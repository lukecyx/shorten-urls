import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";

import { redirect } from "../controller";
import { logMiddleware, validateRequestPart } from "~/lib/middleware";
import { redirectSchema } from "../schemas";

export const handler = middy(redirect)
  .use(logMiddleware())
  .use(validateRequestPart(redirectSchema, "pathParameters"))
  .use(httpJsonBodyParser())
  .use(httpErrorHandler());
