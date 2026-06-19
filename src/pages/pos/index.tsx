import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Barcode, CreditCard, Search, ShoppingCart } from "lucide-react";

const quickProducts = [
  "Kopi Susu",
  "Air Mineral",
  "Roti Coklat",
  "Beras 5kg",
  "Telur 1kg",
  "Minyak Goreng",
];

export default function PosPage() {
  return (
    <div className="grid h-[calc(100vh-3.5rem)] gap-4 p-4 lg:grid-cols-[1fr_24rem]">
      <section className="flex min-h-0 flex-col gap-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 pl-9"
              placeholder="Scan barcode, SKU, atau cari nama produk"
            />
          </div>
          <Button className="h-11" variant="outline">
            <Barcode className="size-4" />
            Scan
          </Button>
        </div>

        <div className="grid flex-1 auto-rows-min gap-3 overflow-auto sm:grid-cols-2 xl:grid-cols-3">
          {quickProducts.map((product) => (
            <Card className="cursor-pointer transition-colors hover:bg-muted/60" key={product}>
              <CardHeader>
                <CardTitle className="text-base">{product}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Rp 0</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col rounded-xl border bg-card">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="font-semibold">Cart</h1>
            <p className="text-xs text-muted-foreground">0 item</p>
          </div>
          <ShoppingCart className="size-5 text-muted-foreground" />
        </div>
        <Separator />
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Scan produk atau pilih item untuk mulai transaksi.
        </div>
        <Separator />
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between text-sm">
            <span>Total</span>
            <span className="text-lg font-semibold">Rp 0</span>
          </div>
          <Button className="h-12 w-full" disabled>
            <CreditCard className="size-4" />
            Checkout
          </Button>
        </div>
      </aside>
    </div>
  );
}
