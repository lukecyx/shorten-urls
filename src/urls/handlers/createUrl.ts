import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";

import { createUrl } from "../controller";
import { logMiddleware, validateRequestPart } from "~/lib/middleware";
import { createUrlSchema } from "../schemas";

export const handler = middy(createUrl)
  .use(logMiddleware())
  .use(httpJsonBodyParser())
  .use(validateRequestPart(createUrlSchema, "body"))
  .use(httpErrorHandler());
