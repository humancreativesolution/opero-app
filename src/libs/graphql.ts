import { GraphQLClient } from "graphql-request";

import { LocalStorage } from "@/libs/storage";

export const gqlClient = new GraphQLClient(
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
