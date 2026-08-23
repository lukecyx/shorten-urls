import { SeverityNumber } from "@opentelemetry/api-logs";

import { RequestContext } from "~/lib/types/context";
import { env } from "~/config";
import {
  generateSnowflakeId,
  encodeToBase58,
  createFeistelContext,
} from "~/layers";
import { fetchSecret } from "../utils";
import { Prisma } from "~/generated/prisma";
import { v7 as uuidv7 } from "uuid";

async function getShortCode(ctx: RequestContext) {
  const snowflakeId = generateSnowflakeId();

  const [feistelSecret, feistelRounds, domainBits] = await Promise.all([
    env.feistelSecret ?? fetchSecret(process.env.FEISTEL_SECRET_ARN!),
    env.feistelRounds ?? fetchSecret(process.env.FEISTEL_ROUNDS_ARN!),
    env.domainBits ?? fetchSecret(process.env.DOMAIN_BITS_ARN!),
  ]);

  const encodingCtx = createFeistelContext(
    BigInt(domainBits),
    parseInt(feistelRounds, 10),
    feistelSecret,
    BigInt(env.codeBase),
    BigInt(env.codeLength),
  );

  const shortCode = encodeToBase58(snowflakeId, encodingCtx);

  ctx.logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: "INFO",
    body: "URL encoded successfully",
    attributes: {
      layer: "service",
      service: "urls",
      operation: "getShortCode",
      shortCode,
    },
  });

  return shortCode;
}

export async function createUrl(longUrl: string, ctx: RequestContext) {
  let shortCode: string | undefined = undefined;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    shortCode = await getShortCode(ctx);

    try {
      const result = await ctx.db.url.create({
        data: { id: uuidv7(), shortCode, longUrl },
      });

      ctx.logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: "URL saved to db",
        attributes: {
          layer: "service",
          service: "urls",
          operation: "createUrl",
          id: result?.id,
        },
      });

      break;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          attempts++;

          ctx.logger.emit({
            severityNumber: SeverityNumber.ERROR,
            severityText: "ERROR",
            body: "Failed to insert record shortCode already exists in db",
            attributes: {
              layer: "service",
              service: "urls",
              operation: "createUrl",
              "exception.message": error.message,
            },
          });

          if (attempts >= maxAttempts) {
            ctx.logger.emit({
              severityNumber: SeverityNumber.ERROR,
              severityText: "ERROR",
              body: "Max retry attempts exceeded",
              attributes: {
                layer: "service",
                service: "urls",
                operation: "createUrl",
              },
            });

            throw new Error("Max retry attempts exceeded");
          }

          continue;
        }
      }

      throw error;
    }
  }

  return shortCode;
}
