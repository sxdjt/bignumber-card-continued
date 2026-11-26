// Test environment for bignumber-card.js.
//
// The tests load the card file itself (the exact file Home Assistant loads) into a
// happy-dom window. happy-dom is a dev-only dependency: it gives the card a real DOM
// (shadow roots, innerHTML, querySelector, composed events) without a browser.
//
// Home Assistant's own elements (ha-card, ha-selector, ha-switch, ha-icon,
// ha-expansion-panel) are not defined here. They behave as plain unknown elements: the
// card only sets properties on them and listens for their events, which tests fire.
//
// IMPORTANT: never pass a DOM node to assert. A failing assertion inspects the node,
// which walks the whole happy-dom window without end (see tests/README.md).

import { createRequire } from 'node:module';
import { Window } from 'happy-dom';

// The card is loaded with require(), not by happy-dom, so happy-dom never needs to run
// scripts or fetch anything. Disabling both keeps injected markup inert.
export const window = new Window({
  url: 'http://localhost:8123/lovelace/0',
  settings: {
    disableJavaScriptEvaluation: true,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
    handleDisabledFileLoadingAsSuccess: true,
  },
});

for (const key of ['document', 'HTMLElement', 'customElements', 'CustomEvent', 'Event', 'CSS', 'KeyboardEvent']) {
  globalThis[key] = window[key];
}
globalThis.window = window;

// happy-dom does not resolve colors in computed style, so the editor's swatch never
// syncs. Stand-in: hex and a few named colors resolve to rgb(), anything else to ''.
const NAMED_RGB = { red: [255, 0, 0], green: [0, 128, 0], blue: [0, 0, 255], black: [0, 0, 0], white: [255, 255, 255] };
globalThis.getComputedStyle = (el) => {
  const v = String(el.style.color || '').trim().toLowerCase();
  let rgb = NAMED_RGB[v];
  const hex = v.match(/^#([0-9a-f]{6})$/);
  if (hex) rgb = [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
  return { color: rgb ? `rgb(${rgb.join(', ')})` : '' };
};

// The editor blocks config-changed until the next animation frame after a render.
// Node timers stand in so tests can wait for it with nextFrame().
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
export const nextFrame = () => new Promise((r) => setTimeout(r, 0));

// happy-dom's CSS.supports returns true for any value. Stand-in for the one query the
// editor makes, ('color', value). window.CSS returns a new object on each access, so
// the patch goes on the global object the card reads.
const NAMED_COLORS = new Set(['red', 'green', 'blue', 'black', 'white', 'orange', 'yellow', 'transparent', 'currentcolor']);
export function isColor(value) {
  const v = String(value).trim().toLowerCase();
  return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(v)
    || /^(rgb|rgba|hsl|hsla|var)\(.+\)$/.test(v)
    || NAMED_COLORS.has(v);
}
globalThis.CSS.supports = (property, value) => {
  if (property !== 'color') throw new Error(`CSS.supports stand-in only handles 'color', got '${property}'`);
  return isColor(value);
};

// Browser dialogs and navigation are recorded, never performed
export const browser = { confirmAnswer: true, confirms: [], opened: [] };
window.confirm = (text) => { browser.confirms.push(text); return browser.confirmAnswer; };
window.open = (url) => { browser.opened.push(url); return null; };

const require = createRequire(import.meta.url);
require('../../bignumber-card.js');

export const document = window.document;
export const Card = window.customElements.get('bignumber-card');
export const Editor = window.customElements.get('bignumber-card-editor');

// --- fixtures ---

export function stateObj(state, attributes = {}) {
  return { state, attributes };
}

// states: { 'sensor.a': stateObj('5', {...}) } or { 'sensor.a': '5' }
export function makeHass(states = {}, extra = {}) {
  const normalized = {};
  for (const [id, s] of Object.entries(states)) {
    normalized[id] = typeof s === 'string' ? stateObj(s) : s;
  }
  const calls = [];
  return {
    states: normalized,
    calls,
    themes: { darkMode: false },
    callService: async (domain, service, data) => { calls.push({ domain, service, data }); },
    ...extra,
  };
}

// A copy of hass with some states replaced (new object, as HA does on every update)
export function withStates(hass, states) {
  const next = { ...hass, states: { ...hass.states } };
  for (const [id, s] of Object.entries(states)) next.states[id] = typeof s === 'string' ? stateObj(s) : s;
  return next;
}

// A card attached to the document, with config and hass applied
export function makeCard(config, hass) {
  const card = document.createElement('bignumber-card');
  const events = [];
  for (const type of ['hass-more-info', 'location-changed']) {
    card.addEventListener(type, (e) => events.push({ type, detail: e.detail }));
  }
  card.events = events;
  card.setConfig(config);
  document.body.appendChild(card);
  if (hass) card.hass = hass;
  return card;
}

export const haCard = (card) => card.shadowRoot.querySelector('ha-card');
export const valueEl = (card) => card.shadowRoot.getElementById('value');
export const cssVar = (card, name) => haCard(card).style.getPropertyValue(name);

export async function makeEditor(config = {}, hass = makeHass()) {
  const editor = document.createElement('bignumber-card-editor');
  const changes = [];
  editor.addEventListener('config-changed', (e) => changes.push(structuredClone(e.detail.config)));
  editor.changes = changes;
  editor.hass = hass;
  editor.setConfig(config);
  document.body.appendChild(editor);
  await nextFrame();
  return editor;
}

export const lastConfig = (editor) => editor.changes.at(-1);

// Fire the event an HA control would fire
export function fireValue(el, value) {
  el.dispatchEvent(new window.CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
}

// Editor control by its visible label (ha-selector .label, native select's <label>,
// switch's aria-label, or a color swatch's aria-label)
export function control(editor, label) {
  const root = editor.shadowRoot;
  const sel = [...root.querySelectorAll('ha-selector')].find((s) => s.label === label);
  if (sel) return sel;
  const lab = [...root.querySelectorAll('label')].find((l) => l.textContent === label);
  if (lab) return root.getElementById(lab.htmlFor);
  const aria = root.querySelector(`[aria-label="${label}"]`);
  if (aria) return aria;
  throw new Error(`no editor control labelled "${label}"`);
}

export function cleanup() {
  document.body.innerHTML = '';
  browser.confirmAnswer = true;
  browser.confirms.length = 0;
  browser.opened.length = 0;
}
