import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  InventoryBalance,
  InventoryFilterInput,
  InventoryTransactionEntity,
  SetInitialStockInput,
  StockAdjustmentInput,
  StockTransferInput,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { gqlClient } from "@/libs/graphql";
import { productKeys } from "@/resources/gql/product.gql";

export const StockWarningStatus = {
  LowStock: "LOW_STOCK",
  OutOfStock: "OUT_OF_STOCK",
} as const;

export type StockWarningStatus =
  (typeof StockWarningStatus)[keyof typeof StockWarningStatus];

export type MinimumStockSettingEntity = {
  id: string;
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  minimumStock: number;
  createdAt: string;
  updatedAt: string;
};

export type StockWarningEntity = {
  productId: string;
  productName: string;
  sku?: string | null;
  barcode?: string | null;
  locationId: string;
  locationName: string;
  stockOnHand: number;
  minimumStock: number;
  status: StockWarningStatus;
};

export type StockWarningFilterInput = {
  locationId?: string;
  productId?: string;
  status?: StockWarningStatus;
};

export type SetMinimumStockInput = {
  productId: string;
  locationId: string;
  minimumStock: number;
};

const GET_INVENTORY_BALANCES = /* GraphQL */ `
  query GetInventoryBalances($filter: InventoryFilterInput) {
    inventoryBalances(filter: $filter) {
      productId
      product
      sku
      barcode
      locationId
      location
      balance
    }
  }
`;

const GET_INVENTORY_TRANSACTIONS = /* GraphQL */ `
  query GetInventoryTransactions($filter: InventoryFilterInput) {
    inventoryTransactions(filter: $filter) {
      id
      productId
      product
      locationId
      location
      transactionType
      referenceId
      referenceType
      qtyIn
      qtyOut
      balanceAfter
      createdAt
    }
  }
`;

const ADJUST_STOCK = /* GraphQL */ `
  mutation AdjustStock($input: StockAdjustmentInput!) {
    adjustStock(input: $input) {
      id
      productId
      product
      locationId
      location
      transactionType
      referenceId
      referenceType
      qtyIn
      qtyOut
      balanceAfter
      createdAt
    }
  }
`;

const TRANSFER_STOCK = /* GraphQL */ `
  mutation TransferStock($input: StockTransferInput!) {
    transferStock(input: $input) {
      id
      productId
      product
      locationId
      location
      transactionType
      referenceId
      referenceType
      qtyIn
      qtyOut
      balanceAfter
      createdAt
    }
  }
`;

const SET_INITIAL_STOCK = /* GraphQL */ `
  mutation SetInitialStock($input: SetInitialStockInput!) {
    setInitialStock(input: $input) {
      id
      productId
      product
      locationId
      location
      transactionType
      referenceId
      referenceType
      qtyIn
      qtyOut
      balanceAfter
      createdAt
    }
  }
`;

const GET_MINIMUM_STOCK_SETTINGS = /* GraphQL */ `
  query MinimumStockSettings($filter: InventoryFilterInput) {
    minimumStockSettings(filter: $filter) {
      id
      productId
      productName
      locationId
      locationName
      minimumStock
      createdAt
      updatedAt
    }
  }
`;

const GET_STOCK_WARNINGS = /* GraphQL */ `
  query StockWarnings($filter: StockWarningFilterInput) {
    stockWarnings(filter: $filter) {
      productId
      productName
      sku
      barcode
      locationId
      locationName
      stockOnHand
      minimumStock
      status
    }
  }
`;

const SET_MINIMUM_STOCK = /* GraphQL */ `
  mutation SetMinimumStock($input: SetMinimumStockInput!) {
    setMinimumStock(input: $input) {
      id
      productId
      productName
      locationId
      locationName
      minimumStock
      createdAt
      updatedAt
    }
  }
`;

type InventoryParams = {
  filter?: InventoryFilterInput;
};

type StockWarningParams = {
  filter?: StockWarningFilterInput;
};

export const inventoryKeys = {
  all: ["inventory"] as const,
  balances: () => [...inventoryKeys.all, "balances"] as const,
  balanceList: (params: InventoryParams) =>
    [...inventoryKeys.balances(), params] as const,
  transactions: () => [...inventoryKeys.all, "transactions"] as const,
  transactionList: (params: InventoryParams) =>
    [...inventoryKeys.transactions(), params] as const,
  minimumStockSettings: () =>
    [...inventoryKeys.all, "minimum-stock-settings"] as const,
  minimumStockSettingList: (params: InventoryParams) =>
    [...inventoryKeys.minimumStockSettings(), params] as const,
  stockWarnings: () => [...inventoryKeys.all, "stock-warnings"] as const,
  stockWarningList: (params: StockWarningParams) =>
    [...inventoryKeys.stockWarnings(), params] as const,
};

export function useInventoryBalances(params: InventoryParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.balanceList(params),
    queryFn: () =>
      gqlClient.request<{ inventoryBalances: InventoryBalance[] }>(
        GET_INVENTORY_BALANCES,
        params,
      ),
    select: (data) => data.inventoryBalances,
  });
}

export function useInventoryTransactions(params: InventoryParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.transactionList(params),
    queryFn: () =>
      gqlClient.request<{
        inventoryTransactions: InventoryTransactionEntity[];
      }>(GET_INVENTORY_TRANSACTIONS, params),
    select: (data) => data.inventoryTransactions,
  });
}

export function useMinimumStockSettings(params: InventoryParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.minimumStockSettingList(params),
    queryFn: () =>
      gqlClient.request<{
        minimumStockSettings: MinimumStockSettingEntity[];
      }>(GET_MINIMUM_STOCK_SETTINGS, params),
    select: (data) => data.minimumStockSettings,
  });
}

export function useStockWarnings(params: StockWarningParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.stockWarningList(params),
    queryFn: () =>
      gqlClient.request<{ stockWarnings: StockWarningEntity[] }>(
        GET_STOCK_WARNINGS,
        params,
      ),
    select: (data) => data.stockWarnings,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StockAdjustmentInput) =>
      gqlClient.request<{ adjustStock: InventoryTransactionEntity }>(
        ADJUST_STOCK,
        { input },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.posLists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useTransferStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StockTransferInput) =>
      gqlClient.request<{ transferStock: InventoryTransactionEntity[] }>(
        TRANSFER_STOCK,
        { input },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.posLists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useSetInitialStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SetInitialStockInput) =>
      gqlClient.request<{ setInitialStock: InventoryTransactionEntity[] }>(
        SET_INITIAL_STOCK,
        { input },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.posLists() });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}

export function useSetMinimumStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SetMinimumStockInput) =>
      gqlClient.request<{ setMinimumStock: MinimumStockSettingEntity }>(
        SET_MINIMUM_STOCK,
        { input },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error: unknown) => {
      throw ErrorHelper.parse(error);
    },
  });
}
