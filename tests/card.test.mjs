import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Card, makeCard, makeEditor, control, makeHass, withStates, stateObj, haCard, valueEl, cssVar, cleanup, window } from './helpers/env.mjs';

afterEach(cleanup);

const W = (state, attrs = {}) => stateObj(state, { unit_of_measurement: 'W', ...attrs });

describe('registration', () => {
  test('defines the card and editor and adds a card picker entry', () => {
    assert.ok(Card);
    assert.equal(window.customCards.find((c) => c.type === 'bignumber-card').preview, true);
  });

  test('setConfig requires an entity', () => {
    assert.throws(() => document.createElement('bignumber-card').setConfig({}), /Please define an entity/);
  });
});

describe('value', () => {
  test('shows the formatted state with its unit on the right', () => {
    const card = makeCard({ entity: 'sensor.p' }, makeHass({ 'sensor.p': W('19578') }));
    assert.equal(valueEl(card).textContent, '19,578W');
    assert.equal(valueEl(card).querySelector('small').textContent, 'W');
  });

  test('documented defaults: scale 50px, from left, more-info tap action', () => {
    const card = makeCard({ entity: 'sensor.p' }, makeHass({ 'sensor.p': W('1') }));
    assert.equal(card._config.scale, '50px');
    assert.equal(card._config.from, 'left');
    assert.deepEqual(card._config.tap_action, { action: 'more-info' });
    assert.equal(card._config.opacity, '0.7');
    assert.equal(cssVar(card, '--bignumber-fill-color'), 'var(--label-badge-blue)');
    assert.equal(cssVar(card, '--bignumber-text-color'), 'var(--primary-text-color)');
  });

  test('dark theme default fill is #01579b', () => {
    const card = makeCard({ entity: 'sensor.p' }, makeHass({ 'sensor.p': W('1') }, { themes: { darkMode: true } }));
    assert.equal(cssVar(card, '--bignumber-fill-color'), '#01579b');
  });

  // BN1 (B11/D6): value and unit are written with innerHTML
  test('a display state cannot inject markup', () => {
    const card = makeCard(
      { entity: 'sensor.p', display_entity: 'sensor.text' },
      makeHass({ 'sensor.p': W('1'), 'sensor.text': '<img src=x onerror=alert(1)>' }),
    );
    assert.equal(valueEl(card).querySelectorAll('img').length, 0, 'injected <img> was rendered');
    assert.equal(valueEl(card).textContent, '<img src=x onerror=alert(1)>');  // unit comes from the display entity, which has none
  });

  test('a unit_of_measurement cannot inject markup', () => {
    const card = makeCard({ entity: 'sensor.p' }, makeHass({ 'sensor.p': stateObj('1', { unit_of_measurement: '<b>W</b>' }) }));
    assert.equal(valueEl(card).querySelectorAll('b').length, 0, 'unit markup was rendered');
    assert.equal(valueEl(card).querySelector('small').textContent, '<b>W</b>');
  });

  test('unit_position left puts the unit first', () => {
    const card = makeCard({ entity: 'sensor.p', unit_position: 'left', unit: '£' }, makeHass({ 'sensor.p': '5.06' }));
    assert.equal(valueEl(card).firstChild.nodeName, 'SMALL');
    assert.equal(valueEl(card).textContent, '£5.06');
  });

  // BN6 (B8): setConfig rebuilds the card, but cached state skips the next repaint
  test('a new config with unchanged entity state still shows the value', () => {
    const hass = makeHass({ 'sensor.p': W('42') });
    const card = makeCard({ entity: 'sensor.p', min: 0, max: 100 }, hass);
    card.setConfig({ entity: 'sensor.p', min: 0, max: 100, title: 'Power' });
    assert.equal(valueEl(card).textContent, '42W', 'blank right after setConfig');
    card.hass = withStates(hass, {});
    assert.equal(valueEl(card).textContent, '42W');
    assert.equal(cssVar(card, '--bignumber-percent'), '58%');
  });

  test('an attribute that is missing still paints after setConfig', () => {
    const hass = makeHass({ 'sensor.p': W('42') });
    const card = makeCard({ entity: 'sensor.p', attribute: 'nope', hideunit: true }, hass);
    card.setConfig({ entity: 'sensor.p', attribute: 'nope', hideunit: true, noneString: 'N/A' });
    assert.equal(valueEl(card).textContent, 'N/A');
  });
});

describe('progress bar', () => {
  test('min/max set the gradient stop, clamped to 0-100', () => {
    const hass = makeHass({ 'sensor.p': W('25') });
    const card = makeCard({ entity: 'sensor.p', min: 0, max: 100 }, hass);
    assert.equal(cssVar(card, '--bignumber-percent'), '75%');
    card.hass = withStates(hass, { 'sensor.p': W('170') });
    assert.equal(cssVar(card, '--bignumber-percent'), '0%');
  });
});

describe('interaction', () => {
  test('click opens more-info by default', () => {
    const card = makeCard({ entity: 'sensor.p' }, makeHass({ 'sensor.p': W('1') }));
    haCard(card).click();
    assert.deepEqual(card.events, [{ type: 'hass-more-info', detail: { entityId: 'sensor.p' } }]);
  });
});

describe('opacity', () => {
  test('a YAML opacity: 0 is kept', () => {
    const card = makeCard({ entity: 'sensor.p', opacity: 0 }, makeHass({ 'sensor.p': '1' }));
    assert.equal(card._config.opacity, 0);
  });

  test('opacity 0 shows as 0 in the editor field', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', opacity: 0 });
    assert.equal(control(editor, 'Unit text opacity').value, 0);
  });
});

describe('round', () => {
  test('a negative round does not break the card', () => {
    const card = makeCard({ entity: 'sensor.p', round: -1 });
    assert.doesNotThrow(() => { card.hass = makeHass({ 'sensor.p': '12.34' }); });
    assert.equal(valueEl(card).textContent, '12');
  });

  test('the editor limits Decimal places to 0-20', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    const { min, max } = control(editor, 'Decimal places').selector.number;
    assert.deepEqual([min, max], [0, 20]);
  });

  test('round above 20 is clamped; a non-number is ignored; 0 rounds', () => {
    const hass = makeHass({ 'sensor.p': '1.5' });
    for (const [round, text] of [[50, '1.50000000000000000000'], ['abc', '1.5'], ['', '1.5'], [0, '2']]) {
      const card = makeCard({ entity: 'sensor.p', round, hideunit: true }, hass);
      assert.equal(valueEl(card).textContent, text, String(round));
    }
  });

  test('a negative value that rounds to zero shows 0, not -0', () => {
    const card = makeCard({ entity: 'sensor.p', round: 0, hideunit: true }, makeHass({ 'sensor.p': '-0.4' }));
    assert.equal(valueEl(card).textContent, '0');
  });
});
