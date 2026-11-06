import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../extension/canvas.js', import.meta.url), 'utf8');
const family = '"NeoDunggeunmo", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

function boot({ game = true, enabled = true, canonicalizeFont = false } = {}) {
  const calls = [];
  const translations = [];
  class CanvasContext {
    constructor(font = 'bold 20px monospace') {
      this._font = font;
      this.fontWrites = 0;
    }
    get font() { return this._font; }
    set font(value) {
      this.fontWrites++;
      this._font = canonicalizeFont ? value.replace('"NeoDunggeunmo"', 'NeoDunggeunmo') : value;
    }
    fillText(...args) {
      calls.push({ method: 'fillText', args, font: this.font });
      if (this.fail) throw new Error('drawing failed');
    }
    strokeText(...args) { calls.push({ method: 'strokeText', args, font: this.font }); }
    measureText(...args) {
      calls.push({ method: 'measureText', args, font: this.font });
      return { width: String(args[0]).length };
    }
  }
  class DetailEvent extends Event {
    constructor(value) { super('psko:settings'); this.detail = value; }
  }
  const document = Object.assign(new EventTarget(), {
    readyState: 'complete', querySelector: () => game ? {} : null,
  });
  const context = vm.createContext({
    document, Event, CanvasRenderingContext2D: CanvasContext,
    window: { alert() {}, confirm() { return true; } },
    PSKO: {
      translate(text) {
        translations.push(text);
        return { Bulbasaur: '이상해씨', 'Luminous Orb': '빛의구슬' }[text] ?? text;
      },
      translateMove(text) { translations.push(text); return '사이코키네시스'; },
    },
    PSKO_ORBS: [[['Orbe luminoso', 'Luminous Orb', '빛의구슬'],
      ['Ves más mapa', 'You see more map', '더 넓은 지도를 봅니다']]],
  });
  vm.runInContext(`
    globalThis.fontReplacements = 0;
    const originalReplace = String.prototype.replace;
    String.prototype.replace = function (...args) {
      if (String(this).includes('monospace')) globalThis.fontReplacements++;
      return originalReplace.apply(this, args);
    };
  `, context);
  vm.runInContext(source, context);
  document.dispatchEvent(new DetailEvent(enabled));
  return { CanvasContext, calls, translations, context, document, DetailEvent };
}

test('already-correct Korean canvas fonts need no repeated font writes', () => {
  const { CanvasContext, calls } = boot();
  const canvas = new CanvasContext(`bold 20px ${family}`);
  for (let frame = 0; frame < 100; frame++) {
    canvas.fillText(String(frame), 1, 2);
    canvas.strokeText('Bulbasaur', 3, 4);
    canvas.measureText('Bulbasaur');
  }
  assert.equal(canvas.fontWrites, 0);
  assert.equal(calls.length, 300);
  assert.equal(calls[1].args[0], '이상해씨');
});

test('repeated drawing with the same source font parses it only once', () => {
  const { CanvasContext, context } = boot();
  const canvas = new CanvasContext();
  for (let frame = 0; frame < 100; frame++) {
    canvas.fillText('Bulbasaur', 1, 2);
    canvas.measureText('Bulbasaur');
  }
  assert.equal(context.fontReplacements, 1);
  assert.equal(canvas.font, 'bold 20px monospace');
});

test('browser-normalized Korean font names avoid repeated equivalent assignments', () => {
  const { CanvasContext } = boot({ canonicalizeFont: true });
  const font = `bold 20px ${family.replace('"NeoDunggeunmo"', 'NeoDunggeunmo')}`;
  const canvas = new CanvasContext(font);
  for (let frame = 0; frame < 100; frame++) canvas.fillText(String(frame), 1, 2);
  assert.equal(canvas.fontWrites, 2);
  assert.equal(canvas.font, font);
});

test('canvas labels and numeric counters retain Korean fonts, drawing arguments and state', () => {
  const { CanvasContext, calls } = boot();
  const canvas = new CanvasContext();
  canvas.fillText('42', 1, 2, 300);
  canvas.strokeText('Psychic', 3, 4);
  assert.equal(canvas.measureText('Bulbasaur').width, '이상해씨'.length);
  assert.deepEqual(calls.map(call => call.args), [['42', 1, 2, 300], ['사이코키네시스', 3, 4], ['이상해씨']]);
  assert.ok(calls.every(call => call.font === `bold 20px ${family}`));
  assert.equal(canvas.font, 'bold 20px monospace');
});

test('font caching preserves changes in drawing size and weight', () => {
  const { CanvasContext, calls } = boot();
  const canvas = new CanvasContext();
  canvas.fillText('Bulbasaur', 1, 2);
  canvas.font = 'italic 700 13px monospace';
  canvas.fillText('THE JUDGMENT', 3, 4);
  assert.equal(calls[0].font, `bold 20px ${family}`);
  assert.equal(calls[1].font, `italic 700 13px ${family}`);
  assert.equal(calls[1].args[0], 'THE JUDGMENT');
  assert.equal(canvas.font, 'italic 700 13px monospace');
});

for (const options of [{ enabled: false }, { game: false }]) {
  test(`canvas bypasses translation outside an enabled game: ${JSON.stringify(options)}`, () => {
    const { CanvasContext, calls, translations, context } = boot(options);
    const canvas = new CanvasContext();
    canvas.fillText('Bulbasaur', 1, 2);
    canvas.measureText(42);
    assert.deepEqual(calls.map(call => call.args), [['Bulbasaur', 1, 2], [42]]);
    assert.equal(canvas.fontWrites, 0);
    assert.equal(context.fontReplacements, 0);
    assert.equal(translations.length, 0);
  });
}

test('failed canvas drawing restores its original font', () => {
  const { CanvasContext } = boot();
  const canvas = new CanvasContext();
  canvas.fail = true;
  assert.throws(() => canvas.fillText('Bulbasaur', 1, 2), /drawing failed/);
  assert.equal(canvas.font, 'bold 20px monospace');
});

test('orb tooltip translations keep independent measurement and drawing sequences', () => {
  const { CanvasContext, calls } = boot();
  const first = new CanvasContext();
  const second = new CanvasContext();
  first.measureText('Luminous Orb');
  second.measureText('Bulbasaur');
  first.measureText('You see more map');
  first.fillText('Luminous Orb', 1, 2);
  first.fillText('You see more map', 1, 3);
  assert.deepEqual(calls.map(call => call.args[0]), [
    '빛의구슬', '이상해씨', '더 넓은 지도를 봅니다', '빛의구슬', '더 넓은 지도를 봅니다',
  ]);
});
