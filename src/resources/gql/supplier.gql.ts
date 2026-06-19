import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreateSupplierInput,
  PaginatedSuppliers,
  SupplierEntity,
  UpdateSupplierInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

const GET_SUPPLIERS = /* GraphQL */ `
  query GetSuppliers($page: Int, $limit: Int) {
    suppliers(page: $page, limit: $limit) {
      data {
        id
        code
        name
        phone
        address
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

const CREATE_SUPPLIER = /* GraphQL */ `
  mutation CreateSupplier($createSupplierInput: CreateSupplierInput!) {
    createSupplier(createSupplierInput: $createSupplierInput) {
      id
      code
      name
      phone
      address
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_SUPPLIER = /* GraphQL */ `
  mutation UpdateSupplier($updateSupplierInput: UpdateSupplierInput!) {
    updateSupplier(updateSupplierInput: $updateSupplierInput) {
      id
      code
      name
      phone
      address
      createdAt
      updatedAt
    }
  }
`;

type SupplierListParams = {
  page?: number;
  limit?: number;
};

export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (params: SupplierListParams) =>
    [...supplierKeys.lists(), params] as const,
};

export function useSuppliers(params: SupplierListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
  };

  return useQuery({
    queryKey: supplierKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ suppliers: PaginatedSuppliers }>(
        GET_SUPPLIERS,
        queryParams,
      ),
    select: (data) => data.suppliers,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createSupplierInput: CreateSupplierInput) =>
      gqlClient.request<{ createSupplier: SupplierEntity }>(CREATE_SUPPLIER, {
        createSupplierInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateSupplierInput: UpdateSupplierInput) =>
      gqlClient.request<{ updateSupplier: SupplierEntity }>(UPDATE_SUPPLIER, {
        updateSupplierInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
