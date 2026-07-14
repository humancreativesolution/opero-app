import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreatePurchaseFromSuggestionsInput,
  CreatePurchaseInput,
  PurchaseEntity,
  PurchaseSuggestionEntity,
  PurchaseSuggestionFilterInput,
  ReceivePurchaseInput,
  UpdatePurchaseInput,
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

const UPDATE_PURCHASE = /* GraphQL */ `
  mutation UpdatePurchase($input: UpdatePurchaseInput!) {
    updatePurchase(input: $input) {
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

const CANCEL_PURCHASE = /* GraphQL */ `
  mutation CancelPurchase($id: String!) {
    cancelPurchase(id: $id) {
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

const RECEIVE_PURCHASE = /* GraphQL */ `
  mutation ReceivePurchase($input: ReceivePurchaseInput!) {
    receivePurchase(input: $input) {
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

const GET_PURCHASE_SUGGESTIONS = /* GraphQL */ `
  query PurchaseSuggestions($filter: PurchaseSuggestionFilterInput) {
    purchaseSuggestions(filter: $filter) {
      productId
      productName
      sku
      barcode
      locationId
      locationName
      stockOnHand
      minimumStock
      suggestedQty
      lastCostPrice
      estimatedAmount
      warningStatus
    }
  }
`;

const CREATE_PURCHASE_FROM_SUGGESTIONS = /* GraphQL */ `
  mutation CreatePurchaseFromSuggestions($input: CreatePurchaseFromSuggestionsInput!) {
    createPurchaseFromSuggestions(input: $input) {
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

type PurchaseListParams = {
  page?: number;
  limit?: number;
};

type PurchaseSuggestionParams = {
  filter?: PurchaseSuggestionFilterInput;
};

export const purchaseKeys = {
  all: ["purchases"] as const,
  lists: () => [...purchaseKeys.all, "list"] as const,
  list: (params: PurchaseListParams) =>
    [...purchaseKeys.lists(), params] as const,
  suggestions: () => [...purchaseKeys.all, "suggestions"] as const,
  suggestionList: (params: PurchaseSuggestionParams) =>
    [...purchaseKeys.suggestions(), params] as const,
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

export function usePurchaseSuggestions(params: PurchaseSuggestionParams = {}) {
  return useQuery({
    queryKey: purchaseKeys.suggestionList(params),
    queryFn: () =>
      gqlClient.request<{ purchaseSuggestions: PurchaseSuggestionEntity[] }>(
        GET_PURCHASE_SUGGESTIONS,
        params,
      ),
    select: (data) => data.purchaseSuggestions,
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

export function useCreatePurchaseFromSuggestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePurchaseFromSuggestionsInput) =>
      gqlClient.request<{ createPurchaseFromSuggestions: PurchaseEntity }>(
        CREATE_PURCHASE_FROM_SUGGESTIONS,
        { input },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.suggestions() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePurchaseInput) =>
      gqlClient.request<{ updatePurchase: PurchaseEntity }>(UPDATE_PURCHASE, {
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

export function useCancelPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ cancelPurchase: PurchaseEntity }>(CANCEL_PURCHASE, {
        id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useReceivePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReceivePurchaseInput) =>
      gqlClient.request<{ receivePurchase: PurchaseEntity }>(RECEIVE_PURCHASE, {
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
