import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readOwnedPokemon, rankOwnedPokemon, validateRankings } from '../extension/owned-pokemon.mjs';

function readCollection({ storage = {}, user = { id: 'current-user' }, platform = true, game = true } = {}) {
  const reads = [];
  const result = vm.runInNewContext(`(${readOwnedPokemon.toString()})()`, {
    document: { querySelector: () => game },
    window: { PS_PLATFORM_MODE: platform, PS_HOST_USER: user },
    localStorage: { getItem: (key) => { reads.push(key); return storage[key] ?? null; } },
    console: { error() {} },
  });
  return { result: JSON.parse(JSON.stringify(result)), reads };
}

test('reads only the active platform account and returns species numbers without save details', () => {
  const { result, reads } = readCollection({ storage: {
    'ps.save.platform.current-user': JSON.stringify({ owned: { 243: { at: 1 }, 25: { at: 2 }, 150: false }, coins: 999, name: 'Private' }),
    'ps.save.platform.other-user': JSON.stringify({ owned: { 890: { at: 3 } } }),
  } });
  assert.deepEqual(result, { owned: [25, 243] });
  assert.deepEqual(reads, ['ps.save.platform.current-user']);
  assert.deepEqual(readCollection({ user: { id: 'user/a' }, storage: {
    'ps.save.platform.user%2Fa': '{"owned":{"243":true}}',
  } }).result, { owned: [243] });
});

test('legacy accounts follow ps.session and never combine accounts', () => {
  const { result, reads } = readCollection({ platform: false, storage: {
    'ps.session': '"player"',
    'ps.save.player': '{"owned":{"150":true}}',
    'ps.save.another': '{"owned":{"243":true}}',
  } });
  assert.deepEqual(result, { owned: [150] });
  assert.deepEqual(reads, ['ps.session', 'ps.save.player']);
});

test('ignores the host page and distinguishes logged-out, empty, missing and malformed saves', () => {
  assert.deepEqual(readCollection({ game: false }), { result: null, reads: [] });
  assert.match(readCollection({ user: null }).result.error, /로그인/);
  assert.match(readCollection().result.error, /읽지 못했습니다/);
  assert.deepEqual(readCollection({ storage: { 'ps.save.platform.current-user': '{"owned":{}}' } }).result, { owned: [] });
  for (const invalid of ['{', 'null', '{"owned":[]}', '{"owned":{"invalid":true}}']) {
    assert.ok(readCollection({ storage: { 'ps.save.platform.current-user': invalid } }).result.error, invalid);
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
