import { decodeBase58, encodeBase58 } from "./base58";
import {
  encodeFeistel,
  createFeistelContext,
  decodeFeistel,
} from "./feistelNetwork";

export function encodeToBase58(
  id: bigint,
  ctx: ReturnType<typeof createFeistelContext>,
): string {
  const feistelOutput = encodeFeistel(id, ctx);

  return encodeBase58(feistelOutput);
}

export function decodeFromBase58(
  code: string,
  ctx: ReturnType<typeof createFeistelContext>,
): bigint {
  const feistelInput = decodeBase58(code);

  return decodeFeistel(feistelInput, ctx);
}

export { createFeistelContext };
