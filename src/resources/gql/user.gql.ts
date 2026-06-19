import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "@/libs/graphql";
import { ErrorHelper } from "@libs/error";
import { useAtomicSetter } from "@libs/state";
import { errorAtom } from "@states/atoms/error.atom";
import type {
  PaginatedUsers,
  UserEntity,
  CreateUserInput,
  UpdateUserInput,
} from "@graphql/generated";

// ─── GraphQL Documents ─────────────────────────────────────────────────────────

const GET_USERS = /* GraphQL */ `
  query GetUsers {
    users {
      data {
        id
        tenantId
        email
        fullName
        role
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

const GET_USER = /* GraphQL */ `
  query GetUser($id: String!) {
    user(id: $id) {
      id
      tenantId
      email
      fullName
      role
      createdAt
      updatedAt
    }
  }
`;

const CREATE_USER = /* GraphQL */ `
  mutation CreateUser($createUserInput: CreateUserInput!) {
    createUser(createUserInput: $createUserInput) {
      id
      tenantId
      email
      fullName
      role
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_USER = /* GraphQL */ `
  mutation UpdateUser($updateUserInput: UpdateUserInput!) {
    updateUser(updateUserInput: $updateUserInput) {
      id
      tenantId
      email
      fullName
      role
      createdAt
      updatedAt
    }
  }
`;

const REMOVE_USER = /* GraphQL */ `
  mutation RemoveUser($id: String!) {
    removeUser(id: $id) {
      id
    }
  }
`;

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ─── Query Hooks ───────────────────────────────────────────────────────────────

export function useGetUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => gqlClient.request<{ users: PaginatedUsers }>(GET_USERS),
    select: (data) => data.users,
  });
}

export function useGetUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () =>
      gqlClient.request<{ user: UserEntity | null }>(GET_USER, { id }),
    select: (data) => data.user,
    enabled: !!id,
  });
}

// ─── Mutation Hooks ────────────────────────────────────────────────────────────

export function useCreateUser() {
  const queryClient = useQueryClient();
  const setGlobalError = useAtomicSetter(errorAtom);

  return useMutation({
    mutationFn: (createUserInput: CreateUserInput) =>
      gqlClient.request<{ createUser: UserEntity }>(CREATE_USER, {
        createUserInput,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      setGlobalError(ErrorHelper.parse(error));
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const setGlobalError = useAtomicSetter(errorAtom);

  return useMutation({
    mutationFn: (updateUserInput: UpdateUserInput) =>
      gqlClient.request<{ updateUser: UserEntity }>(UPDATE_USER, {
        updateUserInput,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
    },
    onError: (error: unknown) => {
      setGlobalError(ErrorHelper.parse(error));
    },
  });
}

export function useRemoveUser() {
  const queryClient = useQueryClient();
  const setGlobalError = useAtomicSetter(errorAtom);

  return useMutation({
    mutationFn: (id: string) =>
      gqlClient.request<{ removeUser: UserEntity }>(REMOVE_USER, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      setGlobalError(ErrorHelper.parse(error));
    },
  });
}
