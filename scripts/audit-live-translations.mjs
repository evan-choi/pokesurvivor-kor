import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const language = process.argv[2] || 'en';
if (!['en', 'es'].includes(language) || process.argv.length > 3) {
  console.error('Usage: node scripts/audit-live-translations.mjs [en|es]');
  process.exit(1);
}

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'test-results', `translation-audit-${language}.json`);
const extension = path.join(root, 'extension');
const { moves: expectedMoves, evolvedMoveIds } = JSON.parse(await readFile(path.join(root, 'tests/fixtures/official-game-moves.json'), 'utf8'));
const { moves: expectedPowers } = JSON.parse(await readFile(path.join(root, 'tests/fixtures/official-game-powers.json'), 'utf8'));
await mkdir(path.dirname(output), { recursive: true });

// Only these named products, rights holders and technical labels may remain in Latin script.
// Unknown words, including short words such as "de", "as" and "o", are still reported.
const allowedNames = [
  'pokesurvivor.com',
  'PokéSurvivor', 'PokeSurvivor', 'The Pokémon Company', 'Pokémon', 'Creatures Inc.',
  'Nintendo', 'Creatures', 'GAME FREAK', 'PolyForm Noncommercial 1.0.0',
  'CC BY-NC 4.0', 'Pixelify Sans', 'SpriteCollab', 'PokéAPI', 'PokeAPI',
  'JPTER78', 'TheAdro7', 'Folagor', 'Sekiam', 'PokeAlex', 'Copyright',
  'Pokémon Edición Reloaded', 'F3R', 'Jhony_Ryu', 'SrYena', 'Frisma32', 'pokemon-reloaded.blogspot.com',
  'Google', 'Gmail', 'GitHub', 'YouTube', 'Ko-fi', 'Discord', 'Firebase', 'CREDITS.md', 'MIT',
  'Xbox', 'PlayStation', 'Switch', 'USB', 'Bluetooth',
  'iPhone', 'Safari', 'Chrome', 'Android', 'iOS', 'Windows', 'macOS',
  'PMD', 'OFL', 'NFT', 'FPS', 'PC', 'HP', 'LAN', 'P2P',
];
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const namesPattern = new RegExp(`(?<![A-Za-z0-9])(?:${allowedNames.sort((a, b) => b.length - a.length).map(escape).join('|')})(?![A-Za-z0-9])`, 'gi');
const foreignCharacters = /[\p{Script=Latin}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

function unexplainedText(entry) {
  if (entry.tag === 'KBD' && /^(?:[WASDQERPF]|Esc|Enter|Space|Tab|Shift|Ctrl|Alt|Delete|Home|End|PageUp|PageDown|CapsLock|Num [0-9]|1[0-2]?|[2-9])$/i.test(entry.text)) return '';
  if (entry.class.split(/\s+/).includes('padkey') && /^(?:[ABXY]|LB|RB|LT|RT|Start|Select)$/u.test(entry.text)) return '';
  return entry.text
    .replace(namesPattern, '')
    .replace(/DD(?=래리어트)/g, '')
    .replace(/[XYZ](?=[가-힣])/g, '')
    .replace(/(메가[가-힣]+)\s?[XYZ](?=[\s,.!?()]|$)/g, '$1')
    .replace(/\bNo\.\s*\d+\b/gi, '')
    .replace(/\b(?:Lv|Nv)\.\s*\d+\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ms|min|s|m|h|HP|XP|EXP)\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*\/s\b/g, '')
    .replace(/\b(?:LB|RB|A|B|X|Y|Q|E|F|Esc)(?:·(?:LB|RB|A|B|X|Y|Q|E|F|Esc))*\s*(?=버튼|키|로)/g, '')
    .replace(/\b[XY](?=\([가-힣])/g, '')
    .replace(/\b(?:WASD|Q\/E|Esc\/P)\b/g, '');
}

const preservedLabels = {
  Google: 'Google', 'En PC': 'PC', 'On PC': 'PC',
  Espacio: 'Space', Space: 'Space', Intro: 'Enter', Enter: 'Enter', Esc: 'Esc',
  Supr: 'Delete', Delete: 'Delete', Inicio: 'Home', Home: 'Home', Fin: 'End', End: 'End',
  'Re Pág': 'Page Up', 'Page Up': 'Page Up', 'Av Pág': 'Page Down', 'Page Down': 'Page Down',
  'Bloq Mayús': 'Caps Lock', 'Caps Lock': 'Caps Lock',
};
const errors = [];
const screens = [];
const findings = [];
let localeEntriesChecked = 0;
let traitNamesChecked = 0;
let formNamesChecked = 0;
let moveLabelsChecked = 0;
let moveNameFindings = [];
let generatedChoiceChecks = [];
let generatedChoiceCounts = {};
let powerNameChecks = [];
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  viewport: { width: 1400, height: 1000 },
});
const page = await context.newPage();
page.setDefaultTimeout(20_000);
page.on('pageerror', (error) => errors.push(error.message));
await page.addLocatorHandler(page.locator('#scr-video:not(.hidden)'), () =>
  page.locator('#video-close').evaluate(button => button.click()));
await context.addInitScript((lang) => localStorage.setItem('ps.lang', lang), language);
let frame;

