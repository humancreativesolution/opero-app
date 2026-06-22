import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { ErrorHelper } from "@/libs/error";
import {
  purchaseFormSchema,
  type PurchaseFormValues,
} from "@/features/purchase/schemas/purchase-form.schema";
import { useLocations } from "@/resources/gql/location.gql";
import { useProducts } from "@/resources/gql/product.gql";
import { useCreatePurchase } from "@/resources/gql/purchase.gql";
import { useSuppliers } from "@/resources/gql/supplier.gql";

type PurchaseFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: PurchaseFormValues = {
  supplierId: "",
  locationId: "",
  purchaseDate: "",
  items: [{ productId: "", qty: 1, costPrice: 0 }],
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function PurchaseFormSheet({
  open,
  onOpenChange,
}: PurchaseFormSheetProps) {
  const createPurchase = useCreatePurchase();
  const suppliersQuery = useSuppliers({ limit: 100 });
  const locationsQuery = useLocations({
    limit: 100,
    filter: { type: "WAREHOUSE" },
  });
  const productsQuery = useProducts({ limit: 100 });
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });
  const totalAmount = useMemo(
    () =>
      (watchedItems ?? []).reduce(
        (total, item) => total + (item.qty || 0) * (item.costPrice || 0),
        0,
      ),
    [watchedItems],
  );
  const isSubmitting = createPurchase.isPending;

  function addItem() {
    append({ productId: "", qty: 1, costPrice: 0 });
  }

  async function handleSubmit(values: PurchaseFormValues) {
    try {
      await createPurchase.mutateAsync({
        supplierId: values.supplierId,
        locationId: values.locationId,
        purchaseDate: values.purchaseDate || undefined,
        items: values.items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          costPrice: item.costPrice,
        })),
      });

      toast.success("Purchase created");
      form.reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create purchase", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="xl-sheet overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create purchase</SheetTitle>
          <SheetDescription>
            Purchase items will become stock-in through inventory transactions.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-5 px-4"
            id="purchase-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                        {...field}
                      >
                        <option value="">Select supplier</option>
                        {(suppliersQuery.data?.data ?? []).map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
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
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                        {...field}
                      >
                        <option value="">Select warehouse</option>
                        {(locationsQuery.data?.data ?? []).map((location) => (
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
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Add products and cost price for this purchase.
                  </p>
                </div>
                <Button onClick={addItem} type="button" variant="outline">
                  <Plus className="size-4" />
                  Add item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[minmax(14rem,1fr)_7rem_9rem_auto]"
                    key={field.id}
                  >
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <FormControl>
                            <select
                              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                              {...field}
                            >
                              <option value="">Select product</option>
                              {(productsQuery.data?.data ?? []).map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
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
                      name={`items.${index}.qty`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
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
                      name={`items.${index}.costPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost price</FormLabel>
                          <FormControl>
                            <Input
                              min="0"
                              onChange={(event) =>
                                field.onChange(event.target.valueAsNumber || 0)
                              }
                              step="100"
                              type="number"
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
                      <Button
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Remove item</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated total</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="purchase-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : (
              "Create purchase"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
