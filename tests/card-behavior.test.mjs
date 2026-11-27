import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Card, Editor, makeCard, makeHass, withStates, stateObj, haCard, valueEl, cssVar, browser, cleanup, window, document } from './helpers/env.mjs';

afterEach(() => { mock.restoreAll(); cleanup(); });

const entry = () => window.customCards.find((c) => c.type === 'bignumber-card');
const styleText = (card) => card.shadowRoot.querySelector('style').textContent;
const key = (card, k, opts = {}) => haCard(card).dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts }));

describe('card picker and sizing', () => {
  // Found on ha-test (2026-11-26): a fixed 2 rows (about 120px) cut off the value and the
  // title once a long title wrapped in a narrow slot (user decision: size to content)
  test('getGridOptions sizes the card to its content (rows: auto)', () => {
    const card = document.createElement('bignumber-card');
    assert.deepEqual(card.getGridOptions(), { rows: 'auto', columns: 6, min_columns: 3 });
  });

  test('getConfigElement, getCardSize', () => {
    assert.ok(Card.getConfigElement() instanceof Editor);
    const card = makeCard({ entity: 'sensor.p' });
    assert.equal(card.getCardSize(), 1);
  });

  test('getStubConfig picks the first sensor, or none', () => {
    assert.deepEqual(Card.getStubConfig(makeHass({ 'light.a': 'on', 'sensor.t': '1' })), { entity: 'sensor.t', title: '', scale: '50px' });
    assert.equal(Card.getStubConfig(makeHass({ 'light.a': 'on' })).entity, '');
    assert.equal(Card.getStubConfig().entity, '');
  });

  test('getEntitySuggestion: numeric domains and numeric sensors only', () => {
    const hass = makeHass({
      'input_number.a': '1', 'number.b': '1', 'counter.c': '1',
      'sensor.unit': stateObj('1', { unit_of_measurement: 'W' }),
      'sensor.class': stateObj('1', { state_class: 'measurement' }),
      'sensor.blank': stateObj('x', { unit_of_measurement: '' }),
      'switch.s': 'on',
    });
    const suggested = (id) => entry().getEntitySuggestion(hass, id)?.config.entity ?? null;
    assert.deepEqual(
      ['input_number.a', 'number.b', 'counter.c', 'sensor.unit', 'sensor.class', 'sensor.blank', 'switch.s', 'sensor.missing'].map(suggested),
      ['input_number.a', 'number.b', 'counter.c', 'sensor.unit', 'sensor.class', null, null, null],
    );
  });
});

describe('layout options', () => {
  test('full_height false sizes to content; unit_font_size applies', () => {
    const card = makeCard({ entity: 'sensor.p', full_height: false, unit_font_size: '20px' });
    assert.match(styleText(card), /height: auto/);
    assert.match(styleText(card), /opacity: 0\.7; font-size: 20px/);
  });

  test('custom font sizes and padding replace the scale-based ones', () => {
    const card = makeCard({ entity: 'sensor.p', value_font_size: '48px', title_font_size: '12px', card_padding: '15px 10px', title: 'T' });
    const css = styleText(card);
    assert.match(css, /font-size: 48px/);
    assert.match(css, /font-size: 12px/);
    assert.match(css, /padding: 15px 10px/);
    assert.equal(card.shadowRoot.getElementById('title').textContent, 'T');
  });

  test('setConfig replaces the previous card', () => {
    const card = makeCard({ entity: 'sensor.p' });
    card.setConfig({ entity: 'sensor.p' });
    assert.equal(card.shadowRoot.querySelectorAll('ha-card').length, 1);
  });
});

