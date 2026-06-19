import { useQuery } from "@tanstack/react-query";

import type { LocationEntity, PaginatedLocations } from "@/graphql/generated";
import { gqlClient } from "@/libs/graphql";

const GET_LOCATIONS = /* GraphQL */ `
  query GetLocations($page: Int, $limit: Int) {
    locations(page: $page, limit: $limit) {
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
  query GetLocationsByTenant {
    locationsByTenant {
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
};

export const locationKeys = {
  all: ["locations"] as const,
  lists: () => [...locationKeys.all, "list"] as const,
  list: (params: LocationListParams) =>
    [...locationKeys.lists(), params] as const,
  byTenant: () => [...locationKeys.all, "by-tenant"] as const,
};

export function useLocations(params: LocationListParams = {}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
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

export function useLocationsByTenant() {
  return useQuery({
    queryKey: locationKeys.byTenant(),
    queryFn: () =>
      gqlClient.request<{ locationsByTenant: LocationEntity[] }>(
        GET_LOCATIONS_BY_TENANT,
      ),
    select: (data) => data.locationsByTenant,
  });
}
