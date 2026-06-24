import { useQuery } from "@tanstack/react-query";

import type {
  DashboardSummary,
  DashboardSummaryFilterInput,
} from "@/graphql/generated";
import { gqlClient } from "@/libs/graphql";

const GET_DASHBOARD_SUMMARY = /* GraphQL */ `
  query GetDashboardSummary($filter: DashboardSummaryFilterInput) {
    dashboardSummary(filter: $filter) {
      sales {
        transactionCount
        saleCount
        returnCount
        grossSales
        returnAmount
        netSales
        grossProfit
      }
      cash {
        cashTotal
        nonCashTotal
        byMethod {
          method
          amount
          count
        }
      }
      inventory {
        lowStockCount
        outOfStockCount
      }
      purchases {
        pendingPurchaseCount
        partiallyReceivedPurchaseCount
      }
    }
  }
`;

type DashboardSummaryParams = {
  filter?: DashboardSummaryFilterInput;
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (params: DashboardSummaryParams) =>
    [...dashboardKeys.all, "summary", params] as const,
};

export function useDashboardSummary(params: DashboardSummaryParams = {}) {
  return useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () =>
      gqlClient.request<{ dashboardSummary: DashboardSummary }>(
        GET_DASHBOARD_SUMMARY,
        params,
      ),
    select: (data) => data.dashboardSummary,
  });
}
