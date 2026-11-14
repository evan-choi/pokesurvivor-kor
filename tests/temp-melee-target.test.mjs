import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function setup(enabled = true) {
  const context = vm.createContext({
    localStorage: { getItem: () => String(enabled) },
    document: { addEventListener() {}, querySelector() { return null; } },
    MutationObserver: class { observe() {} },
  });
  vm.runInContext(readFileSync(new URL('../extension/temp-melee-target.js', import.meta.url), 'utf8'), context);
  vm.runInContext(`
    var near={x:40,y:20},boss={x:200,y:0}, calls=[], scans=0;
    var moves=[{kind:'projectile',radius:300,t:0},{kind:'melee',radius:65,t:0}];
    var player={x:0,y:0,target:boss,aim:0,activeGroup(){return moves}};
    var enemies={queryCircle(){scans++;return [near]},rebuildGrid(){}};
    var combat={ghostCast(){},resolve(){},tick(dt,p){
      for(const m of p.activeGroup()){
        m.t-=dt;
        if(m.t>0)continue;
        if(p.target&&Math.hypot(p.target.x-p.x,p.target.y-p.y)<=m.radius+30){
          calls.push({kind:m.kind,target:p.target===near?'near':'boss',aim:p.aim});m.t=1;
          if(p.fail)throw Error('cast failed');
        }else m.t=.05;
      }
      return 17;
    }};
    var native=combat.tick;
    PSKO_INSTALL_TEMP_MELEE_FIX({combat,enemies,Judgment:{shielded:false}});
  `, context);
  return expression => vm.runInContext(expression, context);
}

test('linked melee uses a reachable enemy while ranged aim and original target stay intact', () => {
  const run = setup();
  assert.equal(run('combat.tick(.016,player)'), 17);
  assert.deepEqual(JSON.parse(run('JSON.stringify(calls.map(c=>[c.kind,c.target]))')), [['projectile','boss'],['melee','near']]);
  assert.equal(run('calls[1].aim'), Math.atan2(20,40));
  assert.equal(run('player.target===boss && player.aim===0'), true);
  assert.equal(run('Object.hasOwn(moves,Symbol.iterator)'), false);
  assert.equal(run('moves[1].t'), 1);
});

test('crossed slashes use a reachable enemy without changing ranged targeting', () => {
  const run = setup();
  run("moves[1].kind='scissor';combat.tick(.016,player)");
  assert.deepEqual(JSON.parse(run('JSON.stringify(calls.map(c=>[c.kind,c.target]))')), [['projectile','boss'],['scissor','near']]);
  assert.equal(run('player.target===boss && player.aim===0'), true);
  assert.equal(run('Object.hasOwn(moves,Symbol.iterator)'), false);
});

test('disabled, manual aim, remote players and cooling moves keep native behavior', () => {
  for (const condition of ['disabled','manualAim','remote','cooldown']) {
    const run = setup(condition !== 'disabled');
    if (condition === 'cooldown') run('moves[1].t=3');
    else if (condition !== 'disabled') run(`player.${condition}=true`);
    run('combat.tick(.016,player)');
    assert.equal(run('calls.length'), 1, condition);
    assert.equal(run('scans'), 0, condition);
  }
});

test('no reachable enemy and a target already within range are left alone', () => {
  const run = setup();
  run('near.x=100; combat.tick(.016,player)');
  assert.equal(run('calls.length'), 1);
  run('calls=[];moves.forEach(m=>m.t=0);player.target=near;near.x=30;scans=0;combat.tick(.016,player)');
  assert.equal(run('calls.length'), 2);
  assert.equal(run('scans'), 0);
});

test('cast failures restore target, aim and iterator without swallowing the exception', () => {
  const run = setup();
  run('moves.shift();player.fail=true');
  assert.throws(() => run('combat.tick(.016,player)'), /cast failed/);
  assert.equal(run('player.target===boss && player.aim===0'), true);
  assert.equal(run('Object.hasOwn(moves,Symbol.iterator)'), false);
});
