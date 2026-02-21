import { BinaryLike, createHmac } from "crypto";

/**
 * Context for a Feistel domain
 */
export interface FeistelContext {
  domainBits: bigint;
  rounds: number;
  secret: BinaryLike;
}

/**
 * Create a Feistel context with precomputed constants.
 *
 * This allows all internal functions (splitId, combineId, roundFn) to
 * access shared values like halfBits and halfMask without passing them repeatedly.
 */
export function createFeistelContext(
  domainBits: bigint,
  rounds: number,
  secret: BinaryLike,
  base: bigint,
  length: bigint,
) {
  const halfBits = domainBits / 2n;

  /**
   * HALF_MASK masks a value down to HALF_BITS bits.
   *
   * Example (HALF_BITS = 18):
   *   HALF_MASK = 0b00000000000000111111111111111111
   *
   * This guarantees that:
   *  - Each Feistel half stays within its assigned bit-width
   *  - The permutation remains bijective over the full domain
   */
  const halfMask = (1n << halfBits) - 1n;
  const maxValue = base ** length;

  return {
    domainBits,
    rounds,
    secret,
    halfBits,
    halfMask,
    maxValue,
  } as const;
}

/**
 * Split an ID into left/right halves
 * Full 36-bit id:  000001101011111000 101010111100
 *                    |                  |
 *                leftHalf            rightHalf
 */
function splitId(
  id: bigint,
  ctx: ReturnType<typeof createFeistelContext>,
): [bigint, bigint] {
  // Lower bits.
  const rightHalf = id & ctx.halfMask;
  // Upper bits
  const leftHalf = (id >> ctx.halfBits) & ctx.halfMask;

  return [leftHalf, rightHalf];
}

/**
 * Combine left/right halves back into a full ID
 */
function combineId(
  leftHalf: bigint,
  rightHalf: bigint,
  ctx: ReturnType<typeof createFeistelContext>,
): bigint {
  return (leftHalf << ctx.halfBits) | rightHalf;
}

/**
 * PRF (Pseudorandom Function)
 *
 * HMAC-SHA256(key, round || rightHalf), truncated to HALF_BITS.
 * This provides diffusion and hides sequential structure.
 */
function roundFn(
  feistelRightHalf: bigint,
  roundIndex: number,
  ctx: ReturnType<typeof createFeistelContext>,
): bigint {
  const hmac = createHmac("sha256", ctx.secret);

  // Domain-separate each Feistel round
  hmac.update(Buffer.from([roundIndex]));

  // Number of bytes required to encode one Feistel half
  const halfByteLength = Math.ceil(Number(ctx.halfBits) / 8);

  // Canonical big-endian encoding of the Feistel right half
  const rightHalfBytes = Buffer.alloc(halfByteLength);
  let remainingValue = feistelRightHalf;

  for (let bytePos = halfByteLength - 1; bytePos >= 0; bytePos--) {
    rightHalfBytes[bytePos] = Number(remainingValue & 0xffn);
    remainingValue >>= 8n;
  }

  // PRF input: roundIndex || rightHalfBytes
  hmac.update(rightHalfBytes);

  // Full HMAC-SHA256 output
  const prfDigest = hmac.digest();

  // Extract enough PRF output to cover HALF_BITS
  let truncatedPrfOutput = 0n;
  for (let i = 0; i < halfByteLength; i++) {
    truncatedPrfOutput = (truncatedPrfOutput << 8n) | BigInt(prfDigest[i]);
  }

  // Ensure output fits exactly within the Feistel half width
  return truncatedPrfOutput & ctx.halfMask;
}

function reduceId(id: bigint, ctx: ReturnType<typeof createFeistelContext>) {
  return id % ctx.maxValue;
}

/**
 * Encode a Feistel ID
 *
 * This operates entirely inside the domainBits (e.g., 36 bits).
 * Throws if the ID is larger than the domain allows.
 */
export function encodeFeistelRaw(
  id: bigint,
  ctx: ReturnType<typeof createFeistelContext>,
): bigint {
  const x = id;

  if (x >= 1n << ctx.domainBits) {
    throw new Error("ID exceeds configured domain size");
  }

  let [leftHalf, rightHalf] = splitId(x, ctx);

  // Rounds are to create confusion between input and secret key
  for (let i = 0; i < ctx.rounds; i++) {
    [leftHalf, rightHalf] = [rightHalf, leftHalf ^ roundFn(rightHalf, i, ctx)];
  }

  return combineId(leftHalf, rightHalf, ctx);
}

/**
 * Wrapper around the real encoding.
 *
 * This is entirely done for cycling so that the feistel output
 * will always be within the range of the domain (58^6).
 */
export function encodeFeistel(
  id: bigint,
  ctx: ReturnType<typeof createFeistelContext>,
) {
  let x = BigInt(id) > ctx.maxValue ? reduceId(id, ctx) : BigInt(id);

  // Always apply Feistel at least once, then cycle if needed
  do {
    x = encodeFeistelRaw(x, ctx);
  } while (x >= ctx.maxValue);

  return x;
}

/**
 * Decode a Feistel ID (raw, single pass)
 *
 * This reverses one application of the Feistel network.
 */
export function decodeFeistelRaw(
  encoded: bigint,
  ctx: ReturnType<typeof createFeistelContext>,
): bigint {
  let [leftHalf, rightHalf] = splitId(encoded, ctx);

  // Reverse Feistel rounds
  for (let i = ctx.rounds - 1; i >= 0; i--) {
    [leftHalf, rightHalf] = [rightHalf ^ roundFn(leftHalf, i, ctx), leftHalf];
  }

  return combineId(leftHalf, rightHalf, ctx);
}

/**
 * Wrapper around the raw decoding.
 *
 * This handles cycle walking in reverse: if the decoded value is >= maxValue,
 * it means we need to continue decoding until we get a value within bounds.
 */
export function decodeFeistel(
  encoded: bigint,
  ctx: ReturnType<typeof createFeistelContext>,
): bigint {
  let x = encoded;
  let decoded = decodeFeistelRaw(x, ctx);

  // Keep cycling until we get a value < maxValue
  while (decoded >= ctx.maxValue) {
    x = decoded;
    decoded = decodeFeistelRaw(x, ctx);
  }

  return decoded;
}
