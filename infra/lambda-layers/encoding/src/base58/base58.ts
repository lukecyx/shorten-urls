const BASE_58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function encodeBase58(num: bigint): string {
  if (num === 0n) {
    return BASE_58_ALPHABET[0];
  }

  if (num > 58n ** 6n) {
    throw new Error("Num out of bounds");
  }

  let out = "";
  while (num > 0n) {
    const rem = Number(num % 58n);
    out = BASE_58_ALPHABET[rem] + out;
    num /= 58n;
  }
  return out.padStart(6, BASE_58_ALPHABET[0]);
}

export function decodeBase58(str: string): bigint {
  let num = 0n;
  for (const char of str) {
    const val = BASE_58_ALPHABET.indexOf(char);
    if (val === -1) {
      throw new Error("invalid base58 character");
    }
    num = num * 58n + BigInt(val);
  }
  return num;
}

console.log(encodeBase58(456n));
