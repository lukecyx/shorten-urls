import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { MiddlewareObj } from "@middy/core";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { trace, propagation, context } from "@opentelemetry/api";

import { initSDK } from "~/lib/observability/instrumentation";
import { initLogging, getLogger } from "~/lib/observability/logger";
import { RequestContext } from "~/lib/types/context";

export const logMiddleware = (): MiddlewareObj<APIGatewayProxyEventV2> => {
  initSDK();
  initLogging();

  return {
    before: (handler) => {
      const requestId =
        (handler.context as unknown as Context).awsRequestId ||
        "local-request-id";
      const ctx = handler.context as unknown as RequestContext;

      const extractedCtx = propagation.extract(
        context.active(),
        handler.event.headers,
      );
      const span = trace
        .getTracer("url-shortener")
        .startSpan("lambda.handler", {}, extractedCtx);

      const activeCtx = trace.setSpan(extractedCtx, span);

      (ctx as any).__span = span;
      ctx.logger = getLogger(activeCtx, requestId);
      ctx.requestId = requestId;

      ctx.logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Incoming request",
        attributes: {
          event: JSON.stringify(handler.event),
        },
      });
    },
    after: (handler) => {
      const ctx = handler.context as unknown as RequestContext;

      ctx.logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "Request succeeded",
        attributes: {
          response: handler.response,
        },
      });

      (ctx as any).__span?.end();
    },
    onError: (handler) => {
      const ctx = handler.context as unknown as RequestContext;
      const error = handler.error;

      ctx.logger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: "ERROR",
        body: "Request failed",
        attributes: {
          "exception.type": error instanceof Error ? error.name : typeof error,
          "exception.message": error instanceof Error ? error.message : error,
          "exception.stacktrace":
            error instanceof Error ? error.stack : undefined,
        },
      });

      (ctx as any).__span?.end();
      throw error;
    },
  };
};
