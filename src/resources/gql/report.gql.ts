import { useMutation, useQuery } from "@tanstack/react-query";

import type {
  PaginatedSalesReportItems,
  PaginatedSalesReportTransactions,
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

const EXPORT_SALES_REPORT_TRANSACTIONS_CSV = /* GraphQL */ `
  query ExportSalesTransactions($filter: SalesReportFilterInput) {
    salesReportTransactionsCsv(filter: $filter)
  }
`;

const EXPORT_SALES_REPORT_ITEMS_CSV = /* GraphQL */ `
  query ExportSalesItems($filter: SalesReportFilterInput) {
    salesReportItemsCsv(filter: $filter)
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

export function useExportSalesReportTransactionsCsv() {
  return useMutation({
    mutationFn: (filter?: SalesReportFilterInput) =>
      gqlClient
        .request<{ salesReportTransactionsCsv: string }>(
          EXPORT_SALES_REPORT_TRANSACTIONS_CSV,
          { filter },
        )
        .then((data) => data.salesReportTransactionsCsv),
  });
}

export function useExportSalesReportItemsCsv() {
  return useMutation({
    mutationFn: (filter?: SalesReportFilterInput) =>
      gqlClient
        .request<{ salesReportItemsCsv: string }>(EXPORT_SALES_REPORT_ITEMS_CSV, {
          filter,
        })
        .then((data) => data.salesReportItemsCsv),
  });
}

export type {
  SalesReportFilterInput,
  SalesReportItemEntity,
  SalesReportSummaryEntity,
  SalesReportTransactionEntity,
};
