import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeEditor, fireValue, lastConfig, control, cleanup, nextFrame } from './helpers/env.mjs';

afterEach(cleanup);

const severityValues = (editor) => [...editor.shadowRoot.querySelectorAll('.severity-item')].map((row) => row.querySelector('ha-selector'));

describe('basic fields', () => {
  test('title change fires config-changed; clearing it removes the key', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    fireValue(control(editor, 'Title'), 'Power');
    assert.equal(lastConfig(editor).title, 'Power');
    fireValue(control(editor, 'Title'), '');
    assert.equal('title' in lastConfig(editor), false);
  });

  test('changes during the first frame after render are not fired', async () => {
    const editor = await makeEditor({ entity: 'sensor.p' });
    editor.render();
    fireValue(control(editor, 'Title'), 'Early');
    assert.equal(editor.changes.length, 0);
    await nextFrame();
    fireValue(control(editor, 'Title'), 'Late');
    assert.equal(lastConfig(editor).title, 'Late');
  });
});

describe('severity', () => {
  // BE5 (B4): 0 is a valid threshold
  test('a severity value of 0 is kept', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', severity: [{ value: 10, fill_color: 'red' }] });
    fireValue(severityValues(editor)[0], '0');
    assert.equal(lastConfig(editor).severity[0].value, 0);
  });

  test('clearing a severity value or color removes the key', async () => {
    const editor = await makeEditor({ entity: 'sensor.p', severity: [{ value: 10, fill_color: 'red' }] });
    fireValue(severityValues(editor)[0], '');
    assert.equal('value' in lastConfig(editor).severity[0], false);
  });
});

describe('setConfig after the first render', () => {
  // BE1 (B10/A11): render-once editor
  test('a YAML edit shows in the visual editor', { todo: 'setConfig renders only once, fields stay stale' }, async () => {
    const editor = await makeEditor({ entity: 'sensor.p', title: 'Old' });
    editor.setConfig({ entity: 'sensor.p', title: 'New', severity: [{ value: 1 }] });
    assert.equal(control(editor, 'Title').value, 'New');
    assert.equal(severityValues(editor).length, 1);
  });
});
