import { describe, expect, test } from "bun:test";
import { Cursor } from "../src/sav/binary.ts";
import { readVariableRecord, decodeFormat, decodeMissing } from "../src/sav/variable.ts";

const DEC = new TextDecoder("utf-8");
type VarBodyOpts = {
  hasLabel?: boolean;
  label?: string;
  miss?: number[];
  name: string;
  nMiss?: number;
  print?: number;
  type: number;
};

/** Little-endian int32 as a byte array. */
function i32(n: number): number[] {
  const b = new ArrayBuffer(4);
  new DataView(b).setInt32(0, n, true);
  return [...new Uint8Array(b)];
}

function varHead(opts: VarBodyOpts): number[] {
  return [
    ...i32(opts.type),
    ...i32(opts.hasLabel ? 1 : 0),
    ...i32(opts.nMiss ?? 0),
    ...i32(opts.print ?? 0),
    ...i32(opts.print ?? 0),
  ];
}

function labelBytes(opts: VarBodyOpts): number[] {
  if (!opts.hasLabel || opts.label === undefined) return [];
  const enc = new TextEncoder().encode(opts.label);
  const padded = Math.ceil(enc.length / 4) * 4;
  return [...i32(enc.length), ...enc, ...new Array(padded - enc.length).fill(0)];
}

function missingBytes(miss: number[]): number[] {
  const out: number[] = [];
  for (const m of miss) {
    const b = new ArrayBuffer(8);
    new DataView(b).setFloat64(0, m, true);
    out.push(...new Uint8Array(b));
  }
  return out;
}

// helper builds a type-2 body (WITHOUT the leading rec_type int, which the loop consumes)
function varBody(opts: VarBodyOpts): ArrayBuffer {
  const name = opts.name.padEnd(8, " ").slice(0, 8);
  const parts: number[] = [
    ...varHead(opts),
    ...new TextEncoder().encode(name),
    ...labelBytes(opts),
    ...missingBytes(opts.miss ?? []),
  ];
  return new Uint8Array(parts).buffer;
}

describe("readVariableRecord", () => {
  test("numeric variable, no label, no missing", () => {
    const v = readVariableRecord(new Cursor(varBody({ name: "id", type: 0 })), DEC);
    expect(v).not.toBe("continuation");
    if (v !== "continuation") {
      expect(v.name).toBe("id");
      expect(v.type).toBe(0);
      expect(v.missing.kind).toBe("none");
    }
  });
  test("continuation record returns 'continuation'", () => {
    expect(readVariableRecord(new Cursor(varBody({ name: "", type: -1 })), DEC)).toBe(
      "continuation",
    );
  });
  test("variable label is read and 4-byte padded", () => {
    const v = readVariableRecord(
      new Cursor(varBody({ hasLabel: true, label: "My var", name: "x", type: 0 })),
      DEC,
    );
    if (v !== "continuation") expect(v.label).toBe("My var");
  });
  test("range missing (n=-2) → range spec", () => {
    const v = readVariableRecord(
      new Cursor(varBody({ miss: [1, 9], name: "q", nMiss: -2, type: 0 })),
      DEC,
    );
    if (v !== "continuation") expect(v.missing).toEqual({ hi: 9, kind: "range", lo: 1 });
  });
  test("discrete missing (n=2) → discrete spec", () => {
    const v = readVariableRecord(
      new Cursor(varBody({ miss: [98, 99], name: "q", nMiss: 2, type: 0 })),
      DEC,
    );
    if (v !== "continuation") expect(v.missing).toEqual({ kind: "discrete", values: [98, 99] });
  });
});

describe("decodeFormat / decodeMissing", () => {
  test("packed format int → {type,width,decimals}", () => {
    // byte0 decimals=2, byte1 width=8, byte2 type=5 → 0x00050802
    expect(decodeFormat(0x00050802)).toMatchObject({ decimals: 2, type: 5, width: 8 });
  });
  test("range+discrete (n=-3)", () => {
    expect(decodeMissing(-3, [1, 9, 99])).toEqual({
      hi: 9,
      kind: "range+discrete",
      lo: 1,
      value: 99,
    });
  });
});
