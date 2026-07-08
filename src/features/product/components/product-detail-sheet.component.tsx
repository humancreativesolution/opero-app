import { useMemo, useState } from "react";
import { Boxes, History, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductEntity } from "@/graphql/generated";
import { useLocations } from "@/resources/gql/location.gql";
import { useProductStockCard } from "@/resources/gql/product.gql";

type ProductDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductEntity | null;
};

type ProductDetailTab = "overview" | "stock-card";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getTransactionClassName(type: string) {
  if (type === "PURCHASE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (type === "SALE") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
}

export function ProductDetailSheet({
  open,
  onOpenChange,
  product,
}: ProductDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<ProductDetailTab>("overview");
  const [locationId, setLocationId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const isService = product?.type === "SERVICE";
  const canShowStockCard = Boolean(product) && !isService;
  const locationsQuery = useLocations({ limit: 100 });
  const stockCardFilter = useMemo(
    () => ({
      productId: product?.id ?? "",
      locationId: locationId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [dateFrom, dateTo, locationId, product?.id],
  );
  const stockCardQuery = useProductStockCard(
    stockCardFilter,
    open && activeTab === "stock-card" && canShowStockCard,
  );
  const stockCard = stockCardQuery.data;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="xl-sheet overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Product detail</SheetTitle>
          <SheetDescription>
            Product overview and inventory movement history.
          </SheetDescription>
        </SheetHeader>

        {product ? (
          <div className="space-y-5 px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setActiveTab("overview")}
                size="sm"
                type="button"
                variant={activeTab === "overview" ? "default" : "outline"}
              >
                <Boxes className="size-4" />
                Overview
              </Button>
              {!isService ? (
                <Button
                  onClick={() => setActiveTab("stock-card")}
                  size="sm"
                  type="button"
                  variant={activeTab === "stock-card" ? "default" : "outline"}
                >
                  <History className="size-4" />
                  Stock Card
                </Button>
              ) : null}
            </div>

            {activeTab === "overview" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Product info</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="outline">
                        {product.type === "SERVICE" ? "Service" : "Stock"}
                      </Badge>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">SKU</span>
                      <span>{product.sku || "-"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Barcode</span>
                      <span>{product.barcode || "-"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Unit</span>
                      <span>
                        {product.unitName
                          ? `${product.unitName}${product.unitCode ? ` (${product.unitCode})` : ""}`
                          : "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Selling price</span>
                      <span className="font-medium">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Last cost price</span>
                      <span className="font-medium">
                        {formatCurrency(product.lastCostPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={product.isActive ? "secondary" : "outline"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {isService ? (
                      <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                        Service products do not have inventory ledger, so Stock Card is hidden.
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {activeTab === "stock-card" && canShowStockCard ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Stock Card Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-3">
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
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
                    <Input
                      onChange={(event) => setDateFrom(event.target.value)}
                      type="date"
                      value={dateFrom}
                    />
                    <Input
                      onChange={(event) => setDateTo(event.target.value)}
                      type="date"
                      value={dateTo}
                    />
                  </CardContent>
                </Card>

                {stockCardQuery.isLoading ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading stock card...
                  </div>
                ) : null}

                {stockCard ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Opening</p>
                          <p className="text-2xl font-semibold">
                            {stockCard.openingBalance}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total in</p>
                          <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                            {stockCard.totalQtyIn}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total out</p>
                          <p className="text-2xl font-semibold text-red-700 dark:text-red-300">
                            {stockCard.totalQtyOut}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Closing</p>
                          <p className="text-2xl font-semibold">
                            {stockCard.closingBalance}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">In</TableHead>
                            <TableHead className="text-right">Out</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stockCard.rows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                className="h-24 text-center text-muted-foreground"
                                colSpan={7}
                              >
                                No stock movement found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            stockCard.rows.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell>{formatDate(row.createdAt)}</TableCell>
                                <TableCell>{row.locationName}</TableCell>
                                <TableCell>
                                  <div>
                                    <p>{row.referenceType}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {row.referenceId}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={getTransactionClassName(
                                      row.transactionType,
                                    )}
                                    variant="outline"
                                  >
                                    {row.transactionType}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-emerald-700 dark:text-emerald-300">
                                  {row.qtyIn || "-"}
                                </TableCell>
                                <TableCell className="text-right text-red-700 dark:text-red-300">
                                  {row.qtyOut || "-"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {row.balanceAfter}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
