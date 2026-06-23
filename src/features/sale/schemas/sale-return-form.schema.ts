import { z } from "zod";

export const saleReturnFormSchema = z.object({
  reason: z.string().trim().min(1, "Return reason is required"),
  refundMethod: z.enum(["CASH", "QRIS", "CARD", "TRANSFER"]),
  referenceNo: z.string().trim().optional(),
  provider: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().min(0),
        maxQty: z.number().int().min(0),
      }),
    )
    .min(1),
});

export type SaleReturnFormValues = z.infer<typeof saleReturnFormSchema>;
