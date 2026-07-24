import { FileText, Hash, ReceiptText, RotateCcw, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERMISSIONS } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LocationType } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  NumberingDocumentType,
  NumberingResetPeriod,
  type NumberingConfigurationEntity,
  type UpdateNumberingConfigurationInput,
  useNumberingConfigurations,
  useUpdateNumberingConfiguration,
} from "@/resources/gql/numbering-configuration.gql";
import {
  type ReceiptConfigurationEntity,
  type UpdateReceiptConfigurationInput,
  useReceiptConfiguration,
  useReceiptConfigurations,
  useUpdateReceiptConfiguration,
} from "@/resources/gql/receipt-configuration.gql";
import { useLocationsByTenant } from "@/resources/gql/location.gql";

type SettingsView = "receipt" | "numbering";

type SettingsPageProps = {
  view?: SettingsView;
};

type ReceiptFormState = {
  storeName: string;
  address: string;
  phone: string;
  footerText: string;
  returnPolicyText: string;
  showCashierName: boolean;
  showShiftCode: boolean;
  showDiscount: boolean;
  showSku: boolean;
  showBarcode: boolean;
  isActive: boolean;
};

type NumberingFormState = {
  prefix: string;
  format: string;
  padding: string;
  resetPeriod: NumberingResetPeriod;
  isActive: boolean;
};

const DEFAULT_RECEIPT_FORM: ReceiptFormState = {
  storeName: "",
  address: "",
  phone: "",
  footerText: "",
  returnPolicyText: "",
  showCashierName: true,
  showShiftCode: true,
  showDiscount: true,
  showSku: false,
  showBarcode: false,
  isActive: true,
};

const DEFAULT_NUMBERING_FORM: NumberingFormState = {
  prefix: "",
  format: "{PREFIX}-{YYYY}{MM}{DD}-{SEQ}",
  padding: "4",
  resetPeriod: NumberingResetPeriod.Daily,
  isActive: true,
};

const documentTypeOptions = [
  NumberingDocumentType.SaleInvoice,
  NumberingDocumentType.SaleReturn,
  NumberingDocumentType.PurchaseOrder,
  NumberingDocumentType.StockOpname,
];

const resetPeriodOptions = [
  NumberingResetPeriod.Daily,
  NumberingResetPeriod.Monthly,
  NumberingResetPeriod.Yearly,
  NumberingResetPeriod.Never,
];

const tokenOptions = ["{PREFIX}", "{YYYY}", "{YY}", "{MM}", "{DD}", "{SEQ}"];

