# Big Number Card - Continued

![GitHub Release](https://img.shields.io/github/v/release/sxdjt/bignumber-card-continued?style=for-the-badge)
[![AI Assisted](https://img.shields.io/badge/AI-Claude%20Code-AAAAAA.svg?style=for-the-badge)](https://claude.ai/code)
![GitHub License](https://img.shields.io/github/license/sxdjt/bignumber-card-continued?style=for-the-badge)

## About This Continuation

This is a community-maintained continuation of the original [bignumber-card](https://github.com/custom-cards/bignumber-card) by [@ciotlosm](https://github.com/ciotlosm). The original authors deserve full credit for the excellent foundation they created.

## Documentation

A simple card to display big numbers for sensors. It also supports severity levels as background.

<img width="1029" height="164" alt="Screenshot 2026-01-14 at 09 28 25" src="https://github.com/user-attachments/assets/a26b52f9-4164-459d-b32e-fd4feb2949ce" />

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=bignumber-card-continued)

## Configuration Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:bignumber-card`
| attribute | string | optional | the entity attribute you want to display e.g. `current_temperature`.  The entity state will be shown if not defined.
| background_color | string | `var(--card-background-color)` | Unfilled bar portion color. Can be a hex value, CSS color name (e.g. green), or HA variable
| card_padding | string | optional | Custom card padding (e.g., "20px 10px"). Allows independent height control
| entity | string | **Required** | `sensor.my_temperature`
| fill_color | string | `var(--label-badge-blue)` | Bar fill color. Can be a hex value, CSS color name (e.g. green), or HA variable. Example: `var(--label-badge-green)`
| from | string | left | Direction from where the bar will start filling (must have min/max specified)
| full_height | boolean | true | Fill the container height. Leave `true` for normal dashboard/grid/sections placement. Set `false` to size the card to its content when placing it in a `picture-elements` card. See [Picture Elements](#picture-elements)
| hideunit | boolean | optional | hide the unit of measurement if set to true. If absent, unit of measurement will be shown
| max | number | optional | Maximum value. Must be specified if you added min
| max_entity | string | optional | Entity whose value is used as the maximum, overriding `max`. Falls back to `max` if the entity is unavailable or non-numeric. See [Dynamic min/max](#dynamic-minmax)
| max_entity_attribute | string | optional | Attribute of `max_entity` to read instead of its state (e.g. `max_temp`). See [Dynamic min/max](#dynamic-minmax)
| min | number | optional | Minimum value. If specified you get bar display
| min_entity | string | optional | Entity whose value is used as the minimum, overriding `min`. Falls back to `min` if the entity is unavailable or non-numeric. See [Dynamic min/max](#dynamic-minmax)
| min_entity_attribute | string | optional | Attribute of `min_entity` to read instead of its state. See [Dynamic min/max](#dynamic-minmax)
| noneCardClass | string | optional | CSS class to add to card if value == None
| noneString | string | optional | String to use for value if value == None
| noneValueClass | string | optional | CSS class to add to value if value == None
| round | int | optional | Number of decimals to round to. (If not present, do not round.)
| scale | string | 50px | Base scale for card: '50px'
| severity | list | optional | A list of severity objects. Items in list must be ascending based on 'value'
| tap_action | object | `{action: 'more-info'}` | Action to perform on tap. See Tap Action Object below
| text_color | string | `var(--primary-text-color)` | Text color. Can be a hex value, CSS color name (e.g. green), or HA variable. Example: `var(--secondary-text-color)`
| title | string | optional | Name to display on card
| title_font_size | string | optional | Custom font size for title (e.g., "14px", "1rem"). Overrides scale-based sizing
| unit | string | optional | Custom unit to display instead of entity's unit_of_measurement. Leave unset to use entity unit. Set to empty string "" to force no unit. Examples: " %", " pancakes/hour", "°F"
| unit_font_size | string | optional | Custom font size for unit of measurement (e.g., "20px", "1em"). Overrides default small-tag sizing
| unit_position | string | `right` | Position of the unit relative to the value: `right` (default, e.g., `5.06 kWh`) or `left` (e.g., `£5.06`)
| use_grouping | boolean | true | Show locale-aware thousands separators (e.g. `19,578`). Set `false` to suppress grouping and display the raw digits (e.g. `19578`)
| value_font_size | string | optional | Custom font size for value (e.g., "30px", "2rem"). Overrides scale-based sizing

#### Deprecated Option Names (Still Supported)

For backwards compatibility, the following option names still work but the new names above are preferred:

| Deprecated | Use Instead |
| ---------- | ----------- |
| color | text_color |
| bnStyle | fill_color |

### Severity Object

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| value | number | **Required** | Value until which to use this severity
| fill_color | string | **Required** | Bar fill color. Can be a hex value, CSS color name (e.g. green), or HA variable. Example: `var(--label-badge-green)`
| background_color | string | inherited | Unfilled bar portion color. Can be a hex value, CSS color name (e.g. green), or HA variable
| text_color | string | `var(--primary-text-color)` | Text color. Can be a hex value, CSS color name (e.g. green), or HA variable. Example: `var(--secondary-text-color)`

The deprecated names `bnStyle` and `color` also work in severity objects for backwards compatibility.

### Tap Action Object

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| action | string | `more-info` | Action type: `more-info`, `toggle`, `call-service`, `navigate`, `url`, `none`
| navigation_path | string | optional | Path to navigate to (e.g., `/lovelace/1`) when action is `navigate`
| service | string | optional | Service to call when action is `call-service` (e.g., `light.turn_on`)
| service_data | object | optional | Service data to pass when action is `call-service`
| url_path | string | optional | URL to open when action is `url`

### Notes

- Numbers are automatically formatted with locale-aware thousands separators (e.g., 19,578 in US, 19.578 in German)
- Font sizes can be customized independently from the `scale` parameter for better layout control
- Make sure you use ascending object values to have consistent behaviour
- Values are the upper limit until which that severity is applied
- Any color option accepts a hex value (`#00FF00`), a standard CSS color name (`green`), or a Home Assistant theme variable (`var(--label-badge-green)`). See the [CSS color names reference](https://htmlcolorcodes.com/color-names/)
- In the visual editor, every color field (including per-severity fill/text colors) has a swatch color picker next to the text input for quick visual selection

## Examples

### Basic Example with Severity

```yaml
- type: custom:bignumber-card
  title: Humidity
  entity: sensor.outside_humidity
  from: bottom
  min: 0
  max: 100
  hideunit: true
  text_color: '#000000'
  fill_color: var(--label-badge-blue)
  severity:
    - value: 70
      fill_color: var(--label-badge-green)
    - value: 90
      fill_color: var(--label-badge-yellow)
    - value: 100
      fill_color: var(--label-badge-red)
      text_color: '#FFFFFF'
```

### Custom Background Color Example

Control the unfilled bar portion color globally or per-severity:

```yaml
- type: custom:bignumber-card
  title: VOC Level
  entity: sensor.voc_index
  min: 0
  max: 300
  from: bottom
  hideunit: true
  background_color: '#222222'
  severity:
    - value: 50
      fill_color: var(--label-badge-green)
    - value: 150
      fill_color: var(--label-badge-yellow)
      text_color: '#FF0000'
      background_color: '#333333'
    - value: 200
      fill_color: var(--label-badge-orange)
    - value: 300
      fill_color: var(--label-badge-red)
      background_color: '#440000'
```

### Dynamic min/max

Instead of hard-coding `min` and `max`, you can drive either bound from another
entity so the progress bar rescales automatically as that entity changes.

- Use `max_entity` / `min_entity` to source a bound from another entity's **state**.
- Use `max_entity_attribute` / `min_entity_attribute` to read a numeric **attribute**
  of that entity instead of its state. This is useful when the value you want is not
  the state itself - for example a `climate` entity whose state is `heat` but which
  exposes `max_temp` and `min_temp` attributes, or a `number` / `input_number` helper
  that exposes `max` and `min` attributes.

An entity-sourced bound overrides the matching static value. If the referenced entity
is unavailable or its value is not numeric, the card falls back to the static `max` /
`min` (if provided); if there is no static fallback, the progress bar is simply not drawn.
The bar updates whenever the displayed entity or a referenced bound entity changes.

Source the maximum from another sensor's state, with a static fallback:

```yaml
- type: custom:bignumber-card
  title: Power Draw
  entity: sensor.current_power
  min: 0
  max: 3000                     # fallback if sensor.power_budget is unavailable
  max_entity: sensor.power_budget
  from: left
```

Source both bounds from attributes of a climate entity:

```yaml
- type: custom:bignumber-card
  title: Thermostat
  entity: climate.living_room
  attribute: current_temperature
  min_entity: climate.living_room
  min_entity_attribute: min_temp
  max_entity: climate.living_room
  max_entity_attribute: max_temp
  from: bottom
```

### Using card-mod to display cover/background images

The card renders an inner background layer to support progress bar gradients and theme compatibility.  To use background images in the card, set `background_color: transparent`.  

### Handling None Values

If your sensor may result in `None` (for instance if it is offline), you may wish to handle that separately. Here is an example, which uses [card-mod](https://github.com/thomasloven/lovelace-card-mod) to add special styling for the `None` case.

```yaml
- type: custom:bignumber-card
  title: Humidity
  entity: sensor.outside_humidity
  scale: 30px
  from: bottom
  min: 0
  max: 100
  text_color: '#000000'
  fill_color: var(--label-badge-blue)
  severity:
    - value: 70
      fill_color: var(--label-badge-green)
    - value: 90
      fill_color: var(--label-badge-yellow)
    - value: 100
      fill_color: var(--label-badge-red)
      text_color: '#FFFFFF'
  noneString: Offline
  noneCardClass: none-card-class
  noneValueClass: none-value-class
  style: |
    .none-card-class {
      background-color: yellow;
    }
    .none-value-class {
      font-size: 22px !important;
    }
```

### Custom Font Sizes Example

Customize font sizes independently from card scale:

```yaml
- type: custom:bignumber-card
  title: Temperature
  entity: sensor.living_room_temperature
  scale: 30px
  title_font_size: 12px
  value_font_size: 48px
  card_padding: 15px 10px
```

### Picture Elements

When placing the card inside a `picture-elements` card, set `full_height: false`. A
`picture-elements` card positions each element absolutely over the image and gives it
no bounded height, so the card's default `height: 100%` would stretch it to the full
image height. Setting `full_height: false` sizes the card to its content instead.

Only card options (`scale`, `min`, `max`, `full_height`, ...) go at the element level;
the `style:` block is for CSS positioning only (`top`, `left`, ...).

```yaml
type: picture-elements
image: https://demo.home-assistant.io/stub_config/floorplan.png
elements:
  - type: custom:bignumber-card
    entity: sensor.tempest_humidity
    title: Luftfeuchtigkeit
    scale: 13px
    min: 0
    max: 100
    fill_color: var(--label-badge-blue)
    full_height: false
    style:
      top: 50%
      left: 32%
```

### Tap Action Examples

Toggle a light on tap:

```yaml
- type: custom:bignumber-card
  title: Power Usage
  entity: sensor.power_consumption
  tap_action:
    action: toggle
```

Navigate to another view:

```yaml
- type: custom:bignumber-card
  title: Temperature
  entity: sensor.outside_temperature
  tap_action:
    action: navigate
    navigation_path: /lovelace/climate
```

Call a service with data:

```yaml
- type: custom:bignumber-card
  title: Volume
  entity: sensor.media_volume
  tap_action:
    action: call-service
    service: media_player.volume_set
    service_data:
      entity_id: media_player.living_room
      volume_level: 0.5
```
## Contributing

Contributions are welcome! Please feel free to submit pull requests or [open an issue](https://github.com/sxdjt/bignumber-card-continued/issues) for bugs and feature requests.

## Credits

Original card created by [@ciotlosm](https://github.com/ciotlosm) and contributors to [custom-cards/bignumber-card](https://github.com/custom-cards/bignumber-card).

This continuation is maintained by the community to keep the card compatible with modern Home Assistant versions.

## License

This project is primarily licensed under the **MIT License**. 

However, to maintain compatibility with original contributions, it remains available under the **Apache License 2.0**. 

See the [LICENSE](LICENSE) file for full details.
