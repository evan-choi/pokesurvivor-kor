import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('network preferences survive a stale initial read without publishing premature language changes', async () => {
  const document = new EventTarget();
  class CustomEvent extends Event {
    constructor(name, { detail } = {}) { super(name); this.detail = detail; }
  }
  const languages = [];
  const networks = [];
  document.addEventListener('psko:settings', event => languages.push(event.detail));
  document.addEventListener('psko:network-settings', event => networks.push(JSON.parse(JSON.stringify(event.detail))));
  let changed, finish;
  const chrome = { storage: {
    local: { get: () => new Promise(resolve => { finish = resolve; }) },
    onChanged: { addListener: listener => { changed = listener; } },
  } };
  vm.runInNewContext(readFileSync(new URL('../extension/storage.js', import.meta.url), 'utf8'), { document, chrome, CustomEvent, Event });
  changed({ lanDirect: { newValue: true } }, 'local');
  document.dispatchEvent(new Event('psko:ready'));
  assert.deepEqual(languages, []);
  assert.deepEqual(networks, []);
  finish({ enabled: false, lanDirect: false, debug: true });
  await Promise.resolve();
  assert.deepEqual(languages, [false]);
  assert.deepEqual(networks, [{ lanDirect: true, debug: false }]);
  changed({ debug: { newValue: false } }, 'local');
  assert.deepEqual(languages, [false]);
  assert.deepEqual(networks.at(-1), { lanDirect: true, debug: false });
  document.dispatchEvent(new Event('psko:network-ready'));
  assert.deepEqual(networks.at(-1), { lanDirect: true, debug: false });
});
