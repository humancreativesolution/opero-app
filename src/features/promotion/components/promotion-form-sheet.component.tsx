import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  promotionFormSchema,
  type PromotionFormValues,
} from "@/features/promotion/schemas/promotion-form.schema";
import type {
  DiscountValueType,
  ProductEntity,
  PromotionChannel,
  PromotionEntity,
  PromotionStatus,
  PromotionType,
} from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { useLocations } from "@/resources/gql/location.gql";
import { useProducts } from "@/resources/gql/product.gql";
import {
  useCreatePromotion,
  useUpdatePromotion,
} from "@/resources/gql/promotion.gql";

type PromotionFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: PromotionEntity | null;
};

const defaultValues: PromotionFormValues = {
  name: "",
  description: "",
  type: "PRODUCT_DISCOUNT",
  channel: "POS",
  status: "ACTIVE",
  discountValueType: "PERCENT",
  discountValue: 0,
  minQty: undefined,
  minSubtotal: undefined,
  applyToAllProducts: false,
  productIds: [],
  locationIds: [],
  defaultLocationId: "",
  startsAt: "",
  endsAt: "",
};

function toDatetimeLocal(value?: unknown) {
  if (!value) {
    return "";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoString(value?: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function getDatePart(value?: string) {
  return value?.split("T")[0] ?? "";
}

function getTimePart(value?: string) {
  return value?.split("T")[1] ?? "";
}

function combineLocalDateTime(date: string, time: string, fallbackTime: string) {
  return date ? `${date}T${time || fallbackTime}` : "";
}

function toggleArrayValue(values: string[], value: string, checked: boolean) {
  if (checked) {
    return values.includes(value) ? values : [...values, value];
  }

  return values.filter((item) => item !== value);
}

type ProductMultiSelectProps = {
  products: ProductEntity[];
  value: string[];
  onChange: (value: string[]) => void;
};

function ProductMultiSelect({
  products,
  value,
  onChange,
}: ProductMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedProducts = useMemo(
    () => products.filter((product) => value.includes(product.id)),
    [products, value],
  );

  function toggleProduct(productId: string) {
    onChange(
      value.includes(productId)
        ? value.filter((item) => item !== productId)
        : [...value, productId],
    );
  }

  return (
    <div className="relative space-y-2">
      <Button
        className="h-auto min-h-9 w-full justify-between px-3 py-2 font-normal"
        onClick={() => setOpen((current) => !current)}
        type="button"
        variant="outline"
      >
        <span className="truncate text-muted-foreground">
          {selectedProducts.length > 0
            ? `${selectedProducts.length} product selected`
            : "Search and select products"}
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </Button>

      {open ? (
        <div className="absolute left-0 right-0 top-11 z-50 rounded-lg border bg-popover p-2 shadow-lg">
          <Command shouldFilter>
            <CommandInput
              onValueChange={setSearch}
              placeholder="Search product by name, SKU, or barcode"
              value={search}
            />
            <CommandList className="max-h-60">
              <CommandEmpty>No products found.</CommandEmpty>
              <CommandGroup>
                {products.map((product) => {
                  const isSelected = value.includes(product.id);

                  return (
                    <CommandItem
                      data-checked={isSelected}
                      key={product.id}
                      onSelect={() => toggleProduct(product.id)}
                      value={`${product.name} ${product.sku ?? ""} ${
                        product.barcode ?? ""
                      } ${product.type}`}
                    >
                      <Check
                        className={
                          isSelected ? "size-4 opacity-100" : "size-4 opacity-0"
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate">{product.name}</p>
                          <Badge variant="outline">
                            {product.type === "SERVICE" ? "Service" : "Stock"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {product.barcode || product.sku || "No barcode/SKU"}
                        </p>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      ) : null}

      {selectedProducts.length > 0 ? (
        <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto rounded-lg border p-2">
          {selectedProducts.map((product) => (
            <Badge className="gap-1" key={product.id} variant="secondary">
              {product.name}
              <span className="text-muted-foreground">
                {product.type === "SERVICE" ? "Service" : "Stock"}
              </span>
              <button
                onClick={() => toggleProduct(product.id)}
                type="button"
              >
                <X className="size-3" />
                <span className="sr-only">Remove {product.name}</span>
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="border-t pt-2 text-xs text-muted-foreground">
          No products selected.
        </p>
      )}
    </div>
  );
}

export function PromotionFormSheet({
  open,
  onOpenChange,
  promotion,
}: PromotionFormSheetProps) {
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const productsQuery = useProducts({ limit: 100 });
  const locationsQuery = useLocations({ limit: 100, filter: { type: "OUTLET" } });
  const isEdit = Boolean(promotion);
  const isSubmitting = createPromotion.isPending || updatePromotion.isPending;
  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues,
  });
  const applyToAllProducts = useWatch({
    control: form.control,
    name: "applyToAllProducts",
  });
  const promotionType = useWatch({
    control: form.control,
    name: "type",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      promotion
        ? {
            name: promotion.name,
            description: promotion.description ?? "",
            type: promotion.type,
            channel: promotion.channel,
            status: promotion.status,
            discountValueType: promotion.discountValueType,
            discountValue: promotion.discountValue,
            minQty: promotion.minQty ?? undefined,
            minSubtotal: promotion.minSubtotal ?? undefined,
            applyToAllProducts: promotion.applyToAllProducts,
            productIds: promotion.productIds,
            locationIds: promotion.locationIds,
            defaultLocationId: promotion.defaultLocationId ?? "",
            startsAt: toDatetimeLocal(promotion.startsAt),
            endsAt: toDatetimeLocal(promotion.endsAt),
          }
        : defaultValues,
    );
  }, [form, open, promotion]);

  async function handleSubmit(values: PromotionFormValues) {
    if (!values.applyToAllProducts && values.productIds.length === 0) {
      form.setError("productIds", {
        message: "Select at least one product or apply to all products",
      });
      return;
    }

    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        type: values.type as PromotionType,
        channel: values.channel as PromotionChannel,
        status: values.status as PromotionStatus,
        discountValueType: values.discountValueType as DiscountValueType,
        discountValue: values.discountValue,
        minQty:
          values.type === "MIN_QTY_DISCOUNT" ? values.minQty || undefined : undefined,
        minSubtotal:
          values.type === "MIN_TRANSACTION_DISCOUNT"
            ? values.minSubtotal || undefined
            : undefined,
        applyToAllProducts: values.applyToAllProducts,
        productIds: values.applyToAllProducts ? [] : values.productIds,
        locationIds: values.locationIds,
        defaultLocationId: values.defaultLocationId || undefined,
        startsAt: toIsoString(values.startsAt) ?? new Date().toISOString(),
        endsAt: toIsoString(values.endsAt),
      };

      if (promotion) {
        await updatePromotion.mutateAsync({
          id: promotion.id,
          ...payload,
        });
        toast.success("Promotion updated");
      } else {
        await createPromotion.mutateAsync(payload);
        toast.success("Promotion created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        isEdit ? "Failed to update promotion" : "Failed to create promotion",
        {
          description: ErrorHelper.parse(error).message,
        },
      );
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="xl-sheet overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit promotion" : "Create promotion"}</SheetTitle>
          <SheetDescription>
            Promotions are calculated by backend and shown in POS product prices.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-5 px-4"
            id="promotion-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Example: Promo Kopi 10%" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional promotion description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PRODUCT_DISCOUNT">
                          Product discount
                        </SelectItem>
                        <SelectItem value="MIN_QTY_DISCOUNT">
                          Minimum qty discount
                        </SelectItem>
                        <SelectItem value="MIN_TRANSACTION_DISCOUNT">
                          Minimum transaction discount
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="POS">POS</SelectItem>
                        <SelectItem value="SALES_ORDER">Sales order</SelectItem>
                        <SelectItem value="ALL">All</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount value type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select value type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                        <SelectItem value="AMOUNT">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount value</FormLabel>
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

              {promotionType === "MIN_QTY_DISCOUNT" ? (
                <FormField
                  control={form.control}
                  name="minQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum qty</FormLabel>
                      <FormControl>
                        <Input
                          min="1"
                          onChange={(event) =>
                            field.onChange(event.target.valueAsNumber || undefined)
                          }
                          type="number"
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {promotionType === "MIN_TRANSACTION_DISCOUNT" ? (
                <FormField
                  control={form.control}
                  name="minSubtotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum subtotal</FormLabel>
                      <FormControl>
                        <Input
                          min="0"
                          onChange={(event) =>
                            field.onChange(event.target.valueAsNumber || undefined)
                          }
                          step="1000"
                          type="number"
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts at</FormLabel>
                    <FormControl>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          onChange={(event) =>
                            field.onChange(
                              combineLocalDateTime(
                                event.target.value,
                                getTimePart(field.value),
                                "00:00",
                              ),
                            )
                          }
                          type="date"
                          value={getDatePart(field.value)}
                        />
                        <Input
                          onChange={(event) =>
                            field.onChange(
                              combineLocalDateTime(
                                getDatePart(field.value),
                                event.target.value,
                                "00:00",
                              ),
                            )
                          }
                          type="time"
                          value={getTimePart(field.value)}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Choose activation date and time.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ends at</FormLabel>
                    <FormControl>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          onChange={(event) =>
                            field.onChange(
                              combineLocalDateTime(
                                event.target.value,
                                getTimePart(field.value),
                                "23:59",
                              ),
                            )
                          }
                          type="date"
                          value={getDatePart(field.value)}
                        />
                        <Input
                          disabled={!getDatePart(field.value)}
                          onChange={(event) =>
                            field.onChange(
                              combineLocalDateTime(
                                getDatePart(field.value),
                                event.target.value,
                                "23:59",
                              ),
                            )
                          }
                          type="time"
                          value={getTimePart(field.value)}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Optional. Choose end date and time, or leave empty.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="applyToAllProducts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Apply to all products</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      If enabled, selected product list will be ignored.
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

            {!applyToAllProducts ? (
              <FormField
                control={form.control}
                name="productIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Products</FormLabel>
                    <ProductMultiSelect
                      onChange={field.onChange}
                      products={productsQuery.data?.data ?? []}
                      value={field.value}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="locationIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outlet scope</FormLabel>
                  <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border p-3 lg:grid-cols-2">
                    {(locationsQuery.data?.data ?? []).map((location) => (
                      <label
                        className="flex items-center gap-2 text-sm"
                        key={location.id}
                      >
                        <input
                          checked={field.value.includes(location.id)}
                          className="size-4 accent-primary"
                          onChange={(event) =>
                            field.onChange(
                              toggleArrayValue(
                                field.value,
                                location.id,
                                event.target.checked,
                              ),
                            )
                          }
                          type="checkbox"
                        />
                        <span>{location.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty if promotion applies to all outlets.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="promotion-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create promotion"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
