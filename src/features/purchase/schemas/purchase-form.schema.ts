import { z } from "zod";

export const purchaseFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  locationId: z.string().min(1, "Location is required"),
  purchaseDate: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        qty: z.number().int().min(1, "Qty must be at least 1"),
        costPrice: z.number().min(0, "Cost price cannot be negative"),
      }),
    )
    .min(1, "At least one item is required"),
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;
