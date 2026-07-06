import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";
import { userKeys } from "@/resources/gql/user.gql";

export type PermissionEntity = {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string | null;
};

export type RoleEntity = {
  id: string;
  name: string;
  description?: string | null;
  permissions: PermissionEntity[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateRoleInput = {
  name: string;
  description?: string;
  permissionIds: string[];
};

export type UpdateRoleInput = {
  id: string;
  name?: string;
  description?: string;
  permissionIds?: string[];
};

const ROLE_FIELDS = /* GraphQL */ `
  id
  name
  description
  permissions {
    id
    name
    module
    action
    description
  }
  createdAt
  updatedAt
`;

const GET_PERMISSIONS = /* GraphQL */ `
  query Permissions {
    permissions {
      id
      name
      module
      action
      description
    }
  }
`;

const GET_ROLES_BY_TENANT = /* GraphQL */ `
  query RolesByTenant {
    rolesByTenant {
      ${ROLE_FIELDS}
    }
  }
`;

const CREATE_ROLE = /* GraphQL */ `
  mutation CreateRole($createRoleInput: CreateRoleInput!) {
    createRole(createRoleInput: $createRoleInput) {
      ${ROLE_FIELDS}
    }
  }
`;

const UPDATE_ROLE = /* GraphQL */ `
  mutation UpdateRole($updateRoleInput: UpdateRoleInput!) {
    updateRole(updateRoleInput: $updateRoleInput) {
      ${ROLE_FIELDS}
    }
  }
`;

const REMOVE_ROLE = /* GraphQL */ `
  mutation RemoveRole($id: String!) {
    removeRole(id: $id) {
      id
    }
  }
`;

export const roleKeys = {
  all: ["roles"] as const,
  permissions: () => [...roleKeys.all, "permissions"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
};

export function usePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () =>
      gqlClient.request<{ permissions: PermissionEntity[] }>(GET_PERMISSIONS),
    select: (data) => data.permissions,
  });
}

export function useRolesByTenant() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: () =>
      gqlClient.request<{ rolesByTenant: RoleEntity[] }>(GET_ROLES_BY_TENANT),
    select: (data) => data.rolesByTenant,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createRoleInput: CreateRoleInput) =>
      gqlClient.request<{ createRole: RoleEntity }>(CREATE_ROLE, {
        createRoleInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateRoleInput: UpdateRoleInput) =>
      gqlClient.request<{ updateRole: RoleEntity }>(UPDATE_ROLE, {
        updateRoleInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ removeRole: Pick<RoleEntity, "id"> }>(REMOVE_ROLE, {
        id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
