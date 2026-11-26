import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Card, makeCard, makeHass, withStates, stateObj, haCard, valueEl, cssVar, cleanup, window } from './helpers/env.mjs';

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
  test('a display state cannot inject markup', { todo: 'value and unit go through innerHTML unescaped' }, () => {
    const card = makeCard(
      { entity: 'sensor.p', display_entity: 'sensor.text' },
      makeHass({ 'sensor.p': W('1'), 'sensor.text': '<img src=x onerror=alert(1)>' }),
    );
    assert.equal(valueEl(card).querySelectorAll('img').length, 0, 'injected <img> was rendered');
    assert.equal(valueEl(card).textContent, '<img src=x onerror=alert(1)>W');
  });

  test('a unit_of_measurement cannot inject markup', { todo: 'unit goes through innerHTML unescaped' }, () => {
    const card = makeCard({ entity: 'sensor.p' }, makeHass({ 'sensor.p': stateObj('1', { unit_of_measurement: '<b>W</b>' }) }));
    assert.equal(valueEl(card).querySelectorAll('b').length, 0, 'unit markup was rendered');
  });

  // BN6 (B8): setConfig rebuilds the card, but cached state skips the next repaint
  test('a new config with unchanged entity state still shows the value', { todo: 'cached _entityState skips the repaint, value stays blank' }, () => {
    const hass = makeHass({ 'sensor.p': W('42') });
    const card = makeCard({ entity: 'sensor.p', min: 0, max: 100 }, hass);
    card.setConfig({ entity: 'sensor.p', min: 0, max: 100, title: 'Power' });
    card.hass = withStates(hass, {});
    assert.equal(valueEl(card).textContent, '42W');
    assert.equal(cssVar(card, '--bignumber-percent'), '58%');
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
