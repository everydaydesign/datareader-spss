import type { Format } from "../src/index.ts";

import { describe, expect, test } from "bun:test";

describe("scaffold", () => {
  test("types import and the basic fixture exists", async () => {
    const f = Bun.file(new URL("../oracle/fixtures/basic.sav", import.meta.url).pathname);
    expect(await f.exists()).toBe(true);
    const format: Format = "sav"; // types resolve
    expect(format).toBe("sav");
  });
});
