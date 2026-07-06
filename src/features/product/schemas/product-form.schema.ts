import { z } from "zod";

export const productFormSchema = z.object({
  type: z.enum(["STOCK", "SERVICE"]),
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  name: z.string().trim().min(1, "Product name is required"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  lastCostPrice: z.number().min(0, "Last cost price cannot be negative"),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
