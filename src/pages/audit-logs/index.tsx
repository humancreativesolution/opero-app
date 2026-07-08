import type { ColumnDef } from "@tanstack/react-table";
import { Eye, FileSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditLogEntity } from "@/graphql/generated";
import { useAuditLogs } from "@/resources/gql/audit-log.gql";
import { useGetUsers } from "@/resources/gql/user.gql";

const ALL_VALUE = "__all";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const auditModuleOptions = [
  "sales",
  "purchases",
  "cashier-shifts",
  "inventory",
  "stock-opnames",
];

const auditActionOptions = [
  "create",
  "return",
  "update",
  "update_status",
  "receive",
  "cancel",
  "open",
  "close",
  "adjust",
  "set_initial_stock",
  "transfer",
  "finalize",
];

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function formatLabel(value?: string | null) {
  if (!value) {
    return "-";
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseMetadata(metadata?: string | null) {
  if (!metadata) {
    return null;
  }

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function summarizeMetadata(metadata?: string | null) {
  const parsed = parseMetadata(metadata);

  if (!parsed) {
    return metadata || "-";
  }

  const preferredKeys = [
    "invoiceNo",
    "purchaseNo",
    "opnameNo",
    "locationName",
    "totalAmount",
    "qty",
    "productName",
    "supplierName",
  ];
  const parts = preferredKeys
    .filter((key) => parsed[key] !== undefined && parsed[key] !== null)
    .map((key) => `${formatLabel(key)}: ${String(parsed[key])}`);

  if (parts.length > 0) {
    return parts.slice(0, 3).join(" · ");
  }

  return Object.entries(parsed)
    .slice(0, 3)
    .map(([key, value]) => `${formatLabel(key)}: ${String(value)}`)
    .join(" · ");
}

function stringifyMetadata(metadata?: string | null) {
  const parsed = parseMetadata(metadata);

  if (!parsed) {
    return metadata || "No metadata";
  }

  return JSON.stringify(parsed, null, 2);
}

function getActionClassName(action: string) {
  if (["create", "open", "receive", "finalize"].includes(action)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (["cancel", "return", "close"].includes(action)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300";
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntity | null>(null);
  const usersQuery = useGetUsers();
  const auditLogsQuery = useAuditLogs({
    page,
    limit,
    filter: {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      module: module || undefined,
      action: action || undefined,
      entityType: entityType.trim() || undefined,
      userId: userId || undefined,
    },
  });

  function resetPage() {
    setPage(1);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  const columns = useMemo<ColumnDef<AuditLogEntity>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Time",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "userFullName",
        header: "User",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {row.original.userFullName || "System"}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.userEmail || row.original.userId || "-"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "module",
        header: "Module",
        cell: ({ row }) => (
          <Badge variant="secondary">{formatLabel(row.original.module)}</Badge>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <Badge
            className={getActionClassName(row.original.action)}
            variant="outline"
          >
            {formatLabel(row.original.action)}
          </Badge>
        ),
      },
      {
        accessorKey: "entityLabel",
        header: "Entity",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.entityLabel || "-"}</p>
            <p className="text-xs text-muted-foreground">
              {formatLabel(row.original.entityType)}
              {row.original.entityId ? ` · ${row.original.entityId}` : ""}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "metadata",
        header: "Metadata summary",
        cell: ({ row }) => (
          <p className="max-w-md truncate text-sm text-muted-foreground">
            {summarizeMetadata(row.original.metadata)}
          </p>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              onClick={() => setSelectedLog(row.original)}
              size="sm"
              variant="outline"
            >
              <Eye className="size-4" />
              Detail
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
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Operational activity history for sales, purchases, cashier shifts,
          inventory, and stock opname.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="size-4 text-muted-foreground" />
            Audit log list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={auditLogsQuery.data?.data ?? []}
            emptyMessage="No audit logs found."
            isLoading={auditLogsQuery.isLoading}
            pagination={{
              meta: auditLogsQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <div className="grid w-full gap-2 md:grid-cols-3 xl:grid-cols-6">
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
                <Select
                  onValueChange={(value) => {
                    setModule(value === ALL_VALUE ? "" : value);
                    resetPage();
                  }}
                  value={module || ALL_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All modules</SelectItem>
                    {auditModuleOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {formatLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) => {
                    setAction(value === ALL_VALUE ? "" : value);
                    resetPage();
                  }}
                  value={action || ALL_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All actions</SelectItem>
                    {auditActionOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {formatLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => {
                      setEntityType(event.target.value);
                      resetPage();
                    }}
                    placeholder="Entity type"
                    value={entityType}
                  />
                </div>
                <Select
                  onValueChange={(value) => {
                    setUserId(value === ALL_VALUE ? "" : value);
                    resetPage();
                  }}
                  value={userId || ALL_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All users</SelectItem>
                    {(usersQuery.data?.data ?? []).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null);
          }
        }}
        open={Boolean(selectedLog)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audit log detail</DialogTitle>
            <DialogDescription>
              Full metadata JSON for the selected operational activity.
            </DialogDescription>
          </DialogHeader>

          {selectedLog ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">
                    {selectedLog.userFullName || selectedLog.userEmail || "System"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Module / action</p>
                  <p className="font-medium">
                    {formatLabel(selectedLog.module)} ·{" "}
                    {formatLabel(selectedLog.action)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity</p>
                  <p className="font-medium">
                    {selectedLog.entityLabel || selectedLog.entityId || "-"}
                  </p>
                </div>
              </div>
              <pre className="max-h-[60vh] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs">
                {stringifyMetadata(selectedLog.metadata)}
              </pre>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
