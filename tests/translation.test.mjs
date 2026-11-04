import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const extensionUrl = new URL('../extension/', import.meta.url);
const gameDictionaries = [
  ['moves', 300],
  ['menus', 300],
  ['progress', 300],
  ['settings', 288],
];

function evaluate(context, relativePath) {
  vm.runInContext(readFileSync(new URL(relativePath, extensionUrl), 'utf8'), context, {
    filename: relativePath,
    timeout: 1000,
  });
}

function readMessages(name) {
  const context = vm.createContext({});
  evaluate(context, `translations/${name}.js`);
  return context.PSKO_MESSAGES;
}

const context = vm.createContext({});
for (const name of [...gameDictionaries.map(([name]) => name), 'extra', 'pokemon']) {
  evaluate(context, `translations/${name}.js`);
}
evaluate(context, 'translation-core.js');
const translate = context.PSKO.translate;

test('all 1,188 game messages have complete translations and matching placeholders', () => {
  let total = 0;
  for (const [name, count] of gameDictionaries) {
    const messages = readMessages(name);
    assert.equal(messages.length, count, `${name} message count`);
    total += messages.length;
    for (const [index, entry] of messages.entries()) {
      assert.equal(entry.length, 3, `${name}[${index}] must contain Spanish, English, Korean`);
      const [spanish, english, korean] = entry;
      for (const text of entry) {
        assert.equal(typeof text, 'string', `${name}[${index}] must contain strings`);
        assert.ok(text.trim(), `${name}[${index}] must not be empty`);
      }
      const placeholders = (text) => (text.match(/\{x\}/g) || []).length;
      assert.equal(placeholders(korean), placeholders(spanish), `${name}[${index}] Spanish placeholders`);
      assert.equal(placeholders(korean), placeholders(english), `${name}[${index}] English placeholders`);
    }
  }
  assert.equal(total, 1188);
});

test('starter Pokémon and names with punctuation use Korean species names', () => {
  for (const [source, expected] of [
    ['Bulbasaur', '이상해씨'],
    ['Charmander', '파이리'],
    ['Squirtle', '꼬부기'],
    ['Pikachu', '피카츄'],
    ['Mr. Mime', '마임맨'],
    ['Farfetch’d', '파오리'],
    ["Farfetch'd", '파오리'],
  ]) assert.equal(translate(source), expected, source);
});

test('all 18 Pokémon types have Korean names', () => {
  for (const [source, expected] of [
    ['Normal', '노말'], ['Fire', '불꽃'], ['Water', '물'], ['Grass', '풀'],
    ['Electric', '전기'], ['Ice', '얼음'], ['Fighting', '격투'], ['Poison', '독'],
    ['Ground', '땅'], ['Flying', '비행'], ['Psychic', '에스퍼'], ['Bug', '벌레'],
    ['Rock', '바위'], ['Ghost', '고스트'], ['Dragon', '드래곤'], ['Dark', '악'],
    ['Steel', '강철'], ['Fairy', '페어리'],
  ]) assert.equal(translate(source), expected, source);
});

test('move names translate from both game languages', () => {
  for (const [source, expected] of [
    ['Thunderbolt', '10만볼트'], ['Rayo', '10만볼트'],
    ['Flamethrower', '화염방사'], ['Lanzallamas', '화염방사'],
    ['Water Gun', '물대포'], ['Pistola Agua', '물대포'],
    ['Pikachu · Thunderbolt', '피카츄 · 10만볼트'],
  ]) assert.equal(translate(source), expected, source);
});

test('uppercase UI labels and names translate', () => {
  assert.equal(translate('SETTINGS'), '설정');
  assert.equal(translate('PIKACHU'), '피카츄');
  assert.equal(translate('THUNDERBOLT'), '10만볼트');
});

test('dynamic messages translate names and keep placeholder order and values', () => {
  assert.equal(translate('A wild Bulbasaur appeared!'), '야생의 이상해씨 등장!');
  assert.equal(translate('¡Bulbasaur salvaje apareció!'), '야생의 이상해씨 등장!');
  assert.equal(translate('Level 27!'), '레벨 27!');
  assert.equal(translate('Question 2 of 8'), '질문 2 / 8');
  assert.equal(translate('You have 12 of 151'), '보유 12 / 151');
});

test('specific rift timer messages retain distance and translate seconds', () => {
  assert.equal(translate('Rift · 128 m · 32 s'), '균열 · 128 m · 32초');
  assert.equal(translate('Grieta · 128 m · 32 s'), '균열 · 128 m · 32초');
});

test('unknown text, whitespace, and numeric-only labels remain intact', () => {
  for (const text of ['', '  unexplored\n\tnebula  ', '\n\t', '01:34', '+25%', '1,234 / 9,999']) {
    assert.equal(translate(text), text);
  }
  assert.equal(translate('\n  Pikachu\t'), '\n  피카츄\t');
  assert.equal(translate('Bulbasaur 23% 01:34 +5'), '이상해씨 23% 01:34 +5');
});

test('dictionary terms do not replace parts of unrelated words or identifiers', () => {
  const text = 'Firefly SquirtleTrainer my_Pikachu';
  assert.equal(translate(text), text);
});

test('repeated translation leaves Korean text unchanged', () => {
  const korean = translate('A wild Bulbasaur appeared!');
  assert.equal(translate(korean), korean);
  assert.equal(translate('A wild Bulbasaur appeared!'), korean);
});

test('non-string canvas arguments are passed through without coercion', () => {
  const value = { label: 'Pikachu' };
  assert.equal(translate(123), 123);
  assert.equal(translate(null), null);
  assert.equal(translate(undefined), undefined);
  assert.equal(translate(value), value);
});
