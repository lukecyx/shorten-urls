import { APIGatewayProxyEventV2 } from "aws-lambda";
import { MiddlewareObj } from "@middy/core";

import { getLogger } from "~/lib/logger";
import { LambdaLoggingContext } from "./types";

export const logMiddleware = (): MiddlewareObj<APIGatewayProxyEventV2> => ({
  before: (handler) => {
    const ctx = handler.context as LambdaLoggingContext;
    const logger = getLogger();

    // Create the initial request context with child logger
    // Winston child logger will include requestId in all subsequent logs
    const requestId = handler.context.awsRequestId || "local";

    const childLogger = logger.child({ requestId });

    ctx.requestContext = {
      logger: childLogger,
      requestId,
    };

    ctx.requestContext.logger.info("Incoming request", {
      event: handler.event,
    });
  },
  after: (handler) => {
    const ctx = handler.context as LambdaLoggingContext;

    ctx.requestContext.logger.info("Request succeeded", {
      response: handler.response,
    });
  },
  onError: (handler) => {
    const ctx = handler.context as LambdaLoggingContext;
    ctx.requestContext.logger.error("Request failed", handler.error);
    //
    // Error will automatically propagate to next error handler (httpErrorHandler)
  },
});
