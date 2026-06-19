import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Search, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SupplierFormSheet } from "@/features/supplier/components/supplier-form-sheet.component";
import type { SupplierEntity } from "@/graphql/generated";
import { useSuppliers } from "@/resources/gql/supplier.gql";

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierEntity | null>(null);
  const suppliersQuery = useSuppliers({ page, limit });
  const filteredSuppliers = useMemo(() => {
    const suppliers = suppliersQuery.data?.data ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return suppliers;
    }

    return suppliers.filter((supplier) =>
      [supplier.code, supplier.name, supplier.phone, supplier.address]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [search, suppliersQuery.data?.data]);

  function handleCreate() {
    setSelectedSupplier(null);
    setSheetOpen(true);
  }

  function handleEdit(supplier: SupplierEntity) {
    setSelectedSupplier(supplier);
    setSheetOpen(true);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  const columns = useMemo<ColumnDef<SupplierEntity>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Supplier",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => row.original.code || "-",
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone || "-",
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => (
          <span className="block max-w-sm truncate">
            {row.original.address || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              onClick={() => handleEdit(row.original)}
              size="icon-sm"
              variant="ghost"
            >
              <Edit className="size-4" />
              <span className="sr-only">Edit supplier</span>
            </Button>
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
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage suppliers used by purchasing and purchase history.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Create supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="size-4 text-muted-foreground" />
            Supplier master
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredSuppliers}
            emptyMessage="No suppliers found."
            isLoading={suppliersQuery.isLoading}
            pagination={{
              meta: suppliersQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search code, name, phone, or address"
                  value={search}
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <SupplierFormSheet
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        supplier={selectedSupplier}
      />
    </div>
  );
}
