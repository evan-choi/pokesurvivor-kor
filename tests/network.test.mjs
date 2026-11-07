import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../extension/network.js', import.meta.url), 'utf8');
class CustomEvent extends Event {
  constructor(name, { detail } = {}) { super(name); this.detail = detail; }
}

function boot({ game = true } = {}) {
  let now = 0;
  class Channel extends EventTarget {
    readyState = 'open';
    bufferedAmount = 0;
    sent = [];
    constructor(label) { super(); this.label = label; }
    send(data) {
      if (this.readyState !== 'open') throw new Error('not open');
      this.sent.push(data);
      return 'native result';
    }
    receive(data) { this.dispatchEvent(Object.assign(new Event('message'), { data })); }
  }
  class NativePeer extends EventTarget {
    static marker = 'native';
    connectionState = 'connected';
    report = new Map();
    calls = 0;
    constructor(config) { super(); this.config = config; }
    createDataChannel(label) { return new Channel(label); }
    getStats() { this.calls++; return Promise.resolve(this.report); }
    close() { this.connectionState = 'closed'; }
  }
  const document = Object.assign(new EventTarget(), { querySelector: () => game, visibilityState: 'visible' });
  const context = vm.createContext({ document, RTCPeerConnection: NativePeer, WeakRef, Event, CustomEvent, performance: { now: () => now } });
  vm.runInContext(source, context);
  return {
    document, NativePeer, Channel, Peer: context.RTCPeerConnection,
    time(value) { now = value; },
    timing() {
      let result;
      document.addEventListener('psko:network-timing', event => { result = JSON.parse(JSON.stringify(event.detail)); }, { once: true });
      document.dispatchEvent(new Event('psko:network-query'));
      return result;
    },
    settings(detail) { document.dispatchEvent(new CustomEvent('psko:network-settings', { detail })); },
    query() {
      return new Promise(resolve => {
        document.addEventListener('psko:network-status', event => resolve(JSON.parse(JSON.stringify(event.detail))), { once: true });
        document.dispatchEvent(new Event('psko:network-query'));
      });
    },
  };
}

function report(local = 'host', remote = 'host', selected = true) {
  return new Map([
    ['transport', { type: 'transport', selectedCandidatePairId: selected ? 'pair' : undefined }],
    ['pair', { type: 'candidate-pair', state: 'succeeded', nominated: true, localCandidateId: 'local', remoteCandidateId: 'remote' }],
    ['local', { type: 'local-candidate', candidateType: local, address: 'private-not-for-display' }],
    ['remote', { type: 'remote-candidate', candidateType: remote }],
    ['unused', { type: 'local-candidate', candidateType: 'relay' }],
  ]);
}

test('LAN is off by default, preserves config and existing peers, and supports native identity', () => {
  const env = boot();
  const config = { iceTransportPolicy: 'relay', iceServers: [{ urls: 'turn:example.invalid', credential: 'secret' }], bundlePolicy: 'max-bundle' };
  const before = new env.Peer(config);
  assert.equal(before.config, config);
  env.settings({ lanDirect: true });
  const after = new env.Peer(config);
  assert.equal(after.config.iceTransportPolicy, 'all');
  assert.equal(after.config.iceServers, config.iceServers);
  assert.equal(after.config.bundlePolicy, 'max-bundle');
  assert.equal(before.config.iceTransportPolicy, 'relay');
  assert.equal(config.iceTransportPolicy, 'relay');
  assert.ok(after instanceof env.Peer);
  assert.ok(after instanceof env.NativePeer);
  assert.equal(env.Peer.marker, 'native');
  class Child extends env.Peer {}
  assert.ok(new Child(config) instanceof Child);
  env.settings({ lanDirect: false });
  assert.equal(new env.Peer(config).config, config);
});

test('measures per-channel send/receive intervals, pending gaps and bounded counters without reading payloads', () => {
  const env = boot();
  const pc = new env.Peer();
  const s = pc.createDataChannel('s');
  const g = pc.createDataChannel('g');
  const payload = { toString() { throw new Error('must not inspect payload'); } };
  env.settings({ debug: true });
  env.time(100); assert.equal(s.send(payload), 'native result');
  env.time(160); s.send(payload); s.receive(payload);
  env.time(230); s.receive(payload);
  env.time(1000);
  const first = env.timing();
  assert.equal(first.channels.length, 2);
  const row = first.channels.find(row => row.label === 's');
  assert.deepEqual(row.send, { count: 2, average: 60, max: 840, peak: 840, idle: 840 });
  assert.deepEqual(row.receive, { count: 2, average: 70, max: 770, peak: 770, idle: 770 });
  assert.equal(row.elapsed, 1000);
  assert.equal(s.sent[0], payload);
  env.time(1100); s.receive(payload);
  env.time(1200); s.receive(payload);
  env.time(2000);
  const second = env.timing().channels.find(row => row.label === 's');
  assert.equal(second.send.count, 0);
  assert.equal(second.send.average, null);
  assert.equal(second.receive.average, 485);
  assert.equal(second.receive.peak, 870);
  assert.equal(g.sent.length, 0);
});

