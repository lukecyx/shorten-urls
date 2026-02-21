import { vi } from "vitest";

export const generateSnowflakeId = vi.fn(() => 123456789n);
export const encodeToBase58 = vi.fn(() => "aBc123");
export const createFeistelContext = vi.fn(() => ({ __mock: true }));