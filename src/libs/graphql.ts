import { ClientError, GraphQLClient, type RequestDocument } from "graphql-request";

import { LocalStorage } from "@/libs/storage";
import {
  expireAuthSession,
  isAccessTokenExpired,
} from "@/routes/auth";

type GraphQLErrorLike = {
  message?: string;
  extensions?: {
    code?: string;
    originalError?: {
      statusCode?: number;
      message?: string;
      error?: string;
    };
  };
};

const graphqlClient = new GraphQLClient(
  `${import.meta.env.VITE_API_URL}graphql`,
  {
    headers() {
      const token = LocalStorage.getItem("accessToken");

      return token
        ? { Authorization: `Bearer ${token}` }
        : ({} as Record<string, string>);
    },
  },
);

function isUnauthorizedGraphQLError(row: GraphQLErrorLike) {
  const code = row.extensions?.code?.toUpperCase();
  const statusCode = row.extensions?.originalError?.statusCode;
  const message = [
    row.message,
    row.extensions?.originalError?.message,
    row.extensions?.originalError?.error,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    statusCode === 401 ||
    code === "UNAUTHENTICATED" ||
    code === "UNAUTHORIZED" ||
    code === "INVALID_TOKEN" ||
    message.includes("jwt expired") ||
    message.includes("unauthorized")
  );
}

function isUnauthorizedError(error: unknown) {
  if (error instanceof ClientError) {
    if (error.response.status === 401) {
      return true;
    }

    return error.response.errors?.some(isUnauthorizedGraphQLError);
  }

  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { errors?: GraphQLErrorLike[] } })
      .response;

    return response?.errors?.some(isUnauthorizedGraphQLError) ?? false;
  }

  return false;
}

export const gqlClient = {
  async request<TResponse = unknown>(
    document: RequestDocument,
    variables?: Record<string, unknown>,
  ) {
    if (isAccessTokenExpired()) {
      expireAuthSession();
      throw new Error("Session expired");
    }

    try {
      if (variables) {
        return await graphqlClient.request<TResponse>(document, variables);
      }

      return await graphqlClient.request<TResponse>(document);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        expireAuthSession();
      }

      throw error;
    }
  },
};