async function capture(label) {
  await frame.locator('body').evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const capture = await frame.locator('body').evaluate(() => {
    const entries = [];
    const seen = new Set();
    let skippedUserText = 0;
    let skippedLanguagePicker = 0;
    let skippedExternalText = 0;
    const userText = [
      '#user-pill [translate="no"]', '#fr-me [translate="no"]',
      '.fr-row > b[translate="no"]', '#lobby-members b[translate="no"]',
      '#inv-text [translate="no"]', '.rk-row .who > b[translate="no"]',
      '#prof-body .prof-head h2[translate="no"]', '#goals-body .pe-side > b[translate="no"]',
      '#set-body .set-row > span[translate="no"]', '#lobby-room-code',
    ].join(',');

    function add(element, value, attribute) {
      const text = value.trim();
      if (!text || !/[\p{Script=Latin}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) return;
      // Native selects can hide the option nodes even though their labels appear in the dropdown.
      const visibleControl = element.closest('select') || element;
      if (element.closest('script, style, noscript') || !visibleControl.checkVisibility({ checkVisibilityCSS: true })) return;
      if (element.closest('[data-lang], [data-psko-language]')) {
        skippedLanguagePicker++;
        return;
      }
      // The game preserves external video titles and hardware-provided device names.
      if (attribute === 'text' && element.matches('#menu-banner > .mb-slide.yt > .mb-txt > b[translate="no"], #set-body > p.sub > b[translate="no"]')) {
        skippedExternalText++;
        return;
      }
      // Inspect protected fixed copy, particularly #news-body and ranking explanations.
      // Only specifically identified player text is exempted and never stored in the report.
      if (element.closest(userText) && attribute === 'text') {
        skippedUserText++;
        return;
      }
      const key = `${text}|${attribute}`;
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({
        text, attribute, tag: element.tagName, id: element.id,
        class: element.className, protected: !!element.closest('[translate="no"]'),
      });
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement) add(node.parentElement, node.nodeValue, 'text');
    }
    for (const element of document.querySelectorAll('[title], [placeholder], [aria-label], [alt]')) {
      for (const attribute of ['title', 'placeholder', 'aria-label', 'alt']) {
        if (element.hasAttribute(attribute)) add(element, element.getAttribute(attribute), attribute);
      }
    }
    return { entries, skippedUserText, skippedLanguagePicker, skippedExternalText };
  });
  const unexpected = capture.entries.filter((entry) => foreignCharacters.test(unexplainedText(entry)));
  screens.push({ label, ...capture });
  findings.push(...unexpected.map((entry) => ({ screen: label, ...entry })));
  console.log(`${label}: ${capture.entries.length} Latin/CJK entries, ${unexpected.length} unexplained`);
}

const run = (action, argument) => frame.locator('body').evaluate(action, argument);

async function resetScreens(showMenu = false) {
  await run((body, showMenu) => {
    const game = window.__PSKO_TEST_GAME__;
    game.UI.hideAll();
    document.querySelectorAll('.scr').forEach((element) => element.classList.add('hidden'));
    if (showMenu) game.MenuUI.open();
  }, showMenu);
}

async function openPanel(component, argument) {
  await resetScreens(true);
  await run((body, { component, argument }) => window.__PSKO_TEST_GAME__[component].open(argument), { component, argument });
}

async function auditGeneratedChoices() {
  await resetScreens();
  const { records, counts } = await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    const player = game._115d8ef.player;
    const choices = game._c0e2c6b.STATS.map(stat => ({
      type: 'stat', key: `stat:${stat.id}`, title: stat.title, desc: stat.desc,
      icon: stat.icon, color: '#8fa3c4', tag: 'Mejora',
    }));
    const counts = { stats: choices.length, offered: 0, moveUpgrades: 0 };
    // Force the two rare cards into the real offer without changing the run.
    const random = Math.random;
    try {
      Math.random = () => 0;
      const sample = Object.assign(Object.create(player), { itemSlots: 3, got4: false, gotWis: false });
      const offered = game._c0e2c6b.offer(sample, 10000);
      counts.offered = offered.length;
      choices.push(...offered);
    } finally { Math.random = random; }
    for (const definition of game.Moves.ALL) {
      const move = game.Moves.instance(definition.id);
      for (let level = 1; level < definition.maxLvl; level++) {
        counts.moveUpgrades++;
        move.lvl = level;
        choices.push({ type: 'up', key: `up:${definition.id}:${level}`, title: definition.name,
          desc: game.Moves.nextUpText(move), icon: `move:${definition.id}`,
          color: game.U.TYPE_COLOR[definition.type], tag: `Nv. ${level + 1}` });
      }
    }
    const plain = (html, translate = text => text) => {
      const node = document.createElement('div');
      node.innerHTML = html;
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) walker.currentNode.nodeValue = translate(walker.currentNode.nodeValue);
      return node.textContent;
    };
    game.RunUI.showLevelUp(25, choices, () => {});
    return { counts, records: choices.map(choice => {
      const source = plain(choice.desc);
      return { key: choice.key, type: choice.type, source,
        native: plain(choice.desc, text => game.T(text)),
        fallback: plain(choice.desc, text => window.PSKO.translate(text)) };
    }) };
  });
  generatedChoiceCounts = counts;
  await run(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const rendered = await frame.locator('#cards .ds').allTextContents();
  if (rendered.length !== records.length) throw new Error('The generated level-up cards were not all rendered.');
  generatedChoiceChecks = records.map((record, index) => ({ ...record, rendered: rendered[index] }));
  const numbers = text => (text.match(/\d+(?:[.,]\d+)?/g) || [])
    .map(value => Number(value.replace(',', '.'))).sort((a, b) => a - b);
  for (const record of generatedChoiceChecks) {
    for (const field of ['native', 'fallback', 'rendered']) {
      const text = record[field];
      if (foreignCharacters.test(unexplainedText({ text, tag: 'DIV', class: '' })) ||
          JSON.stringify(numbers(text)) !== JSON.stringify(numbers(record.source))) {
        findings.push({ screen: 'generated-level-up-cards', field, ...record });
      }
    }
  }
  console.log(`Generated level-up choices: ${records.length} descriptions checked in native, fallback and rendered output`);
  await capture('generated-level-up-cards');
  await frame.locator('#cards .card').filter({ hasText: '반사신경' }).first()
    .screenshot({ path: path.join(root, 'test-results', `reflexes-${language}.png`) });
}

