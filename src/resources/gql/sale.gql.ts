import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreateSaleInput,
  CreateSaleReturnInput,
  PaginatedSales,
  SaleEntity,
  SaleFilterInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";
import { productKeys } from "@/resources/gql/product.gql";

const GET_SALES = /* GraphQL */ `
  query GetSales($page: Int, $limit: Int, $filter: SaleFilterInput) {
    sales(page: $page, limit: $limit, filter: $filter) {
      data {
        id
        invoiceNo
        type
        status
        cashierShiftId
        locationId
        locationName
        totalAmount
        paidAmount
        changeAmount
        payments {
          id
          method
          amount
          provider
          referenceNo
          notes
          createdAt
        }
        createdAt
        updatedAt
        items {
          id
          productId
          productName
          qty
          sellingPrice
          costSnapshot
          profit
        }
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

const CREATE_SALE = /* GraphQL */ `
  mutation CreateSale($createSaleInput: CreateSaleInput!) {
    createSale(createSaleInput: $createSaleInput) {
      id
      invoiceNo
      type
      status
      locationId
      locationName
      totalAmount
      paidAmount
      changeAmount
      payments {
        id
        method
        amount
        provider
        referenceNo
        notes
        createdAt
      }
      createdAt
      updatedAt
      items {
        id
        productId
        productName
        qty
        sellingPrice
        costSnapshot
        profit
      }
    }
  }
`;

const CREATE_SALE_RETURN = /* GraphQL */ `
  mutation CreateSaleReturn($createSaleReturnInput: CreateSaleReturnInput!) {
    createSaleReturn(createSaleReturnInput: $createSaleReturnInput) {
      id
      invoiceNo
      type
      status
      referenceSaleId
      reason
      locationId
      locationName
      totalAmount
      paidAmount
      changeAmount
      payments {
        id
        method
        amount
        provider
        referenceNo
        notes
        createdAt
      }
      createdAt
      updatedAt
      items {
        id
        productId
        productName
        qty
        sellingPrice
        costSnapshot
        profit
      }
    }
  }
`;

type SaleListParams = {
  page?: number;
  limit?: number;
  filter?: SaleFilterInput;
};

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (params: SaleListParams) => [...saleKeys.lists(), params] as const,
};

export function useSales(params: SaleListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    filter: params.filter,
  };

  return useQuery({
    queryKey: saleKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ sales: PaginatedSales }>(GET_SALES, queryParams),
    select: (data) => data.sales,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createSaleInput: CreateSaleInput) =>
      gqlClient.request<{ createSale: SaleEntity }>(CREATE_SALE, {
        createSaleInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.posLists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useCreateSaleReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createSaleReturnInput: CreateSaleReturnInput) =>
      gqlClient.request<{ createSaleReturn: SaleEntity }>(CREATE_SALE_RETURN, {
        createSaleReturnInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.posLists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
