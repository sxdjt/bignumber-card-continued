import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeEditor, makeHass, fireValue, lastConfig, control, cleanup, nextFrame, window, document } from './helpers/env.mjs';

afterEach(cleanup);

const change = (el, prop, value) => { el[prop] = value; el.dispatchEvent(new window.Event('change')); };
const rows = (editor) => [...editor.shadowRoot.querySelectorAll('.severity-item')];
const rowFields = (row) => row.querySelectorAll('ha-selector');  // value, fill color, text color
const panels = (editor) => [...editor.shadowRoot.querySelectorAll('ha-expansion-panel')];

describe('field types', () => {
  test('text, number, entity, select and switch fields write their keys', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    fireValue(control(editor, 'Entity'), 'sensor.q');
    fireValue(control(editor, 'Minimum value'), '0');
    fireValue(control(editor, 'Maximum value'), '250');
    change(control(editor, 'Fill direction'), 'value', 'bottom');
    change(control(editor, 'Unit position'), 'value', 'left');
    change(control(editor, 'Hide unit of measurement'), 'checked', true);
    change(control(editor, 'Thousands separators'), 'checked', false);
    fireValue(control(editor, 'Scale (base unit)'), '30px');
    const c = lastConfig(editor);
    assert.deepEqual([c.entity, c.min, c.max, c.from, c.unit_position, c.hideunit, c.use_grouping, c.scale], ['sensor.q', 0, 250, 'bottom', 'left', true, false, '30px']);
    fireValue(control(editor, 'Maximum value'), '');
    assert.equal('max' in lastConfig(editor), false);
  });

  test('fields start from the config; defaults shown when unset', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', round: 0, from: 'top', unit_position: 'left', full_height: false, hideunit: true });
    assert.equal(control(editor, 'Decimal places').value, 0);
    assert.equal(control(editor, 'Fill direction').value, 'top');
    assert.equal(control(editor, 'Unit position').value, 'left');
    assert.equal(control(editor, 'Fill container height (turn off for picture-elements)').checked, false);
    assert.equal(control(editor, 'Hide unit of measurement').checked, true);
    const blank = await makeEditor({});
    assert.equal(control(blank, 'Entity').value, '');
    assert.equal(control(blank, 'Scale (base unit)').value, '50px');
    assert.equal(control(blank, 'Fill direction').value, 'left');
    assert.equal(control(blank, 'Thousands separators').checked, true);
    assert.equal(control(blank, 'Entity').required, true);
  });

  test('hass reaches every selector', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    const hass = makeHass();
    editor.hass = hass;
    for (const s of editor.shadowRoot.querySelectorAll('ha-selector')) assert.ok(s.hass === hass, s.label);
  });

  test('value-changed from text fields does not leak out of the editor', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    let leaked = 0;
    document.body.addEventListener('value-changed', () => leaked++);
    fireValue(control(editor, 'Title'), 'x');
    fireValue(control(editor, 'Text color'), 'red');
    assert.equal(leaked, 0);
  });
});

describe('color fields', () => {
  test('invalid shows an error and marks the swatch; valid clears it and syncs the swatch', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', text_color: 'nope' });
    const field = control(editor, 'Text color');
    const wrapper = field.closest('.color-input').parentElement;
    const error = wrapper.querySelector('.error-text');
    assert.match(error.textContent, /Error: Text color is not a valid color/);
    assert.equal(wrapper.classList.contains('invalid'), true);
    fireValue(field, 'nope2');
    fireValue(field, '#123456');
    assert.equal(error.textContent, '');
    assert.equal(wrapper.querySelector('.color-swatch').value, '#123456');
    fireValue(field, 'var(--x)');
    assert.equal(wrapper.querySelector('.color-swatch').value, '#123456');
  });

  test('picking from the swatch writes the hex value', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', fill_color: 'green' });
    const swatch = control(editor, 'Fill color (bar/background) picker');
    assert.equal(swatch.value, '#008000');
    swatch.value = '#ff0000';
    swatch.dispatchEvent(new window.Event('input'));
    assert.equal(lastConfig(editor).fill_color, '#ff0000');
    assert.equal(control(editor, 'Fill color (bar/background)').value, '#ff0000');
  });

  test('_resolveColorToHex: empty, rejected and unresolvable values give null', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    assert.equal(editor._resolveColorToHex(''), null);
    assert.equal(editor._resolveColorToHex('var(--undefined-token)'), null);
    assert.equal(editor._resolveColorToHex('white'), '#ffffff');
  });
});

