import { z } from "zod";

export const userFormSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Email is invalid"),
  password: z.string().trim().optional(),
  roleId: z.string().min(1, "Role is required"),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
