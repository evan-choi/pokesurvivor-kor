// Temporary upstream targeting workaround. Removal steps: docs/temporary-melee-fix.md.
(() => {
  'use strict';
  const key = 'psko.temp-melee-target';
  let enabled = true, ready = false;
  try { enabled = localStorage.getItem(key) !== 'false'; } catch { /* Session default. */ }

  globalThis.PSKO_INSTALL_TEMP_MELEE_FIX = root => {
    delete globalThis.PSKO_INSTALL_TEMP_MELEE_FIX;
    const modules = Object.values(root);
    const combat = modules.find(m => m?.tick && m?.ghostCast && m?.resolve);
    const enemies = modules.find(m => m?.queryCircle && m?.rebuildGrid);
    if (!combat || !enemies) return;
    const original = combat.tick;
    combat.tick = function (dt, player, ...rest) {
      if (!enabled || !player || player.dead || player.remote || player.manualAim) {
        return original.call(this, dt, player, ...rest);
      }
      const moves = player.activeGroup();
      // shortcut: delayed punch fields re-read aim after tick; add them when field-specific aiming is available.
      const due = move => (move.kind === 'melee' || move.kind === 'scissor')
        && Number.isFinite(move.radius) && move.radius > 0 && move.t <= dt;
      if (!Array.isArray(moves) || !moves.some(due)) return original.call(this, dt, player, ...rest);
      const descriptor = Object.getOwnPropertyDescriptor(moves, Symbol.iterator);
      if (descriptor && !descriptor.configurable) return original.call(this, dt, player, ...rest);
      const iterate = moves[Symbol.iterator];
      const distance2 = target => (target.x - player.x) ** 2 + (target.y - player.y) ** 2;
      const usable = target => target && !target.dead && !(target.arceus && root.Judgment?.shielded);
      // Keep the whole linked group intact, but scope target/aim to each cast.
      // The original tick still controls cooldowns, damage, effects and network messages.
      Object.defineProperty(moves, Symbol.iterator, { configurable: true, value: function* () {
        const iterator = iterate.call(this);
        for (let step = iterator.next(); !step.done; step = iterator.next()) {
          const move = step.value, target = player.target, aim = player.aim;
          if (due(move) && (!usable(target) || distance2(target) > move.radius ** 2)) {
            let closest, best = move.radius ** 2;
            for (const enemy of enemies.queryCircle(player.x, player.y, move.radius)) {
              if (!usable(enemy)) continue;
              const distance = distance2(enemy);
              if (distance <= best) { closest = enemy; best = distance; }
            }
            if (closest) {
              player.target = closest;
              player.aim = Math.atan2(closest.y - player.y, closest.x - player.x);
            }
          }
          try { yield move; } finally { player.target = target; player.aim = aim; }
        }
      } });
      try { return original.call(this, dt, player, ...rest); }
      finally {
        if (descriptor) Object.defineProperty(moves, Symbol.iterator, descriptor);
        else delete moves[Symbol.iterator];
      }
    };
    ready = true;
    render();
  };

  function render() {
    const body = document.querySelector('#set-body');
    if (!body || !document.querySelector('#set-tabs [data-t="ctl"].on')) return;
    const existing = body.querySelector('[data-psko-melee-fix]');
    if (existing) { existing.querySelector('button').disabled = !ready; return; }
    const ko = globalThis.PS_LOCALES?.lang === 'ko';
    const row = document.createElement('div');
    row.className = 'set-row'; row.dataset.pskoMeleeFix = ''; row.dataset.pskoUi = '';
    const text = document.createElement('div'); text.className = 'grow';
    const title = document.createElement('b');
    title.textContent = ko ? '근접 자동 조준 보정 (임시)' : 'Melee targeting fix (temporary)';
    const description = document.createElement('small');
    description.id = 'psko-melee-fix-description';
    description.textContent = ko ? '먼 대상을 조준해 근접 공격이 멈추면 가까운 적을 공격합니다.'
      : 'Attack a nearby enemy when a distant target blocks melee attacks.';
    text.append(title, description);
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-label', title.textContent);
    button.setAttribute('aria-describedby', description.id);
    const update = () => {
      button.className = `btn small switch${enabled ? ' gold' : ''}`;
      button.textContent = ko ? (enabled ? '예' : '아니요') : (enabled ? 'Yes' : 'No');
      button.setAttribute('aria-pressed', String(enabled)); button.disabled = !ready;
    };
    button.addEventListener('click', () => {
      enabled = !enabled;
      try { localStorage.setItem(key, String(enabled)); } catch { /* Keep the session choice. */ }
      update();
    });
    update(); row.append(text, button); body.append(row);
  }
  document.addEventListener('DOMContentLoaded', () => {
    const body = document.querySelector('#set-body');
    if (body) { new MutationObserver(render).observe(body, { childList: true }); render(); }
  }, { once: true });
})();
