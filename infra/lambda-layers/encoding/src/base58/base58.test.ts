import { describe, it, expect } from "vitest";
import { decodeBase58, encodeBase58 } from "./base58";

describe(encodeBase58.name, () => {
  it.each([
    { num: 123n, expected: "111138" },
    { num: 15_999n, expected: "1115kr" },
    { num: 150_999n, expected: "111mtS" },
    { num: 555_555n, expected: "113r9Y" },
    { num: 5_555_555n, expected: "11VUUS" },
    { num: 55_555_555n, expected: "15ujjQ" },
    { num: 656_356_032n, expected: "1zzznK" },
  ])(
    `pads short numbers :: num: $num expected: $expected`,
    ({ num, expected }) => {
      expect(encodeBase58(num)).toBe(expected);
    },
  );

  it.each([
    { num: 1_234_567_890n, expected: "2t6V2H" },
    { num: 9_876_543_210n, expected: "G3ksCm" },
    { num: 656_356_031n, expected: "1zzznJ" },
    { num: 38_068_692_543n, expected: "zzzzzz" },
  ])("encodes $num to $expected", ({ num, expected }) => {
    expect(encodeBase58(num)).toBe(expected);
  });

  it("throws when number is out of bounds", () => {
    const outOfBounds = 58n ** 6n + 1n;
    expect(() => encodeBase58(outOfBounds)).toThrow("Num out of bounds");
  });
});

describe(decodeBase58.name, () => {
  it.each([
    { code: "111138", expected: 123n },
    { code: "1115kr", expected: 15_999n },
    { code: "111mtS", expected: 150_999n },
    { code: "113r9Y", expected: 555_555n },
  ])("decodes padded codes :: $code to $expected", ({ code, expected }) => {
    expect(decodeBase58(code)).toBe(expected);
  });
  it.each([
    { code: "11VUUS", expected: 5_555_555n },
    { code: "15ujjQ", expected: 55_555_555n },
    { code: "1zzznK", expected: 656_356_032n },
  ])(
    `decodes numbers correctly :: $code to $expected`,
    ({ code, expected }) => {
      expect(decodeBase58(code)).toBe(expected);
    },
  );
});
