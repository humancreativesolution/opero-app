import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreateUnitInput,
  PaginatedUnits,
  UnitEntity,
  UpdateUnitInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";
import { productKeys } from "@/resources/gql/product.gql";

const UNIT_FIELDS = /* GraphQL */ `
  id
  code
  name
  isActive
  tenantId
  createdAt
  updatedAt
`;

const GET_UNITS = /* GraphQL */ `
  query GetUnits($page: Int, $limit: Int) {
    units(page: $page, limit: $limit) {
      data {
        ${UNIT_FIELDS}
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

const GET_UNITS_BY_TENANT = /* GraphQL */ `
  query GetUnitsByTenant {
    unitsByTenant {
      ${UNIT_FIELDS}
    }
  }
`;

const CREATE_UNIT = /* GraphQL */ `
  mutation CreateUnit($createUnitInput: CreateUnitInput!) {
    createUnit(createUnitInput: $createUnitInput) {
      ${UNIT_FIELDS}
    }
  }
`;

const UPDATE_UNIT = /* GraphQL */ `
  mutation UpdateUnit($updateUnitInput: UpdateUnitInput!) {
    updateUnit(updateUnitInput: $updateUnitInput) {
      ${UNIT_FIELDS}
    }
  }
`;

const REMOVE_UNIT = /* GraphQL */ `
  mutation RemoveUnit($id: String!) {
    removeUnit(id: $id) {
      id
    }
  }
`;

type UnitListParams = {
  page?: number;
  limit?: number;
};

export const unitKeys = {
  all: ["units"] as const,
  lists: () => [...unitKeys.all, "list"] as const,
  list: (params: Required<UnitListParams>) => [...unitKeys.lists(), params] as const,
  byTenant: () => [...unitKeys.all, "by-tenant"] as const,
};

export function useUnits(params: UnitListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
  };

  return useQuery({
    queryKey: unitKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ units: PaginatedUnits }>(GET_UNITS, queryParams),
    select: (data) => data.units,
  });
}

export function useUnitsByTenant() {
  return useQuery({
    queryKey: unitKeys.byTenant(),
    queryFn: () =>
      gqlClient.request<{ unitsByTenant: UnitEntity[] }>(GET_UNITS_BY_TENANT),
    select: (data) => data.unitsByTenant,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createUnitInput: CreateUnitInput) =>
      gqlClient.request<{ createUnit: UnitEntity }>(CREATE_UNIT, {
        createUnitInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateUnitInput: UpdateUnitInput) =>
      gqlClient.request<{ updateUnit: UnitEntity }>(UPDATE_UNIT, {
        updateUnitInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useRemoveUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ removeUnit: Pick<UnitEntity, "id"> }>(REMOVE_UNIT, {
        id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
