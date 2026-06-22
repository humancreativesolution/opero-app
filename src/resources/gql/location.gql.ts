import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreateLocationInput,
  LocationFilterInput,
  LocationEntity,
  PaginatedLocations,
  UpdateLocationInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

const GET_LOCATIONS = /* GraphQL */ `
  query GetLocations($page: Int, $limit: Int, $filter: LocationFilterInput) {
    locations(page: $page, limit: $limit, filter: $filter) {
      data {
        id
        name
        type
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

const GET_LOCATIONS_BY_TENANT = /* GraphQL */ `
  query GetLocationsByTenant($filter: LocationFilterInput) {
    locationsByTenant(filter: $filter) {
      id
      name
      type
      createdAt
      updatedAt
    }
  }
`;

const CREATE_LOCATION = /* GraphQL */ `
  mutation CreateLocation($createLocationInput: CreateLocationInput!) {
    createLocation(createLocationInput: $createLocationInput) {
      id
      name
      type
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_LOCATION = /* GraphQL */ `
  mutation UpdateLocation($updateLocationInput: UpdateLocationInput!) {
    updateLocation(updateLocationInput: $updateLocationInput) {
      id
      name
      type
      createdAt
      updatedAt
    }
  }
`;

type LocationListParams = {
  page?: number;
  limit?: number;
  filter?: LocationFilterInput;
};

export const locationKeys = {
  all: ["locations"] as const,
  lists: () => [...locationKeys.all, "list"] as const,
  list: (params: LocationListParams) =>
    [...locationKeys.lists(), params] as const,
  byTenant: (params: Pick<LocationListParams, "filter"> = {}) =>
    [...locationKeys.all, "by-tenant", params] as const,
};

export function useLocations(params: LocationListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    filter: params.filter,
  };

  return useQuery({
    queryKey: locationKeys.list(queryParams),
    queryFn: () =>
      gqlClient.request<{ locations: PaginatedLocations }>(
        GET_LOCATIONS,
        queryParams,
      ),
    select: (data) => data.locations,
  });
}

export function useLocationsByTenant(params: Pick<LocationListParams, "filter"> = {}) {
  return useQuery({
    queryKey: locationKeys.byTenant(params),
    queryFn: () =>
      gqlClient.request<{ locationsByTenant: LocationEntity[] }>(
        GET_LOCATIONS_BY_TENANT,
        params,
      ),
    select: (data) => data.locationsByTenant,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createLocationInput: CreateLocationInput) =>
      gqlClient.request<{ createLocation: LocationEntity }>(CREATE_LOCATION, {
        createLocationInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateLocationInput: UpdateLocationInput) =>
      gqlClient.request<{ updateLocation: LocationEntity }>(UPDATE_LOCATION, {
        updateLocationInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
