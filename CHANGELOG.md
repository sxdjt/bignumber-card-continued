# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-continued] - 2025-12-15

### Added
- Locale-aware number formatting with automatic thousands separators (PR #46)
  - Uses browser locale for formatting (e.g., 19,578 in US, 19.578 in German)
  - Respects existing `round` configuration for decimal precision
  - Fully automatic, no configuration needed
- Customizable font sizes and padding (PR #47)
  - New `title_font_size` option for independent title sizing
  - New `value_font_size` option for independent value sizing
  - New `card_padding` option for height control separate from fonts
  - Allows small cards with large fonts or vice versa
- Configurable tap actions (PR #48)
  - Support for standard Home Assistant tap action patterns
  - Actions: `more-info` (default), `toggle`, `call-service`, `navigate`, `url`, `none`
  - Fully backwards compatible (defaults to more-info)
  - Enables public dashboards, custom navigation, and service calls
- Configurable custom unit display
  - New `unit` option to override entity's `unit_of_measurement`
  - Leave unset to use entity's default unit
  - Set to empty string `""` to display no unit
  - Examples: `unit: " %"`, `unit: " pancakes/hour"`, `unit: "°F"`

### Fixed
- None/NaN detection bug now checks numeric value instead of formatted string (PR #46)
- Fixed typo: `nonestring` → `noneString` for consistent property naming
- Added error handling for missing/undefined entities to prevent crashes
- Card now logs warning and gracefully handles non-existent entities

### Changed
- Project forked as community continuation from [custom-cards/bignumber-card](https://github.com/custom-cards/bignumber-card)
- Updated README with continuation notice and comprehensive documentation
- Renamed to "Big Number Card - Continued" for HACS distribution
- Added extensive code comments for maintainability

### Maintained from Original v0.0.6 (2022-01-31)
- Display large sensor values with customizable styling
- Severity-based background colors
- Progress bar visualization with min/max values
- Support for entity attributes
- Handling of None/offline states with custom text and styling
- Configurable scale, colors, and opacity

## Original Project History

The following versions were created by the original authors at [custom-cards/bignumber-card](https://github.com/custom-cards/bignumber-card):

### [0.0.6] - 2022-01-31
- Last release from original maintainers

### [0.0.5] and earlier
- See original repository for complete history: https://github.com/custom-cards/bignumber-card

## Attribution

Original card created by [@ciotlosm](https://github.com/ciotlosm) and contributors. This continuation maintains their excellent work while adding community improvements.
