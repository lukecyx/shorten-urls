import z from "zod";

import { createUrlSchema, redirectSchema } from "~/urls/schemas";

export type CreateUrlBody = z.infer<typeof createUrlSchema>;
export type RedirectPathParams = z.infer<typeof redirectSchema>;
