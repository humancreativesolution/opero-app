import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Edit,
  Loader2,
  MoreVertical,
  PackageCheck,
  PackageSearch,
  Plus,
  Search,
  WandSparkles,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PurchaseFormSheet } from "@/features/purchase/components/purchase-form-sheet.component";
import { PurchaseSuggestionsSheet } from "@/features/purchase/components/purchase-suggestions-sheet.component";
import { PermissionGate } from "@/components/rbac/components/permission-gate.component";
import { PERMISSIONS } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";
import type { PurchaseEntity, PurchaseStatus } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  useCancelPurchase,
  usePurchases,
  useReceivePurchase,
  useUpdatePurchaseStatus,
} from "@/resources/gql/purchase.gql";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getStatusVariant(status: PurchaseStatus): "outline" {
  void status;
  return "outline";
}

function getStatusClassName(status: PurchaseStatus) {
  if (status === "CONFIRMED") {
    return "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300";
  }

  if (status === "RECEIVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (status === "CANCELLED") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  if (status === "PARTIALLY_RECEIVED") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return undefined;
}

type PurchaseStatusAction = {
  purchase: PurchaseEntity;
  status: PurchaseStatus;
  title: string;
  description: string;
};

export default function PurchasesPage() {
  const [page] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [suggestionsSheetOpen, setSuggestionsSheetOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseEntity | null>(null);
  const [statusAction, setStatusAction] =
    useState<PurchaseStatusAction | null>(null);
  const [receivedQtyByItemId, setReceivedQtyByItemId] = useState<
    Record<string, string>
  >({});
  const purchasesQuery = usePurchases({ page, limit });
  const updatePurchaseStatus = useUpdatePurchaseStatus();
  const receivePurchase = useReceivePurchase();
  const cancelPurchase = useCancelPurchase();
  const isUpdatingStatus =
    updatePurchaseStatus.isPending ||
    receivePurchase.isPending ||
    cancelPurchase.isPending;
  const canUpdatePurchase = canAccess({ anyOf: [PERMISSIONS.purchases.update] });
  const filteredPurchases = useMemo(() => {
    const purchases = purchasesQuery.data ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return purchases;
    }

    return purchases.filter((purchase) =>
      [
        purchase.purchaseNo,
        purchase.supplierName,
        purchase.locationName,
        purchase.status,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [purchasesQuery.data, search]);

  function openStatusAction(
    purchase: PurchaseEntity,
    status: PurchaseStatus,
    title: string,
    description: string,
  ) {
    if (status === "RECEIVED") {
      setReceivedQtyByItemId(
        Object.fromEntries(purchase.items.map((item) => [item.id, ""])),
      );
    }

    setStatusAction({
      purchase,
      status,
      title,
      description,
    });
  }

  function handleCreate() {
    setSelectedPurchase(null);
    setSheetOpen(true);
  }

  function handleEdit(purchase: PurchaseEntity) {
    setSelectedPurchase(purchase);
    setSheetOpen(true);
  }

  function fillAllReceivedQty() {
    if (!statusAction) {
      return;
    }

    setReceivedQtyByItemId(
      Object.fromEntries(
        statusAction.purchase.items.map((item) => [item.id, String(item.qty)]),
      ),
    );
  }

  function updateReceivedQty(purchaseItemId: string, value: string) {
    setReceivedQtyByItemId((current) => ({
      ...current,
      [purchaseItemId]: value,
    }));
  }

  async function handleUpdateStatus() {
    if (!statusAction) {
      return;
    }

    try {
      if (statusAction.status === "RECEIVED") {
        await receivePurchase.mutateAsync({
          purchaseId: statusAction.purchase.id,
          items: statusAction.purchase.items.map((item) => ({
            purchaseItemId: item.id,
            receivedQty: Number(receivedQtyByItemId[item.id] || 0),
            costPrice: item.costPrice,
          })),
        });
        toast.success("Purchase received");
        setStatusAction(null);
        setReceivedQtyByItemId({});
        return;
      }

      if (statusAction.status === "CANCELLED") {
        await cancelPurchase.mutateAsync(statusAction.purchase.id);
        toast.success("Purchase cancelled");
        setStatusAction(null);
        return;
      }

      await updatePurchaseStatus.mutateAsync({
        id: statusAction.purchase.id,
        status: statusAction.status,
      });
      toast.success("Purchase status updated");
      setStatusAction(null);
    } catch (error) {
      toast.error("Failed to update purchase status", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  const columns = useMemo<ColumnDef<PurchaseEntity>[]>(
    () => [
      {
        accessorKey: "purchaseNo",
        header: "Purchase no",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.purchaseNo}</span>
        ),
      },
      {
        accessorKey: "purchaseDate",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.purchaseDate),
      },
      {
        accessorKey: "supplierName",
        header: "Supplier",
      },
      {
        accessorKey: "locationName",
        header: "Location",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={getStatusClassName(row.original.status)}
            variant={getStatusVariant(row.original.status)}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.original.totalAmount)}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const purchase = row.original;
          const canConfirm = purchase.status === "DRAFT";
          const canEdit = purchase.status === "DRAFT";
          const canReceive =
            purchase.status === "CONFIRMED" ||
            purchase.status === "PARTIALLY_RECEIVED";
          const canCancel =
            purchase.status === "DRAFT" || purchase.status === "CONFIRMED";
          const hasActions =
            canUpdatePurchase &&
            (canEdit || canConfirm || canReceive || canCancel);

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Open purchase actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {canUpdatePurchase && canEdit ? (
                    <DropdownMenuItem onSelect={() => handleEdit(purchase)}>
                      <Edit className="size-4" />
                      Edit draft
                    </DropdownMenuItem>
                  ) : null}
                  {canUpdatePurchase && canConfirm ? (
                    <DropdownMenuItem
                      className="text-teal-600 focus:bg-teal-50 focus:text-teal-700 dark:text-teal-400 dark:focus:bg-teal-950/40 dark:focus:text-teal-300"
                      onSelect={() =>
                        openStatusAction(
                          purchase,
                          "CONFIRMED",
                          "Confirm purchase",
                          "This will mark the purchase as confirmed and ready to be received.",
                        )
                      }
                    >
                      <CheckCircle2 className="size-4" />
                      Confirm
                    </DropdownMenuItem>
                  ) : null}
                  {canUpdatePurchase && canReceive ? (
                    <DropdownMenuItem
                      onSelect={() =>
                        openStatusAction(
                          purchase,
                          "RECEIVED",
                          "Mark purchase as received",
                          "Input actual received quantities. Backend will create stock-in inventory transactions based on received quantities.",
                        )
                      }
                    >
                      <PackageCheck className="size-4" />
                      Mark as received
                    </DropdownMenuItem>
                  ) : null}
                  {canUpdatePurchase && canCancel ? (
                    <DropdownMenuItem
                      onSelect={() =>
                        openStatusAction(
                          purchase,
                          "CANCELLED",
                          "Cancel purchase",
                          "This will cancel the purchase. This action should only be used before stock is received.",
                        )
                      }
                      variant="destructive"
                    >
                      <XCircle className="size-4" />
                      Cancel
                    </DropdownMenuItem>
                  ) : null}
                  {!hasActions ? (
                    <DropdownMenuItem disabled>No action available</DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [canUpdatePurchase],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchases</h1>
          <p className="text-sm text-muted-foreground">
            Manage purchase orders, stock-in flow, and supplier buying history.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <PermissionGate anyOf={[PERMISSIONS.purchases.create]}>
            <Button
              onClick={() => setSuggestionsSheetOpen(true)}
              variant="outline"
            >
              <WandSparkles className="size-4" />
              Suggestions
            </Button>
          </PermissionGate>
          <PermissionGate anyOf={[PERMISSIONS.purchases.create]}>
            <Button onClick={handleCreate}>
              <Plus className="size-4" />
              Create purchase
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageSearch className="size-4 text-muted-foreground" />
            Purchase list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredPurchases}
            emptyMessage="No purchases found."
            isLoading={purchasesQuery.isLoading}
            toolbar={
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search purchase no, supplier, location, or status"
                  value={search}
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <PurchaseFormSheet
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedPurchase(null);
          }
        }}
        open={sheetOpen}
        purchase={selectedPurchase}
      />

      <PurchaseSuggestionsSheet
        onOpenChange={setSuggestionsSheetOpen}
        open={suggestionsSheetOpen}
      />

      <Dialog
        onOpenChange={(open) => {
          if (!open && !isUpdatingStatus) {
            setStatusAction(null);
            setReceivedQtyByItemId({});
          }
        }}
        open={Boolean(statusAction)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{statusAction?.title}</DialogTitle>
            <DialogDescription>{statusAction?.description}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{statusAction?.purchase.purchaseNo}</p>
            <p className="mt-1 text-muted-foreground">
              Current status: {statusAction?.purchase.status}
            </p>
            {statusAction?.status === "RECEIVED" ? (
              <p className="mt-1 text-muted-foreground">
                Destination warehouse/location:{" "}
                <span className="font-medium text-foreground">
                  {statusAction.purchase.locationName}
                </span>
              </p>
            ) : null}
          </div>
          {statusAction?.status === "RECEIVED" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Received items</p>
                <Button
                  onClick={fillAllReceivedQty}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Receive all
                </Button>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {statusAction.purchase.items.map((item) => (
                  <div
                    className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_96px_120px] sm:items-center"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cost: {formatCurrency(item.costPrice)}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ordered:{" "}
                      <span className="font-medium text-foreground">
                        {item.qty}
                      </span>
                    </div>
                    <Input
                      min={0}
                      onChange={(event) =>
                        updateReceivedQty(item.id, event.target.value)
                      }
                      placeholder="Actual qty"
                      type="number"
                      value={receivedQtyByItemId[item.id] ?? ""}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              disabled={isUpdatingStatus}
              onClick={() => setStatusAction(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isUpdatingStatus}
              onClick={handleUpdateStatus}
              type="button"
              variant={
                statusAction?.status === "CANCELLED" ? "destructive" : "default"
              }
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
