import { RequestContext } from "~/lib/types/context";

import { db } from "./db";
import { logger } from "./logger";

export function createMockContext(
  overrides?: Partial<RequestContext>,
): RequestContext {
  return {
    logger: logger,
    requestId: "req-test-123",
    db: db,
    ...overrides,
  } as RequestContext;
}