import winston from "winston";
import { PrismaClient } from "~/generated/prisma";

/**
 * Request context that flows through the entire request lifecycle.
 */
export interface RequestContext {
  logger: winston.Logger;
  requestId: string;
  db?: PrismaClient;
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

