import { useMutation, useQuery } from "@tanstack/react-query";

import type {
  PaginatedSalesReportItems,
  PaginatedSalesReportTransactions,
  PaginationMeta,
  SalesReportFilterInput,
  SalesReportItemEntity,
  SalesReportSummaryEntity,
  SalesReportTransactionEntity,
} from "@/graphql/generated";
import { gqlClient } from "@/libs/graphql";

type SalesReportListParams = {
  page?: number;
  limit?: number;
  filter?: SalesReportFilterInput;
};

export const ReportExportStatus = {
  Completed: "COMPLETED",
  Failed: "FAILED",
  Pending: "PENDING",
  Processing: "PROCESSING",
} as const;

export type ReportExportStatus =
  (typeof ReportExportStatus)[keyof typeof ReportExportStatus];

export const ReportExportType = {
  SalesReportItems: "SALES_REPORT_ITEMS",
  SalesReportTransactions: "SALES_REPORT_TRANSACTIONS",
} as const;

export type ReportExportType =
  (typeof ReportExportType)[keyof typeof ReportExportType];

export type ReportExportJobEntity = {
  id: string;
  tenantId: string;
  requestedByUserId?: string | null;
  requestedByUserName?: string | null;
  type: string;
  status: ReportExportStatus;
  filterJson?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  content?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  expiresAt?: string | null;
  isDownloadable: boolean;
};

export type ReportExportJobSummaryEntity = Omit<
  ReportExportJobEntity,
  "content"
>;

export type PaginatedReportExportJobs = {
  data: ReportExportJobSummaryEntity[];
  meta: PaginationMeta;
};

export type ReportExportJobFilterInput = {
  status?: ReportExportStatus;
  type?: ReportExportType;
};

type ReportExportJobListParams = {
  page?: number;
  limit?: number;
  filter?: ReportExportJobFilterInput;
};

const GET_SALES_REPORT_SUMMARY = /* GraphQL */ `
  query GetSalesReportSummary($filter: SalesReportFilterInput) {
    salesReportSummary(filter: $filter) {
      grossSales
      itemDiscountTotal
      transactionDiscountTotal
      totalDiscount
      returnAmount
      netSales
      cogs
      grossProfit
      transactionCount
      saleCount
      returnCount
      itemQtySold
    }
  }
`;

