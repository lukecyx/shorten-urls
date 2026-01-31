const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function encodeBase62(counterValue: number): string {
  let out = "";

  if (counterValue === 0) {
    return CHARS[0];
  }

  while (counterValue > 0) {
    out = CHARS[counterValue % CHARS.length] + out;
    counterValue = Math.floor(counterValue / 62);
  }

  return out;
}
