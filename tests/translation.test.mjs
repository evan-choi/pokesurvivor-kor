import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const extensionUrl = new URL('../extension/', import.meta.url);
const gameDictionaries = [
  ['moves', 303],
  ['menus', 300],
  ['progress', 500],
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
for (const name of [...gameDictionaries.map(([name]) => name), 'extra', 'gameplay', 'shop', 'pokedex', 'interface', 'changelog', 'pokemon']) {
  evaluate(context, `translations/${name}.js`);
}
evaluate(context, 'translation-core.js');
const translate = context.PSKO.translate;

test('all added form labels preserve their complete Korean names', () => {
  const forms = readMessages('pokemon');
  assert.equal(forms.length, 623);
  for (const [spanish, english, korean] of forms) {
    assert.equal(translate(spanish), korean, spanish);
    assert.equal(translate(english), korean, english);
  }
  for (const [source, expected] of [
    ['Mega Charizard X', '메가리자몽X'],
    ['Mega Mewtwo Y', '메가뮤츠Y'],
    ['Mega Lucario Z', '메가루카리오Z'],
    ['Alolan Raichu', '라이츄 (알로라의 모습)'],
    ['White Kyurem', '화이트큐레무'],
    ['Ice Calyrex', '버드렉스 (백마 탄 모습)'],
    ['Blade Aegislash', '킬가르도 (블레이드폼)'],
    ['Stellar Form Terapagos', '테라파고스 (스텔라폼)'],
    ['Pikachu Libre', '마스크드 피카츄'],
    ['Pikachu Rock Star', '하드록 피카츄'],
    ['Unown B', '안농 B'],
    ['Unown !', '안농 !'],
    ['Furioseta', '사나운버섯'],
    ['Ferrotesta', '무쇠감투'],
  ]) assert.equal(translate(source), expected, source);
});

test('all translation records preserve the order and kind of their placeholders', () => {
  const slots = text => (text.match(/\{(?:x|y|name)\}/g) || []).map(slot => slot.replace('name', 'x'));
  for (const [spanish, english, korean] of context.PSKO_MESSAGES) {
    assert.deepEqual(slots(spanish), slots(korean), spanish);
    assert.deepEqual(slots(english), slots(korean), english);
  }
});

test('updated controls, reward placeholders and primal names keep their contexts', () => {
  assert.equal(translate('DOWN'), '쓰러짐');
  assert.equal(translate('Down'), '아래');
  assert.equal(translate('¡Gana Pikachu! Te llevas 10.'), '피카츄 승리! 10 획득.');
  assert.equal(translate('Pikachu wins! You take 10.'), '피카츄 승리! 10 획득.');
  assert.equal(translate('Groudon Primigenio'), '원시그란돈');
  assert.equal(translate('Primal Kyogre'), '원시가이오가');
  assert.equal(context.PSKO.translateMove('Elegir: Pulso Primigenio'), '선택: 근원의파동');
  assert.equal(context.PSKO.translateMove('Choose: Origin Pulse'), '선택: 근원의파동');
  assert.equal(translate(' Estás como invitado: '), ' 게스트로 플레이 중: ');
  assert.equal(translate('16 h 49 min 후 변경'), '16시간 49분 후 변경');
  assert.equal(translate('16 h 후 변경'), '16시간 후 변경');
  assert.equal(translate('49 min 후 변경'), '49분 후 변경');
});

test('orb pickup messages translate the name, current control and effect together', () => {
  const effect = '15초 동안 자신과 주변 팀원의 급소 확률이 25% 증가합니다.';
  const en = '+25% critical chance for 15 s, for you and nearby teammates.';
  const es = '+25 % de crítico durante 15 s, para ti y los compañeros cercanos.';
  for (const [hint, translated] of [
    ['key 5', '5번 키'], ['key 8', '8번 키'], ['X to use it', 'X 버튼으로 사용'],
    ['tap it above your moves', '기술 위의 구슬을 터치'],
  ]) {
    assert.equal(translate(`Focus Orb (${hint}): ${en}`), `집중의 구슬 (${translated}): ${effect}`);
  }
  assert.equal(translate(`Focosfera (tecla 6): ${es}`), `집중의 구슬 (6번 키): ${effect}`);
});

test('multiplayer notices preserve player names before and after native translation', () => {
  for (const name of ['Fire', 'Ash Pokémon', 'Psychic']) {
    for (const [sources, expected] of [
      [[`Watching ${name}`, `Viendo a ${name}`], `${name} 관전 중`],
      [[`${name} is back`, `${name} ha vuelto`], `${name} 복귀`],
      [[`${name}: reconnecting…`, `${name}: reconectando…`], `${name} 재연결 중…`],
      [[`${name} is the new host`, `${name} es el nuevo anfitrión`], `${name} 님이 새 방장이 되었습니다`],
    ]) {
      for (const source of sources) assert.equal(translate(source), expected);
      assert.equal(translate(expected), expected);
    }
  }
  assert.equal(translate('4d 11:19:51'), '4일 11:19:51');
});

test('starting move notices distinguish Psychic from its type in both native output forms', () => {
  for (const [sources, expected] of [
    [['Bulbasaur empezará con Psíquico', 'Bulbasaur will start with Psychic',
      '이상해씨의 시작 기술: Psíquico', '이상해씨의 시작 기술: Psychic'], '이상해씨의 시작 기술: 사이코키네시스'],
    [['Bulbasaur empezará también con Psíquico', 'Bulbasaur will also start with Psychic',
      'Bulbasaur의 두 번째 시작 기술: Psíquico', 'Bulbasaur의 두 번째 시작 기술: Psychic'],
    '이상해씨의 두 번째 시작 기술: 사이코키네시스'],
  ]) {
    for (const source of sources) assert.equal(translate(source), expected);
  }
});

test('native Korean canvas notices keep player names and still translate source text', () => {
  const document = Object.assign(new EventTarget(), { readyState: 'complete', querySelector: () => true });
  class Canvas {
    font = '600 11px sans-serif';
    fillText(text) { return text; }
    strokeText(text) { return text; }
    measureText(text) { return text; }
  }
  const sandbox = vm.createContext({
    PSKO: context.PSKO, PSKO_NATIVE_LOCALE: { active: true }, CanvasRenderingContext2D: Canvas,
    document, window: {}, Event,
  });
  evaluate(sandbox, 'canvas.js');
  document.dispatchEvent(Object.assign(new Event('psko:settings'), { detail: true }));
  for (const method of ['fillText', 'strokeText', 'measureText']) {
    const canvas = new Canvas();
    assert.equal(canvas[method]('Fire 관전 중 · 교체'), 'Fire 관전 중 · 교체');
    assert.equal(canvas[method]('Ash Pokémon 관전 중 · 교체'), 'Ash Pokémon 관전 중 · 교체');
    assert.equal(canvas[method]('Watching Fire'), 'Fire 관전 중');
    assert.equal(canvas[method]('Psychic'), '사이코키네시스');
    const { moves } = JSON.parse(readFileSync(new URL('./fixtures/official-game-moves.json', import.meta.url), 'utf8'));
    for (const { name: [spanish, english, korean] } of moves) {
      assert.equal(canvas[method](spanish), korean);
      assert.equal(canvas[method](english), korean);
    }
    const value = Symbol('canvas argument');
    assert.equal(canvas[method](value), value);
  }
});

test('all orb tooltips measure and draw the complete translation after word wrapping', () => {
  const document = Object.assign(new EventTarget(), { readyState: 'complete', querySelector: () => true });
  class Canvas {
    font = '600 11px sans-serif';
    fillText(text) { return text; }
    measureText(text) { return text; }
  }
  const sandbox = vm.createContext({
    PSKO: context.PSKO, PSKO_ORBS: context.PSKO_ORBS, CanvasRenderingContext2D: Canvas,
    document, window: {}, Event,
  });
  evaluate(sandbox, 'canvas.js');
  const setEnabled = (detail) => document.dispatchEvent(Object.assign(new Event('psko:settings'), { detail }));
  setEnabled(true);
  const ctx = new Canvas();
  assert.equal(context.PSKO_ORBS.length, 6);
  for (const [names, effects] of context.PSKO_ORBS) {
    for (const lang of [0, 1]) {
      const words = effects[lang].split(' ');
      for (let split = 1; split < words.length; split++) {
        const lines = [words.slice(0, split).join(' '), words.slice(split).join(' ')];
        for (const method of ['measureText', 'fillText']) {
          assert.equal(ctx[method](names[lang]), names[2]);
          assert.equal(lines.map(line => ctx[method](line)).join(' '), effects[2]);
        }
      }
    }
  }
  setEnabled(false);
  assert.equal(ctx.fillText('Luminous Orb'), 'Luminous Orb');
  assert.equal(ctx.fillText('out) for 15 s, you and nearby teammates.'), 'out) for 15 s, you and nearby teammates.');
});

test('level-up hints preserve the partner, percentage and preferred attack category', () => {
  const expected = '쉐이미 사용 시 위력 91%. 특수 기술로 더 큰 피해를 줍니다.';
  for (const hint of [
    'Con Shaymin rinde un 91 %: pega mejor con ataques especiales.',
    'With Shaymin it deals 91 %: it hits harder with special moves.',
    'With Shaymin rinde un 91 %: hits harder with special moves.',
    'Shaymin rinde un 91 %: hits harder with special moves. 사용',
  ]) assert.equal(translate(hint), expected);
  assert.equal(translate('Shaymin rinde un 87 %: hits harder with physical moves. 사용'),
    '쉐이미 사용 시 위력 87%. 물리 기술로 더 큰 피해를 줍니다.');
});

test('upgrade options translate the whole label with and without invested levels', () => {
  for (const marker of ['compañero', 'partner']) {
    for (const unit of ['niveles', 'levels']) {
      assert.equal(translate(`Shaymin (${marker}) · 17 ${unit}`), '쉐이미 (파트너) · 강화 17레벨');
      assert.equal(translate(`Turtwig · 9 ${unit}`), '모부기 · 강화 9레벨');
    }
    assert.equal(translate(`Shaymin (${marker})`), '쉐이미 (파트너)');
  }
  assert.equal(translate('Chimchar'), '불꽃숭이');
});

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

test('starting-move labels preserve all move names, including short names and type homonyms', () => {
  const { moves } = JSON.parse(readFileSync(new URL('./fixtures/official-game-moves.json', import.meta.url), 'utf8'));
  for (const { name: [spanish, english, korean] } of moves) {
    for (const [name, choose, suffix] of [[spanish, 'Elegir', '(de serie)'], [english, 'Choose', '(default)']]) {
      assert.equal(context.PSKO.translateMove(`${choose}: ${name}`), `선택: ${korean}`);
      assert.equal(context.PSKO.translateMove(`${name} ${suffix}`), `${korean} (기본)`);
    }
  }
  assert.equal(translate('Elegir: Psíquico'), '선택: 사이코키네시스');
  assert.equal(translate('Choose: Psychic'), '선택: 사이코키네시스');
  assert.equal(translate('Psychic'), '에스퍼');
});

test('all 1,391 base game messages have complete translations and matching placeholders', () => {
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
      const placeholders = (text) => (text.match(/\{(?:x|y|name)\}/g) || []).map(slot => slot.replace('name', 'x'));
      assert.deepEqual(placeholders(korean), placeholders(spanish), `${name}[${index}] Spanish placeholders`);
      assert.deepEqual(placeholders(korean), placeholders(english), `${name}[${index}] English placeholders`);
    }
  }
  assert.equal(total, 1391);
});

