# Changelog

All notable changes to `datareader-spss` are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] — 2026-07-11

### Fixed
- Malformed `.sav` input no longer crashes: a data row with more cells than declared variables
  leaves the extra cells as-is instead of dereferencing an undefined variable spec.
- Missing-value range / range-and-discrete underflow now raises a clean `SavError` instead of
  producing undefined bounds.

### Changed
- Internal: non-null assertions for structurally-bounded indexing (`noUncheckedIndexedAccess`-safe).
  Pure type-safety — no API or parsed-output change.

## [0.1.2] — 2026-07-09

### Changed
- Docs: Roadmap cleanup.

## [0.1.1] — 2026-07-09

### Added
- Docs: Roadmap (big-endian, `.por`, writing).

## [0.1.0] — 2026-07-09

### Added
- Initial release: zero-dependency SPSS `.sav`/`.zsav` reader for the browser and Node,
  validated value-for-value against R `haven`.

[0.1.3]: https://github.com/everydaydesign/datareader-spss/releases/tag/v0.1.3
[0.1.2]: https://github.com/everydaydesign/datareader-spss/releases/tag/v0.1.2
[0.1.1]: https://github.com/everydaydesign/datareader-spss/releases/tag/v0.1.1
[0.1.0]: https://github.com/everydaydesign/datareader-spss/releases/tag/v0.1.0
