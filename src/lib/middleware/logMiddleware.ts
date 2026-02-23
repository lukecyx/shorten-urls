import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { MiddlewareObj } from "@middy/core";

import { getLogger } from "~/lib/logger";
import { RequestContext } from "~/lib/types/context";

export const logMiddleware = (): MiddlewareObj<APIGatewayProxyEventV2> => ({
  before: (handler) => {
    const requestId =
      (handler.context as unknown as Context).awsRequestId || "local";
    const ctx = handler.context as unknown as RequestContext;

    ctx.logger = getLogger().child({ requestId });
    ctx.requestId = requestId;

    ctx.logger.info("Incoming request", {
      event: handler.event,
    });
  },
  after: (handler) => {
    const ctx = handler.context as unknown as RequestContext;

    ctx.logger.info("Request succeeded", {
      response: handler.response,
    });
  },
  onError: (handler) => {
    const ctx = handler.context as unknown as RequestContext;
    ctx.logger.error("Request failed", handler.error);
  },
});
