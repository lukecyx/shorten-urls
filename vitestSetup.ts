import { beforeEach, vi } from "vitest";
import { mockReset } from "vitest-mock-extended";
import { db } from "./src/testUtils";

beforeEach(() => {
  mockReset(db); // handles db mock reset
  vi.clearAllMocks(); // handles vi.fn() mocks
});
