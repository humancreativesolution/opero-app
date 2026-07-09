import { Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { ErrorHelper } from "@/libs/error";
import { useSetMinimumStock } from "@/resources/gql/inventory.gql";
import { useLocations } from "@/resources/gql/location.gql";
import { useProducts } from "@/resources/gql/product.gql";

type MinimumStockFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocationId?: string;
  initialProductId?: string;
};

export function MinimumStockFormSheet({
  open,
  onOpenChange,
  initialLocationId = "",
  initialProductId = "",
}: MinimumStockFormSheetProps) {
  const [locationId, setLocationId] = useState(initialLocationId);
  const [productId, setProductId] = useState(initialProductId);
  const [minimumStock, setMinimumStock] = useState(0);
  const setMinimumStockMutation = useSetMinimumStock();
  const locationsQuery = useLocations({ limit: 100 });
  const productsQuery = useProducts({ limit: 100 });
  const stockProducts = useMemo(
    () => (productsQuery.data?.data ?? []).filter((product) => product.trackInventory),
    [productsQuery.data?.data],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!locationId) {
      toast.error("Location is required");
      return;
    }

    if (!productId) {
      toast.error("Product is required");
      return;
    }

    if (!Number.isInteger(minimumStock) || minimumStock < 0) {
      toast.error("Minimum stock must be zero or greater");
      return;
    }

    try {
      await setMinimumStockMutation.mutateAsync({
        locationId,
        productId,
        minimumStock,
      });

      toast.success("Minimum stock saved");
      setLocationId("");
      setProductId("");
      setMinimumStock(0);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save minimum stock", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Set minimum stock</SheetTitle>
          <SheetDescription>
            Configure the low-stock threshold for one stock product at one
            location.
          </SheetDescription>
        </SheetHeader>

        <form className="grid gap-4 px-4" id="minimum-stock-form" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Location</Label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) => setLocationId(event.target.value)}
              value={locationId}
            >
              <option value="">Select location</option>
              {(locationsQuery.data?.data ?? []).map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} · {location.type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Product</Label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) => setProductId(event.target.value)}
              value={productId}
            >
              <option value="">Select stock product</option>
              {stockProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                  {product.sku ? ` · ${product.sku}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Minimum stock</Label>
            <Input
              min={0}
              onChange={(event) => setMinimumStock(event.target.valueAsNumber || 0)}
              type="number"
              value={minimumStock}
            />
            <p className="text-xs text-muted-foreground">
              Low stock is triggered when stock on hand is greater than zero and
              less than or equal to this value.
            </p>
          </div>
        </form>

        <SheetFooter>
          <Button
            disabled={setMinimumStockMutation.isPending}
            form="minimum-stock-form"
            type="submit"
          >
            {setMinimumStockMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save minimum stock
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
