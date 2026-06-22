import { z } from "zod";

export const stockTransferFormSchema = z.object({
  fromLocationId: z.string().min(1, "Source warehouse is required"),
  toLocationId: z.string().min(1, "Destination outlet is required"),
  productId: z.string().min(1, "Product is required"),
  qty: z.number().int().min(1, "Qty must be at least 1"),
  notes: z.string().trim().optional(),
});

export type StockTransferFormValues = z.infer<
  typeof stockTransferFormSchema
>;
