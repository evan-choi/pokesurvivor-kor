(() => {
  'use strict';

  const NativePeer = globalThis.RTCPeerConnection;
  if (typeof NativePeer !== 'function') return;
  const peers = new Set();
  let lanDirect = false;
  let debug = false;
  let querying = false;
  const channels = new Set();
  const channelData = new WeakMap();
  let peerId = 0;
  let channelId = 0;

  function counter() {
    return { last: null, count: 0, sum: 0, intervals: 0, max: 0, peak: 0 };
  }

  function record(counter, now) {
    if (counter.last !== null) {
      const gap = now - counter.last;
      counter.sum += gap;
      counter.intervals++;
      counter.max = Math.max(counter.max, gap);
      counter.peak = Math.max(counter.peak, gap);
    }
    counter.last = now;
    counter.count++;
  }

  function sample(counter, state, now) {
    const idle = now - (counter.last ?? state.started);
    const max = Math.max(counter.max, idle);
    counter.peak = Math.max(counter.peak, max);
    const result = { count: counter.count, average: counter.intervals ? counter.sum / counter.intervals : null, max, peak: counter.peak, idle };
    counter.count = counter.sum = counter.intervals = counter.max = 0;
    return result;
  }

  function syncChannel(channel, state) {
    const pc = state.pc.deref();
    const active = debug && document.visibilityState === 'visible' && channel.readyState === 'open'
      && !!pc && pc.connectionState !== 'closed';
    if (active === state.active) return;
    state.active = active;
    if (active) {
      state.started = state.sampled = performance.now();
      state.send = counter();
      state.receive = counter();
      state.descriptor = Object.getOwnPropertyDescriptor(channel, 'send');
      const wrapper = new Proxy(channel.send, {
        apply(target, receiver, args) {
          const result = Reflect.apply(target, receiver, args);
          if (state.active && state.wrapper === wrapper && receiver === channel) record(state.send, performance.now());
          return result;
        },
      });
      state.wrapper = wrapper;
      Object.defineProperty(channel, 'send', { configurable: true, writable: true, value: state.wrapper });
      channel.addEventListener('message', state.onMessage);
    } else {
      channel.removeEventListener('message', state.onMessage);
      if (channel.send === state.wrapper) {
        if (state.descriptor) Object.defineProperty(channel, 'send', state.descriptor);
        else delete channel.send;
      }
      state.send = state.receive = null;
    }
  }

  function liveChannels() {
    const result = [];
    for (const reference of channels) {
      const channel = reference.deref();
      if (!channel) { channels.delete(reference); continue; }
      const state = channelData.get(channel);
      syncChannel(channel, state);
      if (channel.readyState === 'closed' || !state.pc.deref() || state.pc.deref().connectionState === 'closed') channels.delete(reference);
      else result.push([channel, state]);
    }
    return result;
  }

  function trackChannel(channel, pc, peer) {
    // Track channel cadence only; never parse or retain game messages.
    if (!['s', 'g'].includes(channel.label) || channelData.has(channel)) return;
    const state = { id: ++channelId, peer, pc: new WeakRef(pc), active: false };
    state.onMessage = () => { if (state.active) record(state.receive, performance.now()); };
    channelData.set(channel, state);
    channels.add(new WeakRef(channel));
    channel.addEventListener('open', () => syncChannel(channel, state));
    channel.addEventListener('close', () => syncChannel(channel, state));
    syncChannel(channel, state);
  }

  function livePeers() {
    const result = [];
    for (const reference of peers) {
      const pc = reference.deref();
      if (!pc || pc.connectionState === 'closed') peers.delete(reference);
      else result.push(pc);
    }
    return result;
  }

  // Preserve native construction, static methods, subclasses and instanceof.
  globalThis.RTCPeerConnection = new Proxy(NativePeer, {
    construct(target, args, newTarget) {
      const game = !!document.querySelector('#tap-start, #scr-settings');
      if (game && lanDirect && (args[0] == null || typeof args[0] === 'object')) {
        args = [{ ...args[0], iceTransportPolicy: 'all' }, ...args.slice(1)];
      }
      const pc = Reflect.construct(target, args, newTarget);
      if (game) {
        livePeers();
        peers.add(new WeakRef(pc));
        const peer = ++peerId;
        pc.createDataChannel = new Proxy(pc.createDataChannel, {
          apply(target, receiver, args) {
            const channel = Reflect.apply(target, receiver, args);
            if (receiver === pc) trackChannel(channel, pc, peer);
            return channel;
          },
        });
        pc.addEventListener('datachannel', event => trackChannel(event.channel, pc, peer));
      }
      return pc;
    },
  });

  async function route(pc) {
    if (pc.connectionState === 'closed') return null;
    if (['failed', 'disconnected'].includes(pc.connectionState)) return 'disconnected';
    if (pc.connectionState !== 'connected') return 'connecting';
    try {
      const report = await pc.getStats();
      // State may change while Chrome gathers the report.
      if (pc.connectionState === 'closed') return null;
      if (pc.connectionState !== 'connected') return 'disconnected';
      let selected = false;
      let unknown = false;
      for (const stat of report.values()) {
        if (stat.type !== 'transport' || !stat.selectedCandidatePairId) continue;
        selected = true;
        const pair = report.get(stat.selectedCandidatePairId);
        const local = report.get(pair?.localCandidateId)?.candidateType;
        const remote = report.get(pair?.remoteCandidateId)?.candidateType;
        if (local === 'relay' || remote === 'relay') return 'turn';
        if (![local, remote].every(type => ['host', 'srflx', 'prflx'].includes(type))) unknown = true;
      }
      return selected && !unknown ? 'direct' : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  document.addEventListener('psko:network-settings', event => {
    if (typeof event.detail?.lanDirect === 'boolean') lanDirect = event.detail.lanDirect;
    if (typeof event.detail?.debug === 'boolean') debug = event.detail.debug;
    liveChannels();
  });
  document.addEventListener('visibilitychange', liveChannels);
  document.addEventListener('psko:network-query', async () => {
    if (!debug || document.visibilityState !== 'visible') return;
    const now = performance.now();
    const timing = [];
    for (const [channel, state] of liveChannels()) {
      if (!state.active) continue;
      timing.push({ id: state.id, peer: state.peer, label: channel.label, elapsed: now - state.sampled,
        send: sample(state.send, state, now), receive: sample(state.receive, state, now), buffered: channel.bufferedAmount });
      state.sampled = now;
    }
    document.dispatchEvent(new CustomEvent('psko:network-timing', { detail: { now, channels: timing } }));
    if (querying) return;
    querying = true;
    try {
      const routes = await Promise.all(livePeers().map(route));
      if (!debug || document.visibilityState !== 'visible') return;
      const counts = { direct: 0, turn: 0, connecting: 0, disconnected: 0, unknown: 0 };
      for (const value of routes) if (value) counts[value]++;
      // Only classifications cross worlds; never addresses, SDP or credentials.
      document.dispatchEvent(new CustomEvent('psko:network-status', { detail: counts }));
    } finally {
      querying = false;
    }
  });
  document.dispatchEvent(new Event('psko:network-ready'));
})();