const GET_SALES_REPORT_TRANSACTIONS = /* GraphQL */ `
  query GetSalesReportTransactions(
    $page: Int!
    $limit: Int!
    $filter: SalesReportFilterInput
  ) {
    salesReportTransactions(page: $page, limit: $limit, filter: $filter) {
      data {
        id
        invoiceNo
        type
        cashierShiftId
        cashierUserId
        cashierName
        customerId
        customerName
        locationId
        locationName
        itemCount
        totalQty
        grossAmount
        itemDiscountTotal
        transactionDiscountTotal
        totalAmount
        paidAmount
        grossProfit
        payments {
          id
          method
          amount
        }
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

const GET_SALES_REPORT_ITEMS = /* GraphQL */ `
  query GetSalesReportItems(
    $page: Int!
    $limit: Int!
    $filter: SalesReportFilterInput
  ) {
    salesReportItems(page: $page, limit: $limit, filter: $filter) {
      data {
        productId
        productName
        sku
        barcode
        qtySold
        grossSales
        discountTotal
        netSales
        cogs
        grossProfit
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

const CREATE_SALES_REPORT_TRANSACTIONS_EXPORT = /* GraphQL */ `
  mutation CreateSalesReportTransactionsExport($filter: SalesReportFilterInput) {
    createSalesReportTransactionsExport(filter: $filter) {
      id
      tenantId
      requestedByUserId
      requestedByUserName
      type
      status
      filterJson
      fileName
      contentType
      content
      errorMessage
      createdAt
      startedAt
      completedAt
      failedAt
      expiresAt
      isDownloadable
    }
  }
`;

const CREATE_SALES_REPORT_ITEMS_EXPORT = /* GraphQL */ `
  mutation CreateSalesReportItemsExport($filter: SalesReportFilterInput) {
    createSalesReportItemsExport(filter: $filter) {
      id
      tenantId
      requestedByUserId
      requestedByUserName
      type
      status
      filterJson
      fileName
      contentType
      content
      errorMessage
      createdAt
      startedAt
      completedAt
      failedAt
      expiresAt
      isDownloadable
    }
  }
`;

const GET_REPORT_EXPORT_JOB = /* GraphQL */ `
  query ReportExportJob($id: ID!) {
    reportExportJob(id: $id) {
      id
      tenantId
      requestedByUserId
      requestedByUserName
      type
      status
      filterJson
      fileName
      contentType
      content
      errorMessage
      createdAt
      startedAt
      completedAt
      failedAt
      expiresAt
      isDownloadable
    }
  }
`;

const GET_REPORT_EXPORT_JOBS = /* GraphQL */ `
  query ReportExportJobs(
    $page: Int!
    $limit: Int!
    $filter: ReportExportJobFilterInput
  ) {
    reportExportJobs(page: $page, limit: $limit, filter: $filter) {
      data {
        id
        tenantId
        requestedByUserId
        requestedByUserName
        type
        status
        filterJson
        fileName
        contentType
        errorMessage
        createdAt
        startedAt
        completedAt
        failedAt
        expiresAt
        isDownloadable
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

export const reportKeys = {
  all: ["reports"] as const,
  salesSummary: (filter?: SalesReportFilterInput) =>
    [...reportKeys.all, "sales-summary", filter] as const,
  salesTransactions: (params: SalesReportListParams) =>
    [...reportKeys.all, "sales-transactions", params] as const,
  salesItems: (params: SalesReportListParams) =>
    [...reportKeys.all, "sales-items", params] as const,
  exportJobs: (params: ReportExportJobListParams) =>
    [...reportKeys.all, "export-jobs", params] as const,
  exportJob: (id: string) => [...reportKeys.all, "export-job", id] as const,
};

export function useSalesReportSummary(filter?: SalesReportFilterInput) {
  return useQuery({
    queryKey: reportKeys.salesSummary(filter),
    queryFn: () =>
      gqlClient.request<{ salesReportSummary: SalesReportSummaryEntity }>(
        GET_SALES_REPORT_SUMMARY,
        { filter },
      ),
    select: (data) => data.salesReportSummary,
  });
}

export function useSalesReportTransactions(params: SalesReportListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    filter: params.filter,
  };

  return useQuery({
    queryKey: reportKeys.salesTransactions(queryParams),
    queryFn: () =>
      gqlClient.request<{
        salesReportTransactions: PaginatedSalesReportTransactions;
      }>(GET_SALES_REPORT_TRANSACTIONS, queryParams),
    select: (data) => data.salesReportTransactions,
  });
}

export function useSalesReportItems(params: SalesReportListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    filter: params.filter,
  };

  return useQuery({
    queryKey: reportKeys.salesItems(queryParams),
    queryFn: () =>
      gqlClient.request<{
        salesReportItems: PaginatedSalesReportItems;
      }>(GET_SALES_REPORT_ITEMS, queryParams),
    select: (data) => data.salesReportItems,
  });
}

export function useCreateSalesReportTransactionsExport() {
  return useMutation({
    mutationFn: (filter?: SalesReportFilterInput) =>
      gqlClient
        .request<{ createSalesReportTransactionsExport: ReportExportJobEntity }>(
          CREATE_SALES_REPORT_TRANSACTIONS_EXPORT,
          { filter },
        )
        .then((data) => data.createSalesReportTransactionsExport),
  });
}

export function useCreateSalesReportItemsExport() {
  return useMutation({
    mutationFn: (filter?: SalesReportFilterInput) =>
      gqlClient
        .request<{ createSalesReportItemsExport: ReportExportJobEntity }>(
          CREATE_SALES_REPORT_ITEMS_EXPORT,
          { filter },
        )
        .then((data) => data.createSalesReportItemsExport),
  });
}

export function useReportExportJobs(params: ReportExportJobListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    filter: params.filter,
  };

  return useQuery({
    queryKey: reportKeys.exportJobs(queryParams),
    queryFn: () =>
      gqlClient.request<{ reportExportJobs: PaginatedReportExportJobs }>(
        GET_REPORT_EXPORT_JOBS,
        queryParams,
      ),
    select: (data) => data.reportExportJobs,
  });
}

export function fetchReportExportJob(id: string) {
  return gqlClient
    .request<{ reportExportJob: ReportExportJobEntity }>(GET_REPORT_EXPORT_JOB, {
      id,
    })
    .then((data) => data.reportExportJob);
}

export type {
  SalesReportFilterInput,
  SalesReportItemEntity,
  SalesReportSummaryEntity,
  SalesReportTransactionEntity,
};
