import type { ColumnDef } from "@tanstack/react-table";
import { Eye, ReceiptText, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CashierShiftReportDialog } from "@/features/cashier-shift/components/cashier-shift-report-dialog.component";
import type { CashierShiftEntity, CashierShiftStatus } from "@/graphql/generated";
import { cn } from "@/libs/utils";
import {
  CashMovementReason,
  CashMovementType,
  useCashierShifts,
  useCashMovements,
  type CashMovementEntity,
  type CashMovementReason as CashMovementReasonValue,
  type CashMovementType as CashMovementTypeValue,
} from "@/resources/gql/cashier-shift.gql";
import { useLocations } from "@/resources/gql/location.gql";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCurrency(value?: number | null) {
  return currencyFormatter.format(value ?? 0);
}

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getStatusClassName(status: CashierShiftStatus) {
  if (status === "OPEN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300";
}

function getVarianceClassName(value?: number | null) {
  if (!value) {
    return "text-emerald-700 dark:text-emerald-300";
  }

  return value > 0
    ? "text-amber-700 dark:text-amber-300"
    : "text-red-700 dark:text-red-300";
}

function getMovementTypeClassName(type: CashMovementTypeValue) {
  if (type === CashMovementType.CashIn) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default function CashierShiftsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [movementPage, setMovementPage] = useState(1);
  const [movementLimit, setMovementLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [movementSearch, setMovementSearch] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState<"" | CashierShiftStatus>("");
  const [movementShiftId, setMovementShiftId] = useState("");
  const [movementLocationId, setMovementLocationId] = useState("");
  const [movementType, setMovementType] = useState<"" | CashMovementTypeValue>("");
  const [movementReason, setMovementReason] = useState<
    "" | CashMovementReasonValue
  >("");
  const [movementDateFrom, setMovementDateFrom] = useState("");
  const [movementDateTo, setMovementDateTo] = useState("");
  const [reportShiftId, setReportShiftId] = useState<string | null>(null);
  const locationsQuery = useLocations({ limit: 100 });
  const shiftsQuery = useCashierShifts({
    page,
    limit,
    filter: {
      locationId: locationId || undefined,
      status: status || undefined,
    },
  });
  const movementsQuery = useCashMovements({
    page: movementPage,
    limit: movementLimit,
    filter: {
      cashierShiftId: movementShiftId.trim() || undefined,
      locationId: movementLocationId || undefined,
      type: movementType || undefined,
      reason: movementReason || undefined,
      dateFrom: movementDateFrom || undefined,
      dateTo: movementDateTo || undefined,
    },
  });
  const filteredShifts = useMemo(() => {
    const shifts = shiftsQuery.data?.data ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return shifts;
    }

    return shifts.filter((shift) =>
      [
        shift.id,
        shift.locationName,
        shift.openedByUserName,
        shift.closedByUserName,
        shift.status,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [search, shiftsQuery.data?.data]);
  const filteredMovements = useMemo(() => {
    const movements = movementsQuery.data?.data ?? [];
    const keyword = movementSearch.trim().toLowerCase();

    if (!keyword) {
      return movements;
    }

    return movements.filter((movement) =>
      [
        movement.id,
        movement.cashierShiftId,
        movement.locationName,
        movement.createdByUserName,
        movement.type,
        movement.reason,
        movement.notes,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [movementSearch, movementsQuery.data?.data]);

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  function handleMovementPageSizeChange(nextLimit: number) {
    setMovementLimit(nextLimit);
    setMovementPage(1);
  }

  const columns = useMemo<ColumnDef<CashierShiftEntity>[]>(
    () => [
      {
        accessorKey: "locationName",
        header: "Shift",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.locationName}</p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge className={getStatusClassName(row.original.status)} variant="outline">
              {row.original.status}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {row.original.status === "OPEN" ? "Live report" : "Final report"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "openedByUserName",
        header: "Cashier",
        cell: ({ row }) => (
          <div>
            <p>{row.original.openedByUserName}</p>
            {row.original.closedByUserName ? (
              <p className="text-xs text-muted-foreground">
                Closed by {row.original.closedByUserName}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "openedAt",
        header: "Period",
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{formatDate(row.original.openedAt)}</p>
            <p className="text-muted-foreground">
              {formatDate(row.original.closedAt)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "expectedCash",
        header: () => <div className="text-right">Expected cash</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.original.expectedCash)}
          </div>
        ),
      },
      {
        accessorKey: "variance",
        header: () => <div className="text-right">Variance</div>,
        cell: ({ row }) => (
          <div
            className={cn(
              "text-right font-medium",
              getVarianceClassName(row.original.variance),
            )}
          >
            {row.original.variance == null
              ? "-"
              : formatCurrency(row.original.variance)}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              onClick={() => setReportShiftId(row.original.id)}
              size="sm"
              variant="outline"
            >
              <Eye className="size-4" />
              Shift Report
            </Button>
          </div>
        ),
      },
    ],
    [],
  );
  const movementColumns = useMemo<ColumnDef<CashMovementEntity>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "locationName",
        header: "Location / Shift",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.locationName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.cashierShiftId}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "createdByUserName",
        header: "Created by",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            className={getMovementTypeClassName(row.original.type)}
            variant="outline"
          >
            {formatLabel(row.original.type)}
          </Badge>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => formatLabel(row.original.reason),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(row.original.amount)}
          </div>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => row.original.notes || "-",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cashier Shifts</h1>
        <p className="text-sm text-muted-foreground">
          Review cashier shift activity and open live or final shift reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="size-4 text-muted-foreground" />
            Shift list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredShifts}
            emptyMessage="No cashier shifts found."
            isLoading={shiftsQuery.isLoading}
            pagination={{
              meta: shiftsQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative w-full lg:max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search shift, outlet, cashier, or status"
                    value={search}
                  />
                </div>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm lg:w-56"
                  onChange={(event) => {
                    setLocationId(event.target.value);
                    setPage(1);
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
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm lg:w-40"
                  onChange={(event) => {
                    setStatus(event.target.value as "" | CashierShiftStatus);
                    setPage(1);
                  }}
                  value={status}
                >
                  <option value="">All statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="size-4 text-muted-foreground" />
            Cash movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={movementColumns}
            data={filteredMovements}
            emptyMessage="No cash movements found."
            isLoading={movementsQuery.isLoading}
            pagination={{
              meta: movementsQuery.data?.meta,
              onPageChange: setMovementPage,
              onPageSizeChange: handleMovementPageSizeChange,
              pageSizeOptions: [10, 25, 50],
            }}
            toolbar={
              <div className="grid w-full gap-2 lg:grid-cols-[minmax(14rem,1fr)_11rem_11rem_11rem_11rem_11rem_11rem]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setMovementSearch(event.target.value)}
                    placeholder="Search movement"
                    value={movementSearch}
                  />
                </div>
                <Input
                  onChange={(event) => {
                    setMovementShiftId(event.target.value);
                    setMovementPage(1);
                  }}
                  placeholder="Shift ID"
                  value={movementShiftId}
                />
                <select
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                  onChange={(event) => {
                    setMovementLocationId(event.target.value);
                    setMovementPage(1);
                  }}
                  value={movementLocationId}
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
                    setMovementType(event.target.value as "" | CashMovementTypeValue);
                    setMovementPage(1);
                  }}
                  value={movementType}
                >
                  <option value="">All types</option>
                  <option value={CashMovementType.CashIn}>Cash in</option>
                  <option value={CashMovementType.CashOut}>Cash out</option>
                </select>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                  onChange={(event) => {
                    setMovementReason(
                      event.target.value as "" | CashMovementReasonValue,
                    );
                    setMovementPage(1);
                  }}
                  value={movementReason}
                >
                  <option value="">All reasons</option>
                  {Object.values(CashMovementReason).map((reason) => (
                    <option key={reason} value={reason}>
                      {formatLabel(reason)}
                    </option>
                  ))}
                </select>
                <Input
                  onChange={(event) => {
                    setMovementDateFrom(event.target.value);
                    setMovementPage(1);
                  }}
                  type="date"
                  value={movementDateFrom}
                />
                <Input
                  onChange={(event) => {
                    setMovementDateTo(event.target.value);
                    setMovementPage(1);
                  }}
                  type="date"
                  value={movementDateTo}
                />
              </div>
            }
          />
        </CardContent>
      </Card>

      <CashierShiftReportDialog
        onOpenChange={(open) => !open && setReportShiftId(null)}
        open={Boolean(reportShiftId)}
        shiftId={reportShiftId}
      />
    </div>
  );
}
