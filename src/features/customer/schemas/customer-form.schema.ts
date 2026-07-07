import { z } from "zod";

const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Invalid email format",
  });

export const customerFormSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(1, "Customer name is required"),
  phone: z.string().trim().optional(),
  email: optionalEmailSchema.optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
