# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2026.9.3] - 2026-09-03

### Fixed
- Progress bar rendering with no color when the entity state is non-numeric, or when `min` equals `max` and the value sits exactly on that bound (issue #15). `_translatePercent()` returned `NaN` in both cases, which was written into the `--bignumber-percent` custom property as `NaN%`. That is not a valid `<percentage>`, so the `linear-gradient` was invalid at computed-value time and the browser discarded it, painting the card with no bar. This is the same visible symptom as the iOS bug fixed in 2026.8.4, reached by a different route, so the clamp added there did not catch it (`Math.min(100, Math.max(0, NaN))` is still `NaN`). A `NaN` result now falls back to an empty bar, consistent with the existing under-`min` convention. Out-of-range values, including a collapsed range where the value is off the bound, are unchanged - they still divide to +/-`Infinity`, which the clamp already resolves to a full or empty bar. The collapsed-range case is easiest to hit with `min_entity` / `max_entity`, where a referenced sensor can legitimately report `0` while the static bound is also `0` - for example a 3D printer's total-layer-count sensor between prints. Values in a normal range are unaffected.

## [2026.8.5] - 2026-08-05

### Added
- `display_entity` and `display_attribute` options to show one entity's value as the card's text while a different entity drives the progress bar (issue #12, requested by [@Scabattoir](https://github.com/Scabattoir)). Previously the displayed value and the bar value were always the same entity, so a template helper combining several values into one string (for example `26 / 81` for 3D printer layers) could be displayed but could not fill the bar, because the string is not numeric. Now `entity` supplies the bar value, severity thresholds, tap action, and None-state detection, while `display_entity` supplies only the text. A missing or unavailable `display_entity` falls back to displaying `entity`. Both options are also exposed in the visual editor under Display Options. Configs without `display_entity` are unaffected.

## [2026.8.4] - 2026-08-04

### Fixed
- Card rendering with no color at all on iOS/iPadOS when the entity's value falls outside the configured `min`/`max` range (upstream issue #7). The progress bar's gradient stop position was left unclamped, so a value well beyond `max` (for example `max: 1` with a state of `170`) produced a stop position of `-16900%`. WebKit discards a gradient with a stop that far out of range and paints the bare card background, while Blink and Gecko tolerate it - so the same dashboard looked correct on desktop and colorless on a phone. The position is now clamped to `0-100%`. Values inside `min`/`max` are unaffected, and out-of-range values render exactly as they already did on desktop (over `max` = completely full, under `min` = empty).

## [2026.7.28] - 2026-07-28

### Added
- `use_grouping` option (default `true`) to control locale-aware thousands separators. Set `use_grouping: false` to display raw digits without separators (e.g. `19578` instead of `19,578`). Also exposed as a "Thousands separators" toggle in the visual editor. Thanks to [@gridlockjoe](https://github.com/gridlockjoe) (PR #14).

## [2026.7.24] - 2026-07-24

### Fixed
- Card stretching to the full image height when placed in a `picture-elements` card (issue #13, reported by [@fridigit](https://github.com/fridigit)). A new `full_height` option (default `true`) preserves the existing fill-the-cell behavior in dashboard/grid/sections views; set `full_height: false` to size the card to its content, which is what `picture-elements` placements need. Also exposed as a "Fill container height" toggle in the visual editor.

## [2026.7.17] - 2026-07-17

### Added
- Color-picker swatch in the visual editor next to every color field (text, fill, background, and each severity level's fill/text colors). The text input remains the source of truth and still accepts hex, CSS color names, or theme variables; the swatch is a quick visual picker that writes a hex value.
- Help link to a CSS color names reference (htmlcolorcodes.com) in the editor's Colors and Severity notes.

### Changed
- Documented that all color options accept standard CSS color names (e.g. `green`) in addition to hex values and Home Assistant theme variables. (Named colors already worked at render time; this clarifies support and surfaces it in the editor.)

## [2026.7.6] - 2026-07-06

### Added
- Dynamic progress-bar bounds (issue #12, requested by [@Scabattoir](https://github.com/Scabattoir)):
  `max_entity` / `min_entity` source the bar's maximum / minimum from another entity's state, and
  `max_entity_attribute` / `min_entity_attribute` read a numeric attribute of that entity instead
  (e.g. a `climate` entity's `max_temp`). An entity-sourced bound overrides the matching static
  value and falls back to it when the entity is unavailable or non-numeric. The bar now
  also updates when a referenced bound entity changes, not only when the displayed entity does.

### Changed
- Switched to CalVer versioning (`YYYY.M.D`).

### Fixed
- Card picker preview was blank: `getStubConfig()` now accepts the `hass` object and selects a real sensor entity, preventing the `setConfig` entity-required error that silently killed the preview.

## [1.3.0] - 2026-06-04

### Added
- Card suggestion support for HA 2026.6+: the card now appears in the "Community" section of the card picker when the user selects a numeric entity (sensor with `unit_of_measurement` or `state_class`, `input_number`, `number`, or `counter`).

## [1.2.7] - 2026-05-13

### Fixed
- Replace deprecated `ha-textfield` with `ha-selector` in visual editor for compatibility with HA 2026.5.1+

## [1.2.6] - 2026-04-21

### Fixed
- Negative values that round to zero (e.g. `-0.0` or `-0.4` with `round: 0`) now display as `0`
  instead of `-0`. Fixes issue #10 reported by [@Yobby](https://github.com/Yobby).

## [1.2.5] - 2026-04-11

### Fixed
- Card now sizes correctly in the HA sections (grid) view. Two changes were required:
  1. Implemented `getGridOptions()` so HA knows the card's default grid dimensions
     (6 columns x 2 rows, resizable down to 3 columns x 1 row).
  2. Added `height: 100%` to `:host` and `ha-card`, with flexbox vertical centering,
     so the card fills the full height allocated by the grid cell.
  Previously, the card only implemented `getCardSize()` (masonry layout only) and had no
  height-fill CSS, causing it to shrink to content size regardless of the assigned row count.
  Fixes issue #9 reported by [@phil11c](https://github.com/phil11c).

## [1.2.4-continued] - 2026-03-05

### Added
- New `unit_font_size` option to independently control the unit of measurement font size
  - Accepts any CSS length value (e.g., `20px`, `1em`, `1.2rem`)
  - Overrides the default browser `<small>` tag sizing
  - Configurable in the visual editor under Sizing
  - Thanks to [@EdDickens](https://github.com/EdDickens) for raising this in issue #8

## [1.2.3-continued] - 2026-03-04

### Fixed
- Time and other mixed-format sensor values (e.g. "2:13 PM") now display correctly.
  Previously, `parseFloat()` was used to detect numeric values, which partially parsed
  strings like "2:13 PM" and returned only "2". Switched to `Number()`, which correctly
  returns NaN for non-numeric strings so the original value is displayed unchanged.

## [1.2.2-continued] - 2026-02-26

### Added
- New `unit_position` option to place the unit before the value instead of after
  - `unit_position: left` displays as `£5.06` instead of `5.06£`
  - `unit_position: right` (default) preserves existing behaviour
  - Useful for currency symbols and any prefix-style units
  - Configurable in the visual editor under Display Options

## [1.2.1-continued] - 2026-02-26

### Fixed
- Gradient background now works correctly with themes that use card-mod to override
  ha-card's background (e.g. Frosted Glass theme). The gradient was previously set
  directly on ha-card, which card-mod's async CSS injection would silently replace
  with `transparent`. The gradient is now rendered on an inner div that is unaffected
  by theme background overrides.

## [1.2.0-continued] - 2026-01-19

### Added
- Visual configuration editor for Home Assistant UI
  - Entity picker with autocomplete
  - All card options configurable without YAML
  - Collapsible sections for organized settings:
    - Basic Settings (entity, title)
    - Display Options (attribute, hide unit, decimal places, custom unit)
    - Colors (text color, fill color, background color, opacity)
    - Sizing (scale, value/title font sizes, card padding)
    - Progress Bar (min, max, fill direction)
    - None State Handling (display text, CSS classes)
    - Tap Action (all action types with conditional fields)
    - Severity Levels (add/remove/edit thresholds in UI)
  - Card preview updates in real-time as settings change

## [1.1.0-continued] - 2026-01-14

### Added
- New `background_color` option for unfilled bar portion
  - Can be set globally or per-severity condition
  - Defaults to card background color for backwards compatibility

### Changed
- Standardized color option names for clarity (backwards compatible)
  - `fill_color` replaces `bnStyle` (old name still works)
  - `text_color` replaces `color` (old name still works)
  - `background_color` for unfilled bar (new option)
- Internal CSS variables renamed for consistency:
  - `--bignumber-color` renamed to `--bignumber-text-color`

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
