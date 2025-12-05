class BigNumberCard extends HTMLElement {
  _DEFAULT_STYLE(){return 'var(--label-badge-blue)';}
  _DEFAULT_COLOR(){return 'var(--primary-text-color)';}

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
    if (!cardConfig.noneString) cardConfig.nonestring = null;
    if (!cardConfig.noneCardClass) cardConfig.noneCardClass = null;
    if (!cardConfig.noneValueClass) cardConfig.noneValueClass = null;

    // NEW: Custom font size support (PR #47 - issue #39)
    // Allows independent control of title and value font sizes separate from scale parameter
    // Defaults to null to maintain backwards compatibility with scale-based sizing
    if (!cardConfig.title_font_size) cardConfig.title_font_size = null;
    if (!cardConfig.value_font_size) cardConfig.value_font_size = null;

    // NEW: Custom card padding support (PR #47 - issue #39)
    // Decouples card height from font sizes for better layout control
    // Defaults to null to maintain backwards compatibility with scale-based padding
    if (!cardConfig.card_padding) cardConfig.card_padding = null;

    // NEW: Tap action support (PR #48 - issue #41)
    // Defaults to more-info to maintain backwards compatibility with existing behavior
    if (!cardConfig.tap_action) {
      cardConfig.tap_action = { action: 'more-info' };
    }

    this.isNoneConfig = Boolean(cardConfig.noneString || cardConfig.noneCardClass || cardConfig.noneValueClass)

    const card = document.createElement('ha-card');
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
      ha-card {
        text-align: center;
        --bignumber-color: ${this._getColor(null, cardConfig)};
        --bignumber-fill-color: ${this._getStyle(null, cardConfig)};
        --bignumber-percent: 100%;
        --bignumber-direction: ${cardConfig.from};
        --base-unit: ${cardConfig.scale};
        padding: ${cardPadding};
        background: linear-gradient(to var(--bignumber-direction), var(--card-background-color) var(--bignumber-percent), var(--bignumber-fill-color) var(--bignumber-percent));
      }
      #value {
        font-size: ${valueFontSize};
        line-height: ${valueFontSize};
        color: var(--bignumber-color);
      }
      #value small{opacity: ${cardConfig.opacity}}
      #title {
        font-size: ${titleFontSize};
        line-height: ${titleFontSize};
        color: var(--bignumber-color);
      }
    `;
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

  _getColor(entityState, config) {
    if (config.severity) {
      const severity = this._computeSeverity(entityState, config.severity);
      if (severity && severity.color) return severity.color;
    }
    if (config.color) return config.color;
    return this._DEFAULT_COLOR();
  }

  _getStyle(entityState, config) {
    if (config.severity) {
      const severity = this._computeSeverity(entityState, config.severity);
      if (severity && severity.bnStyle) return severity.bnStyle;
    }
    if (config.bnStyle) return config.bnStyle;
    return this._DEFAULT_STYLE();
  }

  _translatePercent(value, min, max) {
    return 100-100 * (value - min) / (max - min);
  }

  // NEW: Format numbers with locale-aware thousands separators (PR #46 - issue #45)
  // Uses toLocaleString() for automatic locale-based formatting
  // Respects config.round setting for decimal precision
  _formatNumber(value, config) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return value;
    }

    const options = {};
    if (config.round != null) {
      options.minimumFractionDigits = config.round;
      options.maximumFractionDigits = config.round;
    }

    return numValue.toLocaleString(undefined, options);
  }

  set hass(hass) {
    const config = this._config;
    const root = this.shadowRoot;
    const entityState = config.attribute
      ? hass.states[config.entity].attributes[config.attribute]
      : hass.states[config.entity].state;
    const measurement = hass.states[config.entity].attributes.unit_of_measurement || "";

    if (entityState !== this._entityState) {
      if (config.min !== undefined && config.max !== undefined) {
        root.querySelector("ha-card").style.setProperty('--bignumber-percent', `${this._translatePercent(entityState, config.min, config.max)}%`);
      }
      root.querySelector("ha-card").style.setProperty('--bignumber-fill-color', `${this._getStyle(entityState, config)}`);
      root.querySelector("ha-card").style.setProperty('--bignumber-color', `${this._getColor(entityState, config)}`);
      this._entityState = entityState
      // NEW: Use locale-aware formatting (PR #46 - issue #45)
      const numValue = parseFloat(entityState);
      let value = this._formatNumber(entityState, config);
      if (config.hideunit==true)
        { root.getElementById("value").textContent = `${value}`; }
      else
        { root.getElementById("value").innerHTML = `${value}<small>${measurement}</small>`; }
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
}

customElements.define('bignumber-card', BigNumberCard);

// Configure the preview in the Lovelace card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'bignumber-card',
  name: 'Big number card',
  preview: false,
  description: 'A simple card to display big numbers for sensors. It also supports severity levels as background.'
});
