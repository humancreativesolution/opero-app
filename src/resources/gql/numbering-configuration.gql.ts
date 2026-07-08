import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

export const NumberingDocumentType = {
  PurchaseOrder: "PURCHASE_ORDER",
  SaleInvoice: "SALE_INVOICE",
  SaleReturn: "SALE_RETURN",
  StockOpname: "STOCK_OPNAME",
} as const;

export type NumberingDocumentType =
  (typeof NumberingDocumentType)[keyof typeof NumberingDocumentType];

export const NumberingResetPeriod = {
  Daily: "DAILY",
  Monthly: "MONTHLY",
  Never: "NEVER",
  Yearly: "YEARLY",
} as const;

export type NumberingResetPeriod =
  (typeof NumberingResetPeriod)[keyof typeof NumberingResetPeriod];

export type NumberingConfigurationEntity = {
  id: string;
  tenantId: string;
  documentType: NumberingDocumentType;
  prefix: string;
  format: string;
  padding: number;
  resetPeriod: NumberingResetPeriod;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateNumberingConfigurationInput = {
  documentType: NumberingDocumentType;
  prefix: string;
  format: string;
  padding?: number;
  resetPeriod?: NumberingResetPeriod;
  isActive?: boolean;
};

const GET_NUMBERING_CONFIGURATIONS = /* GraphQL */ `
  query NumberingConfigurations {
    numberingConfigurations {
      id
      tenantId
      documentType
      prefix
      format
      padding
      resetPeriod
      isActive
      createdAt
      updatedAt
    }
  }
`;

const GET_NUMBERING_CONFIGURATION = /* GraphQL */ `
  query NumberingConfiguration($documentType: NumberingDocumentType!) {
    numberingConfiguration(documentType: $documentType) {
      id
      tenantId
      documentType
      prefix
      format
      padding
      resetPeriod
      isActive
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_NUMBERING_CONFIGURATION = /* GraphQL */ `
  mutation UpdateNumberingConfiguration($input: UpdateNumberingConfigurationInput!) {
    updateNumberingConfiguration(input: $input) {
      id
      tenantId
      documentType
      prefix
      format
      padding
      resetPeriod
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const numberingConfigurationKeys = {
  all: ["numbering-configurations"] as const,
  lists: () => [...numberingConfigurationKeys.all, "list"] as const,
  detail: (documentType: NumberingDocumentType) =>
    [...numberingConfigurationKeys.all, "detail", documentType] as const,
};

export function useNumberingConfigurations() {
  return useQuery({
    queryKey: numberingConfigurationKeys.lists(),
    queryFn: () =>
      gqlClient.request<{ numberingConfigurations: NumberingConfigurationEntity[] }>(
        GET_NUMBERING_CONFIGURATIONS,
      ),
    select: (data) => data.numberingConfigurations,
  });
}

export function useNumberingConfiguration(documentType: NumberingDocumentType) {
  return useQuery({
    queryKey: numberingConfigurationKeys.detail(documentType),
    queryFn: () =>
      gqlClient.request<{ numberingConfiguration: NumberingConfigurationEntity }>(
        GET_NUMBERING_CONFIGURATION,
        { documentType },
      ),
    select: (data) => data.numberingConfiguration,
  });
}

export function useUpdateNumberingConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateNumberingConfigurationInput) =>
      gqlClient.request<{
        updateNumberingConfiguration: NumberingConfigurationEntity;
      }>(UPDATE_NUMBERING_CONFIGURATION, { input }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: numberingConfigurationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: numberingConfigurationKeys.detail(variables.documentType),
      });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
