import { APIGatewayProxyResultV2 } from "aws-lambda";
import { RequestContext, enrichContext } from "~/lib/types/context";
import { createUrl as createUrlService } from "~/services/urls/createUrl";
import { CreateUrlBody, ValidatedBody } from "~/lib/types";

export async function createUrl(
  event: ValidatedBody<CreateUrlBody>,
  context: RequestContext,
): Promise<APIGatewayProxyResultV2> {
  const ctx = enrichContext(context, {
    layer: "controller",
    controller: "createUrl",
    longUrl: event.body.longUrl,
  });

  ctx.logger.info("Processing createUrl request");

  const urlCode = await createUrlService(event.body.longUrl, ctx);

  ctx.logger.info("URL shortened successfully", { urlCode });

  return {
    statusCode: 200,
    headers: {
      ContentType: "application/json",
    },
    body: JSON.stringify({
      message: "URL shortened successfully",
      urlCode,
    }),
  };
}
