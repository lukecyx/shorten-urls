import { APIGatewayProxyEventV2 } from "aws-lambda";
import { MiddlewareObj } from "@middy/core";
import { getDb } from "../db";
import { LambdaLoggingContext } from "./types";

export const dbMiddleware = (): MiddlewareObj<APIGatewayProxyEventV2> => ({
  before: (handler) => {
    const ctx = handler.context as LambdaLoggingContext;
    ctx.requestContext.db = getDb();
  },
});
