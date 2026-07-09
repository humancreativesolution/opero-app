import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  ChevronDown,
  ChevronRight,
  History,
  PackagePlus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InitialStockFormSheet } from "@/features/inventory/components/initial-stock-form-sheet.component";
import { MinimumStockFormSheet } from "@/features/inventory/components/minimum-stock-form-sheet.component";
import { StockTransferFormSheet } from "@/features/inventory/components/stock-transfer-form-sheet.component";
import { PermissionGate } from "@/components/rbac/components/permission-gate.component";
import { PERMISSIONS } from "@/components/rbac/permissions";
import type {
  InventoryBalance,
  InventoryTransactionEntity,
  InventoryTransactionType,
} from "@/graphql/generated";
import { cn } from "@/libs/utils";
import {
  StockWarningStatus,
  useInventoryBalances,
  useInventoryTransactions,
  useStockWarnings,
  type StockWarningEntity,
} from "@/resources/gql/inventory.gql";
import { useLocations } from "@/resources/gql/location.gql";
import { useProducts } from "@/resources/gql/product.gql";

type InventoryTab = "stock" | "warnings" | "transactions";

type ProductStockGroup = {
  productId: string;
  product: string;
  sku?: string | null;
  barcode?: string | null;
  totalBalance: number;
  locations: InventoryBalance[];
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getTransactionClassName(type: InventoryTransactionType) {
  if (type === "PURCHASE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (type === "SALE") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

function getWarningClassName(status: string) {
  if (status === StockWarningStatus.OutOfStock) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

function formatWarningStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>("stock");
  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState("");
  const [warningProductId, setWarningProductId] = useState("");
  const [warningStatus, setWarningStatus] = useState("");
  const [expandedProductIds, setExpandedProductIds] = useState<
    Record<string, boolean>
  >({});
  const [initialStockSheetOpen, setInitialStockSheetOpen] = useState(false);
  const [transferSheetOpen, setTransferSheetOpen] = useState(false);
  const [minimumStockSheetOpen, setMinimumStockSheetOpen] = useState(false);
  const inventoryFilter = {
    filter: {
      locationId: locationId || undefined,
    },
  };
  const warningFilter = {
    filter: {
      locationId: locationId || undefined,
      productId: warningProductId || undefined,
      status: warningStatus
        ? (warningStatus as StockWarningEntity["status"])
        : undefined,
    },
  };
  const locationsQuery = useLocations({ limit: 100 });
  const productsQuery = useProducts({ limit: 100 });
  const balancesQuery = useInventoryBalances(inventoryFilter);
  const transactionsQuery = useInventoryTransactions(inventoryFilter);
  const stockWarningsQuery = useStockWarnings(warningFilter);
  const stockProducts = useMemo(
    () => (productsQuery.data?.data ?? []).filter((product) => product.trackInventory),
    [productsQuery.data?.data],
  );
  const filteredBalances = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const balances = balancesQuery.data ?? [];

    if (!keyword) {
      return balances;
    }

    return balances.filter((balance) =>
      [balance.product, balance.sku, balance.barcode, balance.location]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [balancesQuery.data, search]);
  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const transactions = transactionsQuery.data ?? [];

    if (!keyword) {
      return transactions;
    }

    return transactions.filter((transaction) =>
      [
        transaction.product,
        transaction.location,
        transaction.transactionType,
        transaction.referenceType,
        transaction.referenceId,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [search, transactionsQuery.data]);
  const filteredWarnings = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const warnings = stockWarningsQuery.data ?? [];

    if (!keyword) {
      return warnings;
    }

    return warnings.filter((warning) =>
      [
        warning.productName,
        warning.sku,
        warning.barcode,
        warning.locationName,
        warning.status,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [search, stockWarningsQuery.data]);
  const groupedBalances = useMemo<ProductStockGroup[]>(() => {
    const groups = new Map<string, ProductStockGroup>();

    filteredBalances.forEach((balance) => {
      const existingGroup = groups.get(balance.productId);

      if (existingGroup) {
        existingGroup.totalBalance += balance.balance;
        existingGroup.locations.push(balance);
        return;
      }

      groups.set(balance.productId, {
        productId: balance.productId,
        product: balance.product,
        sku: balance.sku,
        barcode: balance.barcode,
        totalBalance: balance.balance,
        locations: [balance],
      });
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        locations: group.locations.sort((left, right) =>
          left.location.localeCompare(right.location),
        ),
      }))
      .sort((left, right) => left.product.localeCompare(right.product));
  }, [filteredBalances]);
  const transactionColumns = useMemo<ColumnDef<InventoryTransactionEntity>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "product",
        header: "Product",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.product}</span>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "transactionType",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            className={getTransactionClassName(row.original.transactionType)}
            variant="outline"
          >
            {row.original.transactionType}
          </Badge>
        ),
      },
      {
        accessorKey: "qtyIn",
        header: () => <div className="text-right">In</div>,
        cell: ({ row }) => (
          <div className="text-right text-emerald-600">
            {row.original.qtyIn || "-"}
          </div>
        ),
      },
      {
        accessorKey: "qtyOut",
        header: () => <div className="text-right">Out</div>,
        cell: ({ row }) => (
          <div className="text-right text-red-600">
            {row.original.qtyOut || "-"}
          </div>
        ),
      },
      {
        accessorKey: "balanceAfter",
        header: () => <div className="text-right">Balance</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {row.original.balanceAfter}
          </div>
        ),
      },
      {
        accessorKey: "referenceType",
        header: "Reference",
        cell: ({ row }) => (
          <div>
            <p>{row.original.referenceType}</p>
            <p className="max-w-36 truncate text-xs text-muted-foreground">
              {row.original.referenceId}
            </p>
          </div>
        ),
      },
    ],
    [],
  );
  const warningColumns = useMemo<ColumnDef<StockWarningEntity>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.productName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.barcode || row.original.sku || "No barcode/SKU"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "locationName",
        header: "Location",
      },
      {
        accessorKey: "stockOnHand",
        header: () => <div className="text-right">Stock on hand</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">{row.original.stockOnHand}</div>
        ),
      },
      {
        accessorKey: "minimumStock",
        header: () => <div className="text-right">Minimum stock</div>,
        cell: ({ row }) => (
          <div className="text-right">{row.original.minimumStock}</div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={getWarningClassName(row.original.status)}
            variant="outline"
          >
            {formatWarningStatus(row.original.status)}
          </Badge>
        ),
      },
    ],
    [],
  );
  const tableToolbar = (
    <div className="flex w-full flex-col gap-2 sm:flex-row">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product, SKU, barcode, or reference"
          value={search}
        />
      </div>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        onChange={(event) => setLocationId(event.target.value)}
        value={locationId}
      >
        <option value="">All locations</option>
        {(locationsQuery.data?.data ?? []).map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
    </div>
  );
  const warningToolbar = (
    <div className="grid w-full gap-2 md:grid-cols-[minmax(12rem,1fr)_12rem_12rem_12rem]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product, SKU, barcode, or location"
          value={search}
        />
      </div>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        onChange={(event) => setLocationId(event.target.value)}
        value={locationId}
      >
        <option value="">All locations</option>
        {(locationsQuery.data?.data ?? []).map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        onChange={(event) => setWarningProductId(event.target.value)}
        value={warningProductId}
      >
        <option value="">All products</option>
        {stockProducts.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        onChange={(event) => setWarningStatus(event.target.value)}
        value={warningStatus}
      >
        <option value="">All statuses</option>
        <option value={StockWarningStatus.LowStock}>Low stock</option>
        <option value={StockWarningStatus.OutOfStock}>Out of stock</option>
      </select>
    </div>
  );

  function toggleProduct(productId: string) {
    setExpandedProductIds((current) => ({
      ...current,
      [productId]: !current[productId],
    }));
  }

  function renderStockTable() {
    return (
      <div className="space-y-3">
        {tableToolbar}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Total stock</TableHead>
                <TableHead className="text-right">Locations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balancesQuery.isLoading ? (
                <TableRow>
                  <TableCell
                    className="h-24 text-center text-muted-foreground"
                    colSpan={3}
                  >
                    Loading stock balances...
                  </TableCell>
                </TableRow>
              ) : groupedBalances.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="h-24 text-center text-muted-foreground"
                    colSpan={3}
                  >
                    No stock balances found.
                  </TableCell>
                </TableRow>
              ) : (
                groupedBalances.map((group) => {
                  const isExpanded = Boolean(expandedProductIds[group.productId]);

                  return (
                    <>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        key={group.productId}
                        onClick={() => toggleProduct(group.productId)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="size-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="size-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{group.product}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.barcode || group.sku || "No barcode/SKU"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-lg font-semibold">
                          {group.totalBalance}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {group.locations.length}
                        </TableCell>
                      </TableRow>
                      {isExpanded
                        ? group.locations.map((locationBalance) => (
                            <TableRow
                              className="bg-muted/25"
                              key={`${group.productId}-${locationBalance.locationId}`}
                            >
                              <TableCell className="pl-12">
                                <p className="text-sm font-medium">
                                  {locationBalance.location}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Location stock detail
                                </p>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {locationBalance.balance}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          ))
                        : null}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Monitor stock balances and inventory ledger transactions.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <PermissionGate anyOf={[PERMISSIONS.stock.initial]}>
            <Button
              onClick={() => setInitialStockSheetOpen(true)}
              variant="outline"
            >
              <PackagePlus className="size-4" />
              Set initial stock
            </Button>
          </PermissionGate>
          <PermissionGate anyOf={[PERMISSIONS.stock.transfer]}>
            <Button onClick={() => setTransferSheetOpen(true)}>
              <ArrowRightLeft className="size-4" />
              Transfer stock
            </Button>
          </PermissionGate>
          <PermissionGate anyOf={[PERMISSIONS.stock.adjust]}>
            <Button
              onClick={() => setMinimumStockSheetOpen(true)}
              variant="outline"
            >
              <SlidersHorizontal className="size-4" />
              Set minimum stock
            </Button>
          </PermissionGate>
          <div className="inline-flex rounded-lg border bg-background p-1">
            <Button
              className={cn(activeTab !== "stock" && "text-muted-foreground")}
              onClick={() => setActiveTab("stock")}
              size="sm"
              variant={activeTab === "stock" ? "secondary" : "ghost"}
            >
              Stock list
            </Button>
            <Button
              className={cn(
                activeTab !== "transactions" && "text-muted-foreground",
              )}
              onClick={() => setActiveTab("transactions")}
              size="sm"
              variant={activeTab === "transactions" ? "secondary" : "ghost"}
            >
              Transactions
            </Button>
            <Button
              className={cn(
                activeTab !== "warnings" && "text-muted-foreground",
              )}
              onClick={() => setActiveTab("warnings")}
              size="sm"
              variant={activeTab === "warnings" ? "secondary" : "ghost"}
            >
              Stock Alerts
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {activeTab === "stock" ? (
              <Boxes className="size-4 text-muted-foreground" />
            ) : activeTab === "warnings" ? (
              <AlertTriangle className="size-4 text-muted-foreground" />
            ) : (
              <History className="size-4 text-muted-foreground" />
            )}
            {activeTab === "stock"
              ? "Stock on hand"
              : activeTab === "warnings"
                ? "Stock alerts"
                : "Inventory transactions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === "stock" ? (
            renderStockTable()
          ) : activeTab === "warnings" ? (
            <DataTable
              columns={warningColumns}
              data={filteredWarnings}
              emptyMessage="No stock alerts found."
              isLoading={stockWarningsQuery.isLoading}
              toolbar={warningToolbar}
            />
          ) : (
            <DataTable
              columns={transactionColumns}
              data={filteredTransactions}
              emptyMessage="No inventory transactions found."
              isLoading={transactionsQuery.isLoading}
              toolbar={tableToolbar}
            />
          )}
        </CardContent>
      </Card>

      <InitialStockFormSheet
        onOpenChange={setInitialStockSheetOpen}
        open={initialStockSheetOpen}
      />

      <StockTransferFormSheet
        onOpenChange={setTransferSheetOpen}
        open={transferSheetOpen}
      />

      <MinimumStockFormSheet
        onOpenChange={setMinimumStockSheetOpen}
        open={minimumStockSheetOpen}
      />
    </div>
  );
}
