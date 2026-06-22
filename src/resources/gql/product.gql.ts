import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreateProductInput,
  PaginatedPosProducts,
  PaginatedProducts,
  PosProductFilterInput,
  ProductEntity,
  UpdateProductInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

const GET_PRODUCTS = /* GraphQL */ `
  query GetProducts($page: Int, $limit: Int) {
    products(page: $page, limit: $limit) {
      data {
        id
        sku
        barcode
        name
        sellingPrice
        lastCostPrice
        isActive
        createdAt
        updatedAt
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

const CREATE_PRODUCT = /* GraphQL */ `
  mutation CreateProduct($createProductInput: CreateProductInput!) {
    createProduct(createProductInput: $createProductInput) {
      id
      sku
      barcode
      name
      sellingPrice
      lastCostPrice
      isActive
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PRODUCT = /* GraphQL */ `
  mutation UpdateProduct($updateProductInput: UpdateProductInput!) {
    updateProduct(updateProductInput: $updateProductInput) {
      id
      sku
      barcode
      name
      sellingPrice
      lastCostPrice
      isActive
      createdAt
      updatedAt
    }
  }
`;

const GET_POS_PRODUCTS = /* GraphQL */ `
  query GetPosProducts($filter: PosProductFilterInput!) {
    posProducts(filter: $filter) {
      data {
        id
        sku
        barcode
        name
        sellingPrice
        isActive
        stockOnHand
        locationId
        locationName
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

type ProductListParams = {
  page?: number;
  limit?: number;
};

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  posLists: () => [...productKeys.all, "pos-list"] as const,
  posList: (filter: PosProductFilterInput) =>
    [...productKeys.posLists(), filter] as const,
};

export function useProducts(params: ProductListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
  };

  return useQuery({
    queryKey: productKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ products: PaginatedProducts }>(GET_PRODUCTS, queryParams),
    select: (data) => data.products,
  });
}

export function usePosProducts(filter: PosProductFilterInput) {
  return useQuery({
    enabled: Boolean(filter.locationId),
    queryKey: productKeys.posList(filter),
    queryFn: () =>
      gqlClient.request<{ posProducts: PaginatedPosProducts }>(
        GET_POS_PRODUCTS,
        { filter },
      ),
    select: (data) => data.posProducts,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createProductInput: CreateProductInput) =>
      gqlClient.request<{ createProduct: ProductEntity }>(CREATE_PRODUCT, {
        createProductInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateProductInput: UpdateProductInput) =>
      gqlClient.request<{ updateProduct: ProductEntity }>(UPDATE_PRODUCT, {
        updateProductInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
