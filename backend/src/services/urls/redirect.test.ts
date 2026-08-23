import { describe, it, expect, vi } from "vitest";
import { SeverityNumber } from "@opentelemetry/api-logs";

import { redirect } from "./redirect";

import { db, createMockContext } from "~/testUtils";
import { v7 as uuidv7 } from "uuid";

vi.mock("~/config");
vi.mock("../utils");

const testId = uuidv7();

const record = {
  id: testId,
  longUrl: "https://www.example.com/long/path",
  shortCode: "aBc123",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("redirect.service", () => {
  it("throws an error if longUrl is not found", async () => {
    db.url.findUnique.mockResolvedValueOnce(null);
    const ctx = createMockContext({ db });

    await expect(redirect("https://localhost.com/aBc123", ctx)).rejects.toThrow(
      "longUrl not found for shortUrl",
    );

    expect(ctx.logger.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        severityNumber: SeverityNumber.ERROR,
        body: "longUrl not found for shortUrl",
        attributes: expect.objectContaining({
          shortUrl: "https://localhost.com/aBc123",
        }),
      }),
    );
  });

  it("queries by the provided shortCode", async () => {
    db.url.findUnique.mockResolvedValueOnce(record);
    const ctx = createMockContext({ db });

    await redirect("aBc123", ctx);

    expect(db.url.findUnique).toHaveBeenCalledWith({
      where: { shortCode: "aBc123" },
    });
  });

  it("returns the url when record is found", async () => {
    db.url.findUnique.mockResolvedValueOnce(record);
    const ctx = createMockContext({ db });

    const reuslt = await redirect("https://localhost.com/aBc123", ctx);
    expect(reuslt).toBe(record);
  });

  it("propagates db errors", async () => {
    db.url.findUnique.mockRejectedValueOnce(new Error("Connection timeout"));
    const ctx = createMockContext({ db });

    await expect(redirect("aBc123", ctx)).rejects.toThrow("Connection timeout");
  });
});
