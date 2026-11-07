import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = () => readFileSync(new URL('../extension/effects.js', import.meta.url), 'utf8');
async function setup(own = 0.2, party = 0.5) {
  const context = vm.createContext({
    URL, queueMicrotask, addEventListener() {}, setTimeout: () => 0, clearTimeout() {},
    location: { origin: 'https://pokesurvivor.com' },
    localStorage: { getItem: () => JSON.stringify({ own, party }) },
    document: { currentScript: { src: 'https://pokesurvivor.com/js/app.min.js?v=test' },
      addEventListener() {}, querySelector() { return null; } },
    MutationObserver: class { observe() {} },
  });
  vm.runInContext('globalThis.nativeCreate=Object.create;globalThis.nativePush=Array.prototype.push;globalThis.nativeIterator=Array.prototype[Symbol.iterator];', context);
  vm.runInContext(source(), context);
  vm.runInContext(`
    var root=Object.create(null), particles=[], shots=[], fields=[], paints=[];
    var me={}, mate={}, foe={}, damage=0;
    root.Game={startRun(){},player:me};
    root.Coop={players(){return [me,mate]},puppets(){return []},mates(){return []}};
    root.FX={draw(ctx){for(const p of particles){ctx.globalAlpha=.8;ctx.fillRect(p.x,0,1,1)}},
      sp(x){particles.push({x,y:0,t:0,life:1})},burst(x){this.sp(x)},clear(){particles=[]}};
    root.Shots={all(){return shots},spawn(o){shots.push(o);return o},spawnOrb(o){return this.spawn(o)},clearOrbs(){},
      draw(ctx){for(const p of shots){ctx.globalAlpha=.6;ctx.fillRect(p.x,0,1,1)}}};
    root.Combat={tick(dt,p){damage++;root.FX.sp(p===me?1:2);fields.push({owner:p,x:8,life:1,t:0});},
      ghostCast(p){root.FX.sp(3)},ghostOrbit(){},
      drawGroundFields(ctx){for(const f of fields){ctx.globalAlpha=.4;ctx.fillRect(f.x,0,1,1)}},drawAirFields(){}};
    var ctx={globalAlpha:1,fillRect(x){paints.push([x,this.globalAlpha])}};
  `, context);
  await new Promise(resolve => queueMicrotask(resolve));
  return expression => vm.runInContext(expression, context);
}

test('own, party and enemy effects keep independent opacity and original simulation', async () => {
  const run = await setup();
  run(`root.Combat.tick(0,me);root.Combat.ghostCast(mate);root.FX.sp(4);
    root.Shots.spawn({x:5,owner:me,friendly:true});root.Shots.spawn({x:6,owner:mate,friendly:true});
    root.Shots.spawn({x:7,owner:me,friendly:false});
    root.FX.draw(ctx);root.Shots.draw(ctx);root.Combat.drawGroundFields(ctx);`);
  const values = JSON.parse(run('JSON.stringify(paints)'));
  for (const [x, expected] of [[1,.16],[3,.4],[4,.8],[5,.12],[6,.3],[7,.6],[8,.08]]) {
    assert.ok(Math.abs(values.find(v => v[0] === x)[1] - expected) < 1e-9, `effect ${x}`);
  }
  assert.equal(run('damage'), 1);
  assert.equal(run('Object.create===nativeCreate && Array.prototype.push===nativePush && Array.prototype[Symbol.iterator]===nativeIterator'), true);
});

test('hidden casts still create and simulate effects, unknown ownership stays visible', async () => {
  const run = await setup(0, 1);
  run('root.Combat.tick(0,me);root.Combat.tick(0,foe);root.FX.draw(ctx)');
  assert.equal(run('damage'), 2);
  assert.equal(run('particles.length'), 2);
  assert.deepEqual(JSON.parse(run('JSON.stringify(paints)')), [[2,.8]]);
});

test('render failures restore the native iterator and context alpha', async () => {
  const run = await setup();
  run('root.Combat.tick(0,me);ctx.fillRect=function(){throw Error("paint")};');
  assert.throws(() => run('root.FX.draw(ctx)'), /paint/);
  assert.equal(run('Array.prototype[Symbol.iterator]===nativeIterator'), true);
  assert.equal(run('ctx.globalAlpha'), .8);
});
