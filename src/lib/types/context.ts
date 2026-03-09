import { Context } from "aws-lambda";
import { Logger } from "@opentelemetry/api-logs";
import { PrismaClient } from "~/generated/prisma";

export interface RequestContext extends Context {
  logger: Logger;
  requestId: string;
  db: PrismaClient;
}
