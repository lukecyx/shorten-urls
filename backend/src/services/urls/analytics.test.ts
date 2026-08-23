import { describe, it, expect, vi } from "vitest";
import { SQSRecord } from "aws-lambda";
import { SeverityNumber } from "@opentelemetry/api-logs";

import { writeToAnalytics } from "./analytics";

import { db, createMockContext } from "~/testUtils";

vi.mock("uuid", () => ({ v7: () => "mock-uuid" }));

const makeRecord = (body: object): SQSRecord =>
  ({
    messageId: "msg-1",
    body: JSON.stringify(body),
  }) as SQSRecord;

const urlId = "019df3cc-e78d-77a1-9157-b087c1f43e31";

describe("analytics.service", () => {
  it("writes a row to url_analytics for each record", async () => {
    const ctx = createMockContext({ db });
    const records = [makeRecord({ urlId, ip: "1.2.3.4", userAgent: "curl" })];

    await writeToAnalytics(records, ctx);

    expect(db.urlAnalytics.create).toHaveBeenCalledWith({
      data: { id: "mock-uuid", urlId, ip: "1.2.3.4", userAgent: "curl" },
    });
  });

  it("processes multiple records", async () => {
    const ctx = createMockContext({ db });
    const records = [
      makeRecord({ urlId }),
      makeRecord({ urlId, ip: "5.6.7.8" }),
    ];

    await writeToAnalytics(records, ctx);

    expect(db.urlAnalytics.create).toHaveBeenCalledTimes(2);
  });

  it("logs each record as it is processed", async () => {
    const ctx = createMockContext({ db });
    const records = [makeRecord({ urlId })];

    await writeToAnalytics(records, ctx);

    expect(ctx.logger.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        severityNumber: SeverityNumber.INFO,
        body: "Processing message: msg-1",
      }),
    );
  });

  it("propagates db errors", async () => {
    db.urlAnalytics.create.mockRejectedValueOnce(new Error("Connection lost"));
    const ctx = createMockContext({ db });

    await expect(
      writeToAnalytics([makeRecord({ urlId })], ctx),
    ).rejects.toThrow("Connection lost");
  });
});
