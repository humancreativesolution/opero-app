import { z } from "zod";

import { CashMovementReason, CashMovementType } from "@/graphql/generated";

export const cashMovementFormSchema = z.object({
  type: z.enum([CashMovementType.CashIn, CashMovementType.CashOut]),
  reason: z.enum([
    CashMovementReason.AdditionalFloat,
    CashMovementReason.CashCorrection,
    CashMovementReason.CashDeposit,
    CashMovementReason.CashWithdrawal,
    CashMovementReason.Other,
    CashMovementReason.PettyCashExpense,
  ]),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  notes: z.string().trim().optional(),
});

export type CashMovementFormValues = z.infer<typeof cashMovementFormSchema>;

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
