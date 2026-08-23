import { SeverityNumber } from "@opentelemetry/api-logs";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

import { RequestContext } from "~/lib/types/context";
import { type Url } from "~/generated/prisma";
import { env } from "~/config";

const sqs = new SQSClient({ endpoint: process.env.SQS_ENDPOINT });

export async function redirect(
  shortUrl: string,
  ctx: RequestContext,
  meta: { ip?: string; userAgent?: string; referrer?: string },
): Promise<Url> {
  const url = await ctx.db.url.findUnique({
    where: { shortCode: shortUrl },
  });

  if (!url) {
    ctx.logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: "longUrl not found for shortUrl",
      attributes: {
        layer: "service",
        service: "urls",
        operation: "redirect",
        shortUrl,
      },
    });

    throw new Error("longUrl not found for shortUrl");
  }

  await sqs.send(
    new SendMessageCommand({
      QueueUrl: env.analyticsQueueUrl,
      MessageBody: JSON.stringify({ urlId: url.id, ...meta }),
    }),
  );

  return url;
}
