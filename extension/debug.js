(() => {
  'use strict';

  function init() {
    if (!document.querySelector('#tap-start, #scr-settings')) return;

    let enabled = false;
    let settingChanged = false;
    let host;
    let output;
    let frameId;
    let observer;
    let started;
    let previous;
    let frames = 0;
    let maxGap = 0;
    let slowFrames = 0;
    let longTasks = 0;
    let longTaskMs = 0;
    let observing = false;
    let networkText = '확인 중';
    let networkAge = 0;
    let timingAge = 0;
    let channelSelect, networkValues, graphAxis, sendLine, receiveLine, referenceLine;
    const history = new Map();
    let graphNow = 0;
    let channelOptions = '';

    function drawNetwork() {
      const entry = history.get(Number(channelSelect.value));
      if (!entry) {
        networkValues.textContent = '송수신: 열린 게임 채널 없음';
        sendLine.setAttribute('points', '');
        receiveLine.setAttribute('points', '');
        return;
      }
      const { row, samples } = entry;
      const ceiling = Math.ceil(Math.max(300, ...samples.flatMap(item => [item.send, item.receive])) / 100) * 100;
      graphAxis.textContent = `${ceiling} ms`;
      const y = value => 12 + 76 * (1 - value / ceiling);
      referenceLine.setAttribute('d', `M40 ${y(300)} H340`);
      for (const [direction, line] of [['send', sendLine], ['receive', receiveLine]]) {
        line.setAttribute('points', samples.map(item => `${(340 - (graphNow - item.now) / 100).toFixed(1)},${y(item[direction]).toFixed(1)}`).join(' '));
      }
      const ms = value => value === null ? '—' : value.toFixed(0);
      networkValues.textContent = [['send', '송신'], ['receive', '수신']].map(([key, label]) => {
        const value = row[key];
        const rate = row.elapsed > 0 ? (value.count * 1000 / row.elapsed).toFixed(1) : '—';
        return `${label} ${rate}회/s · 평균 ${ms(value.average)} ms\n`
          + `  최대(누적) ${ms(value.peak)} · 대기 ${ms(value.idle)} ms`;
      }).join('\n') + `\n송신 큐 ${(row.buffered / 1024).toFixed(1)} KiB`;
    }

    document.addEventListener('psko:network-timing', event => {
      if (!host) return;
      const data = event.detail;
      const number = value => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
      const validCounter = value => value && ['count', 'max', 'peak', 'idle'].every(key => number(value[key]))
        && (value.average === null || number(value.average));
      if (!data || !number(data.now) || data.now < graphNow || !Array.isArray(data.channels) || data.channels.length > 32
        || !data.channels.every(row => row && Number.isSafeInteger(row.id) && row.id > 0 && Number.isSafeInteger(row.peer) && row.peer > 0
          && ['s', 'g'].includes(row.label) && number(row.elapsed) && number(row.buffered) && validCounter(row.send) && validCounter(row.receive))) return;
      graphNow = data.now;
      timingAge = 0;
      const ids = new Set(data.channels.map(row => row.id));
      for (const id of history.keys()) if (!ids.has(id)) history.delete(id);
      for (const row of data.channels) {
        const entry = history.get(row.id) || { samples: [] };
        entry.row = row;
        entry.samples = entry.samples.filter(item => item.now >= graphNow - 30000 && item.now < graphNow).slice(-30);
        entry.samples.push({ now: graphNow, send: row.send.max, receive: row.receive.max });
        history.set(row.id, entry);
      }
      const rows = [...data.channels].sort((a, b) => a.peer - b.peer || b.label.localeCompare(a.label) || a.id - b.id);
      const options = rows.map(row => row.id).join(',');
      if (options !== channelOptions) {
        channelOptions = options;
        const selected = Number(channelSelect.value);
        channelSelect.replaceChildren(...rows.map(row => {
          const option = document.createElement('option');
          option.value = String(row.id);
          option.textContent = `연결 ${row.peer} · ${row.label === 's' ? '상태(s)' : '일반(g)'}`;
          return option;
        }));
        channelSelect.value = String(ids.has(selected) ? selected : (rows[0]?.id ?? ''));
      }
      channelSelect.disabled = !rows.length;
      drawNetwork();
    });
    document.addEventListener('psko:network-status', event => {
      if (!host) return;
      const labels = { direct: '직결', turn: 'TURN', connecting: '연결 중', disconnected: '연결 끊김', unknown: '확인 불가' };
      const counts = event.detail;
      if (!counts || !Object.keys(labels).every(key => Number.isSafeInteger(counts[key]) && counts[key] >= 0 && counts[key] <= 1000)) return;
      networkText = Object.entries(labels).filter(([key]) => counts[key]).map(([key, label]) => `${label} ${counts[key]}`).join(' · ') || '연결 없음';
      networkAge = 0;
    });

    function resetWindow() {
      frames = maxGap = slowFrames = longTasks = longTaskMs = 0;
    }

    function frame(now) {
      if (previous === undefined) {
        started = now;
      } else {
        const gap = now - previous;
        frames++;
        maxGap = Math.max(maxGap, gap);
        if (gap > 50) slowFrames++;
      }
      previous = now;
      const elapsed = now - started;
      if (elapsed >= 1000) {
        networkAge++;
        timingAge++;
        document.dispatchEvent(new Event('psko:network-query'));
        const heap = performance.memory?.usedJSHeapSize;
        output.textContent = `DEBUG · 최근 ${(elapsed / 1000).toFixed(1)}초\n`
          + `FPS (rAF) ${(frames * 1000 / elapsed).toFixed(1)}\n`
          + `프레임 간격 ${(elapsed / frames).toFixed(1)} / 최대 ${maxGap.toFixed(1)} ms\n`
          + `50ms 초과 간격 ${slowFrames}회\n`
          + `긴 작업 (50ms+) ${observing ? `${longTasks}회 / ${longTaskMs.toFixed(1)} ms` : '지원 안 됨'}\n`
          + `JS 힙 ${Number.isFinite(heap) ? `≈ ${(heap / 1048576).toFixed(1)} MiB` : '지원 안 됨'}\n`
          + `통신: ${networkAge > 2 ? '확인 불가' : networkText}\n`
          + 'rAF 기준 · GPU 지연 미포함';
        if (timingAge > 2) {
          networkValues.textContent = '송수신: 측정 응답 없음';
          sendLine.setAttribute('points', '');
          receiveLine.setAttribute('points', '');
        }
        started = now;
        resetWindow();
      }
      frameId = requestAnimationFrame(frame);
    }

    function stop() {
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      frameId = undefined;
      observer?.disconnect();
      observer = undefined;
      observing = false;
      host?.remove();
      host = output = undefined;
      previous = undefined;
      networkText = '확인 중';
      networkAge = 0;
      timingAge = 0;
      history.clear();
      graphNow = 0;
      channelOptions = '';
      resetWindow();
    }

    function place() {
      if (host) (document.fullscreenElement || document.documentElement).append(host);
    }

    function sync() {
      if (!enabled || document.visibilityState !== 'visible') {
        stop();
        return;
      }
      if (host) return;
      host = document.createElement('div');
      host.id = 'psko-debug';
      host.setAttribute('data-psko-ui', '');
      host.setAttribute('translate', 'no');
      host.style.cssText = 'all:initial!important;position:fixed!important;top:8px!important;left:8px!important;z-index:2147483647!important;pointer-events:none!important;';
      const shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = 'pre,.network{box-sizing:border-box;width:360px;max-width:calc(100vw - 16px);margin:0;padding:8px 10px;background:#101a33f2;color:#f3f6ff;font:11px/1.5 monospace;white-space:pre;pointer-events:none}pre{border-radius:6px 6px 0 0}.network{border-radius:0 0 6px 6px;padding-top:0;white-space:normal}.network pre{width:auto;padding:0;background:none}select{max-width:100%;background:#1e3055;color:#fff;border:1px solid #7890b0;border-radius:3px;font:inherit;pointer-events:auto}svg{display:block;width:100%;height:auto}';
      output = document.createElement('pre');
      output.textContent = 'DEBUG · 측정 중…';
      shadow.append(style, output);
      const network = document.createElement('div');
      network.className = 'network';
      channelSelect = document.createElement('select');
      channelSelect.setAttribute('aria-label', '송수신 그래프 연결 및 채널');
      channelSelect.addEventListener('change', drawNetwork);
      channelSelect.addEventListener('keydown', event => event.stopPropagation());
      channelSelect.disabled = true;
      const legend = document.createElement('div');
      legend.textContent = '송신(노랑 점선) · 수신(하늘 실선)\n최근 30초 · 구간 최대 간격(대기 포함)';
      legend.style.whiteSpace = 'pre-line';
      const svg = (tag, attributes = {}) => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
        return node;
      };
      const graph = svg('svg', { viewBox: '0 0 350 110', role: 'img', 'aria-label': '최근 30초 송신 수신 최대 간격 그래프. 수치는 아래 표시.' });
      graphAxis = svg('text', { x: 0, y: 10, fill: '#e1e8f5', 'font-size': 10 });
      graphAxis.id = 'network-axis';
      graphAxis.textContent = '300 ms';
      referenceLine = svg('path', { d: 'M40 12 H340', stroke: '#63718a', 'stroke-dasharray': '2 3' });
      const baseline = svg('path', { d: 'M40 12 V88 H340', stroke: '#63718a', fill: 'none' });
      sendLine = svg('polyline', { fill: 'none', stroke: '#ffd75e', 'stroke-width': 2, 'stroke-dasharray': '4 3' });
      receiveLine = svg('polyline', { fill: 'none', stroke: '#70e5ff', 'stroke-width': 1.5 });
      sendLine.id = 'network-send'; receiveLine.id = 'network-receive';
      graph.append(graphAxis, referenceLine, baseline, sendLine, receiveLine);
      for (const [x, y, text] of [[20, 91, '0'], [40, 105, '-30초'], [312, 105, '현재']]) {
        const label = svg('text', { x, y, fill: '#b7c6de', 'font-size': 10 });
        label.textContent = text;
        graph.append(label);
      }
      networkValues = document.createElement('pre');
      networkValues.id = 'network-values';
      networkValues.textContent = '송수신: 측정 중…';
      const note = document.createElement('div');
      note.textContent = '간격 ≠ 통신 지연 · 일시정지도 공백에 포함';
      network.append(channelSelect, legend, graph, networkValues, note);
      shadow.append(network);
      place();
      if (globalThis.PerformanceObserver?.supportedEntryTypes.includes('longtask')) {
        try {
          observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              longTasks++;
              longTaskMs += entry.duration;
            }
          });
          observer.observe({ type: 'longtask' });
          observing = true;
        } catch {
          observer?.disconnect();
          observer = undefined;
        }
      }
      frameId = requestAnimationFrame(frame);
    }

    document.addEventListener('visibilitychange', sync);
    document.addEventListener('fullscreenchange', place);
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', sync);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.debug) return;
      settingChanged = true;
      enabled = changes.debug.newValue === true;
      sync();
    });
    chrome.storage.local.get({ debug: false }).then(settings => {
      if (settingChanged) return;
      enabled = settings.debug === true;
      sync();
    }).catch(() => {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
