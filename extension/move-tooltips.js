(() => {
  'use strict';
  const info = globalThis.PSKO_MOVE_INFO;
  const proto = globalThis.CanvasRenderingContext2D?.prototype;
  if (!info || !proto) return;
  const icons = new WeakMap(), frames = new WeakMap();
  const mapSet = Map.prototype.set, drawImage = proto.drawImage, strokeRect = proto.strokeRect;
  let latest, pointer, tooltip, signature = '', korean = true, nextUpdate = 0;

  // The game's icon cache identifies otherwise indistinguishable Canvas images.
  Map.prototype.set = function (key, value) {
    const result = mapSet.call(this, key, value);
    if (typeof key === 'string' && value instanceof HTMLCanvasElement) {
      const id = key.startsWith('move:') ? key.slice(5) : `item:${key}`;
      if (info[id]) icons.set(value, id);
    }
    return result;
  };
  proto.drawImage = function (image, ...args) {
    const frame = frames.get(this);
    if (frame?.active && args.length === 4 && icons.has(image) && frame.icons.length < 128) {
      const [x, y, w, h] = args;
      frame.icons.push({ id: icons.get(image), x: x + w / 2, y: y + h / 2 });
    }
    return drawImage.call(this, image, ...args);
  };
  proto.strokeRect = function (x, y, w, h) {
    const frame = frames.get(this);
    if (frame?.active && this.strokeStyle === '#ffd23f' && w <= 24 && h <= 24) frame.gold.push({ x, y, w, h });
    return strokeRect.call(this, x, y, w, h);
  };

  const inside = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  function hide() { if (tooltip) tooltip.style.display = 'none'; signature = ''; }
  function label(values, move = false) {
    const language = globalThis.PS_LOCALES?.lang;
    if (korean && globalThis.PSKO) return globalThis.PSKO[move ? 'translateMove' : 'translate'](values[1]);
    return values[language === 'es' ? 0 : 1];
  }
  function show() {
    nextUpdate = performance.now() + 100;
    if (!pointer || !latest || pointer.canvas !== latest.canvas || document.hidden
      || document.elementFromPoint(pointer.x, pointer.y) !== latest.canvas) return hide();
    const bounds = latest.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return hide();
    const sx = bounds.width / latest.canvas.width, sy = bounds.height / latest.canvas.height;
    const slot = latest.slots.find(r => inside((pointer.x - bounds.left) / sx, (pointer.y - bounds.top) / sy, r));
    if (!slot) return hide();
    if (!tooltip) {
      tooltip = document.createElement('div'); tooltip.id = 'psko-move-tooltips';
      tooltip.dataset.pskoUi = ''; tooltip.setAttribute('translate', 'no'); tooltip.setAttribute('role', 'tooltip');
      Object.assign(tooltip.style, { position: 'fixed', zIndex: '2147483646', pointerEvents: 'none',
        display: 'flex', flexDirection: 'column-reverse', gap: '3px', boxSizing: 'border-box',
        font: '12px/1.3 "NeoDunggeunmo", "Malgun Gothic", sans-serif', transformOrigin: 'top left', color: '#eaf2ff' });
      document.body.append(tooltip);
    }
    const key = `${korean}:${globalThis.PS_LOCALES?.lang}:` + slot.moves.map(m => m.id + (m.evolved ? '+' : '')).join(',');
    if (key !== signature) {
      signature = key;
      tooltip.replaceChildren(...slot.moves.map(move => {
        const data = info[move.id], article = document.createElement('article');
        Object.assign(article.style, { padding: '5px 8px', border: `1px solid ${move.evolved ? '#ffd23f' : '#7c9bd0'}`,
          borderRadius: '6px', background: 'rgba(10,14,28,.96)', boxShadow: '0 2px 8px #0008', overflowWrap: 'anywhere' });
        const title = document.createElement('b'); title.textContent = label(move.evolved && data.evo ? data.evo.name : data.name, !move.id.startsWith('item:'));
        Object.assign(title.style, { display: 'block', color: move.evolved ? '#ffd23f' : '#b8d5ff', fontSize: '13px', marginBottom: '2px' });
        const desc = document.createElement('div'); desc.textContent = label(data.desc);
        article.append(title, desc);
        if (move.evolved && data.evo) {
          const evolved = document.createElement('div'); evolved.textContent = label(data.evo.desc);
          Object.assign(evolved.style, { color: '#ffe48c', marginTop: '2px', fontSize: '11px' }); article.append(evolved);
        }
        return article;
      }));
    }
    tooltip.style.display = 'flex';
    tooltip.style.width = `${Math.max(1, Math.min(260, innerWidth - 16))}px`;
    tooltip.style.transform = 'none';
    const width = tooltip.offsetWidth, height = tooltip.offsetHeight;
    const top = bounds.top + slot.y * sy;
    const fit = Math.min(1, Math.max(1, top - 16) / height);
    tooltip.style.transform = `scale(${fit})`;
    tooltip.style.left = `${Math.max(8, Math.min(innerWidth - width * fit - 8, bounds.left + (slot.x + slot.w / 2) * sx - width * fit / 2))}px`;
    tooltip.style.top = `${Math.max(8, top - height * fit - 8)}px`;
  }

  globalThis.PSKO_MOVE_TOOLTIPS = {
    begin(ctx) {
      let frame = frames.get(ctx);
      if (!frame) { frame = { icons: [], gold: [], slots: [] }; frames.set(ctx, frame); }
      frame.icons.length = frame.gold.length = frame.slots.length = 0; frame.active = true;
    },
    text(ctx, text, x, y) {
      const frame = frames.get(ctx);
      if (!frame?.active) return;
      const item = /^(?:700|bold) 9px /.test(ctx.font) && ctx.textAlign === 'center' && ctx.fillStyle === '#ffd23f';
      if (!item && (!/^[1-4]$/.test(text) || !ctx.font.startsWith('800 9px ') || ctx.textAlign !== 'left')) return;
      // The held item's name sits six pixels above its 54px slot.
      const rect = item ? { x: x - 27, y: y + 6, w: 54, h: 54 } : { x: x - 3, y: y - 10, w: 54, h: 54 };
      const found = frame.icons.filter(icon => icon.id.startsWith('item:') === item && inside(icon.x, icon.y, rect));
      if (!found.length) return;
      const moves = found.map(icon => ({ id: icon.id, evolved: !item && (found.length === 1
        ? ctx.strokeStyle === '#ffd23f' : frame.gold.some(r => inside(icon.x, icon.y, r))) }));
      const m = ctx.getTransform();
      frame.slots.push({ x: rect.x * m.a + m.e, y: rect.y * m.d + m.f, w: rect.w * m.a, h: rect.h * m.d, moves });
    },
    end(ctx) {
      const frame = frames.get(ctx);
      if (!frame) return;
      frame.active = false; latest = { canvas: ctx.canvas, slots: frame.slots };
      if (pointer && (performance.now() >= nextUpdate || !frame.slots.length)) show();
    },
  };
  document.addEventListener('pointermove', event => {
    pointer = event.target instanceof HTMLCanvasElement && event.target.id === 'game'
      ? { canvas: event.target, x: event.clientX, y: event.clientY } : null;
    show();
  }, { passive: true });
  for (const type of ['blur', 'resize', 'pagehide']) window.addEventListener(type, () => { pointer = null; hide(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pointer = null; hide(); } });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) { pointer = null; hide(); } });
  document.addEventListener('psko:settings', event => { if (typeof event.detail === 'boolean') { korean = event.detail; signature = ''; show(); } });
})();
