import { APIGatewayProxyEventV2 } from "aws-lambda";
import { MiddlewareObj } from "@middy/core";

import { getLogger } from "~/lib/logger";
import { LambdaLoggingContext } from "./types";

export const logMiddleware = (): MiddlewareObj<APIGatewayProxyEventV2> => ({
  before: (handler) => {
    const ctx = handler.context as LambdaLoggingContext;
    const logger = getLogger();

    ctx.logger = logger.child({
      requestId: handler.context.awsRequestId,
    });
    ctx.logger.info({ event: handler.event }, "Incoming request");
  },
  after: (handler) => {
    const ctx = handler.context as LambdaLoggingContext;

    ctx.logger.info({ response: handler.response }, "Request succeeded");
  },
  onError: (handler) => {
    const ctx = handler.context as LambdaLoggingContext;
    ctx.logger.error({ error: handler.error }, "Request failed");

    // rethrow so Lambda sees it as an error
    throw handler.error;
  },
});
