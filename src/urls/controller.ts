import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { RequestContext, enrichContext } from "~/lib/types/context";
import { createUrl as createUrlService } from "../services/urls/createUrl";
import { redirect as redirectService } from "../services/urls/redirect";
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
    body: JSON.stringify({
      message: "create url controller called",
      urlCode,
    }),
  };
}

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

  if (!urlCode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "urlCode not found in request" }),
    };
  }

  const urlRecord = await redirectService(urlCode, ctx);

  return {
    statusCode: 302,
    headers: {
      Location: urlRecord.longUrl,
    },
  };
}
