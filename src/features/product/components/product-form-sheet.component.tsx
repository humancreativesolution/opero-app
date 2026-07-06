import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import type { ProductEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/features/product/schemas/product-form.schema";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/resources/gql/product.gql";
import { useUnitsByTenant } from "@/resources/gql/unit.gql";

type ProductFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductEntity | null;
};

const defaultValues: ProductFormValues = {
  type: "STOCK",
  sku: "",
  barcode: "",
  name: "",
  unitId: "",
  sellingPrice: 0,
  lastCostPrice: 0,
  isActive: true,
};

function optionalString(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
}: ProductFormSheetProps) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const unitsQuery = useUnitsByTenant();
  const isEdit = Boolean(product);
  const isSubmitting = createProduct.isPending || updateProduct.isPending;
  const units = unitsQuery.data ?? [];
  const selectableUnits = units.filter(
    (unit) => unit.isActive || unit.id === product?.unitId,
  );
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      product
        ? {
            sku: product.sku ?? "",
            barcode: product.barcode ?? "",
            type: product.type,
            name: product.name,
            unitId: product.unitId,
            sellingPrice: product.sellingPrice,
            lastCostPrice: product.lastCostPrice,
            isActive: product.isActive,
          }
        : defaultValues,
    );
  }, [form, open, product]);

  async function handleSubmit(values: ProductFormValues) {
    try {
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          type: values.type,
          sku: optionalString(values.sku),
          barcode: optionalString(values.barcode),
          name: values.name.trim(),
          unitId: values.unitId,
          sellingPrice: values.sellingPrice,
          lastCostPrice: values.lastCostPrice,
          isActive: values.isActive,
        });
        toast.success("Product updated");
      } else {
        await createProduct.mutateAsync({
          type: values.type,
          sku: optionalString(values.sku),
          barcode: optionalString(values.barcode),
          name: values.name.trim(),
          unitId: values.unitId,
          sellingPrice: values.sellingPrice,
          lastCostPrice: values.lastCostPrice,
          isActive: values.isActive,
        });
        toast.success("Product created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? "Failed to update product" : "Failed to create product", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit product" : "Create product"}</SheetTitle>
          <SheetDescription>
            Catalog items are shared by POS, promotions, reports, and stock flows.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="product-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item type</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                      onChange={field.onChange}
                      value={field.value}
                    >
                      <option value="STOCK">Stock item</option>
                      <option value="SERVICE">Service</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto generated if empty" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional barcode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product name</FormLabel>
                  <FormControl>
                    <Input placeholder="Example: Kopi Susu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                      disabled={unitsQuery.isLoading}
                      onChange={field.onChange}
                      value={field.value}
                    >
                      <option value="">
                        {unitsQuery.isLoading ? "Loading units..." : "Select unit"}
                      </option>
                      {selectableUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.code})
                          {unit.isActive ? "" : " - inactive"}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling price</FormLabel>
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

              <FormField
                control={form.control}
                name="lastCostPrice"
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
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active item</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive products will not be available in POS.
                    </p>
                  </div>
                  <FormControl>
                    <input
                      checked={field.value}
                      className="size-4 accent-primary"
                      onChange={(event) => field.onChange(event.target.checked)}
                      type="checkbox"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="product-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create product"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
