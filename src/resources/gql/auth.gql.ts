import { useMutation, useQueryClient } from "@tanstack/react-query";

import { gqlClient } from "@/libs/graphql";
import type { AuthResponse, LoginInput } from "@/graphql/generated";
import { saveAuthSession } from "@/routes/auth";

const LOGIN = /* GraphQL */ `
  mutation TenantLogin($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      accessToken
      user {
        id
        email
        fullName
        role
        authType
        isSuperuser
        permissions
      }
    }
  }
`;

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loginInput: LoginInput) =>
      gqlClient.request<{ login: AuthResponse }>(LOGIN, {
        loginInput,
      }),
    onSuccess: (data) => {
      saveAuthSession(data.login);
      queryClient.clear();
    },
  });
}
