import { APIGatewayProxyEventV2 } from "aws-lambda";
import { MiddlewareObj } from "@middy/core";
import { getDb } from "../db";
import { RequestContext } from "~/lib/types/context";

export const dbMiddleware = (): MiddlewareObj<APIGatewayProxyEventV2> => ({
  before: (handler) => {
    const ctx = handler.context as unknown as RequestContext;
    ctx.db = getDb();
  },
});
