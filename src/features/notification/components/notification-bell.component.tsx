import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationEntity, NotificationSeverity } from "@/graphql/generated";
import { cn } from "@/libs/utils";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/resources/gql/notification.gql";

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

function getSeverityDotClassName(severity: NotificationSeverity) {
  if (severity === "ERROR") {
    return "bg-red-500";
  }

  if (severity === "WARNING") {
    return "bg-amber-500";
  }

  return "bg-sky-500";
}

export function NotificationBell() {
  const navigate = useNavigate();
  const unreadCountQuery = useUnreadNotificationCount();
  const notificationsQuery = useNotifications({ limit: 5 });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const unreadCount = unreadCountQuery.data ?? 0;
  const notifications = notificationsQuery.data?.data ?? [];

  function handleSelect(notification: NotificationEntity) {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative" size="icon-sm" variant="outline">
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center px-1 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              className="h-auto px-1 text-xs"
              disabled={markAllAsRead.isPending}
              onClick={() => markAllAsRead.mutate()}
              size="sm"
              variant="link"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-80 overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <p className="p-3 text-center text-sm text-muted-foreground">
              Loading notifications...
            </p>
          ) : notifications.length === 0 ? (
            <p className="p-3 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                className="flex-col items-start gap-0.5 whitespace-normal py-2"
                key={notification.id}
                onClick={() => handleSelect(notification)}
              >
                <div className="flex w-full items-start gap-2">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      getSeverityDotClassName(notification.severity),
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm",
                        !notification.isRead && "font-semibold",
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/notifications")}>
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