async function auditPowerChoices() {
  const records = await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    const powers = game._bade424;
    const config = game._0f57260;
    const names = [
      ...Object.entries(config.Z_BY_TYPE).map(([id, source]) => ({ kind: 'z', id, source })),
      ...Object.entries(config.MAX_BY_TYPE).map(([id, source]) => ({ kind: 'max', id, source })),
      ...Object.entries(config.Z_ONLY).map(([id, value]) => ({ kind: 'unique-z', id, source: value.name })),
      ...Object.entries(config.GMAX).map(([id, value]) => ({ kind: 'gmax', id, source: value.name })),
    ];
    const entries = new Map();
    for (const dex of Object.keys(game._b568ae5)) {
      for (const option of powers.options(Number(dex))) {
        entries.set(`${option.title}|${option.desc}`, option);
      }
      for (const kind of ['mega', 'z', 'tera']) {
        for (const option of powers.typeOptions(kind, Number(dex))) {
          entries.set(`${option.title}|${option.desc}`, option);
        }
      }
    }
    game.RunUI.showPower([...entries.values()], () => {});
    return names.map(record => ({ ...record, native: game.T(record.source, 'move'),
      fallback: window.PSKO.translateMove(record.source) }));
  });
  if (records.length !== expectedPowers.length) throw new Error('Refresh the expected power move names: the live list changed.');
  powerNameChecks = records;
  for (const record of records) {
    const expected = expectedPowers.find(move => move.kind === record.kind && String(move.id) === record.id);
    if (!expected || record.source !== expected.spanish) {
      throw new Error(`Refresh the expected power move name: ${record.kind}:${record.id}`);
    }
    for (const field of ['native', 'fallback']) {
      if (record[field] !== expected.korean) {
        findings.push({ screen: 'power-move-names', field, expected: expected.korean, ...record });
      }
    }
  }
  const englishNames = await run((body, expectedPowers) => expectedPowers.map(move => ({
    ...move, native: window.__PSKO_TEST_GAME__.T(move.english, 'move'),
    fallback: window.PSKO.translateMove(move.english),
  })), expectedPowers);
  for (const record of englishNames) {
    if (record.native !== record.korean || record.fallback !== record.korean) {
      findings.push({ screen: 'power-move-names-english', ...record });
    }
  }
  await capture('all-power-options-and-types');
}