test('tracks remote channels and separate peers; off/hidden restores send and resets old gaps', () => {
  const env = boot();
  const a = new env.Peer(); const b = new env.Peer();
  const s = a.createDataChannel('s'); const other = new env.Channel('s');
  const nativeSend = s.send;
  b.dispatchEvent(Object.assign(new Event('datachannel'), { channel: other }));
  env.settings({ debug: true });
  env.time(50); s.send('a'); other.receive('b');
  env.time(100);
  const rows = env.timing().channels;
  assert.equal(new Set(rows.map(row => row.peer)).size, 2);
  assert.equal(rows[0].send.count, 1);
  assert.equal(rows[1].receive.count, 1);
  env.settings({ debug: false });
  assert.equal(s.send, nativeSend);
  env.time(5000); s.send('not sampled');
  env.settings({ debug: true });
  env.time(5100);
  assert.equal(env.timing().channels[0].send.count, 0);
  assert.equal(env.timing().channels[0].send.idle, 100);
  env.document.visibilityState = 'hidden';
  env.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(s.send, nativeSend);
  env.time(10000);
  env.document.visibilityState = 'visible';
  env.document.dispatchEvent(new Event('visibilitychange'));
  env.time(10100);
  assert.equal(env.timing().channels[0].send.idle, 100);
  s.readyState = 'closed';
  assert.throws(() => s.send('bad'), /not open/);
  a.close();
  assert.equal(env.timing().channels.length, 1);
});

test('send exceptions and receivers are preserved and external wrappers do not double-count after toggling', () => {
  const env = boot(); const pc = new env.Peer();
  const channel = pc.createDataChannel('s');
  const expected = new Error('native failure');
  channel.send = function (value) {
    if (value === 'fail') throw expected;
    this.sent.push(value);
    return 42;
  };
  env.settings({ debug: true });
  assert.throws(() => channel.send('fail'), error => error === expected);
  const instrumented = channel.send;
  channel.send = function (value) { return instrumented.call(this, value); };
  const external = channel.send;
  env.settings({ debug: false });
  assert.equal(channel.send, external);
  env.settings({ debug: true });
  env.time(50); assert.equal(channel.send('ok'), 42);
  const receiver = { sent: [] };
  assert.equal(channel.send.call(receiver, 'borrowed'), 42);
  assert.deepEqual(receiver.sent, ['borrowed']);
  env.time(100);
  assert.equal(env.timing().channels[0].send.count, 1);
});

test('only selected candidate pairs decide direct vs TURN, including a remote relay', async () => {
  const env = boot();
  env.settings({ debug: true });
  const direct = new env.Peer(); direct.report = report('srflx', 'prflx');
  const relay = new env.Peer(); relay.report = report('host', 'relay');
  const unknown = new env.Peer(); unknown.report = report('relay', 'host', false);
  assert.deepEqual(await env.query(), { direct: 1, turn: 1, unknown: 1, connecting: 0, disconnected: 0 });
  relay.report = report('host', 'host');
  direct.close();
  unknown.report = new Map();
  assert.deepEqual(await env.query(), { direct: 1, turn: 0, unknown: 1, connecting: 0, disconnected: 0 });
});

test('connection failures and rejected stats never masquerade as direct connections', async () => {
  const env = boot(); env.settings({ debug: true });
  const waiting = new env.Peer(); waiting.connectionState = 'connecting';
  const failed = new env.Peer(); failed.connectionState = 'failed';
  const broken = new env.Peer(); broken.getStats = () => Promise.reject(new Error('closed'));
  const missing = new env.Peer(); missing.report = report(undefined, 'host'); missing.report.delete('local');
  assert.deepEqual(await env.query(), { direct: 0, turn: 0, unknown: 2, connecting: 1, disconnected: 1 });
  for (const pc of [waiting, failed, broken, missing]) pc.close();
  assert.deepEqual(await env.query(), { direct: 0, turn: 0, unknown: 0, connecting: 0, disconnected: 0 });
});

test('debug off or hidden never gathers stats, and overlapping requests are ignored', async () => {
  const env = boot(); const pc = new env.Peer();
  env.document.dispatchEvent(new Event('psko:network-query'));
  assert.equal(pc.calls, 0);
  env.settings({ debug: true }); env.document.visibilityState = 'hidden';
  env.document.dispatchEvent(new Event('psko:network-query'));
  assert.equal(pc.calls, 0);
  env.document.visibilityState = 'visible';
  let finish;
  pc.getStats = () => { pc.calls++; return new Promise(resolve => { finish = resolve; }); };
  const result = env.query();
  env.document.dispatchEvent(new Event('psko:network-query'));
  assert.equal(pc.calls, 1);
  pc.close(); finish(report());
  assert.equal((await result).direct, 0);
});

test('host documents are untouched and untracked even with LAN enabled', async () => {
  const env = boot({ game: false }); env.settings({ debug: true, lanDirect: true });
  const config = { iceTransportPolicy: 'relay' };
  const pc = new env.Peer(config);
  assert.equal(pc.config, config);
  assert.deepEqual(await env.query(), { direct: 0, turn: 0, unknown: 0, connecting: 0, disconnected: 0 });
  assert.equal(pc.calls, 0);
});
