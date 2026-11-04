(() => {
  'use strict';

  let enabled = false;
  let gameDocument = false;
  const detectGame = () => { gameDocument = !!document.querySelector('#tap-start, #scr-settings'); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', detectGame, { once: true });
  else detectGame();
  // The game animates these two headings one letter at a time. Keep their
  // measurements in the original language so letter placement remains correct.
  const animatedHeadings = new Set(['THE JUDGMENT', 'OF ARCEUS', 'LA SENTENCIA', 'DE ARCEUS']);
  const translate = (text) => {
    if (!enabled || !gameDocument || animatedHeadings.has(text)) return text;
    // The canvas uses standalone names for moves; type alerts include their full sentence.
    return typeof text === 'string' && /^(?:Psychic|Psíquico)$/iu.test(text.trim())
      ? globalThis.PSKO.translateMove(text)
      : globalThis.PSKO.translate(text);
  };
  document.addEventListener('psko:settings', (event) => {
    if (typeof event.detail === 'boolean') enabled = event.detail;
  });

  const prototype = globalThis.CanvasRenderingContext2D?.prototype;
  if (prototype) {
    for (const method of ['fillText', 'strokeText', 'measureText']) {
      const original = prototype[method];
      prototype[method] = function (text, ...args) {
        const result = translate(text);
        if (typeof result !== 'string' || !/[가-힣]/.test(result)) {
          return original.call(this, result, ...args);
        }
        const font = this.font;
        // Retain the game's font size/weight while supplying Korean glyphs.
        this.font = font.replace(/(\d+(?:\.\d+)?px(?:\s*\/\s*[^ ]+)?)\s+.*/, '$1 "Apple SD Gothic Neo", "Malgun Gothic", sans-serif');
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
