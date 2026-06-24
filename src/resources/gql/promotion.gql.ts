import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreatePromotionInput,
  PaginatedPromotions,
  PromotionEntity,
  PromotionFilterInput,
  UpdatePromotionInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";
import { productKeys } from "@/resources/gql/product.gql";

const PROMOTION_FIELDS = /* GraphQL */ `
  fragment PromotionFields on PromotionEntity {
    id
    name
    description
    type
    channel
    status
    discountValueType
    discountValue
    minQty
    minSubtotal
    applyToAllProducts
    defaultLocationId
    productIds
    locationIds
    startsAt
    endsAt
    createdAt
    updatedAt
  }
`;

const GET_PROMOTIONS = /* GraphQL */ `
  ${PROMOTION_FIELDS}
  query GetPromotions($page: Int, $limit: Int, $filter: PromotionFilterInput) {
    promotions(page: $page, limit: $limit, filter: $filter) {
      data {
        ...PromotionFields
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

const CREATE_PROMOTION = /* GraphQL */ `
  ${PROMOTION_FIELDS}
  mutation CreatePromotion($createPromotionInput: CreatePromotionInput!) {
    createPromotion(createPromotionInput: $createPromotionInput) {
      ...PromotionFields
    }
  }
`;

const UPDATE_PROMOTION = /* GraphQL */ `
  ${PROMOTION_FIELDS}
  mutation UpdatePromotion($updatePromotionInput: UpdatePromotionInput!) {
    updatePromotion(updatePromotionInput: $updatePromotionInput) {
      ...PromotionFields
    }
  }
`;

const REMOVE_PROMOTION = /* GraphQL */ `
  ${PROMOTION_FIELDS}
  mutation RemovePromotion($id: String!) {
    removePromotion(id: $id) {
      ...PromotionFields
    }
  }
`;

type PromotionListParams = {
  page?: number;
  limit?: number;
  filter?: PromotionFilterInput;
};

export const promotionKeys = {
  all: ["promotions"] as const,
  lists: () => [...promotionKeys.all, "list"] as const,
  list: (params: PromotionListParams) =>
    [...promotionKeys.lists(), params] as const,
};

export function usePromotions(params: PromotionListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    filter: params.filter,
  };

  return useQuery({
    queryKey: promotionKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ promotions: PaginatedPromotions }>(
        GET_PROMOTIONS,
        queryParams,
      ),
    select: (data) => data.promotions,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createPromotionInput: CreatePromotionInput) =>
      gqlClient.request<{ createPromotion: PromotionEntity }>(CREATE_PROMOTION, {
        createPromotionInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.posLists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatePromotionInput: UpdatePromotionInput) =>
      gqlClient.request<{ updatePromotion: PromotionEntity }>(UPDATE_PROMOTION, {
        updatePromotionInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.posLists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useRemovePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ removePromotion: PromotionEntity }>(REMOVE_PROMOTION, {
        id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.posLists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
