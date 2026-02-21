import z from "zod";

import { redirectSchema } from "~/urls/schemas";

export type RedirectPathParams = z.infer<typeof redirectSchema>;
