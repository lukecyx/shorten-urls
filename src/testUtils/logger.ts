import { mockDeep } from "vitest-mock-extended";
import { Logger } from "winston";

export const logger = mockDeep<Logger>();
(logger as any).child.mockReturnValue(logger);