import assert from 'node:assert/strict';
import test from 'node:test';
import { createPokemonSearch } from '../extension/pokemon-search.mjs';

const entries = [
  { dex: 243, names: ['라이코', 'Raikou'] },
  { dex: 26, names: ['라이츄', 'Raichu'] },
  { dex: 6, names: ['리자몽', 'Charizard'] },
  { dex: 25, names: ['피카츄', 'Pikachu'] },
  { dex: 500019, nationalDex: 19, names: ['꼬렛 (알로라의 모습)', 'Rattata de Alola', 'Alolan Rattata'] },
];
const search = createPokemonSearch(entries, entry => entry.names);
const dexes = query => search(query).map(entry => entry.dex);

test('searches Korean, English and regional aliases and both kinds of Pokédex number', () => {
  for (const [query, expected] of [
    ['피카', [25]], [' PIKA ', [25]], ['가 아닌 이름', []],
    ['alolan', [500019]], ['500019', [500019]], ['019', [500019]],
    ['243', [243]], ['999', []],
  ]) assert.deepEqual(dexes(query), expected, query);
  assert.equal(search('  '), entries);
});

test('matches Korean initials without treating Latin text or numbers as empty initials', () => {
  assert.deepEqual(dexes('ㅍㅋㅊ'), [25]);
  assert.deepEqual(dexes('ㄹㅇ'), [243, 26, 500019]);
  assert.deepEqual(dexes('ㄹㅈㅁ'), [6]);
  assert.deepEqual(dexes('ㅆㅆ'), []);
  assert.deepEqual(dexes('zzzzz'), []);
  assert.deepEqual(dexes('024'), []);
});

test('matches misspellings through decomposed Hangul and normalizes keyboard composition', () => {
  assert.deepEqual(dexes('피카추'), [25]);
  assert.deepEqual(dexes('리자뭉'), [6]);
  assert.deepEqual(dexes('pikchu'), [25]);
  assert.deepEqual(dexes('피카츄'.normalize('NFD')), [25]);
});

test('prefers direct matches and preserves tier order for fuzzy results', () => {
  const ranked = [
    { dex: 1, names: ['피카츄 (모자)'] },
    { dex: 2, names: ['피카츄'] },
    { dex: 3, names: ['피카추'] },
  ];
  const find = createPokemonSearch(ranked, entry => entry.names);
  assert.deepEqual(find('피카추'), [ranked[2]]);
  assert.deepEqual(find('피카쥬'), [ranked[0], ranked[1]]);
  assert.deepEqual(find('ㅍㅋㅊ'), ranked);
  assert.deepEqual(createPokemonSearch([], () => [])('피카추'), []);
});
