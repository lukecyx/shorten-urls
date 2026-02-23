import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";

import { createUrl } from "../controller";
import { logMiddleware, validateRequestPart, dbMiddleware } from "~/lib/middleware";
import { createUrlSchema } from "../schemas";

export const handler = middy(createUrl)
  .use(logMiddleware())
  .use(dbMiddleware())
  .use(httpJsonBodyParser())
  .use(validateRequestPart(createUrlSchema, "body"))
  .use(httpErrorHandler());
