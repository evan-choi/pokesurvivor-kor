import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../extension/hud.js', import.meta.url), 'utf8');
function setup(id = 'game', ratio = 1) {
  class Canvas {
    canvas = { id };
    font = '800 13px Pixelify';
    textAlign = 'left';
    textBaseline = 'alphabetic';
    matrix = { a: ratio, b: 0, c: 0, d: ratio, e: 0, f: 0 };
    stack = [];
    calls = [];
    getTransform() { return { ...this.matrix }; }
    setTransform(m) { this.matrix = { ...m }; }
    translate(x, y) { this.matrix.e += this.matrix.a * x; this.matrix.f += this.matrix.d * y; }
    scale(x, y) { this.matrix.a *= x; this.matrix.d *= y; }
    save() { this.stack.push(this.getTransform()); }
    restore() { if (this.stack.length) this.setTransform(this.stack.pop()); }
    fillText(text, x, y) { this.calls.push({ text, x, y, ...this.getTransform() }); }
    measureText(text) { return { width: text.length * 6 }; }
  }
  vm.runInNewContext(source, { CanvasRenderingContext2D: Canvas });
  return new Canvas();
}
function name(ctx) { ctx.save(); ctx.fillText('Eternatus', 16, 30); }
function timer(ctx) { ctx.font = '800 26px Pixelify'; ctx.textAlign = 'center'; ctx.fillText('00:30', 640, 42); }

test('enlarges the HP group 1.5x, preserves DPR, and restores before the timer', () => {
  const ctx = setup('game', 2);
  name(ctx);
  assert.equal(ctx.calls[0].a, 3);
  assert.equal(ctx.calls[0].e, -16);
  assert.equal(ctx.calls[0].f, -20);
  ctx.font = '700 10px Pixelify';
  ctx.save(); ctx.restore(); // HP bar clipping must retain the scale.
  ctx.fillText('133 / 133', 148, 46);
  assert.equal(ctx.calls.at(-1).a, 3);
  timer(ctx);
  assert.equal(ctx.calls.at(-1).a, 2);
  assert.equal(ctx.calls.at(-1).e, 0);
  ctx.restore();
  assert.equal(ctx.stack.length, 0);
});

test('enlarges the later orb badge, then moves party rows below it without resizing them', () => {
  const ctx = setup(); name(ctx); timer(ctx);
  ctx.font = '800 9px Pixelify'; ctx.textAlign = 'left';
  ctx.measureText('FOCUS ORB 12s');
  assert.equal(ctx.getTransform().a, 1.5); // badge background, not just its text
  ctx.fillText('FOCUS ORB 12s', 100, 65);
  assert.equal(ctx.calls.at(-1).a, 1.5);
  assert.equal(ctx.getTransform().a, 1);
  for (const y of [85, 100]) {
    ctx.font = '800 10px Pixelify'; ctx.fillText('Teammate', 16, y);
    assert.equal(ctx.calls.at(-1).a, 1);
    assert.equal(ctx.calls.at(-1).f, 28);
    ctx.save(); ctx.restore(); // party HP bar clip
    assert.equal(ctx.getTransform().f, 0);
  }
  ctx.restore();
});

test('does not resize unrelated canvases, nested decorations, or later menu text', () => {
  const other = setup('menu-partner'); name(other);
  assert.equal(other.calls[0].a, 1);
  const ctx = setup(); name(ctx); timer(ctx);
  ctx.save(); ctx.font = '800 9px Pixelify'; ctx.textAlign = 'left';
  ctx.measureText('FOCUS ORB 12s'); ctx.fillText('arrow', 16, 30);
  assert.equal(ctx.calls.at(-1).a, 1);
  ctx.restore(); ctx.restore();
  ctx.measureText('FOCUS ORB 12s');
  assert.equal(ctx.getTransform().a, 1);
});
