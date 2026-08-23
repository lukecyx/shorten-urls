import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";

import { redirect } from "~/urls/redirect.controller";
import {
  logMiddleware,
  dbMiddleware,
  validateRequestPart,
} from "~/lib/middleware";
import { redirectSchema } from "../schemas";

export const handler = middy(redirect)
  .use(logMiddleware())
  .use(dbMiddleware())
  .use(validateRequestPart(redirectSchema, "pathParameters"))
  .use(httpErrorHandler());
