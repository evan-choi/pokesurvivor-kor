(() => {
  'use strict';

  const preferenceKey = 'psko.native-enabled';
  const originalLanguageKey = 'psko.original-language';
  let enabled = true;
  let config;
  let registered = false;
  let pendingLanguage;
  let reloading = false;
  try { enabled = localStorage.getItem(preferenceKey) !== 'false'; } catch { /* Use the extension's default. */ }

  const messages = Object.fromEntries((globalThis.PSKO_MESSAGES || []).flatMap(([spanish, english, korean]) =>
    [[spanish, korean], [english, korean]]));
  Object.assign(messages, globalThis.PSKO_POKEMON);
  // The game translates its output again in DOM and canvas hooks. Preserve these
  // compound names before shorter glossary terms such as Switch, Pokémon and Credits.
  for (const name of ['Switch', 'The Pokémon Company', 'CREDITS.md', 'Authentication > Settings > Authorized domains']) {
    messages[name] = name;
  }
  // The native DOM hook translates the output again. Match complete Korean
  // results before it can replace an English name next to a Korean particle.
  for (const translated of Object.values(messages)) {
    if (/[가-힣]/u.test(translated) && !/\{(?:x|name)\}/u.test(translated)) messages[translated] = translated;
  }
  // The game distinguishes move names from type names through this dictionary scope.
  const moveNames = { 'Psíquico': '사이코키네시스', 'Psychic': '사이코키네시스' };
  const queue = globalThis.PS_LANG_Q = globalThis.PS_LANG_Q || [];
  queue.push([messages, 'ko'], [moveNames, 'ko', 'move']);

  function register(value) {
    config = value;
    registered = false;
    if (!Array.isArray(config?.choices) || typeof config.normalize !== 'function') return;
    registered = true;
    if (!config.choices.some(([id]) => id === 'ko')) config.choices.push(['ko', '한국어', 'ko-KR']);
    let original = config.lang;
    try {
      if (localStorage.getItem('ps.lang') === 'ko') {
        original = config.normalize(localStorage.getItem(originalLanguageKey)) || 'en';
      } else {
        localStorage.setItem(originalLanguageKey, original);
      }
    } catch { /* The current language is sufficient when storage is unavailable. */ }
    config.lang = enabled ? 'ko' : original;
    config.locale = config.choices.find(([id]) => id === config.lang)?.[2] || 'en-GB';
    document.documentElement.lang = config.lang;
    return config;
  }

  // locales.js assigns this before the game consumes its language and translation queue.
  Object.defineProperty(globalThis, 'PS_LOCALES', {
    configurable: true,
    get: () => config,
    set: register,
  });
  globalThis.PSKO_NATIVE_LOCALE = {
    get registered() { return registered; },
    get active() { return registered && config.lang === 'ko'; },
  };

  document.addEventListener('click', event => {
    if (!registered) return;
    const button = event.target.closest?.('#scr-settings [data-lang], #set-body [data-lang], #settings-body [data-lang]');
    if (!button || !config.choices.some(([id]) => id === button.dataset.lang)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    pendingLanguage = button.dataset.lang;
    document.dispatchEvent(new CustomEvent('psko:set-enabled', { detail: pendingLanguage === 'ko' }));
  }, true);

  document.addEventListener('psko:settings', event => {
    if (typeof event.detail !== 'boolean') return;
    enabled = event.detail;
    try { localStorage.setItem(preferenceKey, String(enabled)); } catch { /* The extension stores the preference too. */ }
    if (!registered) return;
    const requested = pendingLanguage;
    pendingLanguage = undefined;
    if (requested) {
      try {
        localStorage.setItem('ps.lang', requested);
        if (requested !== 'ko') localStorage.setItem(originalLanguageKey, requested);
      } catch { /* Reload still applies the saved extension preference. */ }
    }
    // The game's language is fixed at startup, so switching follows its own reload behavior.
    if (!reloading && ((enabled !== (config.lang === 'ko')) || (requested && requested !== config.lang))) {
      reloading = true;
      location.reload();
    }
  });
  document.addEventListener('psko:storage-error', () => { pendingLanguage = undefined; });
})();
