import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Package, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductFormSheet } from "@/features/product/components/product-form-sheet.component";
import { PermissionGate } from "@/components/rbac/components/permission-gate.component";
import { PERMISSIONS } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";
import type { ProductEntity } from "@/graphql/generated";
import { useProducts } from "@/resources/gql/product.gql";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getProductTypeBadgeClassName(type: ProductEntity["type"]) {
  if (type === "SERVICE") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
  }

  return "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300";
}

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | null>(
    null,
  );
  const productsQuery = useProducts({ page, limit });
  const canUpdateProduct = canAccess({ anyOf: [PERMISSIONS.products.update] });
  const filteredProducts = useMemo(() => {
    const products = productsQuery.data?.data ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter((product) =>
      [product.barcode, product.sku, product.name, product.type]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [productsQuery.data?.data, search]);

  function handleCreate() {
    setSelectedProduct(null);
    setSheetOpen(true);
  }

  function handleEdit(product: ProductEntity) {
    setSelectedProduct(product);
    setSheetOpen(true);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  const columns = useMemo<ColumnDef<ProductEntity>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => row.original.sku || "-",
      },
      {
        accessorKey: "barcode",
        header: "Barcode",
        cell: ({ row }) => row.original.barcode || "-",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            className={getProductTypeBadgeClassName(row.original.type)}
            variant="outline"
          >
            {row.original.type === "SERVICE" ? "Service" : "Stock"}
          </Badge>
        ),
      },
      {
        accessorKey: "sellingPrice",
        header: () => <div className="text-right">Selling price</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.original.sellingPrice)}
          </div>
        ),
      },
      {
        accessorKey: "lastCostPrice",
        header: () => <div className="text-right">Last cost</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.original.lastCostPrice)}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "outline"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {canUpdateProduct ? (
              <Button
                onClick={() => handleEdit(row.original)}
                size="icon-sm"
                variant="ghost"
              >
                <Edit className="size-4" />
                <span className="sr-only">Edit product</span>
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canUpdateProduct],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage stock items and services used by POS and reports.
          </p>
        </div>
        <PermissionGate anyOf={[PERMISSIONS.products.create]}>
          <Button onClick={handleCreate}>
            <Plus className="size-4" />
            Create product
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4 text-muted-foreground" />
            Product master
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredProducts}
            emptyMessage="No products found."
            isLoading={productsQuery.isLoading}
            pagination={{
              meta: productsQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <>
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search barcode, SKU, product name, or type"
                    value={search}
                  />
                </div>
              </>
            }
          />
        </CardContent>
      </Card>

      <ProductFormSheet
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        product={selectedProduct}
      />
    </div>
  );
}
