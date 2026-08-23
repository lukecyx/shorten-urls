import { mockDeep } from "vitest-mock-extended";
import { Logger } from "@opentelemetry/api-logs";

export const logger = mockDeep<Logger>();
