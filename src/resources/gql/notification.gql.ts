import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  NotificationEntity,
  NotificationFilterInput,
  PaginatedNotifications,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

const NOTIFICATION_FIELDS = /* GraphQL */ `
  fragment NotificationFields on NotificationEntity {
    id
    type
    severity
    title
    message
    resourceType
    resourceId
    actionUrl
    isRead
    readAt
    createdAt
  }
`;

const GET_NOTIFICATIONS = /* GraphQL */ `
  ${NOTIFICATION_FIELDS}
  query GetNotifications($page: Int, $limit: Int, $filter: NotificationFilterInput) {
    notifications(page: $page, limit: $limit, filter: $filter) {
      data {
        ...NotificationFields
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
  query GetUnreadNotificationCount {
    unreadNotificationCount
  }
`;

const MARK_NOTIFICATION_AS_READ = /* GraphQL */ `
  ${NOTIFICATION_FIELDS}
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      ...NotificationFields
    }
  }
`;

const MARK_ALL_NOTIFICATIONS_AS_READ = /* GraphQL */ `
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`;

type NotificationListParams = {
  page?: number;
  limit?: number;
  filter?: NotificationFilterInput;
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params: NotificationListParams) =>
    [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

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
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () =>
      gqlClient.request<{ unreadNotificationCount: number }>(
        GET_UNREAD_NOTIFICATION_COUNT,
      ),
    refetchInterval: 30_000,
    select: (data) => data.unreadNotificationCount,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ markNotificationAsRead: NotificationEntity }>(
        MARK_NOTIFICATION_AS_READ,
        { id },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
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
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