function formatLabel(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function mapReceiptToForm(config?: ReceiptConfigurationEntity): ReceiptFormState {
  if (!config) {
    return DEFAULT_RECEIPT_FORM;
  }

  return {
    storeName: config.storeName,
    address: config.address ?? "",
    phone: config.phone ?? "",
    footerText: config.footerText ?? "",
    returnPolicyText: config.returnPolicyText ?? "",
    showCashierName: config.showCashierName,
    showShiftCode: config.showShiftCode,
    showDiscount: config.showDiscount,
    showSku: config.showSku,
    showBarcode: config.showBarcode,
    isActive: config.isActive,
  };
}

function mapNumberingToForm(
  config?: NumberingConfigurationEntity,
): NumberingFormState {
  if (!config) {
    return DEFAULT_NUMBERING_FORM;
  }

  return {
    prefix: config.prefix,
    format: config.format,
    padding: String(config.padding),
    resetPeriod: config.resetPeriod,
    isActive: config.isActive,
  };
}

function normalizeReceiptPayload(
  locationId: string,
  form: ReceiptFormState,
): UpdateReceiptConfigurationInput {
  return {
    ...(locationId ? { locationId } : {}),
    storeName: form.storeName.trim(),
    address: form.address.trim() || undefined,
    phone: form.phone.trim() || undefined,
    footerText: form.footerText.trim() || undefined,
    returnPolicyText: form.returnPolicyText.trim() || undefined,
    showCashierName: form.showCashierName,
    showShiftCode: form.showShiftCode,
    showDiscount: form.showDiscount,
    showSku: form.showSku,
    showBarcode: form.showBarcode,
    isActive: form.isActive,
  };
}

function buildNumberingPreview(form: NumberingFormState) {
  const sequence = "1".padStart(Number(form.padding) || 4, "0");

  return form.format
    .replaceAll("{PREFIX}", form.prefix || "INV")
    .replaceAll("{YYYY}", "2026")
    .replaceAll("{YY}", "26")
    .replaceAll("{MM}", "07")
    .replaceAll("{DD}", "08")
    .replaceAll("{SEQ}", sequence);
}

function CheckboxField({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border p-3">
      <input
        checked={checked}
        className="mt-1 size-4 accent-primary"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function SettingsNav({ view }: { view: SettingsView }) {
  const canViewReceiptSettings = canAccess({
    anyOf: [PERMISSIONS.receiptConfig.read, PERMISSIONS.receiptConfig.update],
  });
  const canViewNumberingSettings = canAccess({
    anyOf: [
      PERMISSIONS.numberingConfig.read,
      PERMISSIONS.numberingConfig.update,
    ],
  });

  return (
    <div className="flex flex-wrap gap-2">
      {canViewReceiptSettings ? (
        <Button asChild variant={view === "receipt" ? "default" : "outline"}>
          <NavLink to="/settings/receipt">
            <ReceiptText className="size-4" />
            Receipt Settings
          </NavLink>
        </Button>
      ) : null}
      {canViewNumberingSettings ? (
        <Button asChild variant={view === "numbering" ? "default" : "outline"}>
          <NavLink to="/settings/numbering">
            <Hash className="size-4" />
            Numbering Settings
          </NavLink>
        </Button>
      ) : null}
    </div>
  );
}

function ReceiptSettingsView() {
  const [locationId, setLocationId] = useState("");
  const [formDrafts, setFormDrafts] = useState<Record<string, ReceiptFormState>>({});
  const locationsQuery = useLocationsByTenant({
    filter: { type: LocationType.Outlet },
  });
  const configurationsQuery = useReceiptConfigurations();
  const resolvedConfigQuery = useReceiptConfiguration(locationId || undefined);
  const updateConfig = useUpdateReceiptConfiguration();
  const canUpdateReceiptConfig = canAccess({
    anyOf: [PERMISSIONS.receiptConfig.update],
  });

  const receiptScopeKey = locationId || "default";
  const resolvedForm = useMemo(
    () => mapReceiptToForm(resolvedConfigQuery.data),
    [resolvedConfigQuery.data],
  );
  const form = formDrafts[receiptScopeKey] ?? resolvedForm;

  function setReceiptForm(updater: (current: ReceiptFormState) => ReceiptFormState) {
    setFormDrafts((current) => ({
      ...current,
      [receiptScopeKey]: updater(current[receiptScopeKey] ?? resolvedForm),
    }));
  }

  const existingConfig = useMemo(
    () =>
      configurationsQuery.data?.find((config) =>
        locationId ? config.locationId === locationId : !config.locationId,
      ),
    [configurationsQuery.data, locationId],
  );

  async function handleSubmit() {
    if (!form.storeName.trim()) {
      toast.error("Store name is required");
      return;
    }

    try {
      await updateConfig.mutateAsync(normalizeReceiptPayload(locationId, form));
      setFormDrafts((current) => {
        const next = { ...current };
        delete next[receiptScopeKey];
        return next;
      });
      toast.success("Receipt configuration saved");
    } catch (error) {
      const parsedError = ErrorHelper.parse(error);
      toast.error("Failed to save receipt configuration", {
        description: parsedError.message,
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="size-4 text-muted-foreground" />
            Receipt Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Configuration scope</Label>
              <Select
                onValueChange={(value) =>
                  setLocationId(value === "default" ? "" : value)
                }
                value={locationId || "default"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tenant default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Tenant default</SelectItem>
                  {(locationsQuery.data ?? []).map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Outlet config overrides tenant default during POS print preview.
              </p>
            </div>
            <div className="flex items-end">
              <Badge variant={existingConfig ? "default" : "secondary"}>
                {existingConfig ? "Saved override" : "Resolved default"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Store name</Label>
              <Input
                onChange={(event) =>
                  setReceiptForm((current) => ({
                    ...current,
                    storeName: event.target.value,
                  }))
                }
                placeholder="Example: Opero Store"
                value={form.storeName}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                onChange={(event) =>
                  setReceiptForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="Example: 0812..."
                value={form.phone}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              onChange={(event) =>
                setReceiptForm((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="Store address printed on receipt"
              value={form.address}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Footer text</Label>
              <Textarea
                onChange={(event) =>
                  setReceiptForm((current) => ({
                    ...current,
                    footerText: event.target.value,
                  }))
                }
                placeholder="Thank you for shopping with us"
                value={form.footerText}
              />
            </div>
            <div className="space-y-2">
              <Label>Return policy</Label>
              <Textarea
                onChange={(event) =>
                  setReceiptForm((current) => ({
                    ...current,
                    returnPolicyText: event.target.value,
                  }))
                }
                placeholder="Return policy shown on receipt"
                value={form.returnPolicyText}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <CheckboxField
              checked={form.showCashierName}
              description="Print cashier name on receipt."
              label="Show cashier name"
              onChange={(checked) =>
                setReceiptForm((current) => ({ ...current, showCashierName: checked }))
              }
            />
            <CheckboxField
              checked={form.showShiftCode}
              description="Print cashier shift information."
              label="Show shift code"
              onChange={(checked) =>
                setReceiptForm((current) => ({ ...current, showShiftCode: checked }))
              }
            />
            <CheckboxField
              checked={form.showDiscount}
              description="Show item and transaction discounts."
              label="Show discount"
              onChange={(checked) =>
                setReceiptForm((current) => ({ ...current, showDiscount: checked }))
              }
            />
            <CheckboxField
              checked={form.showSku}
              description="Print product SKU when available."
              label="Show SKU"
              onChange={(checked) =>
                setReceiptForm((current) => ({ ...current, showSku: checked }))
              }
            />
            <CheckboxField
              checked={form.showBarcode}
              description="Print barcode when available."
              label="Show barcode"
              onChange={(checked) =>
                setReceiptForm((current) => ({ ...current, showBarcode: checked }))
              }
            />
            <CheckboxField
              checked={form.isActive}
              description="Inactive config will not override default."
              label="Active"
              onChange={(checked) =>
                setReceiptForm((current) => ({ ...current, isActive: checked }))
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              disabled={resolvedConfigQuery.isLoading}
              onClick={() =>
                setFormDrafts((current) => {
                  const next = { ...current };
                  delete next[receiptScopeKey];
                  return next;
                })
              }
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
            {canUpdateReceiptConfig ? (
              <Button disabled={updateConfig.isPending} onClick={handleSubmit}>
                <Save className="size-4" />
                Save receipt config
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-muted-foreground" />
            Receipt preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mx-auto max-w-xs rounded-lg border bg-white p-4 font-mono text-xs text-slate-950 shadow-sm">
            <div className="text-center">
              <p className="font-bold">{form.storeName || "Store Name"}</p>
              {form.address ? <p>{form.address}</p> : null}
              {form.phone ? <p>{form.phone}</p> : null}
            </div>
            <div className="my-3 border-t border-dashed border-slate-400" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Invoice</span>
                <span>INV-20260708-0001</span>
              </div>
              {form.showCashierName ? (
                <div className="flex justify-between">
                  <span>Cashier</span>
                  <span>Andi</span>
                </div>
              ) : null}
              {form.showShiftCode ? (
                <div className="flex justify-between">
                  <span>Shift</span>
                  <span>OPEN-001</span>
                </div>
              ) : null}
            </div>
            <div className="my-3 border-t border-dashed border-slate-400" />
            <div>
              <div className="flex justify-between">
                <span>Kopi Demo x2</span>
                <span>Rp 25.000</span>
              </div>
              {form.showSku ? <p className="text-slate-500">SKU: KOPI-001</p> : null}
              {form.showBarcode ? (
                <p className="text-slate-500">Barcode: 899001</p>
              ) : null}
              {form.showDiscount ? (
                <p className="text-slate-500">Discount: Rp 2.000</p>
              ) : null}
            </div>
            <div className="my-3 border-t border-dashed border-slate-400" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>Rp 23.000</span>
            </div>
            {form.footerText ? (
              <p className="mt-4 text-center">{form.footerText}</p>
            ) : null}
            {form.returnPolicyText ? (
              <p className="mt-2 text-center text-slate-500">
                {form.returnPolicyText}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NumberingSettingsView() {
  const [documentType, setDocumentType] = useState<NumberingDocumentType>(
    NumberingDocumentType.SaleInvoice,
  );
  const [formDrafts, setFormDrafts] = useState<Record<string, NumberingFormState>>({});
  const configurationsQuery = useNumberingConfigurations();
  const updateConfig = useUpdateNumberingConfiguration();
  const canUpdateNumberingConfig = canAccess({
    anyOf: [PERMISSIONS.numberingConfig.update],
  });

  const selectedConfig = useMemo(
    () =>
      configurationsQuery.data?.find(
        (config) => config.documentType === documentType,
      ),
    [configurationsQuery.data, documentType],
  );

  const resolvedForm = useMemo(
    () => mapNumberingToForm(selectedConfig),
    [selectedConfig],
  );
  const form = formDrafts[documentType] ?? resolvedForm;

  function setNumberingForm(
    updater: (current: NumberingFormState) => NumberingFormState,
  ) {
    setFormDrafts((current) => ({
      ...current,
      [documentType]: updater(current[documentType] ?? resolvedForm),
    }));
  }

  async function handleSubmit() {
    const padding = Number(form.padding);

    if (!form.prefix.trim()) {
      toast.error("Prefix is required");
      return;
    }

    if (!form.format.includes("{PREFIX}") || !form.format.includes("{SEQ}")) {
      toast.error("Format must include {PREFIX} and {SEQ}");
      return;
    }

    if (!Number.isInteger(padding) || padding < 1 || padding > 12) {
      toast.error("Padding must be between 1 and 12");
      return;
    }

    const payload: UpdateNumberingConfigurationInput = {
      documentType,
      prefix: form.prefix.trim(),
      format: form.format.trim(),
      padding,
      resetPeriod: form.resetPeriod,
      isActive: form.isActive,
    };

    try {
      await updateConfig.mutateAsync(payload);
      setFormDrafts((current) => {
        const next = { ...current };
        delete next[documentType];
        return next;
      });
      toast.success("Numbering configuration saved");
    } catch (error) {
      const parsedError = ErrorHelper.parse(error);
      toast.error("Failed to save numbering configuration", {
        description: parsedError.message,
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="size-4 text-muted-foreground" />
            Document types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documentTypeOptions.map((option) => {
            const config = configurationsQuery.data?.find(
              (item) => item.documentType === option,
            );
            const isSelected = option === documentType;

            return (
              <button
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected ? "border-primary bg-primary/10" : "hover:bg-muted"
                }`}
                key={option}
                onClick={() => setDocumentType(option)}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{formatLabel(option)}</span>
                  <Badge variant={config?.isActive === false ? "secondary" : "default"}>
                    {config?.isActive === false ? "Inactive" : "Active"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {config?.format ?? "Default format"}
                </p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-muted-foreground" />
            {formatLabel(documentType)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input
                onChange={(event) =>
                  setNumberingForm((current) => ({
                    ...current,
                    prefix: event.target.value,
                  }))
                }
                placeholder="INV"
                value={form.prefix}
              />
            </div>
            <div className="space-y-2">
              <Label>Padding</Label>
              <Input
                max={12}
                min={1}
                onChange={(event) =>
                  setNumberingForm((current) => ({
                    ...current,
                    padding: event.target.value,
                  }))
                }
                type="number"
                value={form.padding}
              />
            </div>
            <div className="space-y-2">
              <Label>Reset period</Label>
              <Select
                onValueChange={(value) =>
                  setNumberingForm((current) => ({
                    ...current,
                    resetPeriod: value as NumberingResetPeriod,
                  }))
                }
                value={form.resetPeriod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reset period" />
                </SelectTrigger>
                <SelectContent>
                  {resetPeriodOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Input
              onChange={(event) =>
                setNumberingForm((current) => ({
                  ...current,
                  format: event.target.value,
                }))
              }
              value={form.format}
            />
            <p className="text-xs text-muted-foreground">
              Required tokens: {"{PREFIX}"} and {"{SEQ}"}. Other date tokens are
              optional.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Token helper</Label>
            <div className="flex flex-wrap gap-2">
              {tokenOptions.map((token) => (
                <Button
                  key={token}
                  onClick={() =>
                    setNumberingForm((current) => ({
                      ...current,
                      format: `${current.format}${token}`,
                    }))
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {token}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Preview</p>
              <p className="mt-2 font-mono text-lg font-semibold">
                {buildNumberingPreview(form)}
              </p>
            </div>
            <CheckboxField
              checked={form.isActive}
              description="Inactive config will fallback to backend default."
              label="Active"
              onChange={(checked) =>
                setNumberingForm((current) => ({
                  ...current,
                  isActive: checked,
                }))
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              disabled={configurationsQuery.isLoading}
              onClick={() =>
                setFormDrafts((current) => {
                  const next = { ...current };
                  delete next[documentType];
                  return next;
                })
              }
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
            {canUpdateNumberingConfig ? (
              <Button disabled={updateConfig.isPending} onClick={handleSubmit}>
                <Save className="size-4" />
                Save numbering config
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage({ view = "receipt" }: SettingsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure receipt output and transaction number formatting.
          </p>
        </div>
        <SettingsNav view={view} />
      </div>

      {view === "numbering" ? <NumberingSettingsView /> : <ReceiptSettingsView />}
    </div>
  );
}
