import { SQSRecord } from "aws-lambda";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { v7 as uuidv7 } from "uuid";

import { RequestContext } from "~/lib/types/context";

interface AnalyticsMessage {
  urlId: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
}

export async function writeToAnalytics(
  records: SQSRecord[],
  context: RequestContext,
) {
  for (const record of records) {
    context.logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: `Processing message: ${record.messageId}`,
      attributes: { layer: "service", service: "analytics" },
    });

    const message: AnalyticsMessage = JSON.parse(record.body);

    await context.db.urlAnalytics.create({
      data: { id: uuidv7(), ...message },
    });
  }
}
