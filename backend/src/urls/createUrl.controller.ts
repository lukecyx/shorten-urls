import { APIGatewayProxyResultV2 } from "aws-lambda";
import { SeverityNumber } from "@opentelemetry/api-logs";

import { RequestContext } from "~/lib/types/context";
import { createUrl as createUrlService } from "~/services/urls/createUrl";
import { CreateUrlBody, ValidatedBody } from "~/lib/types";

export async function createUrl(
  event: ValidatedBody<CreateUrlBody>,
  context: RequestContext,
): Promise<APIGatewayProxyResultV2> {
  context.logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: "INFO",
    body: "Processing createUrl request",
    attributes: {
      layer: "controller",
      controller: "createUrl",
      longUrl: event.body.longUrl,
    },
  });

  try {
    const urlCode = await createUrlService(event.body.longUrl, context);

    context.logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "URL shortened successfully",
      attributes: { layer: "controller", controller: "createUrl", urlCode },
    });

    return {
      statusCode: 200,
      headers: { ContentType: "application/json" },
      body: JSON.stringify({ message: "URL shortened successfully", urlCode }),
    };
  } catch (error) {
    const err = error as Error;

    throw err;
  }
}
