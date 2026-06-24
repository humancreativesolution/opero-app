import { z } from "zod";

export const promotionFormSchema = z.object({
  name: z.string().trim().min(1, "Promotion name is required"),
  description: z.string().trim().optional(),
  type: z.enum([
    "PRODUCT_DISCOUNT",
    "MIN_QTY_DISCOUNT",
    "MIN_TRANSACTION_DISCOUNT",
  ]),
  channel: z.enum(["POS", "SALES_ORDER", "ALL"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  discountValueType: z.enum(["PERCENT", "AMOUNT"]),
  discountValue: z.number().min(0, "Discount value cannot be negative"),
  minQty: z.number().int().min(0).optional(),
  minSubtotal: z.number().min(0).optional(),
  applyToAllProducts: z.boolean(),
  productIds: z.array(z.string()),
  locationIds: z.array(z.string()),
  defaultLocationId: z.string().optional(),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().optional(),
});

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;
