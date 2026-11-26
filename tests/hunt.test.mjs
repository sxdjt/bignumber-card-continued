// Bugs found in the step 4 hunt (docs/card-review-plan.md section 7). Each test moves to
// the matching card/editor test file when its fix lands.
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, makeEditor, makeHass, stateObj, haCard, valueEl, fireValue, lastConfig, control, cleanup, window } from './helpers/env.mjs';

afterEach(cleanup);

describe('BE3 (B6): dynamic bound attributes in the editor', () => {
  test('min/max entity attribute fields exist', { todo: 'min_entity_attribute and max_entity_attribute are YAML-only' }, async () => {
    const editor = await makeEditor({ entity: 'sensor.p', max_entity: 'climate.x', max_entity_attribute: 'max_temp' });
    assert.equal(control(editor, 'Maximum entity attribute (optional)').value, 'max_temp');
    assert.ok(control(editor, 'Minimum entity attribute (optional)'));
  });
});

describe('BE15 (B8): deprecated color names', () => {
  test('editing Text color replaces a deprecated color key', { todo: 'color stays in the config; clearing text_color brings it back' }, async () => {
    const editor = await makeEditor({ entity: 'sensor.p', color: 'red', bnStyle: 'blue' });
    fireValue(control(editor, 'Text color'), 'green');
    fireValue(control(editor, 'Fill color (bar/background)'), 'black');
    assert.equal('color' in lastConfig(editor), false);
    assert.equal('bnStyle' in lastConfig(editor), false);
    fireValue(control(editor, 'Text color'), '');
    assert.equal('color' in lastConfig(editor), false);
  });
});

