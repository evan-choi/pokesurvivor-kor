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
  'JPTER78', 'Copyright', 'Google', 'Gmail', 'GitHub', 'YouTube', 'Ko-fi',
  'iPhone', 'Safari', 'Chrome', 'Android', 'iOS', 'Windows', 'macOS',
  'PMD', 'OFL', 'NFT', 'FPS', 'PC',
];
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const namesPattern = new RegExp(`(?<![A-Za-z0-9])(?:${allowedNames.sort((a, b) => b.length - a.length).map(escape).join('|')})(?![A-Za-z0-9])`, 'gi');
const foreignCharacters = /[\p{Script=Latin}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

function unexplainedText(entry) {
  if (entry.tag === 'KBD' && /^(?:[WASDQERPF]|Esc|Enter|Space|Tab|Shift|Ctrl|Alt|1[0-2]?|[2-9])$/i.test(entry.text)) return '';
  return entry.text
    .replace(namesPattern, '')
    .replace(/\bNo\.\s*\d+\b/gi, '')
    .replace(/\b(?:Lv|Nv)\.\s*\d+\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ms|s|m|h|HP|XP|EXP)\b/gi, '')
    .replace(/\b(?:WASD|Q\/E|Esc\/P)\b/g, '');
}

const errors = [];
const screens = [];
const findings = [];
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  viewport: { width: 1400, height: 1000 },
});
const page = await context.newPage();
page.setDefaultTimeout(20_000);
page.on('pageerror', (error) => errors.push(error.message));
await context.addInitScript((lang) => localStorage.setItem('ps.lang', lang), language);
let frame;

async function capture(label) {
  await frame.locator('body').evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const capture = await frame.locator('body').evaluate(() => {
    const entries = [];
    const seen = new Set();
    let skippedUserText = 0;
    let skippedLanguagePicker = 0;
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
      if (element.closest('script, style, noscript') || !element.checkVisibility({ checkVisibilityCSS: true })) return;
      if (element.closest('[data-lang], [data-psko-language]')) {
        skippedLanguagePicker++;
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
    return { entries, skippedUserText, skippedLanguagePicker };
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
      const prefix = source.match(/var (_0x[\da-f]+)=Object\[_0x[\da-f]+\(0x[\da-f]+\)\]\(null\);/);
      if (!prefix) throw new Error('UI audit hook no longer matches the official game bundle.');
      await route.fulfill({ response, body: source.replace(prefix[0], `${prefix[0]}window.__PSKO_TEST_GAME__=${prefix[1]};`) });
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
      U: '_18c81e9', DB: '_fa16ae6', MenuUI: '_3568e77', SettingsUI: '_aa22d55',
      NewsUI: '_8ae4145', SupportUI: '_091716d', NickUI: '_f7271e2', GoalsUI: '_fdfa3bd',
      GachaUI: '_8efd3b3', Moves: '_c96d2a4', RunUI: '_7a7fb51',
    };
    const components = Object.fromEntries(Object.entries(names).map(([name, key]) => {
      if (!game?.[key]) throw new Error(`UI audit module changed: ${name}`);
      return [name, game[key]];
    }));
    window.__PSKO_TEST_GAME__ = { ...game, ...components };
  });
  await capture('login');
  await frame.locator('#btn-guest').click();
  for (let index = 0; index < 8; index++) {
    await capture(`quiz-${index + 1}`);
    await frame.locator('#test-a button').first().click();
  }
  await capture('quiz-result');
  await frame.locator('#res-ok').click();
  await capture('menu');

  for (const tab of ['sound', 'gfx', 'ctl', 'a11y', 'acc', 'about']) {
    await openPanel('SettingsUI', tab);
    await capture(`settings-${tab}`);
  }
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
  await resetScreens(true);
  await frame.locator('[data-go="upgrades"]').click();
  await capture('upgrades');
  await openPanel('GachaUI');
  await capture('gacha');

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
    coins: 100, breakdown: '300 derrotados · 3 jefes', t1: 1, t10: 1,
    moves: [{ id: 'psychic', name: 'Psíquico', lvl: 5 }], caught: [{ dex: 1, isNew: true }], record: true,
  }, () => {}));
  await capture('run-result');
} catch (error) {
  errors.push(error.stack || error.message);
  console.error(error);
} finally {
  await writeFile(output, JSON.stringify({ language, errors, findings, screens }, null, 2));
  await context.close();
  console.log(`${screens.length} screens checked; ${findings.length} unexplained entries; ${errors.length} errors.`);
  console.log(output);
  if (errors.length || findings.length) process.exitCode = 1;
}
