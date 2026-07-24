import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/libs/utils";
import {
  NotificationSeverity,
  type NotificationEntity,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/resources/gql/notification.gql";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getSeverityClassName(severity: NotificationEntity["severity"]) {
  if (severity === NotificationSeverity.Error) {
    return "bg-red-500";
  }

  if (severity === NotificationSeverity.Warning) {
    return "bg-amber-500";
  }

  if (severity === NotificationSeverity.Success) {
    return "bg-emerald-500";
  }

  return "bg-primary";
}

function normalizeActionUrl(actionUrl?: string | null) {
  if (!actionUrl) {
    return null;
  }

  if (actionUrl.startsWith("http")) {
    return null;
  }

  return actionUrl.startsWith("/") ? actionUrl : `/${actionUrl}`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const countQuery = useUnreadNotificationCount();
  const notificationsQuery = useNotifications({
    page: 1,
    limit: 8,
  });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const unreadCount = countQuery.data ?? 0;
  const notifications = notificationsQuery.data?.data ?? [];

  async function handleNotificationClick(notification: NotificationEntity) {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }

    const actionUrl = normalizeActionUrl(notification.actionUrl);

    if (actionUrl) {
      navigate(actionUrl);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark read");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Notifications"
          className="relative"
          size="icon-sm"
          variant="outline"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between gap-3 p-3">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Button
            disabled={unreadCount === 0 || markAllAsRead.isPending}
            onClick={handleMarkAllRead}
            size="xs"
            type="button"
            variant="ghost"
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CheckCheck className="size-3" />
            )}
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[28rem] overflow-y-auto p-2">
          {notificationsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading notifications
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <button
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted",
                    !notification.isRead && "border-primary/30 bg-primary/5",
                  )}
                  disabled={markAsRead.isPending}
                  key={notification.id}
                  onClick={() => void handleNotificationClick(notification)}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 size-2 rounded-full",
                        getSeverityClassName(notification.severity),
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-medium">
                          {notification.title}
                        </p>
                        {!notification.isRead ? (
                          <Badge className="h-4 px-1.5 text-[10px]">New</Badge>
                        ) : null}
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
