import z from "zod";

import { createUrlSchema } from "~/urls/schemas";

export type CreateUrlBody = z.infer<typeof createUrlSchema>;
