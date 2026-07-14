import { Loader2, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PurchaseSuggestionEntity } from "@/graphql/generated";
import { StockWarningStatus } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { useLocations } from "@/resources/gql/location.gql";
import { useProducts } from "@/resources/gql/product.gql";
import {
  useCreatePurchaseFromSuggestions,
  usePurchaseSuggestions,
} from "@/resources/gql/purchase.gql";
import { useSuppliers } from "@/resources/gql/supplier.gql";

type PurchaseSuggestionsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getWarningClassName(status: string) {
  if (status === StockWarningStatus.OutOfStock) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

function formatWarningStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function PurchaseSuggestionsSheet({
  open,
  onOpenChange,
}: PurchaseSuggestionsSheetProps) {
  const [locationId, setLocationId] = useState("");
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<
    Record<string, boolean>
  >({});
  const [qtyByProductId, setQtyByProductId] = useState<Record<string, string>>(
    {},
  );
  const locationsQuery = useLocations({
    limit: 100,
    filter: { type: "WAREHOUSE" },
  });
  const productsQuery = useProducts({ limit: 100 });
  const suppliersQuery = useSuppliers({ limit: 100 });
  const suggestionsQuery = usePurchaseSuggestions({
    filter: {
      locationId: locationId || undefined,
      productId: productId || undefined,
    },
  });
  const createPurchase = useCreatePurchaseFromSuggestions();
  const stockProducts = useMemo(
    () => (productsQuery.data?.data ?? []).filter((product) => product.trackInventory),
    [productsQuery.data?.data],
  );
  const suggestions = suggestionsQuery.data ?? [];
  const selectedSuggestions = suggestions.filter(
    (suggestion) => selectedProductIds[suggestion.productId],
  );
  const estimatedTotal = selectedSuggestions.reduce((total, suggestion) => {
    const qty = Number(qtyByProductId[suggestion.productId] || suggestion.suggestedQty);
    return total + qty * suggestion.lastCostPrice;
  }, 0);

  function toggleSuggestion(suggestion: PurchaseSuggestionEntity) {
    setSelectedProductIds((current) => ({
      ...current,
      [suggestion.productId]: !current[suggestion.productId],
    }));
    setQtyByProductId((current) => ({
      ...current,
      [suggestion.productId]:
        current[suggestion.productId] ?? String(suggestion.suggestedQty),
    }));
  }

  function selectAllSuggestions() {
    setSelectedProductIds(
      Object.fromEntries(suggestions.map((suggestion) => [suggestion.productId, true])),
    );
    setQtyByProductId((current) => ({
      ...Object.fromEntries(
        suggestions.map((suggestion) => [
          suggestion.productId,
          String(suggestion.suggestedQty),
        ]),
      ),
      ...current,
    }));
  }

  function clearSelection() {
    setSelectedProductIds({});
  }

  async function handleSubmit() {
    if (!locationId) {
      toast.error("Warehouse/location is required");
      return;
    }

    if (!supplierId) {
      toast.error("Supplier is required");
      return;
    }

    if (selectedSuggestions.length === 0) {
      toast.error("Select at least one suggestion");
      return;
    }

    const items = selectedSuggestions.map((suggestion) => ({
      productId: suggestion.productId,
      qty: Number(qtyByProductId[suggestion.productId] || suggestion.suggestedQty),
    }));

    if (items.some((item) => !Number.isInteger(item.qty) || item.qty < 1)) {
      toast.error("Suggestion qty must be at least 1");
      return;
    }

    try {
      await createPurchase.mutateAsync({
        supplierId,
        locationId,
        items,
      });
      toast.success("Draft purchase created from suggestions");
      setSupplierId("");
      setSelectedProductIds({});
      setQtyByProductId({});
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create purchase from suggestions", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="xl-sheet overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Purchase suggestions</SheetTitle>
          <SheetDescription>
            Generate a draft purchase from active stock products that are below
            their configured minimum stock.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-5 px-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Warehouse/location</Label>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                onChange={(event) => {
                  setLocationId(event.target.value);
                  setSelectedProductIds({});
                  setQtyByProductId({});
                }}
                value={locationId}
              >
                <option value="">All warehouses</option>
                {(locationsQuery.data?.data ?? []).map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                onChange={(event) => {
                  setProductId(event.target.value);
                  setSelectedProductIds({});
                  setQtyByProductId({});
                }}
                value={productId}
              >
                <option value="">All products</option>
                {stockProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                onChange={(event) => setSupplierId(event.target.value)}
                value={supplierId}
              >
                <option value="">Select supplier</option>
                {(suppliersQuery.data?.data ?? []).map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {selectedSuggestions.length} selected ·{" "}
                {formatCurrency(estimatedTotal)}
              </p>
              <p className="text-xs text-muted-foreground">
                Draft uses product last cost price. You can still edit it before
                confirm.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={selectAllSuggestions} size="sm" variant="outline">
                Select all
              </Button>
              <Button onClick={clearSelection} size="sm" variant="outline">
                Clear
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[40px_1fr_120px_120px_120px_140px] gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span />
              <span>Product</span>
              <span className="text-right">Stock / min</span>
              <span className="text-right">Suggested</span>
              <span className="text-right">Last cost</span>
              <span>Status</span>
            </div>
            <div className="max-h-[55vh] overflow-y-auto">
              {suggestionsQuery.isLoading ? (
                <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                  Loading suggestions...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                  No purchase suggestions found.
                </div>
              ) : (
                suggestions.map((suggestion) => {
                  const selected = Boolean(selectedProductIds[suggestion.productId]);

                  return (
                    <div
                      className="grid grid-cols-[40px_1fr_120px_120px_120px_140px] items-center gap-3 border-b px-3 py-3 last:border-b-0"
                      key={`${suggestion.locationId}-${suggestion.productId}`}
                    >
                      <input
                        checked={selected}
                        className="size-4 accent-primary"
                        onChange={() => toggleSuggestion(suggestion)}
                        type="checkbox"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {suggestion.productName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {suggestion.locationName}
                          {suggestion.sku ? ` · ${suggestion.sku}` : ""}
                          {suggestion.barcode ? ` · ${suggestion.barcode}` : ""}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        {suggestion.stockOnHand} / {suggestion.minimumStock}
                      </div>
                      <div>
                        <Input
                          disabled={!selected}
                          min={1}
                          onChange={(event) =>
                            setQtyByProductId((current) => ({
                              ...current,
                              [suggestion.productId]: event.target.value,
                            }))
                          }
                          type="number"
                          value={
                            qtyByProductId[suggestion.productId] ??
                            String(suggestion.suggestedQty)
                          }
                        />
                      </div>
                      <div className="text-right text-sm">
                        {formatCurrency(suggestion.lastCostPrice)}
                      </div>
                      <Badge
                        className={getWarningClassName(suggestion.warningStatus)}
                        variant="outline"
                      >
                        {formatWarningStatus(suggestion.warningStatus)}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            disabled={createPurchase.isPending}
            onClick={handleSubmit}
            type="button"
          >
            {createPurchase.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <WandSparkles className="size-4" />
            )}
            Create draft purchase
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
