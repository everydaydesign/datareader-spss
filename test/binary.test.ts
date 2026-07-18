import { describe, expect, test } from "bun:test";

import { SavError } from "../src/limits.ts";
import { Cursor } from "../src/sav/binary.ts";

function buf(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe("Cursor", () => {
  test("reads little-endian i32 / f64 and advances", () => {
    // 1 as LE i32, then 2.0 as LE f64
    const b = new ArrayBuffer(12);
    const dv = new DataView(b);
    dv.setInt32(0, 1, true);
    dv.setFloat64(4, 2.0, true);
    const c = new Cursor(b);
    expect(c.readI32()).toBe(1);
    expect(c.readF64()).toBe(2.0);
    expect(c.pos).toBe(12);
  });

  test("reads a little-endian i64 (as a JS number) and advances 8", () => {
    const b = new ArrayBuffer(8);
    new DataView(b).setBigInt64(0, 1_234_567_890_123n, true);
    const c = new Cursor(b);
    expect(c.readI64()).toBe(1_234_567_890_123);
    expect(c.pos).toBe(8);
  });

  test("honors big-endian when little=false", () => {
    const b = new ArrayBuffer(4);
    new DataView(b).setInt32(0, 258, false); // 0x00000102 big-endian
    const c = new Cursor(b);
    c.little = false;
    expect(c.readI32()).toBe(258);
  });

  test("readBytes copies and advances; skip/seek move position", () => {
    const c = new Cursor(buf([10, 20, 30, 40]));
    expect([...c.readBytes(2)]).toEqual([10, 20]);
    c.skip(1);
    expect(c.pos).toBe(3);
    c.seek(0);
    expect([...c.readBytes(1)]).toEqual([10]);
  });
});

describe("Cursor bounds guards (M2 — a truncated read throws SavError, never a raw RangeError)", () => {
  test("readI32 past the buffer end throws SavError", () => {
    expect(() => new Cursor(buf([0, 0])).readI32()).toThrow(SavError); // 2 bytes, i32 needs 4
  });

  test("readF64 past the buffer end throws SavError", () => {
    expect(() => new Cursor(buf([0, 0, 0, 0])).readF64()).toThrow(SavError); // 4 bytes, f64 needs 8
  });

  test("readI64 past the buffer end throws SavError", () => {
    expect(() => new Cursor(buf([0, 0, 0, 0])).readI64()).toThrow(SavError); // 4 bytes, i64 needs 8
  });

  test("readBytes claiming more than remains throws SavError", () => {
    expect(() => new Cursor(buf([1, 2, 3])).readBytes(9)).toThrow(SavError);
  });

  test("seek outside the buffer (past end or negative) throws SavError", () => {
    const c = new Cursor(buf([1, 2, 3, 4]));
    expect(() => c.seek(5)).toThrow(SavError);
    expect(() => c.seek(-1)).toThrow(SavError);
  });
});
