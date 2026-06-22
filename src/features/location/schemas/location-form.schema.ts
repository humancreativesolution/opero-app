import { z } from "zod";

export const locationFormSchema = z.object({
  name: z.string().trim().min(1, "Location name is required"),
  type: z.enum(["OUTLET", "WAREHOUSE"], {
    error: "Location type is required",
  }),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;
