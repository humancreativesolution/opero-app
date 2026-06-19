import { z } from "zod";

export const supplierFormSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(1, "Supplier name is required"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
