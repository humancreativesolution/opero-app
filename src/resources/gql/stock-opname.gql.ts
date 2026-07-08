import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreateStockOpnameInput,
  PaginatedStockOpnames,
  StockOpnameEntity,
  StockOpnameFilterInput,
  UpdateStockOpnameInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";
import { inventoryKeys } from "@/resources/gql/inventory.gql";
import { productKeys } from "@/resources/gql/product.gql";

const STOCK_OPNAME_FIELDS = /* GraphQL */ `
  id
  opnameNo
  locationId
  locationName
  status
  notes
  createdByUserId
  createdByUserName
  finalizedByUserId
  finalizedByUserName
  finalizedAt
  createdAt
  updatedAt
  items {
    id
    productId
    productName
    sku
    barcode
    systemQty
    countedQty
    varianceQty
    adjustmentId
  }
`;

const GET_STOCK_OPNAMES = /* GraphQL */ `
  query GetStockOpnames($page: Int, $limit: Int, $filter: StockOpnameFilterInput) {
    stockOpnames(page: $page, limit: $limit, filter: $filter) {
      data {
        ${STOCK_OPNAME_FIELDS}
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

const GET_STOCK_OPNAME = /* GraphQL */ `
  query GetStockOpname($id: String!) {
    stockOpname(id: $id) {
      ${STOCK_OPNAME_FIELDS}
    }
  }
`;

const CREATE_STOCK_OPNAME = /* GraphQL */ `
  mutation CreateStockOpname($input: CreateStockOpnameInput!) {
    createStockOpname(input: $input) {
      ${STOCK_OPNAME_FIELDS}
    }
  }
`;

const UPDATE_STOCK_OPNAME = /* GraphQL */ `
  mutation UpdateStockOpname($input: UpdateStockOpnameInput!) {
    updateStockOpname(input: $input) {
      ${STOCK_OPNAME_FIELDS}
    }
  }
`;

const FINALIZE_STOCK_OPNAME = /* GraphQL */ `
  mutation FinalizeStockOpname($id: String!) {
    finalizeStockOpname(id: $id) {
      ${STOCK_OPNAME_FIELDS}
    }
  }
`;

const CANCEL_STOCK_OPNAME = /* GraphQL */ `
  mutation CancelStockOpname($id: String!) {
    cancelStockOpname(id: $id) {
      ${STOCK_OPNAME_FIELDS}
    }
  }
`;

type StockOpnameListParams = {
  page?: number;
  limit?: number;
  filter?: StockOpnameFilterInput;
};

export const stockOpnameKeys = {
  all: ["stock-opnames"] as const,
  lists: () => [...stockOpnameKeys.all, "list"] as const,
  list: (params: StockOpnameListParams) =>
    [...stockOpnameKeys.lists(), params] as const,
  detail: (id?: string | null) => [...stockOpnameKeys.all, "detail", id] as const,
};

function invalidateStockOpnameData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: stockOpnameKeys.all });
  queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
  queryClient.invalidateQueries({ queryKey: productKeys.posLists() });
}

export function useStockOpnames(params: StockOpnameListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    filter: params.filter,
  };

  return useQuery({
    queryKey: stockOpnameKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ stockOpnames: PaginatedStockOpnames }>(
        GET_STOCK_OPNAMES,
        queryParams,
      ),
    select: (data) => data.stockOpnames,
  });
}

export function useStockOpname(id?: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: stockOpnameKeys.detail(id),
    queryFn: () =>
      gqlClient.request<{ stockOpname: StockOpnameEntity }>(GET_STOCK_OPNAME, {
        id,
      }),
    select: (data) => data.stockOpname,
  });
}

export function useCreateStockOpname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStockOpnameInput) =>
      gqlClient.request<{ createStockOpname: StockOpnameEntity }>(
        CREATE_STOCK_OPNAME,
        { input },
      ),
    onSuccess: () => invalidateStockOpnameData(queryClient),
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdateStockOpname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStockOpnameInput) =>
      gqlClient.request<{ updateStockOpname: StockOpnameEntity }>(
        UPDATE_STOCK_OPNAME,
        { input },
      ),
    onSuccess: () => invalidateStockOpnameData(queryClient),
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useFinalizeStockOpname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ finalizeStockOpname: StockOpnameEntity }>(
        FINALIZE_STOCK_OPNAME,
        { id },
      ),
    onSuccess: () => invalidateStockOpnameData(queryClient),
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useCancelStockOpname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ cancelStockOpname: StockOpnameEntity }>(
        CANCEL_STOCK_OPNAME,
        { id },
      ),
    onSuccess: () => invalidateStockOpnameData(queryClient),
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
