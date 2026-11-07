(() => {
  'use strict';

  const prototype = globalThis.CanvasRenderingContext2D?.prototype;
  if (!prototype) return;
  const original = Object.fromEntries(['fillText', 'measureText', 'save', 'restore'].map(key => [key, prototype[key]]));
  const frames = new WeakMap();
  const scale = 1.5;
  const fontIs = (ctx, weight, size) => ctx.font.startsWith(`${weight} ${size}px `);

  function reset(ctx, frame) {
    ctx.setTransform(frame.transform);
    frame.mode = '';
  }
  function enlarge(ctx, frame, mode) {
    ctx.setTransform(frame.transform);
    ctx.translate(frame.x, frame.y);
    ctx.scale(scale, scale);
    ctx.translate(-frame.x, -frame.y);
    frame.mode = mode;
  }

  // shortcut: identify the current game's HUD by its name/timer drawing markers;
  // update these markers and the live HUD check if the upstream renderer changes.
  prototype.fillText = function (text, x, y, ...rest) {
    let frame = frames.get(this);
    if (!frame && this.canvas.id === 'game' && this.textAlign === 'left'
      && this.textBaseline === 'alphabetic' && fontIs(this, 800, 13)
      && x >= 16 && x <= 80 && y >= 30 && y <= 100) {
      frame = { transform: this.getTransform(), x, y: y - 10, depth: 0, mode: '' };
      frames.set(this, frame);
      globalThis.PSKO_MOVE_TOOLTIPS?.begin(this);
      enlarge(this, frame, 'main');
    } else if (frame?.mode === 'main' && fontIs(this, 800, 26)) {
      reset(this, frame);
    } else if (frame && !frame.mode && frame.depth === 0 && this.textAlign === 'left'
      && fontIs(this, 800, 10) && x === frame.x && y >= frame.y + 49 && y <= frame.y + 120) {
      // Keep party text/bar sizes, but leave room below the enlarged player buffs.
      frame.partyOffset ??= (y - 9 - frame.y) * (scale - 1);
      this.translate(0, frame.partyOffset);
      frame.mode = 'party';
    }
    globalThis.PSKO_MOVE_TOOLTIPS?.text(this, text, x, y);
    const result = original.fillText.call(this, text, x, y, ...rest);
    if (frame?.mode === 'power' || (frame?.mode === 'party' && fontIs(this, 800, 9))) reset(this, frame);
    return result;
  };

  prototype.measureText = function (text) {
    const frame = frames.get(this);
    // Temporary orb buffs are measured/drawn after the timer and world markers.
    if (frame && !frame.mode && frame.depth === 0 && frame.partyOffset === undefined
      && this.textAlign === 'left' && fontIs(this, 800, 9) && /\s\d+s$/.test(text)) {
      enlarge(this, frame, 'power');
    }
    return original.measureText.call(this, text);
  };

  prototype.save = function () {
    const frame = frames.get(this);
    if (frame) frame.depth++;
    return original.save.call(this);
  };
  prototype.restore = function () {
    const frame = frames.get(this);
    const result = original.restore.call(this);
    if (frame) {
      if (frame.depth === 0) {
        frames.delete(this);
        globalThis.PSKO_MOVE_TOOLTIPS?.end(this);
      }
      else {
        frame.depth--;
        if (frame.depth === 0 && frame.mode === 'party') reset(this, frame);
      }
    }
    return result;
  };
})();
