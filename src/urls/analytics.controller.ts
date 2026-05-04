import { SQSEvent } from "aws-lambda";

import { writeToAnalytics as writeToAnalyticsService } from "~/services/urls/analytics";

import { RequestContext } from "~/lib/types/context";

export async function analytics(
  event: SQSEvent,
  context: RequestContext,
): Promise<void> {
  await writeToAnalyticsService(event.Records, context);
}
