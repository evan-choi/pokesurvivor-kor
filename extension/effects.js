(() => {
  'use strict';

  const key = 'psko.effect-opacity';
  const levels = [1, 0.5, 0.2, 0];
  const settings = { own: 1, party: 1 };
  let ready = false;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    for (const kind of ['own', 'party']) if (levels.includes(saved?.[kind])) settings[kind] = saved[kind];
  } catch { /* Invalid or unavailable storage keeps the default rendering. */ }

  function install(root) {
    globalThis.PSKO_INSTALL_TEMP_MELEE_FIX?.(root);
    const modules = Object.values(root);
    const game = modules.find(m => m?.startRun && 'player' in m);
    const coop = modules.find(m => m?.players && m?.puppets);
    const shots = modules.find(m => m?.spawnOrb && m?.clearOrbs && m?.draw);
    const combat = modules.find(m => m?.ghostCast && m?.drawGroundFields && m?.drawAirFields);
    const fx = root.FX;
    if (!game || !coop || !shots || !combat || !fx?.draw || !fx?.sp) return;

    const owners = new WeakMap();
    const kinds = new WeakMap();
    const contexts = new WeakMap();
    let casting;
    let painting;
    let captureDepth = 0;
    function kindOf(owner) {
      if (!owner || typeof owner !== 'object') return;
      if (owner === game.player) return 'own';
      if (kinds.has(owner)) return kinds.get(owner);
      if (coop.players().includes(owner)) { kinds.set(owner, 'party'); return 'party'; }
    }
    function ownerOf(effect) {
      if (!effect || typeof effect !== 'object' || effect.friendly === false || 'big' in effect) return;
      return kindOf(effect.owner) || owners.get(effect);
    }

    function capture(kind, fn, self, args) {
      const previous = casting;
      const push = Array.prototype.push;
      casting = kind;
      if (captureDepth++ === 0) {
        // Capture only allocations made synchronously by game effect/cast methods.
        Array.prototype.push = function (...items) {
          for (const item of items) {
            if (casting && item && typeof item.x === 'number' && typeof item.y === 'number'
              && typeof item.t === 'number' && item.friendly !== false && !('big' in item)) owners.set(item, casting);
          }
          return Reflect.apply(push, this, items);
        };
      }
      try { return Reflect.apply(fn, self, args); }
      finally {
        if (--captureDepth === 0) Array.prototype.push = push;
        casting = previous;
      }
    }
    function wrapCast(target, name, getKind) {
      const original = target?.[name];
      if (typeof original !== 'function') return;
      target[name] = function (...args) { return capture(getKind(this, args), original, this, args); };
    }
    wrapCast(combat, 'tick', (_, args) => kindOf(args[1]));
    wrapCast(combat, 'ghostCast', (_, args) => kindOf(args[0]));
    wrapCast(combat, 'ghostOrbit', (_, args) => kindOf(args[0]));
    for (const name of ['px', 'burst', 'spark', 'sp', 'twinkle', 'trail', 'ring', 'slash', 'beam']) {
      wrapCast(fx, name, () => casting);
    }
    for (const module of modules) {
      if (typeof module !== 'function') continue;
      if (module.prototype?.activeGroup && module.prototype?.cast) wrapCast(module.prototype, 'cast', self => kindOf(self));
      if (module.prototype?.bossCast && module.prototype?.shoot) {
        for (const name of ['shoot', 'hazard', 'bossCast', 'strike']) wrapCast(module.prototype, name, () => undefined);
      }
    }

    const paintMethods = new Set(['drawImage', 'fillRect', 'strokeRect', 'fill', 'stroke']);
    function drawingContext(ctx) {
      if (contexts.has(ctx)) return contexts.get(ctx);
      const methods = new Map();
      const proxy = new Proxy(ctx, {
        get(target, property) {
          const value = Reflect.get(target, property, target);
          if (typeof value !== 'function') return value;
          if (methods.get(property)?.original === value) return methods.get(property).bound;
          const bound = paintMethods.has(property) ? function (...args) {
            const factor = settings[painting] ?? 1;
            if (factor === 0) return;
            if (factor === 1) return Reflect.apply(value, target, args);
            const alpha = target.globalAlpha;
            target.globalAlpha = alpha * factor;
            try { return Reflect.apply(value, target, args); }
            finally { target.globalAlpha = alpha; }
          } : value.bind(target);
          methods.set(property, { original: value, bound });
          return bound;
        },
        set(target, property, value) { return Reflect.set(target, property, value, target); },
      });
      contexts.set(ctx, proxy);
      return proxy;
    }
    function wrapDraw(target, name) {
      const original = target[name];
      target[name] = function (ctx, ...args) {
        if (settings.own === 1 && settings.party === 1) return Reflect.apply(original, this, [ctx, ...args]);
        const iterator = Array.prototype[Symbol.iterator];
        const previous = painting;
        // The game's effect renderers iterate their private arrays. Scope this to
        // rendering only; never change simulation arrays, entity identity or RNG.
        Array.prototype[Symbol.iterator] = function* () {
          const items = Reflect.apply(iterator, this, []);
          for (let step = items.next(); !step.done; step = items.next()) {
            const before = painting;
            if (step.value && typeof step.value === 'object' && !Array.isArray(step.value)) painting = ownerOf(step.value);
            try { yield step.value; } finally { painting = before; }
          }
        };
        try { return Reflect.apply(original, this, [drawingContext(ctx), ...args]); }
        finally { Array.prototype[Symbol.iterator] = iterator; painting = previous; }
      };
    }
    wrapDraw(fx, 'draw');
    wrapDraw(shots, 'draw');
    wrapDraw(combat, 'drawGroundFields');
    wrapDraw(combat, 'drawAirFields');
    ready = true;
    renderSettings();
  }

  // shortcut: the current game creates one null-prototype module registry in
  // app.min.js; revalidate this adapter if the upstream module loader changes.
  const create = Object.create;
  function restoreCreate() { if (Object.create === observeCreate) Object.create = create; }
  function observeCreate(...args) {
    const result = Reflect.apply(create, Object, args);
    if (args[0] === null) {
      const src = document.currentScript?.src;
      if (src) {
        const url = new URL(src, location.origin);
        if (url.origin === location.origin && url.pathname === '/js/app.min.js') {
          restoreCreate();
          queueMicrotask(() => install(result));
        }
      }
    }
    return result;
  }
  Object.create = observeCreate;
  addEventListener('load', restoreCreate, { once: true });
  setTimeout(restoreCreate, 20000);

  function renderSettings() {
    const body = document.querySelector('#set-body');
    if (!body || !document.querySelector('#set-tabs [data-t="gfx"].on')) return;
    const existing = body.querySelector('[data-psko-effects]');
    if (existing) {
      for (const select of existing.querySelectorAll('select')) select.disabled = !ready;
      return;
    }
    const ko = globalThis.PS_LOCALES?.lang === 'ko';
    const labels = ko ? ['기본', '약간 투명', '매우 투명', '숨김'] : ['Default', 'Slightly transparent', 'Very transparent', 'Hidden'];
    const section = document.createElement('div');
    section.dataset.pskoEffects = '';
    section.dataset.pskoUi = '';
    for (const [kind, title] of [['own', ko ? '내 이펙트' : 'My effects'], ['party', ko ? '파티원 이펙트' : 'Party effects']]) {
      const row = document.createElement('div');
      row.className = 'set-row';
      const text = document.createElement('div');
      text.className = 'grow';
      const heading = document.createElement('b');
      heading.textContent = title;
      const description = document.createElement('small');
      description.id = `psko-effects-${kind}-description`;
      description.textContent = ko
        ? (kind === 'own' ? '내 기술 이펙트의 투명도를 조절합니다.' : '파티원 기술 이펙트의 투명도를 조절합니다.')
        : (kind === 'own' ? 'Adjust the opacity of your move effects.' : 'Adjust the opacity of party members’ move effects.');
      text.append(heading, description);
      const choices = document.createElement('select');
      choices.className = 'btn small';
      choices.setAttribute('aria-label', title);
      choices.setAttribute('aria-describedby', description.id);
      choices.disabled = !ready;
      levels.forEach((value, i) => {
        const option = document.createElement('option');
        option.value = String(value);
        option.textContent = labels[i];
        option.selected = settings[kind] === value;
        choices.append(option);
      });
      choices.addEventListener('change', () => {
        const value = Number(choices.value);
        if (!levels.includes(value)) return;
        settings[kind] = value;
        try { localStorage.setItem(key, JSON.stringify(settings)); } catch { /* Apply for this session. */ }
      });
      row.append(text, choices);
      section.append(row);
    }
    body.append(section);
  }
  function observeSettings() {
    const body = document.querySelector('#set-body');
    if (!body) return;
    new MutationObserver(renderSettings).observe(body, { childList: true });
    renderSettings();
  }
  document.addEventListener('DOMContentLoaded', observeSettings, { once: true });
})();
