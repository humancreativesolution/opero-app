import type { ColumnDef } from "@tanstack/react-table";
import { Edit, MoreVertical, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import DetailLink from "@/components/detail-link/detail-link.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CustomerFormSheet } from "@/features/customer/components/customer-form-sheet.component";
import type { CustomerEntity } from "@/graphql/generated";
import { useCustomers } from "@/resources/gql/customer.gql";
import { canAccess } from "@/components/rbac/rbac.utils";
import { PERMISSIONS } from "@/components/rbac/permissions";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getStatusClassName(status: boolean) {
  if (status) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
}

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerEntity | null>(null);
  const customersQuery = useCustomers({
    page,
    limit,
    filter: { search: search.trim() || undefined },
  });
  const canUpdateCustomer = canAccess({
    anyOf: [PERMISSIONS.customers.update],
  });

  function handleEdit(customer: CustomerEntity) {
    setSelectedCustomer(customer);
    setSheetOpen(true);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  const columns = useMemo<ColumnDef<CustomerEntity>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
          <DetailLink
            onClick={() => setSelectedCustomer(row.original)}
            title={row.original.name}
          />
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
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "-",
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={getStatusClassName(row.original.isActive)} variant="outline">
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {canUpdateCustomer ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Open customer actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleEdit(row.original)}>
                    <Edit className="size-4" />
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Manage customer profiles for POS checkout, sales history, and reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Customer master
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={customersQuery.data?.data ?? []}
            emptyMessage="No customers found."
            isLoading={customersQuery.isLoading}
            pagination={{
              meta: customersQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, code, phone, or email"
                  value={search}
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <CustomerFormSheet
        customer={selectedCustomer}
        onOpenChange={setSheetOpen}
        open={sheetOpen}
      />

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCustomer(null);
          }
        }}
        open={Boolean(selectedCustomer)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name}</DialogTitle>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              {selectedCustomer?.code && (
                <span className="font-mono text-xs">#{selectedCustomer.code}</span>
              )}
              <span>·</span>
              <span>{formatDate(selectedCustomer?.createdAt)}</span>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {selectedCustomer?.phone || selectedCustomer?.email ? (
              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2">
                {selectedCustomer.phone ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{selectedCustomer.phone}</span>
                  </div>
                ) : null}
                {selectedCustomer.email ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{selectedCustomer.email}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {selectedCustomer?.address ? (
              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium">{selectedCustomer.address}</span>
                </div>
              </div>
            ) : null}

            {selectedCustomer?.notes ? (
              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="font-medium">{selectedCustomer.notes}</span>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">
                  {selectedCustomer?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(selectedCustomer?.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-medium">{formatDate(selectedCustomer?.updatedAt)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
