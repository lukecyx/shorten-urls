import { describe, it, expect, vi } from "vitest";

import { createUrl } from "./createUrl";
import { Prisma } from "~/generated/prisma";
import { encodeToBase58, generateSnowflakeId } from "~/layers";

import { db, createMockContext } from "~/testUtils";

vi.mock("~/config");
vi.mock("~/layers");
vi.mock("../utils");

describe(createUrl.name, () => {
  it("enriches the context with service metadata", async () => {
    const ctx = createMockContext();

    createUrl("https://example.com/long/path", ctx);

    expect((ctx.logger as any).child).toHaveBeenCalledWith(
      expect.objectContaining({
        layer: "service",
        service: "urls",
        operation: "createUrl",
      }),
    );
  });

  it("calls generateSnowflakeId to produce a unique ID", async () => {
    const ctx = createMockContext();

    createUrl("https://example.com/long/path", ctx);

    expect(generateSnowflakeId).toHaveBeenCalled();
  });

  it("returns the short code on a successful insert", async () => {
    const ctx = createMockContext();
    const result = await createUrl("https://example.com/long/path", ctx);
    expect(result).toBe("aBc123");
  });

  it("retries on a P2002 unique-constraint violation and returns the code on the next attempt", async () => {
    // Simulate a different short code being generated on the retry.
    vi.mocked(encodeToBase58)
      .mockReturnValueOnce("aBc123") // first attempt — will collide
      .mockReturnValueOnce("xYz789"); // second attempt — succeeds

    const p2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "5.0.0" },
    );

    db.url.create.mockRejectedValueOnce(p2002); // first attempt: collision

    const ctx = createMockContext();
    const result = await createUrl("https://example.com", ctx);

    expect(db.url.create).toHaveBeenCalledTimes(2);
    expect(result).toBe("xYz789");
  });

  it("throws after exceeding maxAttempts consecutive P2002 errors", async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "5.0.0",
      },
    );
    db.url.create.mockRejectedValue(p2002);
    const ctx = createMockContext({ db });

    await expect(createUrl("https://example.com", ctx)).rejects.toThrow(
      "Max retry attempts exceeded",
    );
  });

  it("re-throws non-P2002 database errors immediately", async () => {
    const dbError = new Error("Connection lost");
    db.url.create.mockRejectedValue(dbError);
    const ctx = createMockContext({ db });

    await expect(createUrl("https://example.com", ctx)).rejects.toThrow(
      "Connection lost",
    );
    expect(db.url.create).toHaveBeenCalledTimes(1);
  });
});
