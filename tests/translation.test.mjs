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
for (const name of [...gameDictionaries.map(([name]) => name), 'extra', 'shop', 'interface', 'changelog', 'pokemon']) {
  evaluate(context, `translations/${name}.js`);
}
evaluate(context, 'translation-core.js');
const translate = context.PSKO.translate;

test('partner selection translates the complete button with or without a shiny suffix', () => {
  for (const text of ['Elegir de compañero', 'Choose as partner', 'Choose de partner']) {
    assert.equal(translate(text), '파트너로 선택', text);
  }
  for (const text of ['Elegir de compañero (shiny)', 'Choose as partner (shiny)', 'Choose de partner (shiny)']) {
    assert.equal(translate(text), '파트너로 선택 (색이 다른)', text);
  }
});

test('starter descriptions translate moves and the current personality labels together', () => {
  for (const source of ['Ember · Loner, Proud', 'Ascuas · Solitario, Orgulloso']) {
    assert.equal(translate(source), '불꽃세례 · 독립적, 자부심');
  }
  assert.equal(translate('Razor Leaf · Proud, Clever'), '잎날가르기 · 자부심, 영리함');
});

test('Psychic is distinguished as a type or a move', () => {
  assert.equal(translate('Psychic'), '에스퍼');
  assert.equal(translate('Psíquico'), '에스퍼');
  assert.equal(context.PSKO.translateMove('Psychic'), '사이코키네시스');
  assert.equal(context.PSKO.translateMove('  PSÍQUICO  '), '  사이코키네시스  ');
  assert.equal(context.PSKO.translateMove('Bone Rush'), '본러시');
  assert.equal(context.PSKO.translateMove('Psychic Fangs'), '사이코팽');
  assert.equal(context.PSKO.translateMove('Psychic Fangs Lv.3'), '사이코팽 레벨 3');
  assert.equal(context.PSKO.translateMove(null), null);
});

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

test('audited interface, shop and changelog text resolves as a complete phrase in both input forms', () => {
  for (const file of ['interface', 'shop', 'changelog']) {
    for (const [source, intermediate, korean] of readMessages(file)) {
      const count = (text) => (text.match(/\{x\}/g) || []).length;
      assert.equal(count(source), count(korean), source);
      assert.equal(count(intermediate), count(korean), intermediate);
      if (count(source)) continue;
      assert.equal(translate(source), korean, source);
      assert.equal(translate(intermediate), korean, intermediate);
    }
  }
});

test('every current TM uses its Korean move name and a complete translated description', () => {
  const { moves } = JSON.parse(readFileSync(new URL('./fixtures/official-game-moves.json', import.meta.url), 'utf8'));
  assert.equal(moves.length, 103);
  for (const { id, name: [spanish, english, korean], desc } of moves) {
    assert.equal(context.PSKO.translateMove(spanish), korean, id);
    assert.equal(context.PSKO.translateMove(english), korean, id);
    assert.equal(context.PSKO.translateMove(`TM ${english}`), `기술머신 ${korean}`, id);
    assert.equal(context.PSKO.translateMove(`MT ${spanish}`), `기술머신 ${korean}`, id);
    for (const text of desc) {
      assert.doesNotMatch(translate(text).replace(/\b(?:HP|XP|DPS)\b/g, ''), /[\p{Script=Latin}\p{Script=Han}]/u, id);
    }
  }
  assert.equal(translate('Turtwig can learn it'), '학습 가능: 모부기');
  assert.equal(translate('Scorbunny la puede aprender'), '학습 가능: 염버니');
});

test('handles native partial translations, Chinese notices, and localized durations', () => {
  assert.equal(translate('Estás como guest: '), '게스트로 플레이 중: ');
  assert.equal(translate('You have su shiny'), '색이 다른 모습을 보유 중입니다');
  assert.equal(translate('Buscar por Name'), '이름으로 검색');
  assert.equal(translate('Impulsivo'), '즉흥적');
  assert.equal(translate('Web oficial: pokesurvivor.com · si alguien te pide pagar, no somos nosotros'), '공식 웹사이트: pokesurvivor.com · 이 게임은 무료입니다');
  assert.equal(translate('Se renuevan en 2 h 15 min'), '2시간 15분 후 갱신');
  assert.equal(translate('Psychic Nv.5'), '에스퍼 레벨 5');
  assert.equal(translate('登录窗口被浏览器拦截，请允许弹出窗口后重试。'), '로그인 팝업이 차단됐습니다. 팝업을 허용한 뒤 다시 시도하세요.');
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

test('unknown sentences and nicknames are not partially translated', () => {
  for (const text of ['Brave Otter', 'Lucky Robin', 'Choose some unknown option']) {
    assert.equal(translate(text), text);
  }
  assert.equal(translate('Brave Otter joins you!'), 'Brave Otter 합류!');
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
