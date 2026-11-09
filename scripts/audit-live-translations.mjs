import { mkdir, writeFile } from 'node:fs/promises';
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
await mkdir(path.dirname(output), { recursive: true });

// Only these named products, rights holders and technical labels may remain in Latin script.
// Unknown words, including short words such as "de", "as" and "o", are still reported.
const allowedNames = [
  'pokesurvivor.com',
  'PokéSurvivor', 'PokeSurvivor', 'The Pokémon Company', 'Pokémon', 'Creatures Inc.',
  'Nintendo', 'Creatures', 'GAME FREAK', 'PolyForm Noncommercial 1.0.0',
  'CC BY-NC 4.0', 'Pixelify Sans', 'SpriteCollab', 'PokéAPI', 'PokeAPI',
  'JPTER78', 'TheAdro7', 'Folagor', 'Sekiam', 'PokeAlex', 'Copyright',
  'Google', 'Gmail', 'GitHub', 'YouTube', 'Ko-fi', 'Discord', 'Firebase', 'CREDITS.md', 'MIT',
  'Xbox', 'PlayStation', 'Switch', 'USB', 'Bluetooth',
  'iPhone', 'Safari', 'Chrome', 'Android', 'iOS', 'Windows', 'macOS',
  'PMD', 'OFL', 'NFT', 'FPS', 'PC', 'HP',
];
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const namesPattern = new RegExp(`(?<![A-Za-z0-9])(?:${allowedNames.sort((a, b) => b.length - a.length).map(escape).join('|')})(?![A-Za-z0-9])`, 'gi');
const foreignCharacters = /[\p{Script=Latin}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

function unexplainedText(entry) {
  if (entry.tag === 'KBD' && /^(?:[WASDQERPF]|Esc|Enter|Space|Tab|Shift|Ctrl|Alt|1[0-2]?|[2-9])$/i.test(entry.text)) return '';
  if (entry.class.split(/\s+/).includes('padkey') && /^(?:[ABXY]|LB|RB|LT|RT|Start|Select)$/u.test(entry.text)) return '';
  return entry.text
    .replace(namesPattern, '')
    .replace(/\bNo\.\s*\d+\b/gi, '')
    .replace(/\b(?:Lv|Nv)\.\s*\d+\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ms|s|m|h|HP|XP|EXP)\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*\/s\b/g, '')
    .replace(/\b(?:LB|RB|A|B|X|Y|Q|E|Esc)(?:·(?:LB|RB|A|B|X|Y|Q|E|Esc))*\s*(?=버튼|키|로)/g, '')
    .replace(/\b[XY](?=\([가-힣])/g, '')
    .replace(/\b(?:WASD|Q\/E|Esc\/P)\b/g, '');
}

const errors = [];
const screens = [];
const findings = [];
let localeEntriesChecked = 0;
let traitNamesChecked = 0;
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  viewport: { width: 1400, height: 1000 },
});
const page = await context.newPage();
page.setDefaultTimeout(20_000);
page.on('pageerror', (error) => errors.push(error.message));
await page.addLocatorHandler(page.locator('#scr-video:not(.hidden)'), () => page.locator('#video-close').click());
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
      '#prof-body .prof-head h2[translate="no"]',
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
      if (!source.includes('_0x310a73=[')) throw new Error('Account notice fixture no longer matches the game bundle.');
      const register = /function _0x245df5\([^)]*\)\{/;
      if (!register.test(source)) throw new Error('Locale registry audit hook no longer matches the game bundle.');
      const fixtureSource = source
        .replace('_0x310a73=[', '_0x310a73=window.__PSKO_TEST_NOTICES__=[')
        .replace(register, match => match + "if(_0x1339c1==='en'&&!_0x4f0c9a)Object.assign(window.__PSKO_TEST_LOCALES__??={},_0x3af59a);");
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
      U: '_04b31d9', DB: '_98c1010', MenuUI: '_e2de144', SettingsUI: '_90b8405',
      NewsUI: '_d678271', SupportUI: '_b9c902a', NickUI: '_660aa4c', GoalsUI: '_7bc534a',
      GachaUI: '_0fed362', Moves: '_3deb117', RunUI: '_4373dbf',
      ShopUI: '_ce06d52',
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
  const locale = await run(() => {
    const entries = Object.entries(window.__PSKO_TEST_LOCALES__ || {});
    const untranslated = entries.filter(([spanish, english]) =>
      [spanish, english].some(text => text !== 'Google' && !/[가-힣]/u.test(window.PSKO.translate(text))));
    return { count: entries.length, untranslated };
  });
  localeEntriesChecked = locale.count;
  if (!locale.count) throw new Error('The locale registry was empty.');
  for (const [spanish, english] of locale.untranslated) findings.push({ screen: 'locale-registry', spanish, english });
  const nativeChecks = await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    return {
      aliases: ['Mando conectado', 'Mando conectado:', 'atrás / cerrar', 'TIRADA ×100'].map(text => game.T(text)),
      products: ['Switch', 'The Pokémon Company', 'CREDITS.md', 'Authentication > Settings > Authorized domains']
        .map(text => game.T(game.T(text))),
      rewritten: Object.values(window.PSKO_MESSAGES).filter(row => /[가-힣]/u.test(row[2]) && !/\{(?:x|name)\}/u.test(row[2]))
        .map(row => row[2]).filter(text => game.T(text) !== text),
      untranslated: Object.entries(window.__PSKO_TEST_LOCALES__).filter(([source]) => source !== 'Google' &&
        !/[가-힣]/u.test(game.T(source.replace(/\{(?:x|name)\}/g, '17')))),
      playerNames: ['Fire', 'Ash Pokémon'].flatMap(name => [
        game._30d1664.f('Viendo a {x}', name),
        game._30d1664.f('{name} es el nuevo anfitrión', name),
      ]),
    };
  });
  if (JSON.stringify(nativeChecks.aliases) !== JSON.stringify(['컨트롤러 연결됨', '컨트롤러 연결됨:', '뒤로 / 닫기', '뽑기 ×100']) ||
      JSON.stringify(nativeChecks.products) !== JSON.stringify(['Switch', 'The Pokémon Company', 'CREDITS.md', 'Authentication > Settings > Authorized domains']) ||
      nativeChecks.rewritten.length ||
      JSON.stringify(nativeChecks.playerNames) !== JSON.stringify([
        'Fire 관전 중', 'Fire 님이 새 방장이 되었습니다',
        'Ash Pokémon 관전 중', 'Ash Pokémon 님이 새 방장이 되었습니다',
      ])) {
    throw new Error(`Native translation mismatch: ${JSON.stringify(nativeChecks)}`);
  }
  for (const [source, english] of nativeChecks.untranslated) findings.push({ screen: 'native-locale-registry', source, english });
  const traitCatalog = await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    return [
      ...game._06cb786.map(nature => {
        const source = game._f62b694.name(nature.n);
        return { kind: 'nature', source, translated: window.PSKO_NATURES[source] || source };
      }),
      ...Object.keys(game._9a39d9c).map(id => {
        const source = game._f62b694.abilityName(id);
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
    window.__PSKO_TEST_GAME__._5d93a86.updateNotices();
  });
  await capture('account-update-notice');
  if (/[a-z]/i.test(await frame.locator('#scr-savenote').innerText())) {
    throw new Error('The account update notice still contains untranslated text.');
  }
  await frame.locator('#savenote-ok').click();

  for (const tab of ['sound', 'gfx', 'ctl', 'a11y', 'acc', 'about']) {
    await openPanel('SettingsUI', tab);
    await capture(`settings-${tab}`);
  }
  await run(() => {
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [{
      id: 'Local test controller', index: 0, connected: true, mapping: 'standard',
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0],
    }] });
    window.__PSKO_TEST_GAME__._52f25e4.poll(performance.now());
  });
  await openPanel('SettingsUI', 'ctl');
  await capture('settings-connected-controller');
  await run(() => { delete navigator.getGamepads; });
  await resetScreens();
  await run(() => window.__PSKO_TEST_GAME__._8a3edd0.open());
  await capture('touch-layout');
  await run(() => window.__PSKO_TEST_GAME__._8a3edd0.close());
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

  // Owned/shiny fixtures live only in this browser's game object; nothing is committed.
  await run(() => {
    const game = window.__PSKO_TEST_GAME__;
    game.DB.save.owned = { ...game.DB.save.owned, 1: 1, 4: 1, 121: 1 };
    game.DB.save.shiny = { 1: 1 };
  });
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
  await capture('dex-search-empty');
  await frame.locator('#dex-q').fill('');
  await frame.locator('#dex-type').selectOption('grass');
  await capture('dex-type-grass');
  await frame.locator('#dex-type').selectOption('');
  // Select the all-region tab to include every owned fixture.
  await frame.locator('#dex-gens .gen-tab').first().click();
  await frame.locator('#dex-filters .chip').nth(1).click();
  await capture('dex-owned-list');
  const ownedCount = await frame.locator('#dex-grid .cell:not(.locked)').count();
  if (ownedCount < 3) throw new Error('The audit must inspect all owned Pokémon fixtures.');
  for (let index = 0; index < ownedCount; index++) {
    await frame.locator('#dex-grid .cell:not(.locked)').nth(index).click();
    await capture(`dex-owned-${index}`);
    const favorite = frame.locator('#dex-detail button.chip').first();
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
  for (const [id, expected] of [[492, '쉐이미 (파트너) · 강화 17레벨'], [387, '모부기 · 강화 9레벨'], [390, '불꽃숭이']]) {
    const label = await frame.locator(`#upg-mon option[value="${id}"]`).textContent();
    if (label !== expected) throw new Error(`Incorrect upgrade option: ${label}`);
  }
  // Exercise the purchased starting-move controls that can squeeze the description.
  await run(() => {
    const game = window.__PSKO_TEST_GAME__, save = game.DB.save;
    save.pupg[492].start = 1;
    game.MenuUI.open();
    document.querySelector('[data-go="upgrades"]').click();
  });
  await capture('upgrades-with-starting-move');
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
    const layout = await run(() => {
      const card = document.querySelector('#upg-list [data-start]').closest('.upg-item');
      const text = card.children[1], buttons = card.querySelector('.upg-btns');
      const bounds = card.getBoundingClientRect(), description = text.getBoundingClientRect(), actions = buttons.getBoundingClientRect();
      return { width: description.width, overlap: description.bottom > actions.top + 1,
        overflow: card.scrollWidth > card.clientWidth + 1 || actions.right > bounds.right + 1 };
    });
    if (layout.width < 120 || layout.overlap || layout.overflow) {
      throw new Error(`Cramped starting-move card at ${width}px: ${JSON.stringify(layout)}`);
    }
  }
  await page.setViewportSize({ width: 1400, height: 1000 });
  await run(() => {
    const save = window.__PSKO_TEST_GAME__.DB.save;
    save.bag = { mint: 5, cap: 5, caph: 5, candy: 70 };
    save.tms = Object.fromEntries(Object.keys(window.__PSKO_TEST_GAME__._d1b6145).map(id => [id, 1]));
  });
  await resetScreens(true);
  await frame.locator('[data-go="dex"]').click();
  await frame.locator('#dex-q').fill('121');
  await frame.locator('#dex-grid .cell:not(.locked)').first().click();
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
      game.RunUI.showItemChoice(items[index].id, items[(index + 1) % items.length].id, () => {});
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
    game._9d6a83d.showData({ name: 'Local player', title: 'Brillante', favs: [{ dex: 1, shiny: true }],
      best: { solo: 200, group: 300, level: 40, bosses: 8, legends: 2, kills: 700, medals: 0 } });
    game.UI.show('scr-profile');
  });
  await capture('public-profile');
  await resetScreens(true);
  await run(() => window.__PSKO_TEST_GAME__._5205be5.play());
  await frame.waitForFunction(() => !!window.__PSKO_TEST_GAME__._ae681d5.player);
  await frame.keyboard.press('Escape');
  await run(() => {
    const game = window.__PSKO_TEST_GAME__, player = game._ae681d5.player;
    player.orbs = ['slumber', 'slow', 'blowback', 'focus'].map(id => ({ id, n: 3 }));
    player.orbBuff = { focus: 12, luminous: 13, quick: 8 };
    player.statsTaken = { hp: 3, magnet: 2 };
    player.item = game.Items.LIST[0].id;
    game.RunUI.showPause();
  });
  await capture('pause-with-item-and-orbs');
} catch (error) {
  errors.push(error.stack || error.message);
  console.error(error);
} finally {
  await writeFile(output, JSON.stringify({ language, localeEntriesChecked, traitNamesChecked, errors, findings, screens }, null, 2));
  await context.close();
  console.log(`${screens.length} screens checked; ${findings.length} unexplained entries; ${errors.length} errors.`);
  console.log(output);
  if (errors.length || findings.length) process.exitCode = 1;
}
