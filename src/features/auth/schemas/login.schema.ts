import { z } from "zod";

export const loginSchema = z.object({
  subdomain: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Subdomain hanya boleh huruf kecil, angka, dan dash")
    .optional(),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
