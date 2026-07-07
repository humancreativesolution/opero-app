import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreateCustomerInput,
  CustomerEntity,
  CustomerFilterInput,
  PaginatedCustomers,
  UpdateCustomerInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";
import { reportKeys } from "@/resources/gql/report.gql";
import { saleKeys } from "@/resources/gql/sale.gql";

const CUSTOMER_FIELDS = /* GraphQL */ `
  id
  code
  name
  phone
  email
  address
  notes
  isActive
  tenantId
  createdAt
  updatedAt
`;

const GET_CUSTOMERS = /* GraphQL */ `
  query GetCustomers($page: Int, $limit: Int, $filter: CustomerFilterInput) {
    customers(page: $page, limit: $limit, filter: $filter) {
      data {
        ${CUSTOMER_FIELDS}
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

const GET_CUSTOMERS_BY_TENANT = /* GraphQL */ `
  query GetCustomersByTenant($filter: CustomerFilterInput) {
    customersByTenant(filter: $filter) {
      ${CUSTOMER_FIELDS}
    }
  }
`;

const CREATE_CUSTOMER = /* GraphQL */ `
  mutation CreateCustomer($createCustomerInput: CreateCustomerInput!) {
    createCustomer(createCustomerInput: $createCustomerInput) {
      ${CUSTOMER_FIELDS}
    }
  }
`;

const UPDATE_CUSTOMER = /* GraphQL */ `
  mutation UpdateCustomer($updateCustomerInput: UpdateCustomerInput!) {
    updateCustomer(updateCustomerInput: $updateCustomerInput) {
      ${CUSTOMER_FIELDS}
    }
  }
`;

const REMOVE_CUSTOMER = /* GraphQL */ `
  mutation RemoveCustomer($id: String!) {
    removeCustomer(id: $id) {
      id
    }
  }
`;

type CustomerListParams = {
  page?: number;
  limit?: number;
  filter?: CustomerFilterInput;
};

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: CustomerListParams) => [...customerKeys.lists(), params] as const,
  byTenant: (filter?: CustomerFilterInput) =>
    [...customerKeys.all, "by-tenant", filter] as const,
};

export function useCustomers(params: CustomerListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    filter: params.filter,
  };

  return useQuery({
    queryKey: customerKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ customers: PaginatedCustomers }>(
        GET_CUSTOMERS,
        queryParams,
      ),
    select: (data) => data.customers,
  });
}

export function useCustomersByTenant(filter?: CustomerFilterInput, enabled = true) {
  return useQuery({
    enabled,
    queryKey: customerKeys.byTenant(filter),
    queryFn: () =>
      gqlClient.request<{ customersByTenant: CustomerEntity[] }>(
        GET_CUSTOMERS_BY_TENANT,
        { filter },
      ),
    select: (data) => data.customersByTenant,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createCustomerInput: CreateCustomerInput) =>
      gqlClient.request<{ createCustomer: CustomerEntity }>(CREATE_CUSTOMER, {
        createCustomerInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateCustomerInput: UpdateCustomerInput) =>
      gqlClient.request<{ updateCustomer: CustomerEntity }>(UPDATE_CUSTOMER, {
        updateCustomerInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useRemoveCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ removeCustomer: Pick<CustomerEntity, "id"> }>(
        REMOVE_CUSTOMER,
        { id },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
