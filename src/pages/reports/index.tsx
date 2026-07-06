import type { ColumnDef } from "@tanstack/react-table";
import {
  BarChart3,
  CreditCard,
  Download,
  Package2,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SaleType, SalesReportPaymentMethod } from "@/graphql/generated";
import { useLocations } from "@/resources/gql/location.gql";
import {
  type SalesReportFilterInput,
  type SalesReportItemEntity,
  type SalesReportTransactionEntity,
  useExportSalesReportItemsCsv,
  useExportSalesReportTransactionsCsv,
  useSalesReportItems,
  useSalesReportSummary,
  useSalesReportTransactions,
} from "@/resources/gql/report.gql";
import { useGetUsers } from "@/resources/gql/user.gql";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCurrency(value?: number) {
  return currencyFormatter.format(value ?? 0);
}

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getSaleTypeBadgeClassName(type: SaleType) {
  if (type === "SALE") {
    return "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

type ReportView = "transactions" | "items";

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const today = useMemo(() => getTodayInputValue(), []);
  const [view, setView] = useState<ReportView>("transactions");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [locationId, setLocationId] = useState("");
  const [saleType, setSaleType] = useState<"" | SaleType>("");
  const [paymentMethod, setPaymentMethod] = useState<"" | SalesReportPaymentMethod>(
    "",
  );
  const [cashierUserId, setCashierUserId] = useState("");
  const [cashierShiftId, setCashierShiftId] = useState("");
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLimit, setTransactionLimit] = useState(10);
  const [itemPage, setItemPage] = useState(1);
  const [itemLimit, setItemLimit] = useState(10);

  const locationsQuery = useLocations({ limit: 100 });
  const usersQuery = useGetUsers();
  const exportTransactionsCsv = useExportSalesReportTransactionsCsv();
  const exportItemsCsv = useExportSalesReportItemsCsv();
  const filter = useMemo<SalesReportFilterInput>(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      locationId: locationId || undefined,
      saleType: saleType || undefined,
      paymentMethod: paymentMethod || undefined,
      cashierUserId: cashierUserId || undefined,
      cashierShiftId: cashierShiftId.trim() || undefined,
      search: search.trim() || undefined,
    }),
    [
      cashierShiftId,
      cashierUserId,
      dateFrom,
      dateTo,
      locationId,
      paymentMethod,
      saleType,
      search,
    ],
  );

  const summaryQuery = useSalesReportSummary(filter);
  const transactionsQuery = useSalesReportTransactions({
    page: transactionPage,
    limit: transactionLimit,
    filter,
  });
  const itemsQuery = useSalesReportItems({
    page: itemPage,
    limit: itemLimit,
    filter,
  });

  function resetPages() {
    setTransactionPage(1);
    setItemPage(1);
  }

  function handleTransactionLimitChange(nextLimit: number) {
    setTransactionLimit(nextLimit);
    setTransactionPage(1);
  }

  function handleItemLimitChange(nextLimit: number) {
    setItemLimit(nextLimit);
    setItemPage(1);
  }

  async function handleExportCsv() {
    const datePart = `${dateFrom || "all"}-${dateTo || "all"}`;

    try {
      if (view === "transactions") {
        const csv = await exportTransactionsCsv.mutateAsync(filter);
        downloadCsv(`sales-transactions-${datePart}.csv`, csv);
        return;
      }

      const csv = await exportItemsCsv.mutateAsync(filter);
      downloadCsv(`sales-items-${datePart}.csv`, csv);
    } catch {
      toast.error("Failed to export sales report");
    }
  }

  const summary = summaryQuery.data;
  const metricCards = [
    {
      label: "Net sales",
      value: formatCurrency(summary?.netSales),
      helper: `${summary?.transactionCount ?? 0} transactions`,
      icon: ShoppingCart,
    },
    {
      label: "Gross sales",
      value: formatCurrency(summary?.grossSales),
      helper: `${summary?.saleCount ?? 0} sales`,
      icon: BarChart3,
    },
    {
      label: "Gross profit",
      value: formatCurrency(summary?.grossProfit),
      helper: formatCurrency(summary?.cogs),
      icon: TrendingUp,
    },
    {
      label: "Returns",
      value: formatCurrency(summary?.returnAmount),
      helper: `${summary?.returnCount ?? 0} returns`,
      icon: RotateCcw,
    },
  ];

  const transactionColumns = useMemo<ColumnDef<SalesReportTransactionEntity>[]>(
    () => [
      {
        accessorKey: "invoiceNo",
        header: "Invoice",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.invoiceNo}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(row.original.createdAt)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "locationName",
        header: "Outlet",
      },
      {
        accessorKey: "cashierName",
        header: "Cashier",
        cell: ({ row }) => (
          <div>
            <p>{row.original.cashierName ?? "-"}</p>
            {row.original.cashierShiftId ? (
              <p className="text-xs text-muted-foreground">
                {row.original.cashierShiftId}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            className={getSaleTypeBadgeClassName(row.original.type)}
            variant="outline"
          >
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "totalQty",
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row }) => (
          <div className="text-right">{row.original.totalQty}</div>
        ),
      },
      {
        accessorKey: "grossAmount",
        header: () => <div className="text-right">Gross</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.original.grossAmount)}</div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Net</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(row.original.totalAmount)}
          </div>
        ),
      },
      {
        accessorKey: "grossProfit",
        header: () => <div className="text-right">Profit</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.original.grossProfit)}</div>
        ),
      },
      {
        id: "payments",
        header: "Payments",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.payments.length > 0
              ? row.original.payments.map((payment) => (
                  <Badge key={payment.id} variant="secondary">
                    {payment.method}
                  </Badge>
                ))
              : "-"}
          </div>
        ),
      },
    ],
    [],
  );

  const itemColumns = useMemo<ColumnDef<SalesReportItemEntity>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.productName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.barcode || row.original.sku || "-"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "qtySold",
        header: () => <div className="text-right">Qty sold</div>,
        cell: ({ row }) => <div className="text-right">{row.original.qtySold}</div>,
      },
      {
        accessorKey: "grossSales",
        header: () => <div className="text-right">Gross</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.original.grossSales)}</div>
        ),
      },
      {
        accessorKey: "discountTotal",
        header: () => <div className="text-right">Discount</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.original.discountTotal)}</div>
        ),
      },
      {
        accessorKey: "netSales",
        header: () => <div className="text-right">Net</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(row.original.netSales)}
          </div>
        ),
      },
      {
        accessorKey: "cogs",
        header: () => <div className="text-right">COGS</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.original.cogs)}</div>
        ),
      },
      {
        accessorKey: "grossProfit",
        header: () => <div className="text-right">Profit</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.original.grossProfit)}</div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Sales summary, transaction report, and product sales performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={exportTransactionsCsv.isPending || exportItemsCsv.isPending}
            onClick={handleExportCsv}
            variant="outline"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => setView("transactions")}
            variant={view === "transactions" ? "default" : "outline"}
          >
            <ReceiptText className="size-4" />
            Transactions
          </Button>
          <Button
            onClick={() => setView("items")}
            variant={view === "items" ? "default" : "outline"}
          >
            <Package2 className="size-4" />
            Items
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {summaryQuery.isLoading ? "..." : metric.value}
              </p>
              <p className="text-xs text-muted-foreground">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-muted-foreground" />
              Discount summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Item discount</p>
              <p className="text-xl font-semibold">
                {formatCurrency(summary?.itemDiscountTotal)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Transaction discount</p>
              <p className="text-xl font-semibold">
                {formatCurrency(summary?.transactionDiscountTotal)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Total discount</p>
              <p className="text-xl font-semibold">
                {formatCurrency(summary?.totalDiscount)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Items sold</p>
              <p className="text-xl font-semibold">{summary?.itemQtySold ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="size-4 text-muted-foreground" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Input
              onChange={(event) => {
                setDateFrom(event.target.value);
                resetPages();
              }}
              type="date"
              value={dateFrom}
            />
            <Input
              onChange={(event) => {
                setDateTo(event.target.value);
                resetPages();
              }}
              type="date"
              value={dateTo}
            />
            <select
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) => {
                setLocationId(event.target.value);
                resetPages();
              }}
              value={locationId}
            >
              <option value="">All locations</option>
              {(locationsQuery.data?.data ?? []).map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) => {
                setSaleType(event.target.value as "" | SaleType);
                resetPages();
              }}
              value={saleType}
            >
              <option value="">All types</option>
              <option value="SALE">SALE</option>
              <option value="RETURN">RETURN</option>
            </select>
            <select
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) => {
                setPaymentMethod(event.target.value as "" | SalesReportPaymentMethod);
                resetPages();
              }}
              value={paymentMethod}
            >
              <option value="">All payments</option>
              <option value="CASH">CASH</option>
              <option value="QRIS">QRIS</option>
              <option value="CARD">CARD</option>
              <option value="TRANSFER">TRANSFER</option>
            </select>
            <select
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) => {
                setCashierUserId(event.target.value);
                resetPages();
              }}
              value={cashierUserId}
            >
              <option value="">All cashiers</option>
              {(usersQuery.data?.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.role ?? "NO_ROLE"})
                </option>
              ))}
            </select>
            <Input
              onChange={(event) => {
                setCashierShiftId(event.target.value);
                resetPages();
              }}
              placeholder="Cashier shift ID"
              value={cashierShiftId}
            />
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPages();
                }}
                placeholder={
                  view === "transactions"
                    ? "Search invoice or outlet"
                    : "Search product, SKU, or barcode"
                }
                value={search}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {view === "transactions" ? (
              <>
                <ReceiptText className="size-4 text-muted-foreground" />
                Sales transactions
              </>
            ) : (
              <>
                <Package2 className="size-4 text-muted-foreground" />
                Sales by item
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {view === "transactions" ? (
            <DataTable
              columns={transactionColumns}
              data={transactionsQuery.data?.data ?? []}
              emptyMessage="No sales transactions found."
              isLoading={transactionsQuery.isLoading}
              pagination={{
                meta: transactionsQuery.data?.meta,
                onPageChange: setTransactionPage,
                onPageSizeChange: handleTransactionLimitChange,
                pageSizeOptions: [10, 25, 50, 100],
              }}
            />
          ) : (
            <DataTable
              columns={itemColumns}
              data={itemsQuery.data?.data ?? []}
              emptyMessage="No item sales found."
              isLoading={itemsQuery.isLoading}
              pagination={{
                meta: itemsQuery.data?.meta,
                onPageChange: setItemPage,
                onPageSizeChange: handleItemLimitChange,
                pageSizeOptions: [10, 25, 50, 100],
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
