import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:3001/graphql",
  generates: {
    "src/graphql/generated.ts": {
      plugins: [
        "typescript",
        {
          "typescript-operations": {
            skipTypename: true,
            dedupeFragments: true,
          },
        },
      ],
      config: {
        enumsAsConst: true,
        useTypeImports: true,
      },
    },
  },
};

export default config;
