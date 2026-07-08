import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { InventoryBalance, StockOpnameEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { cn } from "@/libs/utils";
import { useInventoryBalances } from "@/resources/gql/inventory.gql";
import { useLocations } from "@/resources/gql/location.gql";
import {
  useCreateStockOpname,
  useUpdateStockOpname,
} from "@/resources/gql/stock-opname.gql";

type StockOpnameDraftItem = {
  productId: string;
  productName: string;
  sku?: string | null;
  barcode?: string | null;
  systemQty: number;
  countedQty: number;
};

type StockOpnameFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opname?: StockOpnameEntity | null;
};

function getVarianceClassName(varianceQty: number) {
  if (varianceQty === 0) {
    return "text-muted-foreground";
  }

  return varianceQty > 0
    ? "text-emerald-700 dark:text-emerald-300"
    : "text-red-700 dark:text-red-300";
}

function mapBalanceToItem(balance: InventoryBalance): StockOpnameDraftItem {
  return {
    productId: balance.productId,
    productName: balance.product,
    sku: balance.sku,
    barcode: balance.barcode,
    systemQty: balance.balance,
    countedQty: balance.balance,
  };
}

export function StockOpnameFormSheet({
  open,
  onOpenChange,
  opname,
}: StockOpnameFormSheetProps) {
  const isEdit = Boolean(opname);
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<StockOpnameDraftItem[]>([]);
  const locationsQuery = useLocations({ limit: 100 });
  const balancesQuery = useInventoryBalances({
    filter: { locationId: locationId || undefined },
  });
  const createStockOpname = useCreateStockOpname();
  const updateStockOpname = useUpdateStockOpname();
  const isSubmitting = createStockOpname.isPending || updateStockOpname.isPending;
  const totalVariance = useMemo(
    () => items.reduce((total, item) => total + item.countedQty - item.systemQty, 0),
    [items],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    if (opname) {
      queueMicrotask(() => {
        if (!isActive) {
          return;
        }

        setLocationId(opname.locationId);
        setNotes(opname.notes ?? "");
        setItems(
          opname.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            barcode: item.barcode,
            systemQty: item.systemQty,
            countedQty: item.countedQty,
          })),
        );
      });
      return () => {
        isActive = false;
      };
    }

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      setLocationId("");
      setNotes("");
      setItems([]);
    });

    return () => {
      isActive = false;
    };
  }, [open, opname]);

  useEffect(() => {
    if (!open || isEdit || !locationId) {
      return;
    }

    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      setItems((balancesQuery.data ?? []).map(mapBalanceToItem));
    });

    return () => {
      isActive = false;
    };
  }, [balancesQuery.data, isEdit, locationId, open]);

  function refreshSnapshot() {
    if (isEdit) {
      toast.info("Edit draft keeps the original system snapshot");
      return;
    }

    setItems((balancesQuery.data ?? []).map(mapBalanceToItem));
  }

  function updateCountedQty(productId: string, value: string) {
    const nextQty = Math.max(0, Math.floor(Number(value) || 0));

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId ? { ...item, countedQty: nextQty } : item,
      ),
    );
  }

  async function handleSubmit() {
    if (!locationId) {
      toast.error("Location is required");
      return;
    }

    if (items.length === 0) {
      toast.error("No stock products found for this location");
      return;
    }

    try {
      const payloadItems = items.map((item) => ({
        productId: item.productId,
        countedQty: item.countedQty,
      }));

      if (opname) {
        await updateStockOpname.mutateAsync({
          id: opname.id,
          notes: notes.trim() || undefined,
          items: payloadItems,
        });
        toast.success("Stock opname draft updated");
      } else {
        await createStockOpname.mutateAsync({
          locationId,
          notes: notes.trim() || undefined,
          items: payloadItems,
        });
        toast.success("Stock opname draft saved");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        isEdit ? "Failed to update stock opname" : "Failed to create stock opname",
        { description: ErrorHelper.parse(error).message },
      );
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="xl-sheet flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit stock opname" : "Create stock opname"}</SheetTitle>
          <SheetDescription>
            Count physical stock and save as draft before final adjustment.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Location</span>
              <select
                className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                disabled={isEdit}
                onChange={(event) => setLocationId(event.target.value)}
                value={locationId}
              >
                <option value="">Select location</option>
                {(locationsQuery.data?.data ?? []).map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.type})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">Notes</span>
              <Textarea
                className="min-h-9"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes"
                value={notes}
              />
            </label>

            <Button
              disabled={!locationId || balancesQuery.isFetching}
              onClick={refreshSnapshot}
              type="button"
              variant="outline"
            >
              <RefreshCw
                className={cn("size-4", balancesQuery.isFetching && "animate-spin")}
              />
              Refresh stock
            </Button>
          </div>

          <div className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Products</p>
              <p className="text-lg font-semibold">{items.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total system qty</p>
              <p className="text-lg font-semibold">
                {items.reduce((total, item) => total + item.systemQty, 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total variance</p>
              <p className={cn("text-lg font-semibold", getVarianceClassName(totalVariance))}>
                {totalVariance}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU / Barcode</TableHead>
                  <TableHead className="text-right">System</TableHead>
                  <TableHead className="text-right">Counted</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                      {locationId
                        ? "No stock products found for this location."
                        : "Select location to load stock products."}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const varianceQty = item.countedQty - item.systemQty;

                    return (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {[item.sku, item.barcode].filter(Boolean).join(" / ") || "-"}
                        </TableCell>
                        <TableCell className="text-right">{item.systemQty}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            className="ml-auto w-24 text-right"
                            min="0"
                            onChange={(event) =>
                              updateCountedQty(item.productId, event.target.value)
                            }
                            type="number"
                            value={item.countedQty}
                          />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            getVarianceClassName(varianceQty),
                          )}
                        >
                          {varianceQty}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <SheetFooter>
          <Button disabled={isSubmitting} onClick={handleSubmit} type="button">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save draft changes"
            ) : (
              "Save draft"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
