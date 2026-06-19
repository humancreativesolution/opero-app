import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreatePurchaseInput,
  PurchaseEntity,
  UpdatePurchaseStatusInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

const GET_PURCHASES = /* GraphQL */ `
  query GetPurchases($page: Int, $limit: Int) {
    purchases(page: $page, limit: $limit) {
      id
      purchaseNo
      purchaseDate
      supplierId
      supplierName
      locationId
      locationName
      status
      totalAmount
      createdAt
      items {
        id
        productId
        productName
        qty
        costPrice
        subtotal
      }
    }
  }
`;

const CREATE_PURCHASE = /* GraphQL */ `
  mutation CreatePurchase($input: CreatePurchaseInput!) {
    createPurchase(input: $input) {
      id
      purchaseNo
      purchaseDate
      supplierId
      supplierName
      locationId
      locationName
      status
      totalAmount
      createdAt
      items {
        id
        productId
        productName
        qty
        costPrice
        subtotal
      }
    }
  }
`;

const UPDATE_PURCHASE_STATUS = /* GraphQL */ `
  mutation UpdatePurchaseStatus($input: UpdatePurchaseStatusInput!) {
    updatePurchaseStatus(input: $input) {
      id
      status
    }
  }
`;

type PurchaseListParams = {
  page?: number;
  limit?: number;
};

export const purchaseKeys = {
  all: ["purchases"] as const,
  lists: () => [...purchaseKeys.all, "list"] as const,
  list: (params: PurchaseListParams) =>
    [...purchaseKeys.lists(), params] as const,
};

export function usePurchases(params: PurchaseListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
  };

  return useQuery({
    queryKey: purchaseKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ purchases: PurchaseEntity[] }>(
        GET_PURCHASES,
        queryParams,
      ),
    select: (data) => data.purchases,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePurchaseInput) =>
      gqlClient.request<{ createPurchase: PurchaseEntity }>(CREATE_PURCHASE, {
        input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdatePurchaseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePurchaseStatusInput) =>
      gqlClient.request<{ updatePurchaseStatus: PurchaseEntity }>(
        UPDATE_PURCHASE_STATUS,
        {
          input,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
