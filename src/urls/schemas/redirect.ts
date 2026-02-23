import z from "zod";

export const redirectSchema = z.object({
  urlCode: z.string(),
});
