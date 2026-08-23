import middy from "@middy/core";

import { analytics } from "../analytics.controller";
import { logMiddleware, dbMiddleware } from "~/lib/middleware";

export const handler = middy(analytics)
  .use(logMiddleware())
  .use(dbMiddleware());
