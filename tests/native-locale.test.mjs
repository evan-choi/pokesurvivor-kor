import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../extension/native-locale.js', import.meta.url), 'utf8');

function boot(preferences = {}) {
  const storage = new Map(Object.entries(preferences));
  const document = Object.assign(new EventTarget(), { documentElement: { lang: 'es' } });
  class DetailEvent extends Event {
    constructor(type, options) { super(type); this.detail = options.detail; }
  }
  let reloads = 0;
  const context = vm.createContext({
    document, CustomEvent: DetailEvent,
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    location: { reload: () => reloads++ },
    PSKO_MESSAGES: [['Luminosfera', 'Luminous Orb', '빛의구슬'],
      ['Tu apodo es {x}', 'Your nickname is {x}', '내 닉네임은 {x}입니다'],
      ['¡{x} necesita ayuda! · {x} m', '{x} needs help! · {x} m', '{name} 님에게 도움이 필요합니다! · {x} m']],
    PSKO_POKEMON: { Shaymin: '쉐이미' },
  });
  vm.runInContext(source, context);
  const choices = [['es', 'Español', 'es-ES'], ['en', 'English', 'en-GB'], ['fr', 'Français', 'fr-FR']];
  context.PS_LOCALES = {
    choices, lang: 'en', locale: 'en-GB',
    normalize: value => choices.find(([id]) => id === value)?.[0],
  };
  return { context, document, storage, DetailEvent, reloads: () => reloads };
}

test('Korean is registered before the game consumes its locales and dictionaries', () => {
  const { context, document } = boot();
  assert.equal(context.PS_LOCALES.lang, 'ko');
  assert.equal(context.PS_LOCALES.locale, 'ko-KR');
  assert.equal(context.PS_LOCALES.normalize('ko'), 'ko');
  assert.equal(document.documentElement.lang, 'ko');
  assert.equal(context.PSKO_NATIVE_LOCALE.active, true);
  const [dictionary, language] = context.PS_LANG_Q[0];
  assert.equal(language, 'ko');
  assert.equal(dictionary.Luminosfera, '빛의구슬');
  assert.equal(dictionary['Luminous Orb'], '빛의구슬');
  assert.equal(dictionary.Shaymin, '쉐이미');
  assert.equal(dictionary['빛의구슬'], '빛의구슬');
  assert.equal(dictionary['쉐이미'], '쉐이미');
  assert.equal(dictionary['내 닉네임은 {x}입니다'], undefined);
  assert.equal(dictionary['{name} 님에게 도움이 필요합니다! · {x} m'], '{name} 님에게 도움이 필요합니다! · {x} m');
  for (const name of ['Switch', 'The Pokémon Company', 'CREDITS.md', 'Authentication > Settings > Authorized domains']) {
    assert.equal(dictionary[name], name);
  }
  const [moves, moveLanguage, scope] = context.PS_LANG_Q[1];
  assert.equal(moveLanguage, 'ko');
  assert.equal(scope, 'move');
  assert.equal(moves.Psychic, '사이코키네시스');
  assert.equal(dictionary['{x} Primigenio'], '원시{x}');
  assert.equal(dictionary['Primal {x}'], '원시{x}');
});

test('a disabled extension restores the previous language when the saved game language is Korean', () => {
  const { context } = boot({ 'psko.native-enabled': 'false', 'ps.lang': 'ko', 'psko.original-language': 'fr' });
  assert.equal(context.PS_LOCALES.lang, 'fr');
  assert.equal(context.PS_LOCALES.locale, 'fr-FR');
  assert.equal(context.PSKO_NATIVE_LOCALE.active, false);
  assert.equal(context.PS_LOCALES.choices.filter(([id]) => id === 'ko').length, 1);
});

test('a changed preference requests a reload and persists the startup preference', () => {
  const { document, storage, DetailEvent, reloads } = boot();
  document.dispatchEvent(new DetailEvent('psko:settings', { detail: true }));
  assert.equal(reloads(), 0);
  document.dispatchEvent(new DetailEvent('psko:settings', { detail: false }));
  assert.equal(reloads(), 1);
  assert.equal(storage.get('psko.native-enabled'), 'false');
});

test('an unrecognized locale configuration is preserved for the game and leaves fallback translation available', () => {
  const { context } = boot();
  const changedConfiguration = { language: 'en' };
  context.PS_LOCALES = changedConfiguration;
  assert.equal(context.PS_LOCALES, changedConfiguration);
  assert.equal(context.PSKO_NATIVE_LOCALE.registered, false);
  assert.equal(context.PSKO_NATIVE_LOCALE.active, false);
});
