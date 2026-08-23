import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { SeverityNumber } from "@opentelemetry/api-logs";

import { RequestContext } from "~/lib/types/context";
import { redirect as redirectService } from "~/services/urls/redirect";

export async function redirect(
  event: APIGatewayProxyEventV2,
  context: RequestContext,
): Promise<APIGatewayProxyResultV2> {
  const urlCode = event.pathParameters?.urlCode;

  context.logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: "INFO",
    body: "Processing redirect request",
    attributes: { layer: "controller", controller: "redirect", urlCode },
  });

  if (!urlCode) {
    context.logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: "urlCode not found in request",
      attributes: { layer: "controller", controller: "redirect" },
    });

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "urlCode not found in request" }),
    };
  }

  try {
    const urlRecord = await redirectService(urlCode, context, {
      ip: event.requestContext?.http?.sourceIp,
      userAgent: event.requestContext?.http?.userAgent,
      referrer: event.headers["referer"],
    });

    return {
      statusCode: 302,
      headers: { contentType: "application/json", Location: urlRecord.longUrl },
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { contentType: "application/json" },
      body: JSON.stringify({
        message: "Internal server error",
        error: (error as Error).message,
      }),
    };
  }
}
