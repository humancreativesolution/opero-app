import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  ApprovalDecisionInput,
  ApprovalRequestEntity,
  ApprovalRequestFilterInput,
  PaginatedApprovalRequests,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

const APPROVAL_REQUEST_FIELDS = /* GraphQL */ `
  fragment ApprovalRequestFields on ApprovalRequestEntity {
    id
    type
    status
    requestedByUserId
    requestedByUserName
    decidedByUserId
    decidedByUserName
    reason
    notes
    decisionNotes
    resourceType
    resourceId
    failureReason
    requestedAt
    decidedAt
    createdAt
  }
`;

const GET_MY_APPROVAL_REQUESTS = /* GraphQL */ `
  ${APPROVAL_REQUEST_FIELDS}
  query GetMyApprovalRequests(
    $page: Int
    $limit: Int
    $filter: ApprovalRequestFilterInput
  ) {
    myApprovalRequests(page: $page, limit: $limit, filter: $filter) {
      data {
        ...ApprovalRequestFields
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

const GET_APPROVAL_REQUESTS = /* GraphQL */ `
  ${APPROVAL_REQUEST_FIELDS}
  query GetApprovalRequests(
    $page: Int
    $limit: Int
    $filter: ApprovalRequestFilterInput
  ) {
    approvalRequests(page: $page, limit: $limit, filter: $filter) {
      data {
        ...ApprovalRequestFields
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

const APPROVE_APPROVAL_REQUEST = /* GraphQL */ `
  ${APPROVAL_REQUEST_FIELDS}
  mutation ApproveApprovalRequest($input: ApprovalDecisionInput!) {
    approveApprovalRequest(input: $input) {
      ...ApprovalRequestFields
    }
  }
`;

const REJECT_APPROVAL_REQUEST = /* GraphQL */ `
  ${APPROVAL_REQUEST_FIELDS}
  mutation RejectApprovalRequest($input: ApprovalDecisionInput!) {
    rejectApprovalRequest(input: $input) {
      ...ApprovalRequestFields
    }
  }
`;

type ApprovalRequestListParams = {
  page?: number;
  limit?: number;
  filter?: ApprovalRequestFilterInput;
};

export const approvalKeys = {
  all: ["approvals"] as const,
  mine: () => [...approvalKeys.all, "mine"] as const,
  mineList: (params: ApprovalRequestListParams) =>
    [...approvalKeys.mine(), params] as const,
  lists: () => [...approvalKeys.all, "list"] as const,
  list: (params: ApprovalRequestListParams) =>
    [...approvalKeys.lists(), params] as const,
};

export function useMyApprovalRequests(params: ApprovalRequestListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    filter: params.filter,
  };

  return useQuery({
    queryKey: approvalKeys.mineList(queryParams),
    queryFn: () =>
      gqlClient.request<{ myApprovalRequests: PaginatedApprovalRequests }>(
        GET_MY_APPROVAL_REQUESTS,
        queryParams,
      ),
    select: (data) => data.myApprovalRequests,
  });
}

export function useApprovalRequests(params: ApprovalRequestListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    filter: params.filter,
  };

  return useQuery({
    queryKey: approvalKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ approvalRequests: PaginatedApprovalRequests }>(
        GET_APPROVAL_REQUESTS,
        queryParams,
      ),
    select: (data) => data.approvalRequests,
  });
}

export function useApproveApprovalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApprovalDecisionInput) =>
      gqlClient.request<{ approveApprovalRequest: ApprovalRequestEntity }>(
        APPROVE_APPROVAL_REQUEST,
        { input },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useRejectApprovalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApprovalDecisionInput) =>
      gqlClient.request<{ rejectApprovalRequest: ApprovalRequestEntity }>(
        REJECT_APPROVAL_REQUEST,
        { input },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
