import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";

export type ReceiptConfigurationEntity = {
  id: string;
  tenantId: string;
  locationId?: string | null;
  locationName?: string | null;
  storeName: string;
  address?: string | null;
  phone?: string | null;
  footerText?: string | null;
  returnPolicyText?: string | null;
  showCashierName: boolean;
  showShiftCode: boolean;
  showDiscount: boolean;
  showSku: boolean;
  showBarcode: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateReceiptConfigurationInput = {
  locationId?: string;
  storeName: string;
  address?: string;
  phone?: string;
  footerText?: string;
  returnPolicyText?: string;
  showCashierName?: boolean;
  showShiftCode?: boolean;
  showDiscount?: boolean;
  showSku?: boolean;
  showBarcode?: boolean;
  isActive?: boolean;
};

const GET_RECEIPT_CONFIGURATION = /* GraphQL */ `
  query ReceiptConfiguration($locationId: String) {
    receiptConfiguration(locationId: $locationId) {
      id
      tenantId
      locationId
      locationName
      storeName
      address
      phone
      footerText
      returnPolicyText
      showCashierName
      showShiftCode
      showDiscount
      showSku
      showBarcode
      isActive
      createdAt
      updatedAt
    }
  }
`;

const GET_RECEIPT_CONFIGURATIONS = /* GraphQL */ `
  query ReceiptConfigurations {
    receiptConfigurations {
      id
      tenantId
      locationId
      locationName
      storeName
      address
      phone
      footerText
      returnPolicyText
      showCashierName
      showShiftCode
      showDiscount
      showSku
      showBarcode
      isActive
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_RECEIPT_CONFIGURATION = /* GraphQL */ `
  mutation UpdateReceiptConfiguration($input: UpdateReceiptConfigurationInput!) {
    updateReceiptConfiguration(input: $input) {
      id
      tenantId
      locationId
      locationName
      storeName
      address
      phone
      footerText
      returnPolicyText
      showCashierName
      showShiftCode
      showDiscount
      showSku
      showBarcode
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const receiptConfigurationKeys = {
  all: ["receipt-configurations"] as const,
  lists: () => [...receiptConfigurationKeys.all, "list"] as const,
  resolved: (locationId?: string) =>
    [...receiptConfigurationKeys.all, "resolved", locationId ?? "default"] as const,
};

export function useReceiptConfigurations() {
  return useQuery({
    queryKey: receiptConfigurationKeys.lists(),
    queryFn: () =>
      gqlClient.request<{ receiptConfigurations: ReceiptConfigurationEntity[] }>(
        GET_RECEIPT_CONFIGURATIONS,
      ),
    select: (data) => data.receiptConfigurations,
  });
}

export function useReceiptConfiguration(locationId?: string) {
  return useQuery({
    queryKey: receiptConfigurationKeys.resolved(locationId),
    queryFn: () =>
      gqlClient.request<{ receiptConfiguration: ReceiptConfigurationEntity }>(
        GET_RECEIPT_CONFIGURATION,
        { locationId },
      ),
    select: (data) => data.receiptConfiguration,
  });
}

export function useUpdateReceiptConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateReceiptConfigurationInput) =>
      gqlClient.request<{ updateReceiptConfiguration: ReceiptConfigurationEntity }>(
        UPDATE_RECEIPT_CONFIGURATION,
        { input },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: receiptConfigurationKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: receiptConfigurationKeys.resolved(variables.locationId),
      });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
