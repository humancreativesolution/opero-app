import { z } from "zod";

export const openCashierShiftFormSchema = z.object({
  openingCash: z.number().min(0, "Opening cash cannot be negative"),
  notes: z.string().trim().optional(),
});

export const closeCashierShiftFormSchema = z.object({
  countedCash: z.number().min(0, "Counted cash cannot be negative"),
  notes: z.string().trim().optional(),
});

export type OpenCashierShiftFormValues = z.infer<
  typeof openCashierShiftFormSchema
>;

export type CloseCashierShiftFormValues = z.infer<
  typeof closeCashierShiftFormSchema
>;
