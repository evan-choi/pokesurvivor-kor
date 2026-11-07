import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../extension/debug.js', import.meta.url), 'utf8');

async function boot({ debug = false, game = true, supported = true } = {}) {
  const raf = new Map();
  const observers = new Set();
  let nextId = 0;
  let storageListener;
  class Element extends EventTarget {
    attributes = {};
    children = [];
    style = {};
    textContent = '';
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key]; }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    append(...children) {
      for (const child of children) {
        child.remove();
        child.parent = this;
        this.children.push(child);
      }
    }
    attachShadow() { return this.shadowRoot = new Element(); }
    remove() {
      if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
      this.parent = undefined;
    }
  }
  const document = Object.assign(new EventTarget(), {
    readyState: 'complete', visibilityState: 'visible',
    documentElement: new Element(),
    querySelector: () => game ? {} : null,
    createElement: () => new Element(),
    createElementNS: () => new Element(),
  });
  const window = new EventTarget();
  class PerformanceObserver {
    static supportedEntryTypes = supported ? ['longtask'] : [];
    constructor(callback) { this.callback = callback; }
    observe() { observers.add(this); }
    disconnect() { observers.delete(this); }
  }
  const context = vm.createContext({
    document, window, PerformanceObserver, Event,
    performance: supported ? { memory: { usedJSHeapSize: 64 * 1048576 } } : {},
    requestAnimationFrame(callback) { const id = ++nextId; raf.set(id, callback); return id; },
    cancelAnimationFrame(id) { raf.delete(id); },
    chrome: { storage: {
      local: { get: async () => ({ debug }) },
      onChanged: { addListener: listener => { storageListener = listener; } },
    } },
  });
  vm.runInContext(source, context);
  await Promise.resolve();
  return {
    document, window, raf, observers,
    text: () => document.documentElement.children[0]?.shadowRoot.children[1].textContent,
    root: () => document.documentElement.children[0]?.shadowRoot,
    change: (value, area = 'local') => storageListener?.({ debug: { newValue: value } }, area),
    tick(now) {
      const callbacks = [...raf.values()];
      raf.clear();
      for (const callback of callbacks) callback(now);
    },
    visibility(value) {
      document.visibilityState = value;
      document.dispatchEvent(new Event('visibilitychange'));
    },
  };
}

test('debug does no sampling by default and fully stops when disabled', async () => {
  const env = await boot();
  assert.equal(env.raf.size, 0);
  assert.equal(env.observers.size, 0);
  assert.equal(env.text(), undefined);
  env.change(true, 'sync');
  assert.equal(env.raf.size, 0);
  env.change(true);
  env.change(true);
  assert.equal(env.raf.size, 1);
  assert.equal(env.observers.size, 1);
  assert.equal(env.document.documentElement.children.length, 1);
  env.change(false);
  assert.equal(env.raf.size, 0);
  assert.equal(env.observers.size, 0);
  assert.equal(env.text(), undefined);
});

test('graphs bounded send/receive gap history with current silence, per-channel selection and strict input validation', async () => {
  const env = await boot({ debug: true });
  const find = id => {
    const walk = node => node?.id === id ? node : node?.children.map(walk).find(Boolean);
    return walk(env.root());
  };
  const counter = max => ({ count: 15, average: 67, max, peak: max, idle: 10 });
  const timing = (now, max = 67) => env.document.dispatchEvent(Object.assign(new Event('psko:network-timing'), {
    detail: { now, channels: [{ id: 1, peer: 1, label: 's', elapsed: 1000, buffered: 0, send: counter(67), receive: counter(max) }] },
  }));
  for (let i = 1; i <= 40; i++) timing(i * 1000, i === 35 ? 800 : 67);
  const path = find('network-receive');
  assert.ok(path, 'receive graph is present');
  assert.ok(path.getAttribute('points').split(' ').length <= 31);
  assert.notEqual(path.getAttribute('points'), find('network-send').getAttribute('points'));
  assert.match(find('network-values').textContent, /수신 15\.0회\/s/);
  assert.match(find('network-axis').textContent, /800 ms/);
  const before = path.getAttribute('points');
  timing(41000, '<script>');
  assert.equal(path.getAttribute('points'), before);
  env.change(false);
  env.change(true);
  assert.equal(find('network-receive').getAttribute('points'), undefined);
});

