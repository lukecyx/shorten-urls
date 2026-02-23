import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { enrichContext, RequestContext } from "~/lib/types/context";

import { redirect as redirectService } from "~/services/urls/redirect";

export async function redirect(
  event: APIGatewayProxyEventV2,
  context: RequestContext,
): Promise<APIGatewayProxyResultV2> {
  const urlCode = event.pathParameters?.urlCode;
  const ctx = enrichContext(context, {
    layer: "controller",
    controller: "redirect",
    urlCode,
  });

  ctx.logger.info("Processing redirect request");

  if (!urlCode) {
    ctx.logger.error("urlCode not found in request");

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "urlCode not found in request" }),
    };
  }

  try {
    const urlRecord = await redirectService(urlCode, ctx);

    return {
      statusCode: 302,
      headers: {
        contentType: "application/json",
        Location: urlRecord.longUrl,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        contentType: "application/json",
      },
      body: JSON.stringify({ message: "Internal server error", error }),
    };
  }
}
