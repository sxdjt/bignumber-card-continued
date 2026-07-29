/* Last modified: 24-Jul-2026 - 2026.7.24 */

console.info(
  `%c BIGNUMBER-CARD-CONTINUED %c 2026.7.24 `,
  'color: black; background: #F2720C; font-weight: 600;',
  'color: black; background: #00a5c9; font-weight: 600;'
);

class BigNumberCard extends HTMLElement {
  _DEFAULT_STYLE(){return 'var(--label-badge-blue)';}
  _DEFAULT_COLOR(){return 'var(--primary-text-color)';}

  static getConfigElement() {
    return document.createElement('bignumber-card-editor');
  }

  static getStubConfig(hass) {
    const entity = hass
      ? Object.keys(hass.states).find((id) => id.startsWith('sensor.'))
      : undefined;
    return {
      entity: entity || '',
      title: '',
      scale: '50px'
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }

    const root = this.shadowRoot;
    if (root.lastChild) root.removeChild(root.lastChild);
    const cardConfig = Object.assign({}, config);
    if (!cardConfig.scale) cardConfig.scale = "50px";
    if (!cardConfig.from) cardConfig.from = "left";
    if (!cardConfig.opacity) cardConfig.opacity = "0.5";
    if (!cardConfig.noneString) cardConfig.noneString = null;
    if (!cardConfig.noneCardClass) cardConfig.noneCardClass = null;
    if (!cardConfig.noneValueClass) cardConfig.noneValueClass = null;

    // NEW: Custom unit support
    // Allows overriding entity's unit_of_measurement for display
    // If undefined, falls back to entity attribute (original behavior)
    if (cardConfig.unit === undefined) cardConfig.unit = null;

    // Unit position: "right" (default) places unit after value, "left" places it before
    // Useful for currency symbols (e.g. £5.06 instead of 5.06£)
    if (!cardConfig.unit_position) cardConfig.unit_position = "right";

    // NEW: Custom font size support (PR #47 - issue #39)
    // Allows independent control of title and value font sizes separate from scale parameter
    // Defaults to null to maintain backwards compatibility with scale-based sizing
    if (!cardConfig.title_font_size) cardConfig.title_font_size = null;
    if (!cardConfig.value_font_size) cardConfig.value_font_size = null;

    // NEW: Custom card padding support (PR #47 - issue #39)
    // Decouples card height from font sizes for better layout control
    // Defaults to null to maintain backwards compatibility with scale-based padding
    if (!cardConfig.card_padding) cardConfig.card_padding = null;

    // NEW: Unit font size control (issue #8)
    // Overrides the default <small> tag sizing for the unit of measurement
    // Defaults to null (browser default for <small>, typically 0.83em of the value size)
    if (!cardConfig.unit_font_size) cardConfig.unit_font_size = null;

    // Standardized color option names with backwards compatibility
    // fill_color: Bar fill color (new name for bnStyle)
    // text_color: Text color (new name for color)
    // background_color: Unfilled bar portion color
    // Old names (bnStyle, color) still work for backwards compatibility
    if (!cardConfig.fill_color) cardConfig.fill_color = null;
    if (!cardConfig.text_color) cardConfig.text_color = null;
    if (!cardConfig.background_color) cardConfig.background_color = null;

    // NEW: Fill container height toggle (issue #13)
    // Default true keeps the height:100% fill behavior needed in sections/grid view.
    // Set false to size the card to its content, required when placed in a
    // picture-elements card (which has no bounded parent height, so height:100%
    // would otherwise stretch the card to the full image height).
    if (cardConfig.full_height === undefined) cardConfig.full_height = true;

    // NEW: Tap action support (PR #48 - issue #41)
    // Defaults to more-info to maintain backwards compatibility with existing behavior
    if (!cardConfig.tap_action) {
      cardConfig.tap_action = { action: 'more-info' };
    }

    this.isNoneConfig = Boolean(cardConfig.noneString || cardConfig.noneCardClass || cardConfig.noneValueClass)

    const card = document.createElement('ha-card');
    // Gradient background is on a separate div, not on ha-card itself.
    // Some themes (e.g. Frosted Glass via card-mod) set ha-card { background: transparent }
    // asynchronously, which would wipe out a gradient placed directly on ha-card.
    // Using an inner div means the gradient is unaffected by theme background overrides.
    const bg = document.createElement('div');
    bg.id = "bg";
    const content = document.createElement('div');
    content.id = "value"
    const title = document.createElement('div');
    title.id = "title"
    title.textContent = cardConfig.title;

    // NEW: Calculate font sizes and padding with user overrides (PR #47 - issue #39)
    // If user provides custom values, use them; otherwise fall back to scale-based defaults
    // This allows users to set small card heights with large fonts, or vice versa
    const valueFontSize = cardConfig.value_font_size || 'calc(var(--base-unit) * 1.3)';
    const titleFontSize = cardConfig.title_font_size || 'calc(var(--base-unit) * 0.5)';
    const cardPadding = cardConfig.card_padding || 'calc(var(--base-unit)*0.6) calc(var(--base-unit)*0.3)';

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        height: ${cardConfig.full_height ? '100%' : 'auto'};
      }
      ha-card {
        text-align: center;
        position: relative;
        overflow: hidden;
        height: ${cardConfig.full_height ? '100%' : 'auto'};
        display: flex;
        flex-direction: column;
        justify-content: center;
        --bignumber-text-color: ${this._getTextColor(null, cardConfig)};
        --bignumber-fill-color: ${this._getFillColor(null, cardConfig)};
        --bignumber-background-color: ${this._getBackgroundColor(null, cardConfig)};
        --bignumber-percent: 100%;
        --bignumber-direction: ${cardConfig.from};
        --base-unit: ${cardConfig.scale};
        padding: ${cardPadding};
      }
      #bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        border-radius: inherit;
        background: linear-gradient(to var(--bignumber-direction), var(--bignumber-background-color) var(--bignumber-percent), var(--bignumber-fill-color) var(--bignumber-percent));
      }
      #value {
        font-size: ${valueFontSize};
        line-height: ${valueFontSize};
        color: var(--bignumber-text-color);
        position: relative;
        z-index: 1;
      }
      #value small{opacity: ${cardConfig.opacity}${cardConfig.unit_font_size ? `; font-size: ${cardConfig.unit_font_size}` : ''}}
      #title {
        font-size: ${titleFontSize};
        line-height: ${titleFontSize};
        color: var(--bignumber-text-color);
        position: relative;
        z-index: 1;
      }
    `;
    card.appendChild(bg);
    card.appendChild(content);
    card.appendChild(title);
    card.appendChild(style);

    // NEW: Handle tap actions (PR #48 - issue #41)
    // Replaces hardcoded more-info with configurable tap action handler
    card.addEventListener('click', event => {
      this._handleTapAction(cardConfig.tap_action, cardConfig.entity);
    });

    root.appendChild(card);
    this._config = cardConfig;
  }

  _fire(type, detail, options) {
    const node = this.shadowRoot;
    options = options || {};
    detail = (detail === null || detail === undefined) ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
  }

  // NEW: Handle tap actions (PR #48 - issue #41)
  // Implements standard Home Assistant tap action behaviors:
  // - more-info: Show entity history popup (default)
  // - toggle: Toggle the entity state
  // - call-service: Call a Home Assistant service
  // - navigate: Navigate to a Lovelace view
  // - url: Open an external URL
  // - none: Do nothing (disable tap action)
  _handleTapAction(actionConfig, entityId) {
    if (!actionConfig || actionConfig.action === 'none') {
      return;
    }

    switch (actionConfig.action) {
      case 'more-info':
        this._fire('hass-more-info', { entityId: entityId });
        break;

      case 'toggle':
        this._toggleEntity(entityId);
        break;

      case 'call-service':
        if (actionConfig.service) {
          this._callService(actionConfig.service, actionConfig.service_data);
        }
        break;

      case 'navigate':
        if (actionConfig.navigation_path) {
          window.history.pushState(null, '', actionConfig.navigation_path);
          this._fire('location-changed', { replace: false });
        }
        break;

      case 'url':
        if (actionConfig.url_path) {
          window.open(actionConfig.url_path);
        }
        break;

      default:
        // Fall back to more-info for unknown actions
        this._fire('hass-more-info', { entityId: entityId });
    }
  }

  // NEW: Toggle entity helper (PR #48 - issue #41)
  // Calls the appropriate toggle service based on entity domain
  _toggleEntity(entityId) {
    const domain = entityId.split('.')[0];
    this._callService(`${domain}.toggle`, { entity_id: entityId });
  }

  // NEW: Call service helper (PR #48 - issue #41)
  // Fires the call-service event to Home Assistant
  _callService(service, serviceData) {
    const [domain, serviceAction] = service.split('.');
    this._fire('hass-call-service', {
      service: serviceAction,
      domain: domain,
      service_data: serviceData || {}
    });
  }

  _computeSeverity(stateValue, sections) {
    if (stateValue === undefined || stateValue === null) return;
    const numberValue = Number(stateValue);
    for (const section of sections) {
      if (numberValue <= section.value) return section;
    }
  }

  _getTextColor(entityState, config) {
    if (config.severity) {
      const severity = this._computeSeverity(entityState, config.severity);
      // Check new name first, fall back to old name for backwards compatibility
      if (severity && (severity.text_color || severity.color)) {
        return severity.text_color || severity.color;
      }
    }
    // Check new name first, fall back to old name for backwards compatibility
    if (config.text_color || config.color) {
      return config.text_color || config.color;
    }
    return this._DEFAULT_COLOR();
  }

  _getFillColor(entityState, config) {
    if (config.severity) {
      const severity = this._computeSeverity(entityState, config.severity);
      // Check new name first, fall back to old name (bnStyle) for backwards compatibility
      if (severity && (severity.fill_color || severity.bnStyle)) {
        return severity.fill_color || severity.bnStyle;
      }
    }
    // Check new name first, fall back to old name (bnStyle) for backwards compatibility
    if (config.fill_color || config.bnStyle) {
      return config.fill_color || config.bnStyle;
    }
    return this._DEFAULT_STYLE();
  }

  _getBackgroundColor(entityState, config) {
    if (config.severity) {
      const severity = this._computeSeverity(entityState, config.severity);
      if (severity && severity.background_color) return severity.background_color;
    }
    if (config.background_color) return config.background_color;
    return 'var(--card-background-color)';
  }

  _translatePercent(value, min, max) {
    return 100-100 * (value - min) / (max - min);
  }

  // NEW: Resolve a dynamic progress-bar bound (issue #12).
  // A bound (min or max) can be a static number OR sourced from another entity.
  // - boundEntityId: if set, the number is read from that entity.
  // - boundAttribute: if set, read that attribute of boundEntityId instead of its state
  //   (e.g. a climate entity's max_temp attribute, since its state is "heat", not a number).
  // Precedence: a valid numeric value from the referenced entity wins; otherwise fall
  // back to the static value. Returns a Number, or undefined if nothing usable is
  // configured (undefined disables the bar, matching the original behavior).
  _resolveBound(hass, staticValue, boundEntityId, boundAttribute) {
    if (boundEntityId) {
      const boundEntity = hass.states[boundEntityId];
      if (boundEntity) {
        const raw = boundAttribute ? boundEntity.attributes[boundAttribute] : boundEntity.state;
        const numeric = Number(raw);
        if (!isNaN(numeric)) return numeric;
      }
      // Referenced entity is missing or non-numeric: fall through to the static fallback.
    }
    if (staticValue !== undefined && staticValue !== null) {
      const numericStatic = Number(staticValue);
      if (!isNaN(numericStatic)) return numericStatic;
    }
    return undefined;
  }

  // NEW: Format numbers with locale-aware thousands separators (PR #46 - issue #45)
  // Uses toLocaleString() for automatic locale-based formatting
  // Respects config.round setting for decimal precision
  _formatNumber(value, config) {
    // Use Number() instead of parseFloat() so strings like "2:13 PM" return NaN
    // (parseFloat stops at the first non-numeric char and returns a partial value)
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return value;
    }

    const options = {};
    if (config.use_grouping === false) {
      options.useGrouping = false;
    }
    if (config.round != null) {
      options.minimumFractionDigits = config.round;
      options.maximumFractionDigits = config.round;
    }

    // Pre-round so we can eliminate negative zero before formatting.
    // toLocaleString can produce "-0" when a negative value rounds to zero (e.g. -0.4 with round:0).
    const roundedValue = config.round != null
      ? parseFloat(numValue.toFixed(config.round))
      : numValue;

    // Object.is(-0, 0) is false, so this specifically targets -0 only.
    const normalizedValue = Object.is(roundedValue, -0) ? 0 : roundedValue;

    return normalizedValue.toLocaleString(undefined, options);
  }

  set hass(hass) {
    const config = this._config;
    const root = this.shadowRoot;

    // Check if entity exists to prevent crashes
    const entity = hass.states[config.entity];
    if (!entity) {
      console.warn(`BigNumberCard: Entity ${config.entity} not found`);
      return;
    }

    const entityState = config.attribute
      ? entity.attributes[config.attribute]
      : entity.state;
    // NEW: Support custom unit override
    // Priority: config.unit (if defined) → entity.attributes.unit_of_measurement → empty string
    const measurement = config.unit !== null ? config.unit : (entity.attributes.unit_of_measurement || "");

    // NEW: Resolve possibly-dynamic bounds every update (issue #12).
    // These may be sourced from another entity, so they are re-read on each hass
    // update rather than taken from the static config once.
    const min = this._resolveBound(hass, config.min, config.min_entity, config.min_entity_attribute);
    const max = this._resolveBound(hass, config.max, config.max_entity, config.max_entity_attribute);

    // The progress bar must react to a change in EITHER the displayed value or the
    // resolved bounds. A dynamic max/min entity can change while the displayed
    // entity's state is unchanged, so this is guarded independently of the
    // entityState check below (which gates color/text updates that only depend on state).
    if (entityState !== this._entityState || min !== this._min || max !== this._max) {
      if (min !== undefined && max !== undefined) {
        root.querySelector("ha-card").style.setProperty('--bignumber-percent', `${this._translatePercent(entityState, min, max)}%`);
      }
      this._min = min;
      this._max = max;
    }

    if (entityState !== this._entityState) {
      root.querySelector("ha-card").style.setProperty('--bignumber-fill-color', `${this._getFillColor(entityState, config)}`);
      root.querySelector("ha-card").style.setProperty('--bignumber-text-color', `${this._getTextColor(entityState, config)}`);
      root.querySelector("ha-card").style.setProperty('--bignumber-background-color', `${this._getBackgroundColor(entityState, config)}`);
      this._entityState = entityState
      // NEW: Use locale-aware formatting (PR #46 - issue #45)
      const numValue = parseFloat(entityState);
      let value = this._formatNumber(entityState, config);
      if (config.hideunit==true)
        { root.getElementById("value").textContent = `${value}`; }
      else {
        const unitHtml = `<small>${measurement}</small>`;
        root.getElementById("value").innerHTML = config.unit_position === 'left'
          ? `${unitHtml}${value}`
          : `${value}${unitHtml}`;
      }
      if (this.isNoneConfig){
        // NEW: Fixed None detection bug - check numeric value instead of formatted string (PR #46)
        if (isNaN(numValue)) {
          if (config.noneString) {
            root.getElementById("value").textContent = config.noneString;
          }
          if (config.noneCardClass) {
            root.querySelector("ha-card").classList.add(config.noneCardClass)
          }
          if (config.noneValueClass) {
            root.getElementById("value").classList.add(config.noneValueClass)
          }
        } else {
          root.querySelector("ha-card").classList.remove(config.noneCardClass)
          root.getElementById("value").classList.remove(config.noneValueClass)
        }
      }
    }
    root.lastChild.hass = hass;
  }

  getCardSize() {
    return 1;
  }

  // Sections view (grid layout) sizing - 12-column grid system
  getGridOptions() {
    return {
      rows: 2,
      columns: 6,
      min_rows: 1,
      min_columns: 3,
    };
  }
}

// Visual Editor for Big Number Card
// Uses ha-selector for text/number inputs and ha-selector for entity/select only
class BigNumberCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._rendered = false;
    // True while render() is running and immediately after, until the next
    // animation frame. Guards against spurious 'change' events that some
    // browsers fire on native <select> elements when they are first connected
    // to a shadow DOM - which would otherwise trigger _fireConfigChanged().
    this._initializing = false;
  }

  setConfig(config) {
    this._config = { ...config };
    // Only render once initially, not on every config update from HA
    // This prevents destroying DOM elements and losing focus
    if (!this._rendered) {
      this.render();
      this._rendered = true;
    }
  }

  set hass(hass) {
    this._hass = hass;
    // Update all ha-selector elements (entity picker, text, number) with hass reference
    this.shadowRoot?.querySelectorAll('ha-selector').forEach(s => {
      s.hass = hass;
    });
  }

  _fireConfigChanged() {
    // Blocked during render() initialization to prevent spurious events
    // from native <select> DOM connection from polluting the config stream.
    if (this._initializing) return;
    const event = new CustomEvent('config-changed', {
      bubbles: true,
      composed: true,
      detail: { config: this._config }
    });
    this.dispatchEvent(event);
  }

  _valueChanged(field, value) {
    if (field.startsWith('tap_action.')) {
      const subField = field.replace('tap_action.', '');
      const newTapAction = { ...(this._config.tap_action || { action: 'more-info' }) };
      if (value === '' || value === undefined) {
        delete newTapAction[subField];
      } else {
        newTapAction[subField] = value;
      }
      this._config = { ...this._config, tap_action: newTapAction };
      // Re-render only for action type changes (shows/hides conditional fields)
      if (subField === 'action') {
        this._rendered = false;
        this.render();
        this._rendered = true;
        // render() sets _initializing=true to suppress spurious select events,
        // but this config change is a real user action - fire it unconditionally.
        this._initializing = false;
      }
    } else {
      if (value === '' || value === undefined) {
        const newConfig = { ...this._config };
        delete newConfig[field];
        this._config = newConfig;
      } else {
        this._config = { ...this._config, [field]: value };
      }
    }
    this._fireConfigChanged();
  }

  _createTextfield(field, label, value, helperText, type = 'text') {
    const container = document.createElement('div');
    container.className = 'field';

    const selector = document.createElement('ha-selector');
    selector.hass = this._hass;
    selector.label = label;
    if (type === 'number') {
      selector.selector = { number: { mode: 'box', step: 1 } };
    } else {
      selector.selector = { text: {} };
    }
    selector.value = value ?? '';
    selector.addEventListener('value-changed', (e) => {
      e.stopPropagation();
      const newValue = type === 'number' ?
        (e.detail.value === '' ? undefined : Number(e.detail.value)) :
        e.detail.value;
      this._valueChanged(field, newValue);
    });

    container.appendChild(selector);
    return container;
  }

  // Resolve any CSS color string (named color like "green", hex, rgb(), or a
  // theme var()) to a "#rrggbb" hex value suitable for <input type="color">.
  // Returns null when the browser cannot resolve it to a concrete color
  // (e.g. an invalid string, or a var() whose theme variable is not defined in
  // this context). Callers should leave the swatch at its default when null.
  _resolveColorToHex(value) {
    if (!value) return null;
    // Use a detached probe element to let the browser normalize the color.
    // It must be attached to the document so that var(--...) theme tokens
    // defined on :root have a chance to resolve.
    const probe = document.createElement('div');
    probe.style.color = '';
    probe.style.color = value;
    // If the browser rejected the value, style.color stays empty.
    if (!probe.style.color) return null;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color; // e.g. "rgb(0, 128, 0)"
    document.body.removeChild(probe);
    const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    const toHex = (component) => Number(component).toString(16).padStart(2, '0');
    return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
  }

  // Build a combined color input: a text field (the source of truth, which
  // accepts hex, CSS color names like "green", or var(--token)) paired with a
  // native color-picker swatch for quick visual selection. Picking from the
  // swatch writes a hex value; typing a resolvable color updates the swatch.
  // onChange(value) is called with the new string value on either interaction.
  _createColorInput(label, value, onChange) {
    const container = document.createElement('div');
    container.className = 'color-input';

    const selector = document.createElement('ha-selector');
    selector.hass = this._hass;
    selector.label = label;
    selector.selector = { text: {} };
    selector.value = value ?? '';

    const swatch = document.createElement('input');
    swatch.type = 'color';
    swatch.className = 'color-swatch';
    swatch.title = 'Pick a color';
    const initialHex = this._resolveColorToHex(value);
    if (initialHex) swatch.value = initialHex;

    selector.addEventListener('value-changed', (e) => {
      e.stopPropagation();
      onChange(e.detail.value);
      // Keep the swatch in sync when the typed value resolves to a color.
      const hex = this._resolveColorToHex(e.detail.value);
      if (hex) swatch.value = hex;
    });

    swatch.addEventListener('input', (e) => {
      const picked = e.target.value; // always "#rrggbb"
      selector.value = picked;
      onChange(picked);
    });

    container.appendChild(selector);
    container.appendChild(swatch);
    return container;
  }

  // Top-level color config field (wraps _createColorInput and writes the value
  // back to the given config key via _valueChanged).
  _createColorField(field, label, value) {
    const container = document.createElement('div');
    container.className = 'field';
    container.appendChild(this._createColorInput(label, value, (newValue) => this._valueChanged(field, newValue)));
    return container;
  }

  _createSwitch(field, label, checked) {
    const container = document.createElement('div');
    container.className = 'toggle-row';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;

    const toggle = document.createElement('ha-switch');
    toggle.checked = checked || false;
    toggle.addEventListener('change', (e) => {
      this._valueChanged(field, e.target.checked);
    });

    container.appendChild(labelEl);
    container.appendChild(toggle);
    return container;
  }

  _createEntityPicker(field, label, value) {
    const container = document.createElement('div');
    container.className = 'field';

    const selector = document.createElement('ha-selector');
    selector.hass = this._hass;
    selector.selector = { entity: {} };
    selector.value = value || '';
    selector.label = label;
    selector.addEventListener('value-changed', (e) => {
      this._valueChanged(field, e.detail.value);
    });

    container.appendChild(selector);
    return container;
  }

  _createSelect(field, label, value, options) {
    const container = document.createElement('div');
    container.className = 'field';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.className = 'select-label';

    const select = document.createElement('select');
    select.className = 'ha-select';
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === value) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    select.addEventListener('change', (e) => {
      this._valueChanged(field, e.target.value);
    });

    container.appendChild(labelEl);
    container.appendChild(select);
    return container;
  }

  _createExpansionPanel(header, content) {
    const panel = document.createElement('ha-expansion-panel');
    panel.header = header;
    panel.outlined = true;
    panel.appendChild(content);
    return panel;
  }

  _createSeverityItem(index, sev) {
    const item = document.createElement('div');
    item.className = 'severity-item';

    // Value field
    const valueField = document.createElement('ha-selector');
    valueField.hass = this._hass;
    valueField.label = 'Value';
    valueField.selector = { number: { mode: 'box', step: 1 } };
    valueField.value = sev.value ?? '';
    valueField.addEventListener('value-changed', (e) => {
      e.stopPropagation();
      this._updateSeverity(index, 'value', e.detail.value === '' ? undefined : Number(e.detail.value));
    });

    // Fill color field (use new standard name, read from either for backwards compat)
    // Combined text input + color-picker swatch; accepts hex, CSS names, or var().
    const fillField = this._createColorInput(
      'Fill Color',
      sev.fill_color || sev.bnStyle || '',
      (newValue) => this._updateSeverity(index, 'fill_color', newValue)
    );

    // Text color field (use new standard name, read from either for backwards compat)
    const textField = this._createColorInput(
      'Text Color',
      sev.text_color || sev.color || '',
      (newValue) => this._updateSeverity(index, 'text_color', newValue)
    );

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-button';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      this._removeSeverity(index);
    });

    item.appendChild(valueField);
    item.appendChild(fillField);
    item.appendChild(textField);
    item.appendChild(removeBtn);
    return item;
  }

  _updateSeverity(index, key, value) {
    const severities = [...(this._config.severity || [])];
    severities[index] = { ...severities[index], [key]: value };
    // Remove empty values to keep config clean
    if (!value) {
      delete severities[index][key];
    }
    // Remove deprecated keys if new keys are being used
    if (key === 'fill_color') {
      delete severities[index].bnStyle;
    }
    if (key === 'text_color') {
      delete severities[index].color;
    }
    this._config = { ...this._config, severity: severities };
    this._fireConfigChanged();
  }

  _removeSeverity(index) {
    const severities = [...(this._config.severity || [])];
    severities.splice(index, 1);
    if (severities.length === 0) {
      const newConfig = { ...this._config };
      delete newConfig.severity;
      this._config = newConfig;
    } else {
      this._config = { ...this._config, severity: severities };
    }
    this._fireConfigChanged();
    // Rebuild just the severity list, not the whole editor
    this._rebuildSeverityList();
  }

  _rebuildSeverityList() {
    const severityList = this.shadowRoot?.querySelector('.severity-list');
    if (!severityList) return;

    // Clear existing items
    severityList.innerHTML = '';

    // Rebuild items with correct indices
    const severities = this._config.severity || [];
    severities.forEach((sev, index) => {
      severityList.appendChild(this._createSeverityItem(index, sev));
    });
  }

  render() {
    if (!this.shadowRoot) return;

    // Block config-changed until the first animation frame after render(),
    // by which point any spurious browser change events have already fired.
    this._initializing = true;
    requestAnimationFrame(() => { this._initializing = false; });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        padding: 16px;
      }
      .field {
        display: block;
        margin-bottom: 16px;
      }
      .field ha-selector {
        display: block;
        width: 100%;
      }
      ha-expansion-panel {
        display: block;
        margin-bottom: 8px;
      }
      .panel-content {
        padding: 12px;
      }
      .section-note {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-bottom: 12px;
        font-style: italic;
      }
      .section-note a {
        color: var(--primary-color);
      }
      .toggle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
      }
      .toggle-row label {
        font-size: 14px;
        color: var(--primary-text-color);
      }
      h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 500;
      }
      .select-label {
        display: block;
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-bottom: 4px;
      }
      .ha-select {
        display: block;
        width: 100%;
        padding: 8px 12px;
        font-size: 14px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background-color: var(--card-background-color, #fff);
        color: var(--primary-text-color);
        cursor: pointer;
      }
      .ha-select:focus {
        outline: none;
        border-color: var(--primary-color);
      }
      .severity-list {
        margin-bottom: 12px;
      }
      .severity-item {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr auto;
        gap: 8px;
        margin-bottom: 8px;
        align-items: end;
      }
      .severity-item ha-selector {
        display: block;
      }
      .color-input {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .color-input ha-selector {
        flex: 1 1 auto;
        display: block;
        min-width: 0;
      }
      .color-swatch {
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        padding: 2px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: var(--card-background-color, #fff);
        cursor: pointer;
      }
      .add-button, .remove-button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .add-button {
        background-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
        width: 100%;
      }
      .add-button:hover {
        opacity: 0.9;
      }
      .remove-button {
        background-color: var(--error-color, #db4437);
        color: white;
        padding: 8px 12px;
      }
      .remove-button:hover {
        opacity: 0.9;
      }
    `;

    const root = document.createElement('div');

    // Section 1: Basic (always visible)
    const basicSection = document.createElement('div');
    basicSection.innerHTML = '<h3>Basic Settings</h3>';

    basicSection.appendChild(this._createEntityPicker('entity', 'Entity', this._config.entity));
    basicSection.appendChild(this._createTextfield('title', 'Title', this._config.title));

    root.appendChild(basicSection);

    // Section 2: Display Options
    const displayContent = document.createElement('div');
    displayContent.className = 'panel-content';

    displayContent.appendChild(this._createTextfield('attribute', 'Attribute (optional)', this._config.attribute, 'Display entity attribute instead of state'));
    displayContent.appendChild(this._createSwitch('hideunit', 'Hide unit of measurement', this._config.hideunit));
    // Default true; use !== false so an unset config shows the toggle as on (issue #13)
    displayContent.appendChild(this._createSwitch('full_height', 'Fill container height (turn off for picture-elements)', this._config.full_height !== false));
    displayContent.appendChild(this._createTextfield('round', 'Decimal places', this._config.round, 'Number of decimal places (0-10)', 'number'));
    displayContent.appendChild(this._createTextfield('unit', 'Custom unit', this._config.unit, 'Override entity unit of measurement'));
    displayContent.appendChild(this._createSelect('unit_position', 'Unit position', this._config.unit_position || 'right', [
      { value: 'right', label: 'Right (default) - e.g. 5.06 £' },
      { value: 'left',  label: 'Left - e.g. £ 5.06' }
    ]));

    root.appendChild(this._createExpansionPanel('Display Options', displayContent));

    // Section 3: Colors
    const colorsContent = document.createElement('div');
    colorsContent.className = 'panel-content';

    const colorNote = document.createElement('div');
    colorNote.className = 'section-note';
    // innerHTML is safe here: content is a static string with no user input.
    // rel="noopener noreferrer" per project security guidance for external links.
    colorNote.innerHTML = 'Use the swatch to pick a color, or type a hex value (#FF0000), a CSS color name (green), or a CSS variable (var(--primary-color)). <a href="https://htmlcolorcodes.com/color-names/" target="_blank" rel="noopener noreferrer">CSS color names reference</a>.';
    colorsContent.appendChild(colorNote);

    colorsContent.appendChild(this._createColorField('text_color', 'Text color', this._config.text_color || this._config.color));
    colorsContent.appendChild(this._createColorField('fill_color', 'Fill color (bar/background)', this._config.fill_color || this._config.bnStyle));
    colorsContent.appendChild(this._createColorField('background_color', 'Background color (unfilled portion)', this._config.background_color));
    colorsContent.appendChild(this._createTextfield('opacity', 'Unit text opacity', this._config.opacity || '0.5', 'Value between 0 and 1'));

    root.appendChild(this._createExpansionPanel('Colors', colorsContent));

    // Section 4: Sizing
    const sizingContent = document.createElement('div');
    sizingContent.className = 'panel-content';

    const sizingNote = document.createElement('div');
    sizingNote.className = 'section-note';
    sizingNote.textContent = 'Use CSS units (e.g., 50px, 2em, 1.5rem)';
    sizingContent.appendChild(sizingNote);

    sizingContent.appendChild(this._createTextfield('scale', 'Scale (base unit)', this._config.scale || '50px'));
    sizingContent.appendChild(this._createTextfield('value_font_size', 'Value font size', this._config.value_font_size));
    sizingContent.appendChild(this._createTextfield('unit_font_size', 'Unit font size', this._config.unit_font_size, 'Override unit of measurement font size (e.g., 20px, 1em)'));
    sizingContent.appendChild(this._createTextfield('title_font_size', 'Title font size', this._config.title_font_size));
    sizingContent.appendChild(this._createTextfield('card_padding', 'Card padding', this._config.card_padding));

    root.appendChild(this._createExpansionPanel('Sizing', sizingContent));

    // Section 5: Progress Bar
    const progressContent = document.createElement('div');
    progressContent.className = 'panel-content';

    const progressNote = document.createElement('div');
    progressNote.className = 'section-note';
    progressNote.textContent = 'Set min and max to enable progress bar display. An entity picked below overrides the matching static value, and falls back to it if the entity is unavailable.';
    progressContent.appendChild(progressNote);

    progressContent.appendChild(this._createTextfield('min', 'Minimum value', this._config.min, null, 'number'));
    progressContent.appendChild(this._createTextfield('max', 'Maximum value', this._config.max, null, 'number'));
    progressContent.appendChild(this._createEntityPicker('min_entity', 'Minimum from entity (optional)', this._config.min_entity));
    progressContent.appendChild(this._createEntityPicker('max_entity', 'Maximum from entity (optional)', this._config.max_entity));
    progressContent.appendChild(this._createSelect('from', 'Fill direction', this._config.from || 'left', [
      { value: 'left', label: 'Left to Right' },
      { value: 'right', label: 'Right to Left' },
      { value: 'top', label: 'Top to Bottom' },
      { value: 'bottom', label: 'Bottom to Top' }
    ]));

    root.appendChild(this._createExpansionPanel('Progress Bar', progressContent));

    // Section 6: None State Handling
    const noneContent = document.createElement('div');
    noneContent.className = 'panel-content';

    const noneNote = document.createElement('div');
    noneNote.className = 'section-note';
    noneNote.textContent = 'Configure display when sensor value is unavailable or NaN';
    noneContent.appendChild(noneNote);

    noneContent.appendChild(this._createTextfield('noneString', 'Display text when unavailable', this._config.noneString, 'e.g., Offline, N/A'));
    noneContent.appendChild(this._createTextfield('noneCardClass', 'Card CSS class when unavailable', this._config.noneCardClass));
    noneContent.appendChild(this._createTextfield('noneValueClass', 'Value CSS class when unavailable', this._config.noneValueClass));

    root.appendChild(this._createExpansionPanel('None State Handling', noneContent));

    // Section 7: Tap Action
    const tapContent = document.createElement('div');
    tapContent.className = 'panel-content';

    const tapAction = this._config.tap_action || { action: 'more-info' };

    tapContent.appendChild(this._createSelect('tap_action.action', 'Tap action', tapAction.action || 'more-info', [
      { value: 'more-info', label: 'More Info (default)' },
      { value: 'toggle', label: 'Toggle' },
      { value: 'call-service', label: 'Call Service' },
      { value: 'navigate', label: 'Navigate' },
      { value: 'url', label: 'Open URL' },
      { value: 'none', label: 'None (disabled)' }
    ]));

    // Conditional fields based on action type
    if (tapAction.action === 'navigate') {
      tapContent.appendChild(this._createTextfield('tap_action.navigation_path', 'Navigation path', tapAction.navigation_path, 'e.g., /lovelace/0'));
    }

    if (tapAction.action === 'url') {
      tapContent.appendChild(this._createTextfield('tap_action.url_path', 'URL', tapAction.url_path));
    }

    if (tapAction.action === 'call-service') {
      tapContent.appendChild(this._createTextfield('tap_action.service', 'Service', tapAction.service, 'e.g., light.toggle'));
      const serviceDataNote = document.createElement('div');
      serviceDataNote.className = 'section-note';
      serviceDataNote.textContent = 'For service_data, use YAML editor';
      tapContent.appendChild(serviceDataNote);
    }

    root.appendChild(this._createExpansionPanel('Tap Action', tapContent));

    // Section 8: Severity Levels
    const severityContent = document.createElement('div');
    severityContent.className = 'panel-content';

    const severityNote = document.createElement('div');
    severityNote.className = 'section-note';
    // innerHTML is safe here: content is a static string with no user input.
    // rel="noopener noreferrer" per project security guidance for external links.
    severityNote.innerHTML = 'Define color thresholds. Colors apply when value is &lt;= the threshold. List in ascending order. Use the swatch to pick a color, or type a hex value, a CSS color name (green), or a CSS variable. <a href="https://htmlcolorcodes.com/color-names/" target="_blank" rel="noopener noreferrer">CSS color names reference</a>.';
    severityContent.appendChild(severityNote);

    const severityList = document.createElement('div');
    severityList.className = 'severity-list';

    const severities = this._config.severity || [];
    severities.forEach((sev, index) => {
      severityList.appendChild(this._createSeverityItem(index, sev));
    });

    severityContent.appendChild(severityList);

    const addBtn = document.createElement('button');
    addBtn.className = 'add-button';
    addBtn.textContent = 'Add Severity Level';
    addBtn.addEventListener('click', () => {
      const newSev = { value: 0, fill_color: '#cccccc' };
      const newSeverity = [...(this._config.severity || []), newSev];
      this._config = { ...this._config, severity: newSeverity };
      this._fireConfigChanged();
      // Add new item to DOM without full re-render
      const newIndex = newSeverity.length - 1;
      severityList.appendChild(this._createSeverityItem(newIndex, newSev));
    });
    severityContent.appendChild(addBtn);

    root.appendChild(this._createExpansionPanel('Severity Levels', severityContent));

    // Clear and render
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(root);
  }
}

