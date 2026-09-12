import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  PaginatedReportExportJobs,
  ReportExportJobEntity,
  ReportExportJobFilterInput,
  ReportExportJobSummaryEntity,
  SalesReportFilterInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

const REPORT_EXPORT_JOB_SUMMARY_FIELDS = /* GraphQL */ `
  fragment ReportExportJobSummaryFields on ReportExportJobSummaryEntity {
    id
    type
    status
    requestedByUserName
    fileName
    contentType
    errorMessage
    isDownloadable
    createdAt
    startedAt
    completedAt
    failedAt
    expiresAt
  }
`;

const CREATE_SALES_REPORT_TRANSACTIONS_EXPORT = /* GraphQL */ `
  mutation CreateSalesReportTransactionsExport($filter: SalesReportFilterInput) {
    createSalesReportTransactionsExport(filter: $filter) {
      id
      status
    }
  }
`;

const CREATE_SALES_REPORT_ITEMS_EXPORT = /* GraphQL */ `
  mutation CreateSalesReportItemsExport($filter: SalesReportFilterInput) {
    createSalesReportItemsExport(filter: $filter) {
      id
      status
    }
  }
`;

const GET_REPORT_EXPORT_JOBS = /* GraphQL */ `
  ${REPORT_EXPORT_JOB_SUMMARY_FIELDS}
  query GetReportExportJobs(
    $page: Int
    $limit: Int
    $filter: ReportExportJobFilterInput
  ) {
    reportExportJobs(page: $page, limit: $limit, filter: $filter) {
      data {
        ...ReportExportJobSummaryFields
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

const GET_REPORT_EXPORT_JOB = /* GraphQL */ `
  query GetReportExportJob($id: ID!) {
    reportExportJob(id: $id) {
      id
      type
      status
      fileName
      contentType
      content
      errorMessage
      isDownloadable
      expiresAt
    }
  }
`;

type ReportExportJobListParams = {
  page?: number;
  limit?: number;
  filter?: ReportExportJobFilterInput;
};

export const reportExportJobKeys = {
  all: ["report-export-jobs"] as const,
  lists: () => [...reportExportJobKeys.all, "list"] as const,
  list: (params: ReportExportJobListParams) =>
    [...reportExportJobKeys.lists(), params] as const,
};

export function useReportExportJobs(
  params: ReportExportJobListParams = {},
  refetchInterval?: number,
) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    filter: params.filter,
  };

  return useQuery({
    queryKey: reportExportJobKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ reportExportJobs: PaginatedReportExportJobs }>(
        GET_REPORT_EXPORT_JOBS,
        queryParams,
      ),
    refetchInterval,
    select: (data) => data.reportExportJobs,
  });
}

export function fetchReportExportJob(id: string) {
  return gqlClient
    .request<{ reportExportJob: ReportExportJobEntity }>(GET_REPORT_EXPORT_JOB, { id })
    .then((data) => data.reportExportJob);
}

export function useReportExportJob(id?: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: [...reportExportJobKeys.all, "detail", id] as const,
    queryFn: () =>
      gqlClient.request<{ reportExportJob: ReportExportJobEntity }>(
        GET_REPORT_EXPORT_JOB,
        { id },
      ),
    select: (data) => data.reportExportJob,
  });
}

export function useCreateSalesReportTransactionsExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filter?: SalesReportFilterInput) =>
      gqlClient.request<{
        createSalesReportTransactionsExport: ReportExportJobEntity;
      }>(CREATE_SALES_REPORT_TRANSACTIONS_EXPORT, { filter }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportExportJobKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useCreateSalesReportItemsExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filter?: SalesReportFilterInput) =>
      gqlClient.request<{ createSalesReportItemsExport: ReportExportJobEntity }>(
        CREATE_SALES_REPORT_ITEMS_EXPORT,
        { filter },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportExportJobKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export type { ReportExportJobEntity, ReportExportJobSummaryEntity };
