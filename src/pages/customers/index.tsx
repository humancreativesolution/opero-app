import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table.component";
import { PermissionGate } from "@/components/rbac/components/permission-gate.component";
import { PERMISSIONS } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CustomerFormSheet } from "@/features/customer/components/customer-form-sheet.component";
import type { CustomerEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { useCustomers, useRemoveCustomer } from "@/resources/gql/customer.gql";

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

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerEntity | null>(null);
  const [deleteCustomer, setDeleteCustomer] =
    useState<CustomerEntity | null>(null);
  const customersQuery = useCustomers({
    page,
    limit,
    filter: { search: search.trim() || undefined },
  });
  const removeCustomer = useRemoveCustomer();
  const canUpdateCustomer = canAccess({
    anyOf: [PERMISSIONS.customers.update],
  });
  const canDeleteCustomer = canAccess({
    anyOf: [PERMISSIONS.customers.delete],
  });

  function handleCreate() {
    setSelectedCustomer(null);
    setSheetOpen(true);
  }

  function handleEdit(customer: CustomerEntity) {
    setSelectedCustomer(customer);
    setSheetOpen(true);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteCustomer) {
      return;
    }

    try {
      await removeCustomer.mutateAsync(deleteCustomer.id);
      toast.success("Customer deleted");
      setDeleteCustomer(null);
    } catch (error) {
      toast.error("Failed to delete customer", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  const columns = useMemo<ColumnDef<CustomerEntity>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.code || "No code"}
            </p>
          </div>
        ),
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
          <Badge variant={row.original.isActive ? "secondary" : "outline"}>
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
          <div className="flex justify-end gap-1">
            {canUpdateCustomer ? (
              <Button
                onClick={() => handleEdit(row.original)}
                size="icon-sm"
                variant="ghost"
              >
                <Edit className="size-4" />
                <span className="sr-only">Edit customer</span>
              </Button>
            ) : null}
            {canDeleteCustomer ? (
              <Button
                onClick={() => setDeleteCustomer(row.original)}
                size="icon-sm"
                variant="ghost"
              >
                <Trash2 className="size-4 text-destructive" />
                <span className="sr-only">Delete customer</span>
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDeleteCustomer, canUpdateCustomer],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer profiles for POS checkout, sales history, and reports.
          </p>
        </div>
        <PermissionGate anyOf={[PERMISSIONS.customers.create]}>
          <Button onClick={handleCreate}>
            <Plus className="size-4" />
            Create customer
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersRound className="size-4 text-muted-foreground" />
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
        onOpenChange={(open) => !open && setDeleteCustomer(null)}
        open={Boolean(deleteCustomer)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete customer</DialogTitle>
            <DialogDescription>
              This will remove customer "{deleteCustomer?.name}". Customers already used in sales may be rejected by backend.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={removeCustomer.isPending}
              onClick={() => setDeleteCustomer(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={removeCustomer.isPending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
