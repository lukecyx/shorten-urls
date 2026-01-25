import z from "zod";

export const redirectSchema = z.object({
  shortUrl: z.url(),
});
