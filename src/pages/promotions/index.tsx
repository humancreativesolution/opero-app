import type { ColumnDef } from "@tanstack/react-table";
import { Edit, MoreVertical, Plus, Search, Tag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table.component";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PromotionFormSheet } from "@/features/promotion/components/promotion-form-sheet.component";
import { PermissionGate } from "@/components/rbac/components/permission-gate.component";
import { PERMISSIONS } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";
import type {
  PromotionEntity,
  PromotionStatus,
  PromotionType,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  usePromotions,
  useRemovePromotion,
} from "@/resources/gql/promotion.gql";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatDiscount(promotion: PromotionEntity) {
  if (promotion.discountValueType === "PERCENT") {
    return `${promotion.discountValue}%`;
  }

  return currencyFormatter.format(promotion.discountValue);
}

function formatDate(value: unknown) {
  if (!value) {
    return "-";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClassName(status: PromotionStatus) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return undefined;
}

function getTypeLabel(type: PromotionType) {
  if (type === "PRODUCT_DISCOUNT") {
    return "Product discount";
  }

  if (type === "MIN_QTY_DISCOUNT") {
    return "Min qty";
  }

  return "Min transaction";
}

export default function PromotionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | PromotionStatus>("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] =
    useState<PromotionEntity | null>(null);
  const [deletePromotion, setDeletePromotion] =
    useState<PromotionEntity | null>(null);
  const promotionsQuery = usePromotions({
    page,
    limit,
    filter: {
      search: search.trim() || undefined,
      status: status || undefined,
    },
  });
  const removePromotion = useRemovePromotion();
  const canUpdatePromotion = canAccess({
    anyOf: [PERMISSIONS.promotions.update],
  });
  const canDeletePromotion = canAccess({
    anyOf: [PERMISSIONS.promotions.delete],
  });

  function handleCreate() {
    setSelectedPromotion(null);
    setSheetOpen(true);
  }

  function handleEdit(promotion: PromotionEntity) {
    setSelectedPromotion(promotion);
    setSheetOpen(true);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  async function handleDelete() {
    if (!deletePromotion) {
      return;
    }

    try {
      await removePromotion.mutateAsync(deletePromotion.id);
      toast.success("Promotion deleted");
      setDeletePromotion(null);
    } catch (error) {
      toast.error("Failed to delete promotion", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  const columns = useMemo<ColumnDef<PromotionEntity>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Promotion",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.description || "No description"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">{getTypeLabel(row.original.type)}</Badge>
        ),
      },
      {
        accessorKey: "discountValue",
        header: "Discount",
        cell: ({ row }) => formatDiscount(row.original),
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
        accessorKey: "channel",
        header: "Channel",
      },
      {
        accessorKey: "startsAt",
        header: "Period",
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{formatDate(row.original.startsAt)}</p>
            <p className="text-muted-foreground">
              until {formatDate(row.original.endsAt)}
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {canUpdatePromotion || canDeletePromotion ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Open promotion actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canUpdatePromotion ? (
                    <DropdownMenuItem onSelect={() => handleEdit(row.original)}>
                      <Edit className="size-4" />
                      Edit
                    </DropdownMenuItem>
                  ) : null}
                  {canDeletePromotion ? (
                    <DropdownMenuItem
                      onSelect={() => setDeletePromotion(row.original)}
                      variant="destructive"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ),
      },
    ],
    [canDeletePromotion, canUpdatePromotion],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Promotions</h1>
          <p className="text-sm text-muted-foreground">
            Manage POS discounts calculated by backend at checkout.
          </p>
        </div>
        <PermissionGate anyOf={[PERMISSIONS.promotions.create]}>
          <Button onClick={handleCreate}>
            <Plus className="size-4" />
            Create promotion
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="size-4 text-muted-foreground" />
            Promotion list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={promotionsQuery.data?.data ?? []}
            emptyMessage="No promotions found."
            isLoading={promotionsQuery.isLoading}
            pagination={{
              meta: promotionsQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search promotion"
                    value={search}
                  />
                </div>
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                  onChange={(event) => {
                    setStatus(event.target.value as "" | PromotionStatus);
                    setPage(1);
                  }}
                  value={status}
                >
                  <option value="">All status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            }
          />
        </CardContent>
      </Card>

      <PromotionFormSheet
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        promotion={selectedPromotion}
      />

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDeletePromotion(null);
          }
        }}
        open={Boolean(deletePromotion)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete promotion</DialogTitle>
            <DialogDescription>
              This will remove promotion "{deletePromotion?.name}". POS prices will
              be recalculated after deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={removePromotion.isPending}
              onClick={() => setDeletePromotion(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={removePromotion.isPending}
              onClick={handleDelete}
              type="button"
              variant="destructive"
            >
              Delete promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
