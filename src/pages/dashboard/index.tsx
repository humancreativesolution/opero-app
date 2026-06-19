import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Boxes, PackageSearch, ShoppingCart } from "lucide-react";

const metrics = [
  { label: "Sales Hari Ini", value: "Rp 0", icon: ShoppingCart },
  { label: "Purchase Pending", value: "0", icon: PackageSearch },
  { label: "Produk Aktif", value: "0", icon: Boxes },
  { label: "Gross Profit", value: "Rp 0", icon: BarChart3 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan operasional POS, inventory, purchasing, dan sales.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