test('audited interface, shop and changelog text resolves as a complete phrase in both input forms', () => {
  for (const file of ['extra', 'gameplay', 'interface', 'shop', 'pokedex', 'changelog']) {
    for (const [source, intermediate, korean] of readMessages(file)) {
      const count = (text) => (text.match(/\{(?:x|y|name)\}/g) || []).length;
      assert.equal(count(source), count(korean), source);
      assert.equal(count(intermediate), count(korean), intermediate);
      if (count(source)) continue;
      assert.equal(translate(source), korean, source);
      assert.equal(translate(intermediate), korean, intermediate);
    }
  }
});

test('every current move uses its Korean name and a complete translated description', () => {
  const { moves } = JSON.parse(readFileSync(new URL('./fixtures/official-game-moves.json', import.meta.url), 'utf8'));
  assert.equal(moves.length, 176);
  for (const { id, name: [spanish, english, korean], desc } of moves) {
    assert.equal(context.PSKO.translateMove(spanish), korean, id);
    assert.equal(context.PSKO.translateMove(english), korean, id);
    assert.equal(context.PSKO.translateMove(`TM ${english}`), `기술머신 ${korean}`, id);
    assert.equal(context.PSKO.translateMove(`MT ${spanish}`), `기술머신 ${korean}`, id);
    for (const text of desc) {
      assert.doesNotMatch(translate(text).replace(/\b(?:HP|XP|DPS)\b|DD(?=래리어트)/g, ''), /[\p{Script=Latin}\p{Script=Han}]/u, id);
    }
  }
  assert.equal(translate('Turtwig can learn it'), '학습 가능: 모부기');
  assert.equal(translate('Scorbunny la puede aprender'), '학습 가능: 염버니');
});

