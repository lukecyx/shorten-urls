import { SeverityNumber } from "@opentelemetry/api-logs";

import { RequestContext } from "~/lib/types/context";
import { type Url } from "~/generated/prisma";

export async function redirect(
  shortUrl: string,
  ctx: RequestContext,
): Promise<Url> {
  const url = await ctx.db.url.findUnique({
    where: { shortCode: shortUrl },
  });

  if (!url) {
    ctx.logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: "longUrl not found for shortUrl",
      attributes: { layer: "service", service: "urls", operation: "redirect", shortUrl },
    });

    throw new Error("longUrl not found for shortUrl");
  }

  return url;
}
