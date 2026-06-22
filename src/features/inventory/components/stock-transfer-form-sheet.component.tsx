import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  stockTransferFormSchema,
  type StockTransferFormValues,
} from "@/features/inventory/schemas/stock-transfer-form.schema";
import { ErrorHelper } from "@/libs/error";
import {
  useInventoryBalances,
  useTransferStock,
} from "@/resources/gql/inventory.gql";
import { useLocations } from "@/resources/gql/location.gql";

type StockTransferFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: StockTransferFormValues = {
  fromLocationId: "",
  toLocationId: "",
  productId: "",
  qty: 1,
  notes: "",
};

export function StockTransferFormSheet({
  open,
  onOpenChange,
}: StockTransferFormSheetProps) {
  const transferStock = useTransferStock();
  const warehousesQuery = useLocations({
    limit: 100,
    filter: { type: "WAREHOUSE" },
  });
  const outletsQuery = useLocations({
    limit: 100,
    filter: { type: "OUTLET" },
  });
  const form = useForm<StockTransferFormValues>({
    resolver: zodResolver(stockTransferFormSchema),
    defaultValues,
  });
  const fromLocationId = useWatch({
    control: form.control,
    name: "fromLocationId",
  });
  const productId = useWatch({
    control: form.control,
    name: "productId",
  });
  const warehouseBalancesQuery = useInventoryBalances({
    filter: { locationId: fromLocationId || undefined },
  });
  const availableProducts = useMemo(
    () => (warehouseBalancesQuery.data ?? []).filter((item) => item.balance > 0),
    [warehouseBalancesQuery.data],
  );
  const selectedBalance =
    availableProducts.find((item) => item.productId === productId)?.balance ?? 0;
  const isSubmitting = transferStock.isPending;

  async function handleSubmit(values: StockTransferFormValues) {
    if (values.fromLocationId === values.toLocationId) {
      form.setError("toLocationId", {
        message: "Destination outlet must be different from source warehouse",
      });
      return;
    }

    if (values.qty > selectedBalance) {
      form.setError("qty", {
        message: `Qty cannot exceed available stock (${selectedBalance})`,
      });
      return;
    }

    try {
      await transferStock.mutateAsync({
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
        productId: values.productId,
        qty: values.qty,
        notes: values.notes?.trim() || undefined,
      });

      toast.success("Stock transferred");
      form.reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to transfer stock", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Transfer stock</SheetTitle>
          <SheetDescription>
            Move stock from warehouse to outlet so products can be sold in POS.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="stock-transfer-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="fromLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source warehouse</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                        form.setValue("productId", "");
                      }}
                    >
                      <option value="">Select warehouse</option>
                      {(warehousesQuery.data?.data ?? []).map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                      disabled={!fromLocationId || warehouseBalancesQuery.isLoading}
                      {...field}
                    >
                      <option value="">
                        {fromLocationId
                          ? "Select product"
                          : "Select warehouse first"}
                      </option>
                      {availableProducts.map((item) => (
                        <option key={item.productId} value={item.productId}>
                          {item.product} — stock {item.balance}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination outlet</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                      {...field}
                    >
                      <option value="">Select outlet</option>
                      {(outletsQuery.data?.data ?? []).map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qty"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel>Qty</FormLabel>
                    <span className="text-xs text-muted-foreground">
                      Available: {selectedBalance}
                    </span>
                  </div>
                  <FormControl>
                    <Input
                      min="1"
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber || 1)
                      }
                      type="number"
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional transfer notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button
            disabled={isSubmitting}
            form="stock-transfer-form"
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Transferring
              </>
            ) : (
              "Transfer stock"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
