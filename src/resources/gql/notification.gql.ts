import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PaginationMeta } from "@/graphql/generated";
import { gqlClient } from "@/libs/graphql";
import { isAuthenticated } from "@/routes/auth";

export const NotificationType = {
  CashMovementCreated: "CASH_MOVEMENT_CREATED",
  CashierShiftVariance: "CASHIER_SHIFT_VARIANCE",
  ReportExportCompleted: "REPORT_EXPORT_COMPLETED",
  ReportExportFailed: "REPORT_EXPORT_FAILED",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationSeverity = {
  Error: "ERROR",
  Info: "INFO",
  Success: "SUCCESS",
  Warning: "WARNING",
} as const;

export type NotificationSeverity =
  (typeof NotificationSeverity)[keyof typeof NotificationSeverity];

export type NotificationEntity = {
  id: string;
  tenantId: string;
  recipientUserId?: string | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  resourceType?: string | null;
  resourceId?: string | null;
  actionUrl?: string | null;
  metadataJson?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationFilterInput = {
  type?: NotificationType;
  severity?: NotificationSeverity;
  isRead?: boolean;
};

export type PaginatedNotifications = {
  data: NotificationEntity[];
  meta: PaginationMeta;
};

type NotificationListParams = {
  page?: number;
  limit?: number;
  filter?: NotificationFilterInput;
};

const GET_NOTIFICATIONS = /* GraphQL */ `
  query Notifications(
    $page: Int
    $limit: Int
    $filter: NotificationFilterInput
  ) {
    notifications(page: $page, limit: $limit, filter: $filter) {
      data {
        id
        tenantId
        recipientUserId
        type
        severity
        title
        message
        resourceType
        resourceId
        actionUrl
        metadataJson
        isRead
        readAt
        createdAt
      }
      meta {
        page
        limit
        totalCount
        totalPages
        hasNextPage
        hasPrevPage
      }
    }
  }
`;

const GET_UNREAD_NOTIFICATION_COUNT = /* GraphQL */ `
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

const MARK_NOTIFICATION_AS_READ = /* GraphQL */ `
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      id
      isRead
      readAt
    }
  }
`;

const MARK_ALL_NOTIFICATIONS_AS_READ = /* GraphQL */ `
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`;

export const notificationKeys = {
  all: ["notifications"] as const,
  count: () => [...notificationKeys.all, "unread-count"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params: NotificationListParams) =>
    [...notificationKeys.lists(), params] as const,
};

function invalidateNotificationData(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useNotifications(params: NotificationListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    filter: params.filter,
  };

  return useQuery({
    queryKey: notificationKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ notifications: PaginatedNotifications }>(
        GET_NOTIFICATIONS,
        queryParams,
      ),
    select: (data) => data.notifications,
    enabled: isAuthenticated(),
    refetchInterval: 30000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: () =>
      gqlClient.request<{ unreadNotificationCount: number }>(
        GET_UNREAD_NOTIFICATION_COUNT,
      ),
    select: (data) => data.unreadNotificationCount,
    enabled: isAuthenticated(),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ markNotificationAsRead: Pick<NotificationEntity, "id"> }>(
        MARK_NOTIFICATION_AS_READ,
        { id },
      ),
    onSuccess: () => {
      invalidateNotificationData(queryClient);
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      gqlClient.request<{ markAllNotificationsAsRead: number }>(
        MARK_ALL_NOTIFICATIONS_AS_READ,
      ),
    onSuccess: () => {
      invalidateNotificationData(queryClient);
    },
  });
}