describe('value display', () => {
  test('a missing entity warns and paints nothing', () => {
    const warn = mock.method(console, 'warn', () => {});
    const card = makeCard({ entity: 'sensor.gone' }, makeHass());
    assert.equal(valueEl(card).textContent, '');
    assert.match(warn.mock.calls[0].arguments[0], /sensor\.gone not found/);
  });

  test('attribute, hideunit, custom unit, use_grouping false', () => {
    const hass = makeHass({ 'climate.x': stateObj('heat', { current_temperature: 21.5, unit_of_measurement: 'C' }), 'sensor.big': stateObj('19578', { unit_of_measurement: 'W' }) });
    assert.equal(valueEl(makeCard({ entity: 'climate.x', attribute: 'current_temperature' }, hass)).textContent, '21.5C');
    assert.equal(valueEl(makeCard({ entity: 'sensor.big', hideunit: true }, hass)).textContent, '19,578');
    assert.equal(valueEl(makeCard({ entity: 'sensor.big', unit: ' kW' }, hass)).textContent, '19,578 kW');
    assert.equal(valueEl(makeCard({ entity: 'sensor.big', use_grouping: false, unit: '' }, hass)).textContent, '19578');
  });

  test('display_entity with display_attribute; a missing display entity falls back', () => {
    const warn = mock.method(console, 'warn', () => {});
    const hass = makeHass({ 'sensor.p': stateObj('26', { unit_of_measurement: 'L' }), 'sensor.frac': stateObj('x', { text: '26 / 81' }) });
    assert.equal(valueEl(makeCard({ entity: 'sensor.p', display_entity: 'sensor.frac', display_attribute: 'text' }, hass)).textContent, '26 / 81');
    assert.equal(valueEl(makeCard({ entity: 'sensor.p', display_entity: 'sensor.gone' }, hass)).textContent, '26L');
    assert.match(warn.mock.calls[0].arguments[0], /Display entity sensor\.gone not found/);
  });

  test('a display-only change repaints the text', () => {
    const hass = makeHass({ 'sensor.p': '1', 'sensor.d': 'a' });
    const card = makeCard({ entity: 'sensor.p', display_entity: 'sensor.d', hideunit: true }, hass);
    card.hass = withStates(hass, { 'sensor.d': 'b' });
    assert.equal(valueEl(card).textContent, 'b');
  });

  test('None handling: string and classes while non-numeric, classes removed after', () => {
    const hass = makeHass({ 'sensor.p': 'unavailable' });
    const card = makeCard({ entity: 'sensor.p', noneString: 'Offline', noneCardClass: 'nc', noneValueClass: 'nv' }, hass);
    assert.equal(valueEl(card).textContent, 'Offline');
    assert.equal(haCard(card).classList.contains('nc'), true);
    assert.equal(valueEl(card).classList.contains('nv'), true);
    card.hass = withStates(hass, { 'sensor.p': '5' });
    assert.equal(haCard(card).classList.contains('nc'), false);
    assert.equal(valueEl(card).classList.contains('nv'), false);
    assert.equal(valueEl(card).textContent, '5');
  });

  test('None classes without noneString keep the raw text', () => {
    const card = makeCard({ entity: 'sensor.p', noneCardClass: 'nc', hideunit: true }, makeHass({ 'sensor.p': 'unknown' }));
    assert.equal(valueEl(card).textContent, 'unknown');
    assert.equal(valueEl(card).classList.length, 0);
    const card2 = makeCard({ entity: 'sensor.p', noneValueClass: 'nv', hideunit: true }, makeHass({ 'sensor.p': 'unknown' }));
    assert.equal(haCard(card2).classList.length, 0);
  });

  test('switching to dark theme repaints the default fill', () => {
    const hass = makeHass({ 'sensor.p': '1' });
    const card = makeCard({ entity: 'sensor.p' }, hass);
    card.hass = { ...hass, themes: { darkMode: true } };
    assert.equal(cssVar(card, '--bignumber-fill-color'), '#01579b');
  });
});

describe('colors', () => {
  const sev = [
    { value: 10, fill_color: 'green', text_color: 'black', background_color: '#111' },
    { value: 20, bnStyle: 'yellow', color: 'blue' },
    { value: 30 },
  ];
  const colors = (state, extra = {}) => {
    const card = makeCard({ entity: 'sensor.p', severity: sev, ...extra }, makeHass({ 'sensor.p': state }));
    return ['--bignumber-fill-color', '--bignumber-text-color', '--bignumber-background-color'].map((v) => cssVar(card, v));
  };

  test('severity colors, including deprecated names', () => {
    assert.deepEqual(colors('5'), ['green', 'black', '#111']);
    assert.deepEqual(colors('15'), ['yellow', 'blue', 'var(--card-background-color)']);
  });

  test('a matched severity without colors, or no match, falls back to card colors', () => {
    assert.deepEqual(colors('25', { fill_color: 'red', text_color: 'white', background_color: '#222' }), ['red', 'white', '#222']);
    assert.deepEqual(colors('99', { bnStyle: 'orange', color: 'red' }), ['orange', 'red', 'var(--card-background-color)']);
  });

  test('a missing attribute matches no severity', () => {
    const card = makeCard({ entity: 'sensor.p', attribute: 'nope', severity: sev }, makeHass({ 'sensor.p': '5' }));
    assert.equal(cssVar(card, '--bignumber-fill-color'), 'var(--label-badge-blue)');
  });
});

describe('progress bar bounds', () => {
  const pct = (config, states) => cssVar(makeCard({ entity: 'sensor.p', ...config }, makeHass(states)), '--bignumber-percent');

  test('a non-numeric state draws an empty bar', () => {
    assert.equal(pct({ min: 0, max: 10 }, { 'sensor.p': 'unavailable' }), '100%');
  });

  test('bounds from entity state or attribute, with static fallback', () => {
    assert.equal(pct({ min: 0, max_entity: 'sensor.max' }, { 'sensor.p': '25', 'sensor.max': '50' }), '50%');
    assert.equal(pct({ min_entity: 'climate.c', min_entity_attribute: 'min_temp', max_entity: 'climate.c', max_entity_attribute: 'max_temp' },
      { 'sensor.p': '20', 'climate.c': stateObj('heat', { min_temp: 10, max_temp: 30 }) }), '50%');
    assert.equal(pct({ min: 0, max: 100, max_entity: 'sensor.gone' }, { 'sensor.p': '25' }), '75%');
    assert.equal(pct({ min: 0, max: 100, max_entity: 'sensor.max' }, { 'sensor.p': '25', 'sensor.max': 'unavailable' }), '75%');
  });

  // The stylesheet's --bignumber-percent: 100% (empty bar) stays; nothing is set inline
  test('no usable bound draws no bar', () => {
    assert.equal(pct({ min: 0 }, { 'sensor.p': '25' }), '');
    assert.equal(pct({ min: 0, max: 'abc' }, { 'sensor.p': '25' }), '');
  });

  test('a bound entity change redraws while the value is unchanged', () => {
    const hass = makeHass({ 'sensor.p': '25', 'sensor.max': '50' });
    const card = makeCard({ entity: 'sensor.p', min: 0, max_entity: 'sensor.max' }, hass);
    card.hass = withStates(hass, { 'sensor.max': '100' });
    assert.equal(cssVar(card, '--bignumber-percent'), '75%');
  });
});