test('reports timed frame intervals, long tasks and approximate heap without accumulating old samples', async () => {
  const env = await boot({ debug: true });
  env.tick(0);
  for (let i = 1; i < 60; i++) env.tick(i * 1000 / 60);
  for (const observer of env.observers) observer.callback({ getEntries: () => [{ duration: 80 }] });
  env.tick(1000);
  assert.match(env.text(), /FPS \(rAF\) 60\.0/);
  assert.match(env.text(), /프레임 간격 16\.7 \/ 최대 16\.7 ms/);
  assert.match(env.text(), /긴 작업 \(50ms\+\) 1회 \/ 80\.0 ms/);
  assert.match(env.text(), /JS 힙 ≈ 64\.0 MiB/);
  for (let i = 1; i <= 60; i++) env.tick(1000 + i * 1000 / 60);
  assert.match(env.text(), /긴 작업 \(50ms\+\) 0회 \/ 0\.0 ms/);
  env.tick(2100);
  for (let i = 1; i <= 54; i++) env.tick(2100 + i * 1000 / 60);
  assert.match(env.text(), /최대 100\.0 ms/);
  assert.match(env.text(), /50ms 초과 간격 1회/);
});

test('background and page lifecycle pause collection and resume without counting the hidden gap', async () => {
  const env = await boot({ debug: true });
  env.tick(0);
  env.visibility('hidden');
  assert.equal(env.raf.size, 0);
  assert.equal(env.observers.size, 0);
  assert.equal(env.text(), undefined);
  env.visibility('visible');
  env.tick(10000);
  for (let i = 1; i <= 60; i++) env.tick(10000 + i * 1000 / 60);
  assert.match(env.text(), /FPS \(rAF\) 60\.0/);
  assert.match(env.text(), /50ms 초과 간격 0회/);
  env.window.dispatchEvent(new Event('pagehide'));
  assert.equal(env.raf.size, 0);
  env.window.dispatchEvent(new Event('pageshow'));
  assert.equal(env.raf.size, 1);
});

test('skips non-game documents and labels unsupported metrics instead of showing zero', async () => {
  const other = await boot({ debug: true, game: false });
  assert.equal(other.raf.size, 0);
  assert.equal(other.text(), undefined);
  const env = await boot({ debug: true, supported: false });
  env.tick(0);
  env.tick(1000);
  assert.match(env.text(), /긴 작업 \(50ms\+\) 지원 안 됨/);
  assert.match(env.text(), /JS 힙 지원 안 됨/);
  assert.equal(env.observers.size, 0);
});

test('network status uses validated counts and expires when responses stop', async () => {
  const env = await boot({ debug: true });
  env.tick(0);
  const status = counts => env.document.dispatchEvent(Object.assign(new Event('psko:network-status'), { detail: counts }));
  status({ direct: 1, turn: 2, connecting: 0, disconnected: 0, unknown: 0 });
  env.tick(1000);
  assert.match(env.text(), /통신: 직결 1 · TURN 2/);
  status({ direct: '<script>', turn: 0, connecting: 0, disconnected: 0, unknown: 0 });
  env.tick(2000);
  assert.match(env.text(), /통신: 직결 1 · TURN 2/);
  env.tick(3000);
  assert.match(env.text(), /통신: 확인 불가/);
  env.change(false);
  status({ direct: 5, turn: 0, connecting: 0, disconnected: 0, unknown: 0 });
  env.change(true);
  env.tick(4000);
  env.tick(5000);
  assert.match(env.text(), /통신: 확인 중/);
});
