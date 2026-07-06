import { z } from "zod";

export const unitFormSchema = z.object({
  code: z.string().trim().min(1, "Unit code is required"),
  name: z.string().trim().min(1, "Unit name is required"),
  isActive: z.boolean(),
});

export type UnitFormValues = z.infer<typeof unitFormSchema>;
