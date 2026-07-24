import type { ColumnDef } from "@tanstack/react-table";
import { Edit, MoreVertical, Search, Tag } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import DetailLink from "@/components/detail-link/detail-link.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type {
  PromotionEntity,
  PromotionStatus,
  PromotionType,
} from "@/graphql/generated";
import { usePromotions } from "@/resources/gql/promotion.gql";
import { canAccess } from "@/components/rbac/rbac.utils";
import { PERMISSIONS } from "@/components/rbac/permissions";

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
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionEntity | null>(null);
  const promotionsQuery = usePromotions({
    page,
    limit,
    filter: {
      search: search.trim() || undefined,
      status: status || undefined,
    },
  });
  const canUpdatePromotion = canAccess({
    anyOf: [PERMISSIONS.promotions.update],
  });
  const canDeletePromotion = canAccess({
    anyOf: [PERMISSIONS.promotions.delete],
  });

  function handleEdit(promotion: PromotionEntity) {
    setSelectedPromotion(promotion);
    setSheetOpen(true);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  const columns = useMemo<ColumnDef<PromotionEntity>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Promotion",
        cell: ({ row }) => (
          <DetailLink
            onClick={() => setSelectedPromotion(row.original)}
            title={row.original.name}
          />
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
            {canUpdatePromotion ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Open promotion actions</span>
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
        <h1 className="text-2xl font-semibold tracking-tight">Promotions</h1>
        <p className="text-sm text-muted-foreground">
          Manage POS discounts calculated by backend at checkout.
        </p>
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
            setSelectedPromotion(null);
          }
        }}
        open={Boolean(selectedPromotion)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-8">
              <div>
                <DialogTitle>{selectedPromotion?.name}</DialogTitle>
                <DialogDescription>
                  {selectedPromotion ? `${getTypeLabel(selectedPromotion.type)} · ${formatDate(selectedPromotion.createdAt)}` : null}
                </DialogDescription>
              </div>
            </div>
            {selectedPromotion?.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{selectedPromotion.description}</p>
            ) : null}
          </DialogHeader>

          {selectedPromotion ? (
            <div className="space-y-6">
              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{getTypeLabel(selectedPromotion.type)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{selectedPromotion.status}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Channel</span>
                  <span className="font-medium">{selectedPromotion.channel}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">{formatDiscount(selectedPromotion)}</span>
                </div>
              </div>

              {selectedPromotion.minQty ? (
                <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Minimum qty</span>
                    <span className="font-medium">{selectedPromotion.minQty}</span>
                  </div>
                </div>
              ) : null}

              {selectedPromotion.minSubtotal ? (
                <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Minimum subtotal</span>
                    <span className="font-medium">
                      {currencyFormatter.format(selectedPromotion.minSubtotal)}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <h3 className="mb-2 text-sm font-medium">Period</h3>
                <div className="space-y-2">
                  {selectedPromotion.startsAt ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Starts at</span>
                      <span className="font-medium">{formatDate(selectedPromotion.startsAt)}</span>
                    </div>
                  ) : null}
                  {selectedPromotion.endsAt ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ends at</span>
                      <span className="font-medium">{formatDate(selectedPromotion.endsAt)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <h3 className="mb-2 text-sm font-medium">Scope</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Apply to all products</span>
                    <span className="font-medium">{selectedPromotion.applyToAllProducts ? "Yes" : "No"}</span>
                  </div>
                  {!selectedPromotion.applyToAllProducts && selectedPromotion.productIds && selectedPromotion.productIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedPromotion.productIds.map((id, idx) => (
                        <Badge key={id} variant="secondary">
                          {idx < 3 ? `Product ${idx + 1}` : "..."}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {selectedPromotion.locationIds && selectedPromotion.locationIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedPromotion.locationIds.map((id) => (
                        <Badge key={id} variant="outline">
                          Location
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Applies to all locations</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
