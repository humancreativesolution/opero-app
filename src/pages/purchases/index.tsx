import type { ColumnDef } from "@tanstack/react-table";
import { PackageSearch, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PurchaseFormSheet } from "@/features/purchase/components/purchase-form-sheet.component";
import type { PurchaseEntity, PurchaseStatus } from "@/graphql/generated";
import { usePurchases } from "@/resources/gql/purchase.gql";

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

function getStatusVariant(status: PurchaseStatus) {
  if (status === "RECEIVED" || status === "CONFIRMED") {
    return "secondary";
  }

  return "outline";
}

export default function PurchasesPage() {
  const [page] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const purchasesQuery = usePurchases({ page, limit });
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
          <Badge variant={getStatusVariant(row.original.status)}>
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
    ],
    [],
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
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="size-4" />
          Create purchase
        </Button>
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

      <PurchaseFormSheet onOpenChange={setSheetOpen} open={sheetOpen} />
    </div>
  );
}
