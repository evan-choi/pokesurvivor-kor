(() => {
  'use strict';

  let enabled = false;
  let gameDocument = false;
  const fontFamily = '"NeoDunggeunmo", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  const detectGame = () => { gameDocument = !!document.querySelector('#tap-start, #scr-settings'); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', detectGame, { once: true });
  else detectGame();
  // The game animates these two headings one letter at a time. Keep their
  // measurements in the original language so letter placement remains correct.
  const animatedHeadings = new Set(['THE JUDGMENT', 'OF ARCEUS', 'LA SENTENCIA', 'DE ARCEUS']);
  const translate = (text) => {
    if (!enabled || !gameDocument || animatedHeadings.has(text)) return text;
    // Native Korean output may contain player names that must not be translated again.
    if (globalThis.PSKO_NATIVE_LOCALE?.active && typeof text === 'string' && /[가-힣]/u.test(text)) return text;
    // The canvas uses standalone names for moves; type alerts include their full sentence.
    return typeof text === 'string' && /^(?:Psychic|Psíquico)$/iu.test(text.trim())
      ? globalThis.PSKO.translateMove(text)
      : globalThis.PSKO.translate(text);
  };
  document.addEventListener('psko:settings', (event) => {
    if (typeof event.detail === 'boolean') {
      enabled = event.detail;
      tooltipLines = new WeakMap();
    }
  });

  const orbTitles = new Map();
  for (const [names, effects] of globalThis.PSKO_ORBS || []) {
    for (const language of [0, 1]) {
      orbTitles.set(names[language], { source: effects[language], words: effects[2].split(' ') });
    }
  }
  let tooltipLines = new WeakMap();
  function translateCanvasText(ctx, text) {
    if (!enabled || !gameDocument || typeof text !== 'string') return text;
    // The game wraps the source first, then measures the title and each line,
    // and repeats that sequence to draw. Translate the same spans in both passes.
    const orb = orbTitles.get(text);
    if (orb) {
      tooltipLines.set(ctx, { orb, offset: 0, word: 0 });
    } else {
      const line = tooltipLines.get(ctx);
      if (line) {
        const { source, words } = line.orb;
        const end = line.offset + text.length;
        if (text && source.startsWith(text, line.offset) && (end === source.length || source[end] === ' ')) {
          const last = end === source.length;
          const nextWord = last ? words.length : Math.min(words.length - 1,
            Math.max(line.word + 1, Math.round(words.length * end / source.length)));
          const translated = words.slice(line.word, nextWord).join(' ');
          if (last) tooltipLines.delete(ctx);
          else Object.assign(line, { offset: end + 1, word: nextWord });
          return translated;
        }
        tooltipLines.delete(ctx);
      }
    }
    return translate(text);
  }

  const prototype = globalThis.CanvasRenderingContext2D?.prototype;
  if (prototype) {
    for (const method of ['fillText', 'strokeText', 'measureText']) {
      const original = prototype[method];
      prototype[method] = function (text, ...args) {
        const result = translateCanvasText(this, text);
        if (!enabled || !gameDocument || typeof result !== 'string') {
          return original.call(this, result, ...args);
        }
        const font = this.font;
        // Use the same font for measuring and drawing, retaining size and weight.
        this.font = font.replace(/(\d+(?:\.\d+)?px(?:\s*\/\s*[^ ]+)?)\s+.*/, `$1 ${fontFamily}`);
        try {
          return original.call(this, result, ...args);
        } finally {
          this.font = font;
        }
      };
    }
  }

  for (const method of ['alert', 'confirm']) {
    const original = window[method];
    window[method] = function (message) { return original.call(this, translate(message)); };
  }
  document.dispatchEvent(new Event('psko:canvas-ready'));
})();
