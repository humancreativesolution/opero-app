export class TokenError extends Error {}
export class ForbiddenError extends Error {}

type GraphQLErrorLike = {
  message?: string;
  code?: string;
  extensions?: {
    code?: string;
    originalError?: {
      message?: string | string[];
    };
  };
};

export class ErrorHelper {
  static parse(error: unknown): Error {
    if (!(error instanceof Error) && typeof error !== "object") {
      return new Error(String(error));
    }

    const graphQlError = error as {
      graphQLErrors?: GraphQLErrorLike[];
      response?: {
        errors?: GraphQLErrorLike[];
      };
    };
    const networkError =
      graphQlError.graphQLErrors ?? graphQlError.response?.errors;

    if (networkError && Array.isArray(networkError)) {
      const msg = networkError
        .map((row) => {
          const originalMessage = row.extensions?.originalError?.message;

          if (Array.isArray(originalMessage)) {
            return originalMessage.join(", ");
          }

          return originalMessage ?? row.message;
        })
        .filter(Boolean)
        .join(", ");
      const hasInvalidToken = networkError.some(
        (row) =>
          row?.code === "invalid_token" ||
          row?.extensions?.code === "invalid_token",
      );

      if (hasInvalidToken) {
        return new TokenError(msg);
      }

      const hasForbidden = networkError.some((row) => {
        const code = row?.code ?? row?.extensions?.code;
        const message = [row?.message, row?.extensions?.originalError?.message]
          .flat()
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return code === "FORBIDDEN" || message.includes("forbidden");
      });

      if (hasForbidden) {
        return new ForbiddenError(
          msg || "You don't have access to perform this action.",
        );
      }

      return new Error(msg);
    }

    return error instanceof Error ? error : new Error("Unexpected error");
  }
}
