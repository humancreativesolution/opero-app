import {
  Barcode,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ErrorHelper } from "@/libs/error";
import { useLocations } from "@/resources/gql/location.gql";
import { usePosProducts } from "@/resources/gql/product.gql";
import { useCreateSale } from "@/resources/gql/sale.gql";
import { usePosCartStore } from "@/stores/pos-cart.store";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export default function PosPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [locationId, setLocationId] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const locationsQuery = useLocations({
    limit: 100,
    filter: { type: "OUTLET" },
  });
  const createSale = useCreateSale();
  const {
    items,
    addProduct,
    setQty,
    increment,
    decrement,
    remove,
    clear,
  } = usePosCartStore();
  const selectedLocationId = locationId || locationsQuery.data?.data[0]?.id || "";
  const searchKeyword = deferredSearch.trim();
  const productsQuery = usePosProducts({
    locationId: selectedLocationId,
    search: searchKeyword || undefined,
    page: 1,
    limit: 100,
    inStockOnly: !searchKeyword,
  });
  const totalAmount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.qty * item.sellingPrice,
        0,
      ),
    [items],
  );
  const changeAmount = Math.max(paidAmount - totalAmount, 0);
  const posProducts = productsQuery.data?.data ?? [];

  async function handleCheckout() {
    if (!selectedLocationId) {
      toast.error("Outlet is required");
      return;
    }

    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      const result = await createSale.mutateAsync({
        locationId: selectedLocationId,
        paidAmount,
        items: items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          sellingPrice: item.sellingPrice,
        })),
      });

      toast.success("Sale created", {
        description: result.createSale.invoiceNo,
      });
      clear();
      setPaidAmount(0);
    } catch (error) {
      toast.error("Failed to create sale", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <div className="grid h-[calc(100vh-3.5rem)] gap-4 p-4 lg:grid-cols-[1fr_26rem]">
      <section className="flex min-h-0 flex-col gap-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Scan barcode, SKU, or search product name"
              value={search}
            />
          </div>
          <Button className="h-11" variant="outline">
            <Barcode className="size-4" />
            Scan
          </Button>
        </div>

        <div className="grid flex-1 auto-rows-min gap-3 overflow-auto sm:grid-cols-2 xl:grid-cols-3">
          {productsQuery.isLoading || locationsQuery.isLoading ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Loading products...
              </CardContent>
            </Card>
          ) : !selectedLocationId ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Select an outlet to show sellable products.
              </CardContent>
            </Card>
          ) : posProducts.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                No products found.
              </CardContent>
            </Card>
          ) : (
            posProducts.map((product) => {
              const isOutOfStock = product.stockOnHand <= 0;

              return (
              <Card
                className={
                  isOutOfStock
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer transition-colors hover:bg-muted/60"
                }
                key={product.id}
                onClick={() => {
                  if (isOutOfStock) {
                    return;
                  }

                  addProduct(product);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    {isOutOfStock ? (
                      <Badge variant="outline">Out of stock</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {formatCurrency(product.sellingPrice)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.barcode || product.sku || "No barcode/SKU"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Stock: {product.stockOnHand} · {product.locationName}
                  </p>
                </CardContent>
              </Card>
              );
            })
          )}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col rounded-xl border bg-card">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="font-semibold">Cart</h1>
            <p className="text-xs text-muted-foreground">{items.length} item</p>
          </div>
          <ShoppingCart className="size-5 text-muted-foreground" />
        </div>
        <Separator />
        <div className="flex-1 space-y-3 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Scan product or choose an item to start a transaction.
            </div>
          ) : (
            items.map((item) => (
              <div className="rounded-lg border p-3" key={item.productId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.sellingPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {item.stockOnHand}
                    </p>
                  </div>
                  <Button
                    onClick={() => remove(item.productId)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => decrement(item.productId)}
                      size="icon-sm"
                      variant="outline"
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      className="h-8 w-16 text-center"
                      min="1"
                      onChange={(event) =>
                        setQty(item.productId, event.target.valueAsNumber || 1)
                      }
                      type="number"
                      value={item.qty}
                    />
                    <Button
                      onClick={() => increment(item.productId)}
                      size="icon-sm"
                      variant="outline"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.qty * item.sellingPrice)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <Separator />
        <div className="space-y-3 p-4">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Outlet</span>
            <select
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) => setLocationId(event.target.value)}
              value={selectedLocationId}
            >
              <option value="">Select outlet</option>
              {(locationsQuery.data?.data ?? []).map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Paid amount</span>
              <Button
                className="h-auto px-0 text-xs"
                onClick={() => setPaidAmount(totalAmount)}
                type="button"
                variant="link"
              >
                Exact amount
              </Button>
            </div>
            <Input
              min="0"
              onChange={(event) =>
                setPaidAmount(event.target.valueAsNumber || 0)
              }
              step="100"
              type="number"
              value={paidAmount}
            />
          </label>

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span className="text-lg font-semibold">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Change</span>
              <span>{formatCurrency(changeAmount)}</span>
            </div>
          </div>

          <Button
            className="h-12 w-full"
            disabled={
              createSale.isPending ||
              items.length === 0 ||
              !selectedLocationId ||
              paidAmount < totalAmount
            }
            onClick={handleCheckout}
          >
            <CreditCard className="size-4" />
            {createSale.isPending ? "Processing..." : "Checkout"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
