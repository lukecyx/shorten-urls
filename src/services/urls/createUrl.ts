import { RequestContext, enrichContext } from "~/lib/types/context";
import { env } from "~/config";
import {
  generateSnowflakeId,
  encodeToBase58,
  createFeistelContext,
} from "~/layers";
import { fetchSecret } from "../utils";
import { Prisma } from "~/generated/prisma";
import { v7 as uuidv7 } from "uuid";

async function getShortCode(longUrl: string, ctx: RequestContext) {
  const getShortCodeCtx = enrichContext(ctx, {
    layer: "service",
    service: "urls",
    operation: "getShortCode",
  });

  getShortCodeCtx.logger.info("Getting short code for longUrl", {
    longUrl,
  });
  getShortCodeCtx.logger.info("Generating snowflake ID");

  const snowflakeId = generateSnowflakeId();

  getShortCodeCtx.logger.info("Snowflake ID generated", {
    snowflakeId: snowflakeId.toString(),
  });

  getShortCodeCtx.logger.info("Creating Feistel encoding context", {
    domainBits: env.domainBits,
    feistelRounds: env.feistelRounds,
    codeBase: env.codeBase,
    codeLength: env.codeLength,
  });

  // local dev uses env vars but prod doesn't
  const feistelSecret =
    env.feistelSecret ?? (await fetchSecret("FeistelSecret"));

  const encodingCtx = createFeistelContext(
    BigInt(env.domainBits),
    parseInt(env.feistelRounds, 10),
    feistelSecret,
    BigInt(env.codeBase),
    BigInt(env.codeLength),
  );

  getShortCodeCtx.logger.info("Encoding ID to base58");
  const shortCode = encodeToBase58(snowflakeId, encodingCtx);

  getShortCodeCtx.logger.info("URL encoded successfully", {
    shortCode,
  });

  return shortCode;
}

export async function createUrl(longUrl: string, ctx: RequestContext) {
  const serviceCtx = enrichContext(ctx, {
    layer: "service",
    service: "urls",
    operation: "createUrl",
  });

  serviceCtx.logger.info("Generating snowflake ID");
  const snowflakeId = generateSnowflakeId();

  serviceCtx.logger.info("Snowflake ID generated", {
    snowflakeId: snowflakeId.toString(),
  });

  let shortCode: string | undefined = undefined;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    shortCode = await getShortCode(longUrl, ctx);

    try {
      const result = await ctx.db.url.create({
        data: {
          id: uuidv7(),
          shortCode,
          longUrl,
        },
      });

      serviceCtx.logger.info("URL saved to db", { id: result?.id });

      break;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          attempts++;
          serviceCtx.logger.error(
            "Failed to insert record shortCode already exists in db",
            { error },
          );
          if (attempts >= maxAttempts) {
            serviceCtx.logger.error("Max retry attempts exceeded");

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
