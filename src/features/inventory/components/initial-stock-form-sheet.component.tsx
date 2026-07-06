import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
  initialStockFormSchema,
  type InitialStockFormValues,
} from "@/features/inventory/schemas/initial-stock-form.schema";
import { ErrorHelper } from "@/libs/error";
import { useSetInitialStock } from "@/resources/gql/inventory.gql";
import { useLocations } from "@/resources/gql/location.gql";
import { useProducts } from "@/resources/gql/product.gql";

type InitialStockFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: InitialStockFormValues = {
  locationId: "",
  notes: "",
  items: [{ productId: "", qty: 0 }],
};

export function InitialStockFormSheet({
  open,
  onOpenChange,
}: InitialStockFormSheetProps) {
  const setInitialStock = useSetInitialStock();
  const locationsQuery = useLocations({ limit: 100 });
  const productsQuery = useProducts({ limit: 100 });
  const stockProducts = useMemo(
    () => (productsQuery.data?.data ?? []).filter((product) => product.trackInventory),
    [productsQuery.data?.data],
  );
  const form = useForm<InitialStockFormValues>({
    resolver: zodResolver(initialStockFormSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const isSubmitting = setInitialStock.isPending;

  function addItem() {
    append({ productId: "", qty: 0 });
  }

  async function handleSubmit(values: InitialStockFormValues) {
    const items = values.items.filter((item) => item.productId && item.qty > 0);

    if (items.length === 0) {
      form.setError("items", {
        message: "At least one product must have qty greater than 0",
      });
      return;
    }

    try {
      await setInitialStock.mutateAsync({
        locationId: values.locationId,
        notes: values.notes?.trim() || undefined,
        items,
      });

      toast.success("Initial stock saved");
      form.reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save initial stock", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="xl-sheet overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Set initial stock</SheetTitle>
          <SheetDescription>
            Record real stock owned by the client when they first start using
            Opero.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="initial-stock-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                        {...field}
                      >
                        <option value="">Select location</option>
                        {(locationsQuery.data?.data ?? []).map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name} · {location.type}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">Products</h3>
                  <p className="text-sm text-muted-foreground">
                    Add products and their current physical stock.
                  </p>
                </div>
                <Button onClick={addItem} type="button" variant="outline">
                  <Plus className="size-4" />
                  Add product
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[minmax(14rem,1fr)_8rem_auto]"
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
                              {stockProducts.map((product) => (
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

                    <div className="flex items-end">
                      <Button
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                        size="icon"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Remove product</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.items?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.items.message.toString()}
                </p>
              ) : null}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional initial stock notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="initial-stock-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save initial stock"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