async function auditMoveNames() {
  // Exercise the native game's translator and the extension together, not just
  // whether the output contains Korean. These are the game's actual label structures.
  const cases = await run((body, { moves, evolvedMoveIds }) => {
    const live = window.__PSKO_TEST_GAME__.Moves.ALL;
    if (live.length !== moves.length || live.some(move => !moves.some(expected => expected.id === move.id && expected.name.includes(move.name)))) {
      throw new Error('Refresh the expected move names: the live move list has changed.');
    }
    const liveEvolved = Object.keys(window.__PSKO_TEST_GAME__.Moves.EVO);
    if (liveEvolved.length !== evolvedMoveIds.length || liveEvolved.some(id => !evolvedMoveIds.includes(id))) {
      throw new Error('Refresh the expected evolved moves: the live evolution list has changed.');
    }
    const allMoves = moves.concat(evolvedMoveIds.map(id => {
      const move = moves.find(move => move.id === id);
      return { id: `${id}+`, name: move.name.map(name => `${name} +`) };
    }));
    const root = document.createElement('section');
    root.id = 'psko-move-name-audit';
    const cases = [];
    function add(surface, html, selector, text, expected, move, language, attribute = 'text') {
      const entry = document.createElement('div');
      entry.innerHTML = html;
      const node = entry.querySelector(selector);
      if (attribute === 'text') node.textContent = node.textContent.replace('NAME', text);
      else node.setAttribute(attribute, text);
      const id = String(cases.length);
      node.dataset.auditId = id;
      root.append(entry);
      cases.push({ id, move, language, surface, attribute, expected });
    }
    for (const { id, name: [spanish, english, korean] } of allMoves) {
      for (const [language, name, choose, tm, suffix] of [
        ['es', spanish, 'Elegir', 'MT', '(de serie)'], ['en', english, 'Choose', 'TM', '(default)'],
      ]) {
        const templates = [
          ['start', `<div id="upg-list"><button data-start>${choose}: NAME</button></div>`, 'button', `선택: ${korean}`],
          ['start2', `<div id="upg-list"><button data-start2>${choose}: NAME</button></div>`, 'button', `선택: ${korean}`],
          ['picker', '<div class="ban-moves"><button class="chip">NAME</button></div>', '.chip', korean],
          ['picker-default', `<div class="ban-moves"><button class="chip">NAME ${suffix}</button></div>`, '.chip', `${korean} (기본)`],
          ['bind', '<div class="bind-slot"><select><option>NAME</option></select></div>', 'option', korean],
          ['dex', '<div id="dex-detail"><p><b class="gold">NAME</b></p></div>', 'b', korean],
          ['shop', `<div id="shop-body"><div class="upg-item"><b>${tm} NAME</b></div></div>`, 'b', `기술머신 ${korean}`],
          ['bag', `<div id="bag-body"><div class="upg-item"><b>${tm} NAME</b></div></div>`, 'b', `기술머신 ${korean}`],
          ['level-card', '<div id="cards"><div class="nm">NAME</div></div>', '.nm', korean],
          ['bond-card', '<div id="bond-cards"><div class="nm">NAME</div></div>', '.nm', korean],
          ['result', '<div id="over-stats"><div><b style="font-size:15px">NAME</b></div></div>', 'b', korean],
          ['summary', '<div id="over-sum"><table class="sum-moves"><tr><td>NAME</td></tr></table></div>', 'td', korean],
        ];
        for (const [surface, html, selector, expected] of templates) add(surface, html, selector, name, expected, id, language);
        add('move-icon', '<div class="move-icons"><span></span></div>', 'span', name, korean, id, language, 'title');
      }
    }
    const typeNames = {
      normal: '노말', fire: '불꽃', water: '물', grass: '풀', electric: '전기', ice: '얼음',
      fighting: '격투', poison: '독', ground: '땅', flying: '비행', psychic: '에스퍼', bug: '벌레',
      rock: '바위', ghost: '고스트', dragon: '드래곤', dark: '악', steel: '강철', fairy: '페어리',
    };
    for (const [type, expected] of Object.entries(typeNames)) {
      for (const className of ['type', 'tag-chip']) {
        add('type-badge', `<div id="cards"><div class="nm"><span class="${className}">NAME</span></div></div>`,
          'span', window.__PSKO_TEST_GAME__.U.TYPE_NAME[type], expected, type, 'es');
      }
    }
    document.body.append(root);
    return cases;
  }, { moves: expectedMoves, evolvedMoveIds });
  try {
    await run(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    moveNameFindings = await run((body, cases) => cases.flatMap(entry => {
      const node = document.querySelector(`#psko-move-name-audit [data-audit-id="${entry.id}"]`);
      const actual = entry.attribute === 'text' ? node.textContent : node.getAttribute(entry.attribute);
      return actual === entry.expected ? [] : [{ ...entry, actual }];
    }), cases);
    moveLabelsChecked = cases.length;
    console.log(`Move/type names: ${moveLabelsChecked} labels, ${moveNameFindings.length} mismatches`);
    if (moveNameFindings.length) throw new Error(`Incorrect move/type labels: ${JSON.stringify(moveNameFindings)}`);
  } finally {
    await run(() => document.querySelector('#psko-move-name-audit').remove());
  }
}

try {
  await context.route('**/*', (route) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.request().method()) ? route.abort() : route.continue());
  // This hook is injected only into an intercepted response in this disposable test browser.
  // Never modify the installed extension, server bundle or the user's browser profile.
  await page.route('**/js/app.min.js*', async (route) => {
    try {
      const response = await route.fetch();
      const source = await response.text();
      const prefix = source.match(/var (_0x[\da-f]+)=Object\[(?:'create'|_0x[\da-f]+\(0x[\da-f]+\))\]\(null\);/);
      if (!prefix) throw new Error('UI audit hook no longer matches the official game bundle.');
      if (!source.includes('_0x584ee7=[')) throw new Error('Account notice fixture no longer matches the game bundle.');
      const register = /function _0xa9b228\([^)]*\)\{/;
      if (!register.test(source)) throw new Error('Locale registry audit hook no longer matches the game bundle.');
      const fixtureSource = source
        .replace('_0x584ee7=[', '_0x584ee7=window.__PSKO_TEST_NOTICES__=[')
        .replace(register, match => match + "if(_0x1b5615==='en'&&!_0x4f4efd)Object.assign(window.__PSKO_TEST_LOCALES__??={},_0x5bbaaa);");
      await route.fulfill({ response, body: fixtureSource.replace(prefix[0], `${prefix[0]}window.__PSKO_TEST_GAME__=${prefix[1]};`) });
    } catch (error) {
      errors.push(error.stack || error.message);
      await route.abort();
    }
  });
  await page.goto('https://pokesurvivor.com/', { waitUntil: 'domcontentloaded' });
  frame = page;
  await frame.locator('#tap-start:not(.hidden), #scr-login:not(.hidden) #btn-guest').first().waitFor();
  if (await frame.locator('#tap-start').isVisible()) await frame.locator('#tap-start').click();
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    // The official bundle hashes module names; fail explicitly when a release changes them.
    const names = {
      U: 'U', DB: '_2252540', MenuUI: '_4d38f99', SettingsUI: '_206af67',
      NewsUI: '_14eba4c', SupportUI: '_9efc9e4', NickUI: '_9b84f1d', GoalsUI: '_8d6009b',
      GachaUI: '_92c1272', Moves: '_5d2ab74', RunUI: '_1fc60c9',
      ShopUI: '_9049cbe', ClosetUI: '_2a47dd0', MasteryUI: '_ddc84a1',
    };
    const components = Object.fromEntries(Object.entries(names).map(([name, key]) => {
      if (!game?.[key]) throw new Error(`UI audit module changed: ${name}`);
      return [name, game[key]];
    }));
    window.__PSKO_TEST_GAME__ = { ...game, ...components };
  });
  await capture('login');
  const nativeLocale = await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    return {
      language: window.PS_LOCALES.lang,
      dropdown: game.T('Shaymin (compañero) · 17 niveles'),
      orb: game.T('Ves más campo (la cámara se aleja) durante 15 s, tú y los compañeros cercanos.'),
      psychicType: game.T('Psíquico'),
      psychicMove: game.T('Psíquico', 'move'),
    };
  });
  if (nativeLocale.language !== 'ko' ||
      nativeLocale.dropdown !== '쉐이미 (파트너) · 강화 17레벨' ||
      nativeLocale.orb !== '15초 동안 자신과 주변 팀원의 카메라가 멀어져 더 넓은 범위를 볼 수 있습니다.' ||
      nativeLocale.psychicType !== '에스퍼' || nativeLocale.psychicMove !== '사이코키네시스') {
    throw new Error(`The native Korean locale was not registered: ${JSON.stringify(nativeLocale)}`);
  }
  const locale = await run((body, preservedLabels) => {
    const entries = Object.entries(window.__PSKO_TEST_LOCALES__ || {});
    const untranslated = entries.filter(([spanish, english]) =>
      [spanish, english].some(text => {
        if (['{x} Primigenio', 'Primal {x}'].includes(text)) {
          return window.__PSKO_TEST_GAME__.T(text) !== '원시{x}';
        }
        const translated = window.PSKO.translate(text);
        return !/[가-힣]/u.test(translated) && preservedLabels[text] !== translated;
      }));
    return { count: entries.length, untranslated };
  }, preservedLabels);
  localeEntriesChecked = locale.count;
  if (!locale.count) throw new Error('The locale registry was empty.');
  for (const [spanish, english] of locale.untranslated) findings.push({ screen: 'locale-registry', spanish, english });
  const nativeChecks = await run((body, preservedLabels) => {
    const game = window.__PSKO_TEST_GAME__;
    const notice = (template, ...values) => window.PSKO.translate(game.T(game._78cdb75.f(template, ...values)));
    return {
      aliases: ['Mando conectado', 'Mando conectado:', 'atrás / cerrar', 'TIRADA ×100'].map(text => game.T(text)),
      products: ['Switch', 'The Pokémon Company', 'CREDITS.md', 'Authentication > Settings > Authorized domains']
        .map(text => game.T(game.T(text))),
      rewritten: Object.values(window.PSKO_MESSAGES).filter(row => /[가-힣]/u.test(row[2]) && !/\{(?:x|name)\}/u.test(row[2]))
        .map(row => row[2]).filter(text => game.T(text) !== text),
      untranslated: Object.entries(window.__PSKO_TEST_LOCALES__).filter(([source]) => {
        const translated = game.T(source.replace(/\{(?:x|name)\}/g, '17'));
        return !/[가-힣]/u.test(translated) && preservedLabels[source] !== translated;
      }),
      primalNames: ['Groudon Primigenio', 'Kyogre Primigenio', 'Primal Groudon', 'Primal Kyogre'].map(name => game.T(name)),
      playerNames: ['Fire', 'Ash Pokémon', 'Psychic'].flatMap(name => [
        notice('Viendo a {x}', name),
        notice('{name} es el nuevo anfitrión', name),
        notice('Le has regalado un ticket a {x}', name),
        notice('¡{x} necesita ayuda! · {x} m', name, 17),
        notice('¡Gengar le rompe a {x} su {x}!', name, 'Life Orb'),
      ]),
    };
  }, preservedLabels);
  if (JSON.stringify(nativeChecks.aliases) !== JSON.stringify(['컨트롤러 연결됨', '컨트롤러 연결됨:', '뒤로 / 닫기', '뽑기 ×100']) ||
      JSON.stringify(nativeChecks.products) !== JSON.stringify(['Switch', 'The Pokémon Company', 'CREDITS.md', 'Authentication > Settings > Authorized domains']) ||
      nativeChecks.rewritten.length ||
      JSON.stringify(nativeChecks.primalNames) !== JSON.stringify(['원시그란돈', '원시가이오가', '원시그란돈', '원시가이오가']) ||
      JSON.stringify(nativeChecks.playerNames) !== JSON.stringify(['Fire', 'Ash Pokémon', 'Psychic'].flatMap(name => [
        `${name} 관전 중`, `${name} 님이 새 방장이 되었습니다`,
        `${name}에게 티켓을 선물했습니다`, `${name} 님에게 도움이 필요합니다! · 17 m`,
        `팬텀의 도구 파괴 · ${name} · 생명의구슬!`,
      ]))) {
    throw new Error(`Native translation mismatch: ${JSON.stringify(nativeChecks)}`);
  }
  for (const [source, english] of nativeChecks.untranslated) findings.push({ screen: 'native-locale-registry', source, english });
  const traitCatalog = await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    return [
      ...game._b3c0c92.map(nature => {
        const source = game._0a82600.name(nature.n);
        return { kind: 'nature', source, translated: window.PSKO_NATURES[source] || source };
      }),
      ...Object.keys(game._c542b1f).map(id => {
        const source = game._0a82600.abilityName(id);
        return { kind: 'ability', source, translated: window.PSKO_ABILITIES[source] || source };
      }),
    ];
  });
  traitNamesChecked = traitCatalog.length;
  for (const trait of traitCatalog) {
    if (!/[가-힣]/u.test(trait.translated) || /[A-Za-z]/u.test(trait.translated.replace(/^AR시스템$/, ''))) {
      findings.push({ screen: 'trait-name-registry', ...trait });
    }
  }
  const formCatalog = await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    const definitions = game._ba7078c;
    if (!definitions?.list?.length || !game._d7a83e9 || !game._b568ae5) {
      throw new Error('The live Pokémon/form catalog changed.');
    }
    const labels = new Set([
      ...Object.values(game._b568ae5).map(pokemon => pokemon.name),
      ...Object.values(game._d7a83e9).flatMap(form => [form.name, form.fn]),
      ...Object.entries(definitions.names.en).flat(),
      ...Object.entries(definitions.fnames.en).flat(),
    ].filter(name => typeof name === 'string' && name));
    const expected = Object.fromEntries(window.PSKO_MESSAGES.flatMap(([spanish, english, korean]) =>
      [[spanish, korean], [english, korean]]));
    Object.assign(expected, window.PSKO_POKEMON);
    return [...labels].map(source => ({
      source, expected: expected[source] || (/^[A-Z!?]$/.test(source) ? source : undefined),
      native: game.T(source), fallback: window.PSKO.translate(source),
    }));
  });
  formNamesChecked = formCatalog.length;
  for (const form of formCatalog) {
    if (!form.expected || form.native !== form.expected || form.fallback !== form.expected) {
      findings.push({ screen: 'pokemon-form-name-registry', ...form });
    }
  }
  console.log(`Pokémon/form names: ${formNamesChecked} labels, ${findings.filter(entry => entry.screen === 'pokemon-form-name-registry').length} mismatches`);
  await frame.locator('#btn-guest').click();
  for (let index = 0; index < 8; index++) {
    await capture(`quiz-${index + 1}`);
    await frame.locator('#test-a button').first().click();
  }
  await capture('quiz-result');
  await frame.locator('#res-ok').click();
  await capture('menu');
  await run(() => {
    for (const notice of window.__PSKO_TEST_NOTICES__) {
      notice.when = () => true;
      localStorage.removeItem(notice.key);
    }
    window.__PSKO_TEST_GAME__._4f91bef.updateNotices();
  });
  await capture('account-update-notice');
  if (/[a-z]/i.test(await frame.locator('#scr-savenote').innerText())) {
    throw new Error('The account update notice still contains untranslated text.');
  }
  await frame.locator('#savenote-ok').click();

  for (const tab of ['sound', 'gfx', 'ctl', 'a11y', 'acc', 'guides', 'about']) {
    await openPanel('SettingsUI', tab);
    await capture(`settings-${tab}`);
  }
  const settingsTabs = await frame.locator('#set-tabs [data-t]').evaluateAll(tabs => tabs.map(tab => tab.dataset.t));
  if (JSON.stringify(settingsTabs) !== JSON.stringify(['sound', 'gfx', 'ctl', 'a11y', 'network', 'acc', 'guides', 'about'])) {
    throw new Error(`Unexpected settings tab order: ${JSON.stringify(settingsTabs)}`);
  }
  await frame.locator('#set-tabs [data-t="network"]').click();
  await capture('settings-network');
  await frame.locator('#psko-lan-direct').waitFor();
  await page.screenshot({ path: path.join(root, 'test-results', `network-settings-${language}.png`) });
  await page.setViewportSize({ width: 390, height: 844 });
  await frame.locator('#psko-lan-direct').scrollIntoViewIfNeeded();
  const networkOverflow = await frame.locator('#set-body').evaluate(body => body.scrollWidth > body.clientWidth + 1);
  if (networkOverflow) throw new Error('The network settings overflow at 390px.');
  await page.setViewportSize({ width: 1400, height: 1000 });

  await frame.locator('#set-tabs [data-t="ctl"]').click();
  await run(() => {
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [{
      id: 'Local test controller', index: 0, connected: true, mapping: 'standard',
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0],
    }] });
    window.__PSKO_TEST_GAME__._6315985.poll(performance.now());
  });
  await openPanel('SettingsUI', 'ctl');
  await capture('settings-connected-controller');
  await run(() => { delete navigator.getGamepads; });
  await resetScreens();
  await run(() => window.__PSKO_TEST_GAME__._7b7cfdc.open());
  await capture('touch-layout');
  await run(() => window.__PSKO_TEST_GAME__._7b7cfdc.close());
  await openPanel('NewsUI');
  await capture('news');
  await openPanel('SupportUI');
  await capture('support');
  await resetScreens();
  await run(() => window.__PSKO_TEST_GAME__.UI.show('scr-legal'));
  await capture('legal');
  await resetScreens(true);
  await run(() => window.__PSKO_TEST_GAME__.NickUI.open(() => {}));
  await capture('nickname');
  await resetScreens(true);
  await frame.locator('[data-go="friends"]').click();
  await capture('friends-guest');
  await resetScreens();
  await run(() => window.__PSKO_TEST_GAME__.UI.show('scr-lobby'));
  await capture('lobby-static');
  for (const tab of ['missions', 'ach', 'profile']) {
    await openPanel('GoalsUI', tab);
    await capture(`goals-${tab}`);
  }

  await resetScreens(true);
  await run(() => window.__PSKO_TEST_GAME__.MenuUI.openChallenge());
  await capture('weekly-challenge');
  await resetScreens(true);
  await run(() => window.__PSKO_TEST_GAME__.MenuUI.openMode());
  await capture('difficulty');

  // Owned/shiny fixtures live only in this browser's game object; nothing is committed.
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    game.DB.save.owned = { ...game.DB.save.owned, 1: 1, 4: 1, 121: 1 };
    game.DB.save.shiny = { 1: 1 };
  });
  await openPanel('ClosetUI', 1);
  await capture('closet');
  await openPanel('MasteryUI');
  await capture('mastery-list');
  await openPanel('MasteryUI', 1);
  await capture('mastery-pokemon');
  await resetScreens(true);
  await frame.locator('[data-go="dex"]').click();
  await capture('dex');
  // Exercise state-dependent labels, including the selected favorite state.
  for (let index = 0; index < await frame.locator('#dex-filters .chip').count(); index++) {
    await frame.locator('#dex-filters .chip').nth(index).click();
    await capture(`dex-filter-${index}`);
    if (index > 0) await frame.locator('#dex-filters .chip').nth(index).click();
    await frame.locator('#dex-filters .chip').first().click();
  }
  for (let index = 0; index < await frame.locator('.dex-sort .chip').count(); index++) {
    await frame.locator('.dex-sort .chip').nth(index).click();
    await capture(`dex-sort-${index}`);
  }
  await frame.locator('#dex-q').fill('no-such-pokemon-99999');
  await frame.waitForFunction(() => !document.querySelector('#dex-grid .cell'));
  await capture('dex-search-empty');
  await frame.locator('#dex-q').fill('');
  await frame.waitForFunction(() => !!document.querySelector('#dex-grid .cell'));
  await frame.locator('#dex-type').selectOption('grass');
  await capture('dex-type-grass');
  await frame.locator('#dex-type').selectOption('');
  // Select the all-region tab to include every owned fixture.
  await frame.locator('#dex-gens .gen-tab').first().click();
  await frame.locator('#dex-filters .chip').nth(1).click();
  await frame.waitForFunction(() => document.querySelectorAll('#dex-grid .cell:not(.locked)').length >= 3);
  await capture('dex-owned-list');
  const ownedCount = await frame.locator('#dex-grid .cell:not(.locked)').count();
  if (ownedCount < 3) throw new Error('The audit must inspect all owned Pokémon fixtures.');
  for (let index = 0; index < ownedCount; index++) {
    await frame.locator('#dex-grid .cell:not(.locked)').nth(index).click();
    await capture(`dex-owned-${index}`);
    const favorite = frame.locator('#dex-fav');
    await favorite.click();
    await capture(`dex-favorite-${index}`);
    await favorite.click();
  }
  await resetScreens(true);
  await run(() => {
    const { save } = window.__PSKO_TEST_GAME__.DB;
    save.owned = { ...save.owned, 492: 1, 387: 1, 390: 1 };
    save.partner = 492;
    save.pupg = { ...save.pupg, 492: { hp: 17 }, 387: { hp: 9 }, 390: {} };
  });
  await frame.locator('[data-go="upgrades"]').click();
  await capture('upgrades');
  for (const [id, expected] of [[492, '쉐이미 (파트너) · 17레벨'], [387, '모부기 · 9레벨'], [390, '불꽃숭이']]) {
    const label = await frame.locator(`#upg-mon option[value="${id}"]`).textContent();
    if (label !== expected) throw new Error(`Incorrect upgrade option: ${label}`);
  }
  // Exercise every purchased choice control that can squeeze the description.
  await run(() => {
    const game = window.__PSKO_TEST_GAME__, save = game.DB.save;
    Object.assign(save.pupg[492], { start: 1, start2: 1, ban: 3, startitem: 1 });
    save.bag = { ...save.bag, choicescarf: 99 };
    save.pitem = { ...save.pitem, 492: 'choicescarf' };
    game.MenuUI.open();
    document.querySelector('[data-go="upgrades"]').click();
  });
  await capture('upgrades-with-choice-controls');
  for (const attribute of ['data-start', 'data-start2', 'data-ban', 'data-sitem']) {
    if (await frame.locator(`#upg-list [${attribute}]`).count() !== 1) {
      throw new Error(`Missing upgrade choice fixture: ${attribute}`);
    }
  }
  for (const width of [1400, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const ordinaryCards = await run(() => Array.from(document.querySelectorAll('#upg-list > .upg-item')).slice(0, 12).map(card => {
      const text = card.children[1].getBoundingClientRect();
      const buttons = card.querySelector('.upg-btns').getBoundingClientRect();
      return {
        alongside: buttons.left >= text.right - 1 && buttons.top < text.bottom && buttons.bottom > text.top,
        overflow: card.scrollWidth > card.clientWidth + 1,
        singleLinePrice: card.querySelector('[data-buy]').getBoundingClientRect().height <= 44,
      };
    }));
    if (ordinaryCards.some(card => !card.alongside || card.overflow || !card.singleLinePrice)) {
      throw new Error(`Ordinary purchase buttons moved or wrapped at ${width}px: ${JSON.stringify(ordinaryCards)}`);
    }
    const layouts = await run(() => [...document.querySelectorAll('#upg-list > .upg-item')]
      .filter(card => card.querySelector('[data-start], [data-start2], [data-sitem], [data-ban], [data-buy][title]'))
      .map(card => {
        const text = card.children[1], buttons = card.querySelector('.upg-btns');
        const bounds = card.getBoundingClientRect(), description = text.getBoundingClientRect(), actions = buttons.getBoundingClientRect();
        return { name: text.querySelector('b').textContent, width: description.width, overlap: description.bottom > actions.top + 1,
          overflow: card.scrollWidth > card.clientWidth + 1 || actions.right > bounds.right + 1 };
      }));
    if (layouts.some(layout => layout.width < 120 || layout.overlap || layout.overflow)) {
      throw new Error(`Cramped upgrade choice card at ${width}px: ${JSON.stringify(layouts)}`);
    }
    await frame.locator('#upg-list [data-sitem]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(root, 'test-results', `upgrade-choices-${language}-${width}.png`) });
  }
  await page.setViewportSize({ width: 1400, height: 1000 });
  await resetScreens(true);
  await run(() => {
    const game = window.__PSKO_TEST_GAME__, save = game.DB.save;
    save.owned[150] = 1;
    save.partner = 150;
    save.pupg[150] = { start: 1, start2: 1, moves: 1, ban: 3 };
    save.pstart = { ...save.pstart, 150: 'confusion' };
    save.pstart2 = { ...save.pstart2, 150: 'psychic' };
    game.MenuUI.open();
    document.querySelector('[data-go="upgrades"]').click();
  });
  await capture('upgrades-second-starting-move');
  if (await frame.locator('[data-start2]').textContent() !== '선택: 사이코키네시스') throw new Error('Second starting move lost its move-name context.');
  await frame.locator('[data-start]').click();
  await frame.locator('.ban-moves [data-id="psychic"]').click();
  await capture('upgrades-first-starting-move');
  if (await frame.locator('[data-start]').textContent() !== '선택: 사이코키네시스') throw new Error('First starting move lost its move-name context.');
  if (await frame.locator('[data-start2]').textContent() !== '선택: 무작위') throw new Error('Random second move label changed.');
  await run(() => {
    const save = window.__PSKO_TEST_GAME__.DB.save;
    save.bag = { mint: 5, cap: 5, caph: 5, candy: 70 };
    save.tms = Object.fromEntries(Object.keys(window.__PSKO_TEST_GAME__._b4c286c).map(id => [id, 1]));
    window.__PSKO_TEST_GAME__._0a82600.setAbility(121, 0);
  });
  await resetScreens(true);
  await frame.locator('[data-go="dex"]').click();
  await frame.locator('#dex-q').fill('121');
  await frame.locator('#dex-grid .cell:not(.locked)').filter({
    has: frame.locator('.no', { hasText: /^121$/ }),
  }).click();
  const selectedPokemon = await frame.locator('#dex-detail h3').textContent();
  if (selectedPokemon !== '아쿠스타') {
    throw new Error(`The ability picker fixture must select Starmie: ${selectedPokemon}`);
  }
  await capture('dex-with-inventory');
  for (const mode of ['nat', 'cap', 'caph']) {
    const button = frame.locator(`#dex-detail [data-extra="${mode}"]`);
    if (!await button.count()) throw new Error(`Missing nature/ability picker fixture: ${mode}`);
    await button.click();
    await capture(`dex-picker-${mode}`);
    if (/[A-Za-zÀ-ž]/u.test(await frame.locator('#mx-picker').innerText())) throw new Error(`Untranslated picker: ${mode}`);
  }
  await openPanel('GachaUI');
  await capture('gacha');
  // Render a repeatable ten-card result in the guest fixture without spending tickets.
  await run(async () => {
    const { Gacha, DB } = window.__PSKO_TEST_GAME__;
    if (DB.online) throw new Error('The gacha fixture requires a guest session.');
    const { costOf, pull } = Gacha;
    try {
      Gacha.costOf = () => true;
      Gacha.pull = () => [417, 391, 413, 401, 402, 412, 412, 447, 420, 481].map((dex, i) =>
        ({ dex, rarity: 2, isNew: i !== 6, refund: 15, shiny: false }));
      await document.querySelector('#pull-10').onclick();
    } finally {
      Object.assign(Gacha, { costOf, pull });
    }
  });
  await capture('gacha-results');
  const traits = await frame.locator('#pull-results .pcard > .pmon').allTextContents();
  if (traits.length !== 9 || traits.some(text => !/^[가-힣][가-힣\s·]+$/u.test(text.trim()))) {
    throw new Error(`Untranslated gacha traits: ${JSON.stringify(traits)}`);
  }
  await frame.locator('#pull-close').click();
  await run(async () => {
    const game = window.__PSKO_TEST_GAME__;
    const { costOf, pull } = game.Gacha;
    try {
      game.Gacha.costOf = () => true;
      game.Gacha.pull = () => Array.from({ length: 100 }, (_, i) =>
        ({ dex: 1, rarity: 2, isNew: i < 2, refund: 15, shiny: i === 1 }));
      const finished = document.querySelector('#pull-100').onclick();
      document.querySelector('#pull-skip').click();
      await finished;
    } finally {
      Object.assign(game.Gacha, { costOf, pull });
    }
  });
  await capture('gacha-100-results');
  await frame.locator('#pull-close').click();
  await openPanel('ShopUI');
  await capture('shop');
  for (const tab of ['held', 'tm', 'perfil', 'skins']) {
    await frame.locator(`#shop-body [data-tab="${tab}"]`).click();
    await capture(`shop-${tab}`);
  }
  await resetScreens(true);
  await run(() => window.__PSKO_TEST_GAME__.ShopUI.openBag());
  await capture('bag');

  await resetScreens();
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    const cards = game.Moves.ALL.map((move) => ({
      type: 'new', title: move.name, tag: game.U.TYPE_NAME[move.type],
      desc: move.desc, color: game.U.TYPE_COLOR[move.type], icon: `move:${move.id}`,
    }));
    game.RunUI.showLevelUp(20, cards, () => {});
  });
  await capture('all-base-move-cards');
  await resetScreens();
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    const cards = ['especiales', 'físicos'].map((side, index) => ({
      type: 'new', title: 'Bomba Germen', tag: 'Planta', cat: 'Físico', icon: 'move:seed-bomb',
      desc: `<span class="fit-low">Con Shaymin rinde un ${91 - index} %: pega mejor con ataques ${side}.</span>`,
    }));
    game.RunUI.showLevelUp(20, cards, () => {});
  });
  await capture('level-up-move-fit');
  const fit = await frame.locator('#cards .fit-low').allTextContents();
  const expectedFit = ['쉐이미 사용 시 위력 91%. 특수 기술로 더 큰 피해를 줍니다.', '쉐이미 사용 시 위력 90%. 물리 기술로 더 큰 피해를 줍니다.'];
  if (JSON.stringify(fit) !== JSON.stringify(expectedFit)) throw new Error(`Untranslated move fit: ${JSON.stringify(fit)}`);
  await resetScreens();
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    const cards = Object.keys(game.Moves.EVO).map((id) => {
      const move = game.Moves.instance(id);
      move.lvl = move.def.maxLvl;
      const info = game.Moves.evoInfo(move, {});
      if (!info) throw new Error(`Missing evolution info: ${id}`);
      return { type: 'evo', title: info.name, tag: 'EVOLUCIÓN', desc: info.text, color: '#ffd23f', icon: `move:${id}` };
    });
    game.RunUI.showLevelUp(25, cards, () => {});
  });
  await capture('all-evolved-move-cards');

  const itemCount = await run(() => window.__PSKO_TEST_GAME__.Items.LIST.length);
  for (let index = 0; index < itemCount; index++) {
    await resetScreens();
    await run((body, index) => {
      const game = window.__PSKO_TEST_GAME__;
      const items = game.Items.LIST;
      game.RunUI.showItemChoice([items[(index + 1) % items.length].id], items[index].id, () => {});
    }, index);
    await capture(`items-${index}`);
  }
  await resetScreens();
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    game.RunUI.showBond({ mode: 'pair', loose: [game.Moves.instance('psychic'), game.Moves.instance('ember')], group: [] }, () => {});
  });
  await capture('bond-pick-first');
  await run(() => window.__PSKO_TEST_GAME__.RunUI.pickBond(0));
  await capture('bond-pick-second');
  await resetScreens();
  await run(() => window.__PSKO_TEST_GAME__.RunUI.showPause());
  await capture('pause');
  await resetScreens();
  await run(() => window.__PSKO_TEST_GAME__.RunUI.showOver({
    dead: true, time: 300, level: 20, kills: 300, bosses: 3, judge: { time: 60, bosses: 2 },
    coins: 17, breakdown: 'Tiempo 9 · Derrotados 6 · recogidas 2', t1: 1, t10: 1,
    team: [{ me: true, name: 'Local player', sum: { dex: 387, lv: 4, t: 46, it: null, mv: [['razor-leaf', 2, 1592, 0, false], ['tackle', 2, 0, 0, false]] } }],
    moves: [{ id: 'psychic', name: 'Psíquico', lvl: 5 }], caught: [{ dex: 1, isNew: true }], record: true,
  }, () => {}));
  await capture('run-result');
  const resultText = (await frame.locator('#scr-over').innerText()).replace(/\d[\d,.]*\/s\b/g, '');
  if (/[a-z]/i.test(resultText)) throw new Error('The populated run summary still contains untranslated text.');
  await resetScreens();
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    game._bf1511b.showData({ name: 'Local player', title: 'Brillante', favs: [{ dex: 1, shiny: true }],
      best: { solo: 200, group: 300, level: 40, bosses: 8, legends: 2, kills: 700, medals: 0 } });
    game.UI.show('scr-profile');
  });
  await capture('public-profile');
  await resetScreens(true);
  await run(() => window.__PSKO_TEST_GAME__._fab360e.play());
  await frame.waitForFunction(() => !!window.__PSKO_TEST_GAME__._115d8ef.player);
  await frame.keyboard.press('Escape');
  await run(() => {
    const game = window.__PSKO_TEST_GAME__, player = game._115d8ef.player;
    player.orbs = ['slumber', 'slow', 'blowback', 'focus'].map(id => ({ id, n: 3 }));
    player.orbBuff = { focus: 12, luminous: 13, quick: 8 };
    player.statsTaken = { hp: 3, magnet: 2 };
    player.item = game.Items.LIST[0].id;
    game.RunUI.showPause();
  });
  await capture('pause-with-item-and-orbs');
  await auditMoveNames();
  await auditGeneratedChoices();
  await resetScreens();
  await auditPowerChoices();

  await resetScreens();
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    const moves = ['tackle', 'psychic', 'ember'].map(id => game.Moves.instance(id, 3));
    game.RunUI.showForget({ moves, slots: [[moves[0], moves[1]], [moves[2]]],
      forgetChoices: () => ['reflect', 'light-screen', 'double-team'], canEmpty: () => true }, () => {});
  });
  await capture('forget-linked-moves');
  await frame.waitForTimeout(350);
  await run(() => window.__PSKO_TEST_GAME__.RunUI.pickForget(0));
  await capture('forget-replacements');

  await resetScreens();
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    const player = game._115d8ef.player;
    game.RunUI.showEvo({ ...player, dex: 1, mon: { ...game._b568ae5[1], nature: player.mon.nature } },
      { opts: [2, 3], all: [2, 3], half: false }, () => {});
  });
  await capture('pokemon-evolution-choices');
  await resetScreens();
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    const player = game._115d8ef.player;
    game.RunUI.showForm({ ...player, dex: 479, form: 0, mon: { ...game._b568ae5[479], nature: player.mon.nature } },
      { forms: game._88f0d17.of(479, 'stat') }, () => {});
  });
  await capture('pokemon-form-choices');
  for (const gengar of [false, true]) {
    await resetScreens();
    await run((body, gengar) => {
      const game = window.__PSKO_TEST_GAME__;
      game.RunUI.showOver({ dead: !gengar, time: 600, level: 40, kills: 1500, coins: 200,
        t1: 3, t10: 2, candy: 10, judge: { gengar, dmg: 20000, time: 120 },
        chal: { cond: game._b736cc3.CONDS[0], prize: true },
        mastery: { dex: 1, gained: 200, after: gengar ? 1e9 : 200, got: Object.keys(game._abc0315.BY) },
        moves: [{ id: 'psychic', name: 'Psíquico', lvl: 5 }], caught: [{ dex: 1, isNew: true }], record: true }, () => {});
    }, gengar);
    await capture(gengar ? 'run-rewards-gengar-complete-mastery' : 'run-rewards-arceus-mastery');
  }
} catch (error) {
  errors.push(error.stack || error.message);
  console.error(error);
} finally {
  await writeFile(output, JSON.stringify({ language, localeEntriesChecked, traitNamesChecked, formNamesChecked, moveLabelsChecked, moveNameFindings, generatedChoiceCounts, generatedChoiceChecks, powerNameChecks, errors, findings, screens }, null, 2));
  await context.close();
  console.log(`${screens.length} screens checked; ${findings.length} unexplained entries; ${errors.length} errors.`);
  console.log(output);
  if (errors.length || findings.length) process.exitCode = 1;
}
