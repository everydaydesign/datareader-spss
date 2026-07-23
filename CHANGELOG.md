# Changelog

All notable changes to `@easypls/datareader-spss` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this package uses semantic versioning.

## 0.2.1 — 2026-07-23

### Fixed

- **A malformed very-long-string width no longer hangs the parser (denial of service).** A subtype-14
  record declaring a width of `0`, a negative number, or a non-numeric token made the segment count
  `ceil(width/252)` collapse to `0`/`NaN`, so the dictionary walk never advanced and looped forever,
  growing memory without bound until the process (or browser tab) crashed. Because it was a hang and
  not a throw, `try/catch` around `readSav` offered no protection. Such a width is now rejected with a
  catchable `SavError`, and the walk is guaranteed to advance by at least one. Surfaced by an
  automated security scan.

## 0.2.0 — 2026-07-18

Turns several silent-misparse and raw-`RangeError` classes into clear, catchable `SavError`s, and
decodes non-Latin text correctly. One **behavior change** (M1, marked below) affects files in a
codepage the runtime can't decode; pin `0.1.x` if you depend on the old force-mapped behavior.

### Fixed

- **Declared charset is decoded correctly instead of mojibake (behavior change).** The file's
  subtype-20 encoding is now passed straight to the platform `TextDecoder` rather than collapsed onto
  one of three fixed labels — so a Japanese/Chinese file (shift_jis, gbk, big5, euc-jp) decodes to the
  right characters. A label the runtime can't decode (e.g. windows-1251 under Bun, or a corrupt label)
  now throws a `SavError` rather than silently producing wrong letters. What resolves depends on the
  runtime: Node (full ICU) handles every WHATWG label; Bun handles UTF-8/16, windows-1252/latin1, and
  the CJK pages, but not single-byte non-Latin pages like windows-1251/koi8-r (see README → Security &
  limits). A file that previously "read" with wrong Cyrillic now fails loud.
- **Truncated reads throw `SavError`, never a raw `RangeError`.** Every `Cursor` read (`i32`, `f64`,
  `i64`, `bytes`) and `seek` now bounds-checks against the file length before touching the `DataView`,
  so a header/dictionary/trailer that ends mid-field is rejected as a catchable `SavError` instead of
  surfacing an uncatchable `RangeError` past the error contract. Includes a too-short subtype-4
  (machine floating-point) record, which previously read its sysmis `f64` past its payload.
- **Invalid byte-order probe rejected.** A `layout_code` that reads as neither 2 nor 3 in either byte
  order (a corrupt header) is now rejected up front, instead of defaulting to big-endian and flipping
  the whole parse into nonsense downstream.
- **Very-long-string segment shortfall rejected.** When a subtype-14 record declares a string wider
  than its segment records provide, the reader previously consumed the following variable as a phantom
  segment and silently dropped it; the mismatch now throws a `SavError`.

### Changed

- **`DEFAULT_LIMITS.maxCells` documented.** Noted why it is 10× the sibling csv/excel readers' default
  (`.sav` is a statistical format where wide, tall matrices are routine); a memory-tight consumer
  passes its own `maxCells`.

## 0.1.3

- Correct, zero-dependency `.sav`/`.zsav` reader — RLE + ZSAV (zlib) decompression, very-long strings,
  SPSS date/time → `Date`, numeric/string value labels, every missing-value kind, resource ceilings,
  and a suite validated value-for-value against R `haven` plus an adversarial fuzz gate.
