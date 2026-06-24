import {
  BarChart3,
  Boxes,
  CreditCard,
  PackageSearch,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDashboardSummary } from "@/resources/gql/dashboard.gql";
import { useLocations } from "@/resources/gql/location.gql";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(value?: number) {
  return currencyFormatter.format(value ?? 0);
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const today = useMemo(() => getTodayInputValue(), []);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [locationId, setLocationId] = useState("");
  const locationsQuery = useLocations({ limit: 100 });
  const dashboardQuery = useDashboardSummary({
    filter: {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      locationId: locationId || undefined,
    },
  });
  const summary = dashboardQuery.data;
  const metrics = [
    {
      label: "Net sales",
      value: formatCurrency(summary?.sales.netSales),
      helper: `${summary?.sales.transactionCount ?? 0} transactions`,
      icon: ShoppingCart,
    },
    {
      label: "Gross sales",
      value: formatCurrency(summary?.sales.grossSales),
      helper: `${summary?.sales.saleCount ?? 0} sales`,
      icon: BarChart3,
    },
    {
      label: "Gross profit",
      value: formatCurrency(summary?.sales.grossProfit),
      helper: "Sales profit snapshot",
      icon: TrendingUp,
    },
    {
      label: "Returns",
      value: formatCurrency(summary?.sales.returnAmount),
      helper: `${summary?.sales.returnCount ?? 0} returns`,
      icon: RotateCcw,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Operational summary for sales, cash, inventory, and purchasing.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            className="w-full sm:w-40"
            onChange={(event) => setDateFrom(event.target.value)}
            type="date"
            value={dateFrom}
          />
          <Input
            className="w-full sm:w-40"
            onChange={(event) => setDateTo(event.target.value)}
            type="date"
            value={dateTo}
          />
          <select
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            onChange={(event) => setLocationId(event.target.value)}
            value={locationId}
          >
            <option value="">All locations</option>
            {(locationsQuery.data?.data ?? []).map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {dashboardQuery.isLoading ? "..." : metric.value}
              </p>
              <p className="text-xs text-muted-foreground">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-muted-foreground" />
              Payment summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Cash total</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(summary?.cash.cashTotal)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Non-cash total</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(summary?.cash.nonCashTotal)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {(summary?.cash.byMethod ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payment data for selected period.
                </p>
              ) : (
                summary?.cash.byMethod.map((payment) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                    key={payment.method}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{payment.method}</Badge>
                      <span className="text-muted-foreground">
                        {payment.count} transactions
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Boxes className="size-4 text-muted-foreground" />
                Inventory alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Low stock</p>
                <p className="text-2xl font-semibold">
                  {summary?.inventory.lowStockCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Out of stock</p>
                <p className="text-2xl font-semibold">
                  {summary?.inventory.outOfStockCount ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageSearch className="size-4 text-muted-foreground" />
                Purchasing
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Pending purchase</p>
                <p className="text-2xl font-semibold">
                  {summary?.purchases.pendingPurchaseCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">
                  Partially received
                </p>
                <p className="text-2xl font-semibold">
                  {summary?.purchases.partiallyReceivedPurchaseCount ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {dashboardQuery.isError ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load dashboard summary.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
