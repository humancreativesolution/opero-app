import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw, Eye, ReceiptText, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleReturnFormSheet } from "@/features/sale/components/sale-return-form-sheet.component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { SaleEntity, SaleStatus, SaleType } from "@/graphql/generated";
import { useSales } from "@/resources/gql/sale.gql";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
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

function getStatusClassName(status: SaleStatus) {
  if (status === "COMPLETED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
}

function getTypeClassName(type: SaleType) {
  if (type === "SALE") {
    return "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleEntity | null>(null);
  const [returnSheetOpen, setReturnSheetOpen] = useState(false);
  const salesQuery = useSales({
    page,
    limit,
    filter: {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
  });
  const filteredSales = useMemo(() => {
    const sales = salesQuery.data?.data ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return sales;
    }

    return sales.filter((sale) =>
      [
        sale.invoiceNo,
        sale.locationName,
        sale.status,
        sale.type,
        sale.cashierShiftId,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [salesQuery.data?.data, search]);

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  const columns = useMemo<ColumnDef<SaleEntity>[]>(
    () => [
      {
        accessorKey: "invoiceNo",
        header: "Invoice",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.invoiceNo}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "locationName",
        header: "Outlet",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge className={getTypeClassName(row.original.type)} variant="outline">
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={getStatusClassName(row.original.status)}
            variant="outline"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(row.original.totalAmount)}
          </div>
        ),
      },
      {
        accessorKey: "paidAmount",
        header: () => <div className="text-right">Paid</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.original.paidAmount)}</div>
        ),
      },
      {
        id: "payment",
        header: "Payment",
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
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              onClick={() => setSelectedSale(row.original)}
              size="icon-sm"
              variant="ghost"
            >
              <Eye className="size-4" />
              <span className="sr-only">View sale detail</span>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="text-sm text-muted-foreground">
          View POS sales transactions across outlets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="size-4 text-muted-foreground" />
            POS sales list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredSales}
            emptyMessage="No sales found."
            isLoading={salesQuery.isLoading}
            pagination={{
              meta: salesQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <div className="flex w-full flex-col gap-2 lg:flex-row">
                <div className="relative w-full lg:max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search invoice, outlet, status, or shift"
                    value={search}
                  />
                </div>
                <Input
                  className="w-full lg:w-44"
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setPage(1);
                  }}
                  type="date"
                  value={dateFrom}
                />
                <Input
                  className="w-full lg:w-44"
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setPage(1);
                  }}
                  type="date"
                  value={dateTo}
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSale(null);
          }
        }}
        open={Boolean(selectedSale)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-8">
              <div>
                <DialogTitle>{selectedSale?.invoiceNo}</DialogTitle>
                <DialogDescription>
                  {selectedSale
                    ? `${selectedSale.locationName} · ${formatDate(
                        selectedSale.createdAt,
                      )}`
                    : null}
                </DialogDescription>
              </div>
              {selectedSale?.type === "SALE" &&
              selectedSale.status === "COMPLETED" ? (
                <Button
                  onClick={() => setReturnSheetOpen(true)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw className="size-4" />
                  Return sale
                </Button>
              ) : null}
            </div>
          </DialogHeader>
          {selectedSale ? (
            <div className="space-y-4">
              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{selectedSale.type}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{selectedSale.status}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium">
                    {formatCurrency(selectedSale.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Change</span>
                  <span className="font-medium">
                    {formatCurrency(selectedSale.changeAmount)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <h3 className="mb-2 text-sm font-medium">Payments</h3>
                {selectedSale.payments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSale.payments.map((payment) => (
                      <div
                        className="flex items-center justify-between gap-3 text-sm"
                        key={payment.id}
                      >
                        <div>
                          <p className="font-medium">{payment.method}</p>
                          {payment.referenceNo || payment.provider ? (
                            <p className="text-xs text-muted-foreground">
                              {[payment.provider, payment.referenceNo]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <span className="font-medium">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No payment details.
                  </p>
                )}
              </div>

              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Price</th>
                      <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items.map((item) => (
                      <tr className="border-t" key={item.id}>
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="px-3 py-2 text-right">{item.qty}</td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(item.sellingPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatCurrency(item.qty * item.sellingPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end text-sm">
                <div className="w-full max-w-xs space-y-1">
                  <div className="flex justify-between gap-3">
                    <span>Total</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(selectedSale.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <SaleReturnFormSheet
        onOpenChange={setReturnSheetOpen}
        onSuccess={() => {
          setSelectedSale(null);
        }}
        open={returnSheetOpen}
        sale={selectedSale}
      />
    </div>
  );
}
