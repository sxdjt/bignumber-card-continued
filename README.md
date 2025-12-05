# Big Number Card - Continued

IMPORTANT: This is a community-maintained continuation of the original [bignumber-card](https://github.com/custom-cards/bignumber-card) by [@ciotlosm](https://github.com/ciotlosm), which has not been actively maintained since January 2022.

## About This Continuation

This project maintains the original functionality while incorporating bug fixes and community-requested features. The original authors deserve full credit for the excellent foundation they created.

## What's Changed

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## Original Documentation

A simple card to display big numbers for sensors. It also supports severity levels as background.

![bignumber](https://user-images.githubusercontent.com/7738048/42536247-262b74e0-849a-11e8-8ed1-967302b73e03.gif)

## Installation

### HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Go to "Frontend"
3. Click the three dots menu and select "Custom repositories"
4. Add this repository URL with category "Lovelace"
5. Find "Big Number Card - Continued" and install it
6. Restart Home Assistant

### Manual Installation

1. Download `bignumber-card.js` from the latest release
2. Copy it to your `config/www` folder
3. Add the resource reference to your Lovelace configuration:
   ```yaml
   resources:
     - url: /local/bignumber-card.js
       type: module
   ```
4. Restart Home Assistant

## Configuration Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:bignumber-card`
| title | string | optional | Name to display on card
| scale | string | 50px | Base scale for card: '50px'
| entity | string | **Required** | `sensor.my_temperature`
| attribute | string | optional | the entity attribute you want to display e.g. `current_temperature`.  The entity state will be shown if not defined.
| min | number | optional | Minimum value. If specified you get bar display
| max | number | optional | Maximum value. Must be specified if you added min
| color | string | `var(--primary-text-color)` | Default font color. Can be either hex or HA variable. Example: 'var(--secondary-text-color)'
| bnStyle | string| `var(--label-badge-blue)` | Default bar color. Can be either hex or HA variable. Example: 'var(--label-badge-green)'
| from | string | left | Direction from where the bar will start filling (must have min/max specified)
| severity | list | optional | A list of severity objects. Items in list must be ascending based on 'value'
| hideunit | boolean | optional | hide the unit of measurement if set to true. If absent, unit of measurement will be shown
| noneString | string | optional | String to use for value if value == None
| noneCardClass | string | optional | CSS class to add to card if value == None
| noneValueClass | string | optional | CSS class to add to value if value == None
| round | int | optional | Number of decimals to round to. (If not present, do not round.)
| title_font_size | string | optional | NEW: Custom font size for title (e.g., "14px", "1rem"). Overrides scale-based sizing
| value_font_size | string | optional | NEW: Custom font size for value (e.g., "30px", "2rem"). Overrides scale-based sizing
| card_padding | string | optional | NEW: Custom card padding (e.g., "20px 10px"). Allows independent height control
| tap_action | object | `{action: 'more-info'}` | NEW: Action to perform on tap. See Tap Action Object below

### Severity Object

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| value | number | **Required** | Value until which to use this severity
| bnStyle | string | **Required** | Color of severity. Can be either hex or HA variable. Example: 'var(--label-badge-green)'
| color | string | `var(--primary-text-color)` | Font color of the severity. Can be either hex or HA variable. Example: 'var(--secondary-text-color)'

### Tap Action Object

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| action | string | `more-info` | Action type: `more-info`, `toggle`, `call-service`, `navigate`, `url`, `none`
| navigation_path | string | optional | Path to navigate to (e.g., `/lovelace/1`) when action is `navigate`
| url_path | string | optional | URL to open when action is `url`
| service | string | optional | Service to call when action is `call-service` (e.g., `light.turn_on`)
| service_data | object | optional | Service data to pass when action is `call-service`

### Important Notes

- Numbers are automatically formatted with locale-aware thousands separators (e.g., 19,578 in US, 19.578 in German)
- Font sizes can be customized independently from the `scale` parameter for better layout control

- Make sure you use ascending object values to have consistent behaviour
- Values are the upper limit until which that severity is applied
- Note there is a **breaking change** from the original. In order to add the flexibility of using [card-mod](https://github.com/thomasloven/lovelace-card-mod) styling, the `style` configuration options have been changed to `bnStyle`.

## Examples

### Basic Example with Severity

```yaml
- type: custom:bignumber-card
  title: Humidity
  entity: sensor.outside_humidity
  scale: 30px
  from: bottom
  min: 0
  max: 100
  hideunit: true
  color: '#000000'
  bnStyle: 'var(--label-badge-blue)'
  severity:
    - value: 70
      bnStyle: 'var(--label-badge-green)'
    - value: 90
      bnStyle: 'var(--label-badge-yellow)'
    - value: 100
      bnStyle: 'var(--label-badge-red)'
      color: '#FFFFFF'
```

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
  color: '#000000'
  bnStyle: 'var(--label-badge-blue)'
  severity:
    - value: 70
      bnStyle: 'var(--label-badge-green)'
    - value: 90
      bnStyle: 'var(--label-badge-yellow)'
    - value: 100
      bnStyle: 'var(--label-badge-red)'
      color: '#FFFFFF'
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

Disable tap action:

```yaml
- type: custom:bignumber-card
  title: Read Only
  entity: sensor.outdoor_humidity
  tap_action:
    action: none
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Credits

Original card created by [@ciotlosm](https://github.com/ciotlosm) and contributors to [custom-cards/bignumber-card](https://github.com/custom-cards/bignumber-card).

This continuation is maintained by the community to keep the card compatible with modern Home Assistant versions.

## License

Apache-2.0 License - See [LICENSE](LICENSE) file for details
