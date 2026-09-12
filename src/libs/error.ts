export class TokenError extends Error {}

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

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Sesi Anda telah berakhir. Silakan login kembali.",
  FORBIDDEN: "Anda tidak memiliki akses untuk melakukan aksi ini.",
  NOT_FOUND: "Data tidak ditemukan.",
  CONFLICT: "Data sudah ada atau bentrok dengan data lain.",
  INTERNAL_SERVER_ERROR: "Terjadi kesalahan server. Silakan coba lagi.",
  invalid_token: "Sesi Anda telah berakhir. Silakan login kembali.",
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
      const firstError = networkError[0];
      const code =
        firstError?.extensions?.code || firstError?.code || "";

      const hasInvalidToken = networkError.some(
        (row) =>
          row?.code === "invalid_token" ||
          row?.extensions?.code === "invalid_token" ||
          row?.extensions?.code === "UNAUTHORIZED",
      );

      const originalMessage = firstError?.extensions?.originalError?.message;
      let msg = "";

      if (Array.isArray(originalMessage)) {
        msg = originalMessage.join(", ");
      } else if (typeof originalMessage === "string") {
        msg = originalMessage;
      } else if (code && ERROR_MESSAGES[code]) {
        msg = ERROR_MESSAGES[code];
      } else {
        msg = firstError?.message ?? "Terjadi kesalahan";
      }

      if (hasInvalidToken) {
        return new TokenError(msg);
      }

      return new Error(msg);
    }

    return error instanceof Error ? error : new Error("Terjadi kesalahan");
  }
}
