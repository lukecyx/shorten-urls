import z from "zod";

export const redirectSchema = z.object({
  url: z.url(),
});