describe('tap actions', () => {
  test('keyboard: Enter and Space run it, other keys do not', () => {
    const card = makeCard({ entity: 'sensor.p' }, makeHass({ 'sensor.p': '1' }));
    key(card, ' ');
    key(card, 'a');
    assert.equal(card.events.length, 1);
    assert.equal(haCard(card).getAttribute('role'), 'button');
  });

  test('none: not a button, click does nothing', () => {
    const card = makeCard({ entity: 'sensor.p', tap_action: { action: 'none' } }, makeHass({ 'sensor.p': '1' }));
    haCard(card).click();
    assert.equal(card.events.length, 0);
    assert.equal(haCard(card).hasAttribute('role'), false);
    card._handleTapAction(undefined, 'sensor.p');
    assert.equal(card.events.length, 0);
  });

  test('toggle, call-service with and without data or service', () => {
    const hass = makeHass({ 'fan.f': '1' });
    makeCard({ entity: 'fan.f', tap_action: { action: 'toggle' } }, hass).shadowRoot.querySelector('ha-card').click();
    makeCard({ entity: 'fan.f', tap_action: { action: 'call-service', service: 'switch.toggle', service_data: { entity_id: 'switch.p' } } }, hass).shadowRoot.querySelector('ha-card').click();
    makeCard({ entity: 'fan.f', tap_action: { action: 'call-service', service: 'script.go' } }, hass).shadowRoot.querySelector('ha-card').click();
    makeCard({ entity: 'fan.f', tap_action: { action: 'call-service' } }, hass).shadowRoot.querySelector('ha-card').click();
    assert.deepEqual(hass.calls, [
      { domain: 'fan', service: 'toggle', data: { entity_id: 'fan.f' } },
      { domain: 'switch', service: 'toggle', data: { entity_id: 'switch.p' } },
      { domain: 'script', service: 'go', data: {} },
    ]);
  });

  test('a service call before hass arrives warns', () => {
    const warn = mock.method(console, 'warn', () => {});
    const card = makeCard({ entity: 'fan.f', tap_action: { action: 'toggle' } });
    haCard(card).click();
    assert.match(warn.mock.calls[0].arguments[0], /hass not available/);
  });

  test('navigate pushes the path; url opens it; both need their path', () => {
    const navigate = makeCard({ entity: 'sensor.p', tap_action: { action: 'navigate', navigation_path: '/lovelace/climate' } }, makeHass({ 'sensor.p': '1' }));
    haCard(navigate).click();
    assert.equal(window.location.pathname, '/lovelace/climate');
    assert.deepEqual(navigate.events, [{ type: 'location-changed', detail: { replace: false } }]);
    const url = makeCard({ entity: 'sensor.p', tap_action: { action: 'url', url_path: 'https://example.com' } }, makeHass({ 'sensor.p': '1' }));
    haCard(url).click();
    assert.deepEqual(browser.opened, ['https://example.com']);
    for (const action of ['navigate', 'url']) haCard(makeCard({ entity: 'sensor.p', tap_action: { action } })).click();
    assert.equal(browser.opened.length, 1);
  });

  test('an unknown action falls back to more-info', () => {
    const card = makeCard({ entity: 'sensor.p', tap_action: { action: 'bogus' } }, makeHass({ 'sensor.p': '1' }));
    haCard(card).click();
    assert.equal(card.events[0].type, 'hass-more-info');
  });

  test('confirmation: default text, custom text, declined', () => {
    const hass = makeHass({ 'fan.f': '1' });
    haCard(makeCard({ entity: 'fan.f', tap_action: { action: 'toggle', confirmation: true } }, hass)).click();
    haCard(makeCard({ entity: 'fan.f', tap_action: { action: 'toggle', confirmation: { text: 'Sure?' } } }, hass)).click();
    browser.confirmAnswer = false;
    haCard(makeCard({ entity: 'fan.f', tap_action: { action: 'toggle', confirmation: {} } }, hass)).click();
    assert.deepEqual(browser.confirms, ['Are you sure you want to run this action?', 'Sure?', 'Are you sure you want to run this action?']);
    assert.equal(hass.calls.length, 2);
  });
});
