import { useQuery } from "@tanstack/react-query";

import type {
  AuditLogFilterInput,
  PaginatedAuditLogs,
} from "@/graphql/generated";
import { gqlClient } from "@/libs/graphql";

type AuditLogListParams = {
  page?: number;
  limit?: number;
  filter?: AuditLogFilterInput;
};

const GET_AUDIT_LOGS = /* GraphQL */ `
  query AuditLogs($page: Int!, $limit: Int!, $filter: AuditLogFilterInput) {
    auditLogs(page: $page, limit: $limit, filter: $filter) {
      data {
        id
        userId
        userEmail
        userFullName
        module
        action
        entityType
        entityId
        entityLabel
        metadata
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

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  lists: () => [...auditLogKeys.all, "list"] as const,
  list: (params: AuditLogListParams) => [...auditLogKeys.lists(), params] as const,
};

export function useAuditLogs(params: AuditLogListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    filter: params.filter,
  };

  return useQuery({
    queryKey: auditLogKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ auditLogs: PaginatedAuditLogs }>(
        GET_AUDIT_LOGS,
        queryParams,
      ),
    select: (data) => data.auditLogs,
  });
}
