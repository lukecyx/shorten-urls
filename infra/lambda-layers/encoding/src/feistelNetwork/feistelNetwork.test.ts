import { describe, it, expect } from "vitest";

import {
  encodeFeistel,
  decodeFeistel,
  createFeistelContext,
} from "./feistelNetwork";
import { en } from "zod/v4/locales";

const DOMAIN_BITS = 36n;
const FEISTEL_ROUND = 8;
const FEISTEL_SECRET = "_aír}nvë{%ÊõÿV2òGsÅ;ã÷ç";

const FEISTEL_CONTEXT = createFeistelContext(
  DOMAIN_BITS,
  FEISTEL_ROUND,
  FEISTEL_SECRET,
  58n,
  6n,
);

describe(encodeFeistel.name, () => {
  it("is a bijection", () => {
    for (let i = 0n; i < 10_000n; i++) {
      const encoded = encodeFeistel(i, FEISTEL_CONTEXT);
      expect(decodeFeistel(encoded, FEISTEL_CONTEXT)).toBe(i);
    }
  });

  it("is a bijection over the domain", () => {
    for (let i = 0n; i < 10_000n; i++) {
      const encoded = encodeFeistel(i, FEISTEL_CONTEXT);
      const decoded = decodeFeistel(encoded, FEISTEL_CONTEXT);

      expect(decoded).toBe(i);
    }
  });

  it("has no collisions", () => {
    const seen = new Set<bigint>();

    for (let i = 0n; i < 10_000n; i++) {
      const encoded = encodeFeistel(i, FEISTEL_CONTEXT);

      expect(seen.has(encoded)).toBe(false);

      seen.add(encoded);
    }
  });

  it("never produces values outside the domain", () => {
    const max = (1n << 36n) - 1n;

    for (let i = 0n; i < 10_000n; i++) {
      const encoded = encodeFeistel(i, FEISTEL_CONTEXT);

      expect(encoded).toBeGreaterThanOrEqual(0n);
      expect(encoded).toBeLessThanOrEqual(max);
    }
  });

  it("has no trivial fixed points", () => {
    for (let i = 0n; i < 10_000n; i++) {
      const encoded = encodeFeistel(i, FEISTEL_CONTEXT);
      expect(encoded).not.toBe(i);
    }
  });
});
