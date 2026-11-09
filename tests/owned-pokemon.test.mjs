import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { readOwnedPokemon, rankOwnedPokemon, validateRankings } from '../extension/owned-pokemon.mjs';

function collectionReader(save = { owned: {} }, supported = true) {
  const forbidden = [];
  const deny = name => { forbidden.push(name); throw new Error(`Unexpected private-data access: ${name}`); };
  const context = vm.createContext({
    document: { querySelector: () => true },
    console: { error() {} },
    get localStorage() { return deny('localStorage'); },
    get firebase() { return deny('firebase'); },
  });
  const store = { save, owns() {}, upgradesOf() {},
    get user() { return deny('user'); }, get loggedIn() { return deny('loggedIn'); },
    get guest() { return deny('guest'); }, get fb() { return deny('fb'); },
  };
  vm.runInContext(readFileSync(new URL('../extension/collection.js', import.meta.url), 'utf8'), context);
  context.PSKO_INSTALL_COLLECTION_READER(supported ? { store } : {});
  const read = () => JSON.parse(JSON.stringify(vm.runInContext(`(${readOwnedPokemon.toString()})()`, context)));
  return { read, store, context, forbidden };
}

test('reads only the loaded collection without account, authentication or stored-save access', () => {
  const save = { owned: { 243: { at: 1 }, 25: { at: 2 }, 150: false },
    get name() { throw new Error('Name must not be read'); },
    get coins() { throw new Error('Unrelated save data must not be read'); },
  };
  const { read, forbidden } = collectionReader(save);
  assert.deepEqual(read(), { owned: [25, 243] });
  assert.deepEqual(forbidden, []);
  assert.deepEqual(Object.keys(save.owned), ['25', '150', '243']);
});

test('uses the current loaded save on every read and drops the old collection on logout', () => {
  const { read, store, forbidden } = collectionReader({ owned: { 150: true } });
  assert.deepEqual(read(), { owned: [150] });
  store.save = null;
  assert.match(read().error, /플레이를 시작/);
  store.save = { owned: { 243: true } };
  assert.deepEqual(read(), { owned: [243] });
  assert.deepEqual(forbidden, []);
});

test('handles unsupported games, empty collections and invalid data without reading private storage', () => {
  const { read, context } = collectionReader();
  assert.deepEqual(read(), { owned: [] });
  context.document.querySelector = () => false;
  assert.equal(read(), null);
  assert.match(collectionReader(undefined, false).read().error, /새로고침/);
  for (const save of [{}, { owned: [] }, { owned: { invalid: true } }, { owned: { 0: true } },
    { owned: { '9007199254740992': true } }]) {
    const reader = collectionReader(save);
    assert.ok(reader.read().error);
    assert.deepEqual(reader.forbidden, []);
  }
  context.document.querySelector = () => true;
  for (const result of [{ owned: [25] }, ['bad'], [25]]) {
    context.PSKO_READ_OWNED_POKEMON = () => result;
    assert.match(read().error, /형식/);
  }
});

const rankings = [
  { dex: 890, name: 'Eternatus', rank: 1, tier: 'S', path: '/pokedex/eternatus/' },
  { dex: 150, name: 'Mewtwo', rank: 2, tier: 'A', path: '/pokedex/mewtwo/' },
  { dex: 243, name: 'Raikou', rank: 3, tier: 'B', path: '/pokedex/raikou/' },
];

test('orders owned species by global rank and keeps unranked species last', () => {
  assert.deepEqual(rankOwnedPokemon([243, 9999, 890, 890, 9998], rankings), [
    rankings[0], rankings[2], { dex: 9998 }, { dex: 9999 },
  ]);
  assert.deepEqual(rankOwnedPokemon([], rankings), []);
  for (const invalid of [null, {}, ['243'], [-1], [1.5]]) assert.throws(() => rankOwnedPokemon(invalid, rankings));
});

test('rejects incomplete, duplicate or unsafe ranking data rather than showing invented tiers', () => {
  assert.equal(validateRankings(rankings), rankings);
  for (const invalid of [
    [], null, [null], rankings.slice(1), [...rankings, rankings[0]],
    [{ ...rankings[0], rank: 0 }], [{ ...rankings[0], dex: -1 }],
    [{ ...rankings[0], tier: 'SS' }], [{ ...rankings[0], name: '' }],
    [{ ...rankings[0], path: 'https://evil.example/pokedex/test/' }],
    [{ ...rankings[0], path: '/pokedex/../test/' }],
  ]) assert.throws(() => validateRankings(invalid));
});