test('hover descriptions cover all current moves and fully translate evolved names and effects', () => {
  evaluate(context, 'move-tooltip-data.js');
  const { moves } = JSON.parse(readFileSync(new URL('./fixtures/official-game-moves.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(context.PSKO_MOVE_INFO).filter(id => !id.startsWith('item:')).sort(), moves.map(m => m.id).sort());
  for (const { id, name: [, , korean] } of moves) {
    const data = context.PSKO_MOVE_INFO[id];
    for (const name of data.name) assert.equal(context.PSKO.translateMove(name), korean, id);
    for (const entry of [data, data.evo].filter(Boolean)) {
      for (const name of entry.name) assert.doesNotMatch(context.PSKO.translateMove(name).replace(/DD(?=래리어트)/g, ''), /[\p{Script=Latin}\p{Script=Han}]/u, id);
      for (const desc of entry.desc) assert.doesNotMatch(translate(desc).replace(/\b(?:HP|XP|DPS)\b|DD(?=래리어트)/g, ''), /[\p{Script=Latin}\p{Script=Han}]/u, id);
    }
  }
});

test('held-item hover descriptions cover all 24 items and translate their effects', () => {
  evaluate(context, 'move-tooltip-data.js');
  const items = Object.entries(context.PSKO_MOVE_INFO).filter(([id]) => id.startsWith('item:'));
  assert.equal(items.length, 24);
  for (const [id, data] of items) {
    for (const value of [...data.name, ...data.desc]) {
      assert.doesNotMatch(translate(value), /[\p{Script=Latin}\p{Script=Han}]/u, id);
    }
  }
  assert.equal(translate(context.PSKO_MOVE_INFO['item:lifeorb'].name[1]), '생명의구슬');
});

test('handles native partial translations, Chinese notices, and localized durations', () => {
  assert.equal(translate('Estás como guest: '), '게스트로 플레이 중: ');
  assert.equal(translate('You have su shiny'), '색이 다른 모습을 보유 중입니다');
  assert.equal(translate('Buscar por Name'), '이름으로 검색');
  assert.equal(translate('Impulsivo'), '즉흥적');
  assert.equal(translate('Web oficial: pokesurvivor.com · si alguien te pide pagar, no somos nosotros'), '공식 웹사이트: pokesurvivor.com · 돈을 요구하는 곳은 저희와 관계없습니다');
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
