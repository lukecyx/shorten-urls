import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { LambdaLoggingContext } from "~/lib/middleware/types";
import { enrichContext } from "~/lib/types/context";
import { createUrl as createUrlService } from "../services/urls/createUrl";
import { CreateUrlBody, ValidatedBody } from "~/lib/types";

export async function createUrl(
  event: ValidatedBody<CreateUrlBody>,
  context: LambdaLoggingContext,
): Promise<APIGatewayProxyResultV2> {
  const ctx = enrichContext(context.requestContext, {
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
  context: LambdaLoggingContext,
): Promise<APIGatewayProxyResultV2> {
  console.log("redirect controlelr called");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "redirect controlelr called" }),
  };
}