customElements.define('bignumber-card-editor', BigNumberCardEditor);
customElements.define('bignumber-card', BigNumberCard);

// Configure the preview in the Lovelace card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'bignumber-card',
  name: 'Big number card',
  preview: true,
  description: 'A simple card to display big numbers for sensors. It also supports severity levels as background.',

  // Suggest this card when the user picks an entity that is clearly numeric.
  // Only numeric domains and numeric sensors (those with a unit_of_measurement
  // or state_class attribute) are a good fit. Returning null for everything else
  // keeps the card picker clean and avoids misleading suggestions.
  getEntitySuggestion: (hass, entityId) => {
    const entityState = hass.states[entityId];
    if (!entityState) return null;

    const domain = entityId.split('.')[0];
    const attributes = entityState.attributes;

    // input_number, number, and counter are always numeric
    if (domain === 'input_number' || domain === 'number' || domain === 'counter') {
      return { config: { type: 'custom:bignumber-card', entity: entityId } };
    }

    // For sensors, only suggest when the entity exposes numeric data -
    // indicated by a non-empty unit_of_measurement or any state_class value.
    if (domain === 'sensor') {
      const hasUnit = attributes.unit_of_measurement !== undefined && attributes.unit_of_measurement !== '';
      const hasStateClass = attributes.state_class !== undefined;
      if (hasUnit || hasStateClass) {
        return { config: { type: 'custom:bignumber-card', entity: entityId } };
      }
    }

    return null;
  }
});
