import { vi } from "vitest";

export const fetchSecret = vi.fn().mockResolvedValue("test-secret");