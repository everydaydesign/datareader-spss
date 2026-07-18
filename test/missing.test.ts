import type { Sheet, Variable } from "../src/index.ts";

import { describe, expect, test } from "bun:test";

import { applyUserMissing } from "../src/missing.ts";

function numVar(name: string, missing: Variable["missing"]): Variable {
  return {
    format: { decimals: 0, isDate: false, type: 5, width: 8 },
    measure: "scale",
    missing,
    name,
    type: "numeric",
  };
}

function strVar(name: string, missing: Variable["missing"]): Variable {
  return {
    format: { decimals: 0, isDate: false, type: 1, width: 8 },
    measure: "nominal",
    missing,
    name,
    type: "string",
  };
}

describe("applyUserMissing", () => {
  test("discrete numeric missing → null, others unchanged", () => {
    const sheet: Sheet = {
      name: "s",
      rows: [[1], [99], [2]],
      variables: [numVar("a", { kind: "discrete", values: [99] })],
    };
    const out = applyUserMissing(sheet);
    expect(out.rows).toEqual([[1], [null], [2]]);
  });

  test("range missing is inclusive at both boundaries", () => {
    const sheet: Sheet = {
      name: "s",
      rows: [[0], [1], [5], [9], [10]],
      variables: [numVar("a", { hi: 9, kind: "range", lo: 1 })],
    };
    const out = applyUserMissing(sheet);
    expect(out.rows).toEqual([[0], [null], [null], [null], [10]]);
  });

  test("range+discrete: in range OR equals value", () => {
    const sheet: Sheet = {
      name: "s",
      rows: [[0], [5], [99], [98]],
      variables: [numVar("a", { hi: 9, kind: "range+discrete", lo: 1, value: 99 })],
    };
    const out = applyUserMissing(sheet);
    expect(out.rows).toEqual([[0], [null], [null], [98]]);
  });

  test("string missing → null when value ∈ values", () => {
    const sheet: Sheet = {
      name: "s",
      rows: [["ok"], ["NA"], ["?"], [""]],
      variables: [strVar("a", { kind: "strings", values: ["NA", "?"] })],
    };
    const out = applyUserMissing(sheet);
    expect(out.rows).toEqual([["ok"], [null], [null], [""]]);
  });

  test("kind 'none' leaves the column unchanged", () => {
    const sheet: Sheet = {
      name: "s",
      rows: [[1], [99], [2]],
      variables: [numVar("a", { kind: "none" })],
    };
    const out = applyUserMissing(sheet);
    expect(out.rows).toEqual([[1], [99], [2]]);
  });

  test("Date and existing null cells are never matched", () => {
    const d = new Date("2020-01-01T00:00:00Z");
    const sheet: Sheet = {
      name: "s",
      rows: [[d], [null], [5]],
      variables: [numVar("a", { hi: 9, kind: "range", lo: 1 })],
    };
    const out = applyUserMissing(sheet);
    expect(out.rows).toEqual([[d], [null], [null]]);
    expect(out.rows[0]![0]).toBe(d);
  });

  test("does not mutate the input sheet, its rows, or its inner arrays", () => {
    const inner = [1, 99];
    const rows = [inner];
    const sheet: Sheet = {
      name: "s",
      rows,
      variables: [numVar("a", { kind: "none" }), numVar("b", { kind: "discrete", values: [99] })],
    };
    const out = applyUserMissing(sheet);
    // input untouched
    expect(sheet.rows).toBe(rows);
    expect(sheet.rows[0]).toBe(inner);
    expect(inner).toEqual([1, 99]);
    // output is a fresh sheet / rows / inner arrays
    expect(out).not.toBe(sheet);
    expect(out.rows).not.toBe(rows);
    expect(out.rows[0]).not.toBe(inner);
    expect(out.rows).toEqual([[1, null]]);
  });
});
