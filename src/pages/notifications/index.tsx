import type { ColumnDef } from "@tanstack/react-table";
import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NotificationEntity, NotificationSeverity } from "@/graphql/generated";
import { cn } from "@/libs/utils";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "@/resources/gql/notification.gql";
import { useNavigate } from "react-router-dom";

const ALL_VALUE = "__all";

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

function getSeverityClassName(severity: NotificationSeverity) {
  if (severity === "ERROR") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  if (severity === "WARNING") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [severity, setSeverity] = useState<"" | NotificationSeverity>("");
  const [isRead, setIsRead] = useState<"" | "true" | "false">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const notificationsQuery = useNotifications({
    page,
    limit,
    filter: {
      severity: severity || undefined,
      isRead: isRead === "" ? undefined : isRead === "true",
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
  });

  function resetPage() {
    setPage(1);
  }

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  const handleRowClick = useCallback(
    (notification: NotificationEntity) => {
      if (!notification.isRead) {
        markAsRead.mutate(notification.id);
      }

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    },
    [markAsRead, navigate],
  );

  const columns = useMemo<ColumnDef<NotificationEntity>[]>(
    () => [
      {
        accessorKey: "isRead",
        header: "",
        cell: ({ row }) =>
          row.original.isRead ? null : (
            <span className="block size-2 rounded-full bg-primary" />
          ),
      },
      {
        accessorKey: "title",
        header: "Notification",
        cell: ({ row }) => (
          <div>
            <p className={cn("font-medium", !row.original.isRead && "font-semibold")}>
              {row.original.title}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.message}</p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => (
          <Badge className={getSeverityClassName(row.original.severity)} variant="outline">
            {row.original.severity}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Time",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button onClick={() => handleRowClick(row.original)} size="sm" variant="outline">
              {row.original.isRead ? "Open" : "Mark as read"}
            </Button>
          </div>
        ),
      },
    ],
    [handleRowClick],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Operational alerts for report exports, cashier shift variance, cash
            movements, low stock, and approvals.
          </p>
        </div>
        <Button
          disabled={markAllAsRead.isPending}
          onClick={() => markAllAsRead.mutate()}
          variant="outline"
        >
          <CheckCheck className="size-4" />
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-muted-foreground" />
            Notification list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={notificationsQuery.data?.data ?? []}
            emptyMessage="No notifications found."
            isLoading={notificationsQuery.isLoading}
            pagination={{
              meta: notificationsQuery.data?.meta,
              onPageChange: setPage,
              onPageSizeChange: handlePageSizeChange,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            toolbar={
              <div className="grid w-full gap-2 md:grid-cols-4">
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
                    setSeverity(value === ALL_VALUE ? "" : (value as NotificationSeverity));
                    resetPage();
                  }}
                  value={severity || ALL_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All severities</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) => {
                    setIsRead(value === ALL_VALUE ? "" : (value as "true" | "false"));
                    resetPage();
                  }}
                  value={isRead || ALL_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All status</SelectItem>
                    <SelectItem value="false">Unread</SelectItem>
                    <SelectItem value="true">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
