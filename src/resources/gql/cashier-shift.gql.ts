import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CashierShiftEntity,
  CashierShiftFilterInput,
  CashierShiftReportEntity,
  CloseCashierShiftInput,
  OpenCashierShiftInput,
  PaginatedCashierShifts,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

const CASHIER_SHIFT_FIELDS = /* GraphQL */ `
  fragment CashierShiftFields on CashierShiftEntity {
    id
    locationId
    locationName
    openedByUserId
    openedByUserName
    closedByUserId
    closedByUserName
    openingCash
    expectedCash
    countedCash
    variance
    status
    openedAt
    closedAt
    notes
  }
`;

const GET_CURRENT_CASHIER_SHIFT = /* GraphQL */ `
  ${CASHIER_SHIFT_FIELDS}
  query GetCurrentCashierShift($locationId: String!) {
    currentCashierShift(locationId: $locationId) {
      ...CashierShiftFields
    }
  }
`;

const GET_CASHIER_SHIFTS = /* GraphQL */ `
  ${CASHIER_SHIFT_FIELDS}
  query GetCashierShifts(
    $page: Int
    $limit: Int
    $filter: CashierShiftFilterInput
  ) {
    cashierShifts(page: $page, limit: $limit, filter: $filter) {
      data {
        ...CashierShiftFields
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

const GET_CASHIER_SHIFT_REPORT = /* GraphQL */ `
  query GetCashierShiftReport($id: String!) {
    cashierShiftReport(id: $id) {
      id
      locationId
      locationName
      openedByUserId
      openedByUserName
      closedByUserId
      closedByUserName
      status
      openedAt
      closedAt
      openingCash
      expectedCash
      countedCash
      variance
      transactionCount
      saleCount
      returnCount
      grossSales
      returnAmount
      netSales
      itemDiscountTotal
      transactionDiscountTotal
      totalDiscount
      itemQtySold
      cogs
      grossProfit
      cashPaymentTotal
      nonCashPaymentTotal
      paymentsByMethod {
        method
        amount
        count
      }
    }
  }
`;

const OPEN_CASHIER_SHIFT = /* GraphQL */ `
  ${CASHIER_SHIFT_FIELDS}
  mutation OpenCashierShift($input: OpenCashierShiftInput!) {
    openCashierShift(input: $input) {
      ...CashierShiftFields
    }
  }
`;

const CLOSE_CASHIER_SHIFT = /* GraphQL */ `
  ${CASHIER_SHIFT_FIELDS}
  mutation CloseCashierShift($input: CloseCashierShiftInput!) {
    closeCashierShift(input: $input) {
      ...CashierShiftFields
    }
  }
`;

type CashierShiftListParams = {
  page?: number;
  limit?: number;
  filter?: CashierShiftFilterInput;
};

export const cashierShiftKeys = {
  all: ["cashier-shifts"] as const,
  current: (locationId: string) =>
    [...cashierShiftKeys.all, "current", locationId] as const,
  lists: () => [...cashierShiftKeys.all, "list"] as const,
  list: (params: CashierShiftListParams) =>
    [...cashierShiftKeys.lists(), params] as const,
  report: (id?: string | null) => [...cashierShiftKeys.all, "report", id] as const,
};

export function useCurrentCashierShift(locationId: string) {
  return useQuery({
    enabled: Boolean(locationId),
    queryKey: cashierShiftKeys.current(locationId),
    queryFn: () =>
      gqlClient.request<{
        currentCashierShift?: CashierShiftEntity | null;
      }>(GET_CURRENT_CASHIER_SHIFT, { locationId }),
    select: (data) => data.currentCashierShift ?? null,
  });
}

export function useCashierShifts(params: CashierShiftListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    filter: params.filter,
  };

  return useQuery({
    queryKey: cashierShiftKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ cashierShifts: PaginatedCashierShifts }>(
        GET_CASHIER_SHIFTS,
        queryParams,
      ),
    select: (data) => data.cashierShifts,
  });
}

export function useCashierShiftReport(id?: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: cashierShiftKeys.report(id),
    queryFn: () =>
      gqlClient.request<{ cashierShiftReport: CashierShiftReportEntity }>(
        GET_CASHIER_SHIFT_REPORT,
        { id },
      ),
    select: (data) => data.cashierShiftReport,
  });
}

export function useOpenCashierShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OpenCashierShiftInput) =>
      gqlClient.request<{ openCashierShift: CashierShiftEntity }>(
        OPEN_CASHIER_SHIFT,
        { input },
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cashierShiftKeys.all });
      queryClient.setQueryData(
        cashierShiftKeys.current(data.openCashierShift.locationId),
        data.openCashierShift,
      );
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useCloseCashierShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CloseCashierShiftInput) =>
      gqlClient.request<{ closeCashierShift: CashierShiftEntity }>(
        CLOSE_CASHIER_SHIFT,
        { input },
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cashierShiftKeys.all });
      queryClient.setQueryData(
        cashierShiftKeys.current(data.closeCashierShift.locationId),
        null,
      );
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
