import { RequestContext, enrichContext } from "~/lib/types/context";
import { type Url } from "~/generated/prisma";

export async function redirect(
  shortUrl: string,
  ctx: RequestContext,
): Promise<Url> {
  const serviceCtx = enrichContext(ctx, {
    layer: "service",
    service: "urls",
    operation: "redirect",
    shortUrl,
  });

  serviceCtx.logger.info("Retrieving longUrl");
  const url = await ctx.db.url.findUnique({
    where: {
      shortCode: shortUrl,
    },
  });

  serviceCtx.logger.info("Found url", { url });

  if (!url) {
    serviceCtx.logger.error("longUrl not found for shortUrl", {
      shortUrl,
    });

    throw new Error("longUrl not found for shortUrl");
  }

  return url;
}
