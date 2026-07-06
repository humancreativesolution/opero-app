import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  saleReturnFormSchema,
  type SaleReturnFormValues,
} from "@/features/sale/schemas/sale-return-form.schema";
import type { SaleEntity, SalesReportPaymentMethod } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { useCreateSaleReturn } from "@/resources/gql/sale.gql";

type SaleReturnFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: SaleEntity | null;
  onSuccess?: () => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getDefaultRefundMethod(
  sale?: SaleEntity | null,
): SalesReportPaymentMethod {
  return sale?.payments[0]?.method ?? "CASH";
}

export function SaleReturnFormSheet({
  open,
  onOpenChange,
  sale,
  onSuccess,
}: SaleReturnFormSheetProps) {
  const createSaleReturn = useCreateSaleReturn();
  const form = useForm<SaleReturnFormValues>({
    resolver: zodResolver(saleReturnFormSchema),
    defaultValues: {
      reason: "",
      refundMethod: "CASH",
      referenceNo: "",
      provider: "",
      notes: "",
      items: [],
    },
  });
  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });
  const refundAmount = useMemo(() => {
    if (!sale) {
      return 0;
    }

    return (watchedItems ?? []).reduce((total, item) => {
      const saleItem = sale.items.find(
        (originalItem) => originalItem.productId === item.productId,
      );

      return total + (saleItem?.sellingPrice ?? 0) * (item.qty || 0);
    }, 0);
  }, [sale, watchedItems]);
  const isSubmitting = createSaleReturn.isPending;

  useEffect(() => {
    if (!open || !sale) {
      return;
    }

    form.reset({
      reason: "",
      refundMethod: getDefaultRefundMethod(sale),
      referenceNo: "",
      provider: "",
      notes: "",
      items: sale.items.map((item) => ({
        productId: item.productId,
        qty: 0,
        maxQty: Math.abs(item.qty),
      })),
    });
  }, [form, open, sale]);

  async function handleSubmit(values: SaleReturnFormValues) {
    if (!sale) {
      return;
    }

    if (sale.type === "RETURN") {
      toast.error("Return transaction cannot be returned again");
      return;
    }

    const invalidItem = values.items.find((item) => item.qty > item.maxQty);

    if (invalidItem) {
      toast.error("Return qty cannot exceed original sale qty");
      return;
    }

    const returnItems = values.items
      .filter((item) => item.qty > 0)
      .map((item) => ({
        productId: item.productId,
        qty: item.qty,
      }));

    if (returnItems.length === 0) {
      toast.error("Select at least one item to return");
      return;
    }

    try {
      await createSaleReturn.mutateAsync({
        referenceSaleId: sale.id,
        reason: values.reason.trim(),
        refundAmount,
        refundPayment: {
          method: values.refundMethod,
          provider: values.provider?.trim() || undefined,
          referenceNo: values.referenceNo?.trim() || undefined,
          notes: values.notes?.trim() || undefined,
        },
        items: returnItems,
      });

      toast.success("Sale return created");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create sale return", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="xl-sheet overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Return sale</SheetTitle>
          <SheetDescription>
            Create a correction transaction based on the original invoice.
          </SheetDescription>
        </SheetHeader>

        {sale ? (
          <div className="mx-4 rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{sale.invoiceNo}</p>
            <p className="text-muted-foreground">
              {sale.locationName} · Refund total:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(refundAmount)}
              </span>
            </p>
          </div>
        ) : null}

        <Form {...form}>
          <form
            className="grid gap-5 px-4"
            id="sale-return-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Example: Wrong cashier input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div>
                <h3 className="font-medium">Returned items</h3>
                <p className="text-sm text-muted-foreground">
                  Input return quantity for each item. Leave zero if not returned.
                </p>
              </div>
              <div className="space-y-3">
                {sale?.items.map((item, index) => (
                  <div
                    className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[1fr_8rem_8rem_10rem]"
                    key={item.id}
                  >
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Sold: {Math.abs(item.qty)} · Price:{" "}
                        {formatCurrency(item.sellingPrice)}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Max return</p>
                      <p className="font-medium">{Math.abs(item.qty)}</p>
                    </div>
                    <FormField
                      control={form.control}
                      name={`items.${index}.qty`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input
                              max={Math.abs(item.qty)}
                              min="0"
                              onChange={(event) =>
                                field.onChange(event.target.valueAsNumber || 0)
                              }
                              type="number"
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Refund</p>
                      <p className="font-medium">
                        {formatCurrency(
                          (watchedItems?.[index]?.qty || 0) * item.sellingPrice,
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="refundMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select refund method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="QRIS">QRIS</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference no</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional refund reference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional provider" {...field} />
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
                    <FormLabel>Refund notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional refund notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="sale-return-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating return
              </>
            ) : (
              `Create return · ${formatCurrency(refundAmount)}`
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
