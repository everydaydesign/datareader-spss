import { describe, expect, test } from "bun:test";

import { SavError } from "../src/limits.ts";
import { decoderFor } from "../src/sav/cases.ts";

// M1: the file's declared charset (subtype-20) is passed STRAIGHT to the platform TextDecoder, so a
// pre-Unicode file in a CJK codepage decodes to the right letters instead of the mojibake the old
// three-label collapse produced. What decodes depends on the runtime's table (Bun handles the CJK
// pages below but not single-byte non-Latin ones like windows-1251); a label THIS runtime can't
// decode is rejected, not silently mis-decoded. These cases are runtime-invariant (pass on Bun+Node).
describe("decoderFor — the declared charset passes straight to the platform decoder", () => {
  test("shift_jis decodes Japanese bytes (not collapsed onto windows-1252)", () => {
    // 0x93 FA 96 7B is "日本" in Shift_JIS.
    expect(decoderFor("shift_jis").decode(new Uint8Array([0x93, 0xfa, 0x96, 0x7b]))).toBe("日本");
  });

  test("gbk decodes Simplified Chinese bytes", () => {
    // 0xC4 E3 BA C3 is "你好" in GBK.
    expect(decoderFor("gbk").decode(new Uint8Array([0xc4, 0xe3, 0xba, 0xc3]))).toBe("你好");
  });

  test("an empty label (no subtype-20) defaults to utf-8", () => {
    expect(decoderFor("").decode(new Uint8Array([0xc3, 0xa9]))).toBe("é");
  });

  test("a label this runtime can't decode throws SavError, never a silent utf-8 fallback", () => {
    expect(() => decoderFor("not-a-real-charset")).toThrow(SavError);
  });
});