describe('tap action', () => {
  test('changing the action rebuilds the panel, keeps it open and focuses the select', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    panels(editor).find((p) => p.header === 'Tap Action').expanded = true;
    change(control(editor, 'Tap action'), 'value', 'navigate');
    assert.equal(lastConfig(editor).tap_action.action, 'navigate');
    assert.equal(panels(editor).find((p) => p.header === 'Tap Action').expanded, true);
    assert.equal(panels(editor).find((p) => p.header === 'Colors').expanded, undefined);
    await nextFrame();
    assert.equal(editor.shadowRoot.activeElement?.dataset.field, 'tap_action.action');
    fireValue(control(editor, 'Navigation path'), '/lovelace/1');
    assert.equal(lastConfig(editor).tap_action.navigation_path, '/lovelace/1');
    fireValue(control(editor, 'Navigation path'), '');
    assert.equal('navigation_path' in lastConfig(editor).tap_action, false);
  });

  test('url and call-service show their fields', async () => {
    const url = await makeEditor({ entity: 'sensor.p', tap_action: { action: 'url', url_path: 'https://x' } });
    assert.equal(control(url, 'URL').value, 'https://x');
    const svc = await makeEditor({ entity: 'sensor.p', tap_action: { action: 'call-service', service: 'light.toggle' } });
    assert.equal(control(svc, 'Service').value, 'light.toggle');
    assert.match(svc.shadowRoot.textContent, /For service_data, use YAML editor/);
  });

  test('a tap_action without an action shows More Info', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', tap_action: { confirmation: true } });
    assert.equal(control(editor, 'Tap action').value, 'more-info');
    assert.equal(control(editor, 'Require confirmation').checked, true);
  });

    test('none hides the confirmation switch', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', tap_action: { action: 'none' } });
    assert.throws(() => control(editor, 'Require confirmation'), /no editor control/);
  });

  test('confirmation: switch on, custom text, clear text, switch off', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    change(control(editor, 'Require confirmation'), 'checked', true);
    assert.equal(lastConfig(editor).tap_action.confirmation, true);
    fireValue(control(editor, 'Confirmation text (optional)'), 'Sure?');
    assert.deepEqual(lastConfig(editor).tap_action.confirmation, { text: 'Sure?' });
    fireValue(control(editor, 'Confirmation text (optional)'), '');
    assert.equal(lastConfig(editor).tap_action.confirmation, true);
    change(control(editor, 'Require confirmation'), 'checked', false);
    assert.equal('confirmation' in lastConfig(editor).tap_action, false);
  });

  test('confirmation text with no confirmation set stays unset', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', tap_action: { action: 'toggle', confirmation: { text: 'Go?' } } });
    assert.equal(control(editor, 'Confirmation text (optional)').value, 'Go?');
    editor._config = { ...editor._config, tap_action: { action: 'toggle' } };
    editor._valueChanged('tap_action.confirmation_text', '');
    assert.equal('confirmation' in lastConfig(editor).tap_action, false);
  });
});

describe('severity rows', () => {
  test('rows start from the config, including deprecated color names', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', severity: [{ value: 5, bnStyle: 'red', color: 'white' }, {}] });
    const [a, b] = rows(editor).map(rowFields);
    assert.deepEqual([a[0].value, a[1].value, a[2].value], [5, 'red', 'white']);
    assert.deepEqual([b[0].value, b[1].value, b[2].value], ['', '', '']);
  });

  test('editing colors replaces deprecated keys', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', severity: [{ value: 5, bnStyle: 'red', color: 'white' }] });
    const [, fill, text] = rowFields(rows(editor)[0]);
    fireValue(fill, 'green');
    fireValue(text, 'black');
    assert.deepEqual(lastConfig(editor).severity, [{ value: 5, fill_color: 'green', text_color: 'black' }]);
  });

  test('Add appends a row; Remove drops one, focuses Add, and removes the key when empty', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    const add = editor.shadowRoot.querySelector('.add-button');
    add.click();
    add.click();
    assert.equal(rows(editor).length, 2);
    assert.deepEqual(lastConfig(editor).severity, [{ value: 0, fill_color: '#cccccc' }, { value: 0, fill_color: '#cccccc' }]);
    const remove = rows(editor)[0].querySelector('.remove-button');
    assert.equal(remove.textContent, 'Remove severity level 1');
    remove.click();
    assert.equal(rows(editor).length, 1);
    assert.equal(editor.shadowRoot.activeElement?.className, 'add-button');
    rows(editor)[0].querySelector('.remove-button').click();
    assert.equal('severity' in lastConfig(editor), false);
  });

  test('editing a row with no severity list yet starts one', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    editor._updateSeverity(0, 'value', 3);
    assert.deepEqual(lastConfig(editor).severity, [{ value: 3 }]);
    editor._config = { entity: 'sensor.p' };
    editor._removeSeverity(0);
    assert.equal('severity' in lastConfig(editor), false);
  });

  test('_rebuildSeverityList before render does nothing', () => {
    const editor = document.createElement('bignumber-card-editor');
    editor._rebuildSeverityList();
    assert.equal(editor.shadowRoot.childElementCount, 0);
  });
});
