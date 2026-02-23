import { Context } from "aws-lambda";
import winston from "winston";
import { PrismaClient } from "~/generated/prisma";

export interface RequestContext extends Context {
  logger: winston.Logger;
  requestId: string;
  db: PrismaClient;
}

export function enrichContext(
  ctx: RequestContext,
  metadata: Record<string, unknown>,
): RequestContext {
  return {
    ...ctx,
    logger: ctx.logger.child(metadata),
  };
}
