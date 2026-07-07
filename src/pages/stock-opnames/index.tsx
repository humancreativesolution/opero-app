import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Edit,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { StockOpnameFormSheet } from "@/features/stock-opname/components/stock-opname-form-sheet.component";
import type { StockOpnameEntity, StockOpnameStatus } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { cn } from "@/libs/utils";
import { useLocations } from "@/resources/gql/location.gql";
import {
  useCancelStockOpname,
  useFinalizeStockOpname,
  useStockOpnames,
} from "@/resources/gql/stock-opname.gql";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getStatusClassName(status: StockOpnameStatus) {
  if (status === "DRAFT") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (status === "FINALIZED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
}

function getVarianceClassName(value: number) {
  if (value === 0) {
    return "text-muted-foreground";
  }

  return value > 0
    ? "text-emerald-700 dark:text-emerald-300"
    : "text-red-700 dark:text-red-300";
}

function getTotalVariance(opname: StockOpnameEntity) {
  return opname.items.reduce((total, item) => total + item.varianceQty, 0);
}

export default function StockOpnamesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState<"" | StockOpnameStatus>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedOpname, setSelectedOpname] = useState<StockOpnameEntity | null>(
    null,
  );
  const [finalizeOpname, setFinalizeOpname] =
    useState<StockOpnameEntity | null>(null);
  const [cancelOpname, setCancelOpname] = useState<StockOpnameEntity | null>(null);
  const canManageStockOpname = canAccess({ anyOf: [PERMISSIONS.stock.adjust] });
  const locationsQuery = useLocations({ limit: 100 });
  const opnamesQuery = useStockOpnames({
    page,
    limit,
    filter: {
      locationId: locationId || undefined,
      status: status || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
  });
  const finalizeMutation = useFinalizeStockOpname();
  const cancelMutation = useCancelStockOpname();
  const isFinalizing = finalizeMutation.isPending;
  const isCancelling = cancelMutation.isPending;
  const filteredOpnames = useMemo(() => {
    const opnames = opnamesQuery.data?.data ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return opnames;
    }

    return opnames.filter((opname) =>
      [
        opname.opnameNo,
        opname.locationName,
        opname.status,
        opname.createdByUserName,
        opname.finalizedByUserName,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [opnamesQuery.data?.data, search]);

  function handleCreate() {
    setSelectedOpname(null);
    setSheetOpen(true);
  }

  function handleEdit(opname: StockOpnameEntity) {
    setSelectedOpname(opname);
    setSheetOpen(true);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  function resetPage() {
    setPage(1);
  }

  async function handleFinalize() {
    if (!finalizeOpname) {
      return;
    }

    try {
      await finalizeMutation.mutateAsync(finalizeOpname.id);
      toast.success("Stock opname finalized");
      setFinalizeOpname(null);
    } catch (error) {
      const parsedError = ErrorHelper.parse(error);
      const isStockChanged = parsedError.message
        .toLowerCase()
        .includes("stock changed");

      toast.error(
        isStockChanged
          ? "Stock changed after draft snapshot"
          : "Failed to finalize stock opname",
        {
          description: isStockChanged
            ? "Refresh stock data and recreate the draft before finalizing."
            : parsedError.message,
        },
      );
    }
  }

  async function handleCancel() {
    if (!cancelOpname) {
      return;
    }

    try {
      await cancelMutation.mutateAsync(cancelOpname.id);
      toast.success("Stock opname cancelled");
      setCancelOpname(null);
    } catch (error) {
      toast.error("Failed to cancel stock opname", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  const columns = useMemo<ColumnDef<StockOpnameEntity>[]>(
    () => [
      {
        accessorKey: "opnameNo",
        header: "Opname",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.opnameNo}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(row.original.createdAt)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "locationName",
        header: "Location",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={getStatusClassName(row.original.status)} variant="outline">
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "items",
        header: () => <div className="text-right">Items</div>,
        cell: ({ row }) => (
          <div className="text-right">{row.original.items.length}</div>
        ),
      },
      {
        id: "variance",
        header: () => <div className="text-right">Variance</div>,
        cell: ({ row }) => {
          const variance = getTotalVariance(row.original);

          return (
            <div className={cn("text-right font-medium", getVarianceClassName(variance))}>
              {variance}
            </div>
          );
        },
      },
      {
        accessorKey: "createdByUserName",
        header: "Created by",
        cell: ({ row }) => (
          <div>
            <p>{row.original.createdByUserName}</p>
            {row.original.finalizedByUserName ? (
              <p className="text-xs text-muted-foreground">
                Finalized by {row.original.finalizedByUserName}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const opname = row.original;
          const isDraft = opname.status === "DRAFT";

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Open stock opname actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {canManageStockOpname && isDraft ? (
                    <DropdownMenuItem onSelect={() => handleEdit(opname)}>
                      <Edit className="size-4" />
                      Edit draft
                    </DropdownMenuItem>
                  ) : null}
                  {canManageStockOpname && isDraft ? (
                    <DropdownMenuItem
                      className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 dark:text-emerald-400 dark:focus:bg-emerald-950/40 dark:focus:text-emerald-300"
                      onSelect={() => setFinalizeOpname(opname)}
                    >
                      <CheckCircle2 className="size-4" />
                      Finalize
                    </DropdownMenuItem>
                  ) : null}
                  {canManageStockOpname && isDraft ? (
                    <DropdownMenuItem
                      onSelect={() => setCancelOpname(opname)}
                      variant="destructive"
                    >
                      <XCircle className="size-4" />
                      Cancel draft
                    </DropdownMenuItem>
                  ) : null}
                  {!isDraft || !canManageStockOpname ? (
                    <DropdownMenuItem disabled>No action available</DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [canManageStockOpname],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock Opname</h1>
          <p className="text-sm text-muted-foreground">
            Count physical stock, review variance, then finalize inventory adjustment.
          </p>
        </div>
        <PermissionGate anyOf={[PERMISSIONS.stock.adjust]}>
          <Button onClick={handleCreate}>
            <Plus className="size-4" />
            Create stock opname
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock opname list</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredOpnames}
            emptyMessage="No stock opnames found."
            isLoading={opnamesQuery.isLoading}
            pagination={{
              meta: opnamesQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <div className="grid w-full gap-2 lg:grid-cols-[minmax(220px,1fr)_180px_160px_160px_160px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search opname, location, status, or user"
                    value={search}
                  />
                </div>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                  onChange={(event) => {
                    setLocationId(event.target.value);
                    resetPage();
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
                    setStatus(event.target.value as "" | StockOpnameStatus);
                    resetPage();
                  }}
                  value={status}
                >
                  <option value="">All statuses</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="FINALIZED">FINALIZED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <Input
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    resetPage();
                  }}
                  type="date"
                  value={dateFrom}
                />
                <Input
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    resetPage();
                  }}
                  type="date"
                  value={dateTo}
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <StockOpnameFormSheet
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        opname={selectedOpname}
      />

      <Dialog
        onOpenChange={(open) => !open && setFinalizeOpname(null)}
        open={Boolean(finalizeOpname)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize stock opname</DialogTitle>
            <DialogDescription>
              This will create inventory adjustment transactions based on variance.
              If stock changed after the draft snapshot, backend will reject it.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{finalizeOpname?.opnameNo}</p>
            <p className="text-muted-foreground">
              Total variance: {finalizeOpname ? getTotalVariance(finalizeOpname) : 0}
            </p>
          </div>
          <DialogFooter>
            <Button
              disabled={isFinalizing}
              onClick={() => setFinalizeOpname(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isFinalizing} onClick={handleFinalize}>
              {isFinalizing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Finalizing
                </>
              ) : (
                "Finalize"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => !open && setCancelOpname(null)}
        open={Boolean(cancelOpname)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel stock opname draft</DialogTitle>
            <DialogDescription>
              This cancels the draft without creating inventory adjustment transactions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={isCancelling}
              onClick={() => setCancelOpname(null)}
              variant="outline"
            >
              Keep draft
            </Button>
            <Button disabled={isCancelling} onClick={handleCancel}>
              {isCancelling ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Cancelling
                </>
              ) : (
                "Cancel draft"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
