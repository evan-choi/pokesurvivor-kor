import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';

const extensionPath = path.resolve(process.env.PSKO_EXTENSION_PATH || 'extension');
const game = `<!doctype html><html lang="en"><body>
  <div id="tap-start">Press to start</div>
  <section id="scr-settings"><h1>Settings</h1><div id="set-body">
    <div translate="no"><button data-lang="es">Español</button><button data-lang="en" class="on">English</button></div>
  </div></section>
  <p id="pokemon">Bulbasaur</p><p id="dynamic">Fire</p>
  <p id="untouched" translate="no">Fire</p><input value="Bulbasaur" placeholder="Password">
  <div id="cards"><div class="card"><div class="nm">Psychic <span class="tag-chip">Psychic</span></div></div></div>
  <div id="dex-detail"><p>Starts with <b class="gold">Psíquico</b></p><p class="move-icons"><span title="Psychic">icon</span></p></div>
  <div contenteditable="true">Fire</div><canvas id="canvas"></canvas>
  <script>
    window.englishClicks = 0;
    document.querySelector('[data-lang="en"]').onclick = () => { window.englishClicks++; };
  </script>
</body></html>`;

let context;
let page;
let frame;
let popup;
let errors;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  await context.route('https://pokesurvivor.pro/**', (route) => route.fulfill({
    contentType: 'text/html; charset=utf-8',
    body: `<html><body><h1>Host page</h1><iframe srcdoc="${game.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></iframe></body></html>`,
  }));
  page = await context.newPage();
  errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const management = await context.newPage();
  await management.goto('chrome://extensions');
  const item = management.locator('extensions-item').filter({ hasText: 'PokeSurvivor' });
  await expect(item).toHaveCount(1);
  const id = await item.getAttribute('id');
  popup = await context.newPage();
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await management.close();
});

test.afterAll(async () => { await context?.close(); });

test.beforeEach(async () => {
  await popup.locator('#enabled').check();
  await page.goto('https://pokesurvivor.pro/play');
  frame = page.frameLocator('iframe');
  await expect(frame.locator('#pokemon')).toHaveText('이상해씨');
});

test('loads in srcdoc, translates dynamic text and attributes, preserves player input', async () => {
  await expect(frame.locator('h1')).toHaveText('설정');
  await expect(frame.locator('input')).toHaveAttribute('placeholder', '비밀번호');
  await expect(frame.locator('input')).toHaveValue('Bulbasaur');
  await expect(frame.locator('#untouched')).toHaveText('Fire');
  await expect(frame.locator('[contenteditable]')).toHaveText('Fire');
  await expect(page.locator('h1')).toHaveText('Host page');
  await frame.locator('#dynamic').evaluate((node) => { node.firstChild.nodeValue = 'Water Gun'; });
  await expect(frame.locator('#dynamic')).toHaveText('물대포');
  await frame.locator('#dynamic').evaluate((node) => { node.innerHTML = '<strong>Charmander</strong>'; });
  await expect(frame.locator('#dynamic strong')).toHaveText('파이리');
  expect(errors).toEqual([]);
});

test('language buttons and popup restore originals, update all frames, and persist on reload', async () => {
  await expect(frame.locator('[data-psko-language]')).toHaveAttribute('aria-pressed', 'true');
  await frame.locator('[data-lang="en"]').click();
  await expect(frame.locator('#pokemon')).toHaveText('Bulbasaur');
  await expect(popup.locator('#enabled')).not.toBeChecked();
  expect(await frame.locator('body').evaluate(() => window.englishClicks)).toBe(1);
  await page.reload();
  await expect(frame.locator('#pokemon')).toHaveText('Bulbasaur');
  await frame.locator('[data-psko-language]').click();
  await expect(frame.locator('#pokemon')).toHaveText('이상해씨');
  await expect(popup.locator('#enabled')).toBeChecked();
  await popup.locator('#enabled').uncheck();
  await expect(frame.locator('#pokemon')).toHaveText('Bulbasaur');
  await expect(frame.locator('[data-psko-language]')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('canvas uses Korean measurements and preserves drawing state', async () => {
  const widths = () => frame.locator('canvas').evaluate((canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 22px monospace';
    const font = ctx.font;
    ctx.fillText('Bulbasaur', 0, 30);
    ctx.strokeText('Settings', 0, 60);
    return { english: ctx.measureText('Bulbasaur').width, korean: ctx.measureText('이상해씨').width, font: ctx.font, originalFont: font };
  });
  const translated = await widths();
  expect(translated.english).toBe(translated.korean);
  expect(translated.font).toBe(translated.originalFont);
  await popup.locator('#enabled').uncheck();
  await expect(frame.locator('#pokemon')).toHaveText('Bulbasaur');
  const original = await widths();
  expect(original.english).not.toBe(original.korean);
  expect(original.font).toBe(original.originalFont);
  expect(errors).toEqual([]);
});

test('move titles and tooltips use move names while type badges retain type names', async () => {
  await expect(frame.locator('#cards .nm')).toHaveText('사이코키네시스 에스퍼');
  await expect(frame.locator('#dex-detail b')).toHaveText('사이코키네시스');
  await expect(frame.locator('.move-icons span')).toHaveAttribute('title', '사이코키네시스');
  const widths = await frame.locator('canvas').evaluate((canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 20px monospace';
    return [ctx.measureText('Psychic').width, ctx.measureText('사이코키네시스').width];
  });
  expect(widths[0]).toBe(widths[1]);
  await popup.locator('#enabled').uncheck();
  await expect(frame.locator('#cards .nm')).toHaveText('Psychic Psychic');
  await expect(frame.locator('.move-icons span')).toHaveAttribute('title', 'Psychic');
});

test('partner selection remains a complete sentence after the game updates the button', async () => {
  await frame.locator('#dex-detail').evaluate((detail) => {
    const button = document.createElement('button');
    button.id = 'dex-pick';
    button.textContent = 'Elegir de compañero';
    detail.append(button);
  });
  const button = frame.locator('#dex-pick');
  await expect(button).toHaveText('파트너로 선택');
  // The game's own Spanish/English translator may run before the extension.
  await button.evaluate((element) => { element.textContent = 'Choose de partner'; });
  await expect(button).toHaveText('파트너로 선택');
  await button.evaluate((element) => { element.textContent = 'Elegir de compañero (shiny)'; });
  await expect(button).toHaveText('파트너로 선택 (색이 다른)');
  await popup.locator('#enabled').uncheck();
  await expect(button).toHaveText('Elegir de compañero (shiny)');
  expect(errors).toEqual([]);
});

test('translates authored protected notices without translating player names or room codes', async () => {
  await frame.locator('body').evaluate((body) => {
    body.insertAdjacentHTML('beforeend', `
      <div id="news-body"><article class="news-day" translate="no"><h3>Recover your account with Gmail</h3></article></div>
      <span translate="no" id="player-name" title="Ver su Profile">Pikachu</span>
      <b translate="no" id="room-code">FIRE012345</b>
      <div id="user-pill"><span translate="no">Guest</span><i class="sync guest"></i></div>
    `);
  });
  await expect(frame.locator('#news-body h3')).toHaveText('Gmail로 계정 복구');
  await expect(frame.locator('#player-name')).toHaveText('Pikachu');
  await expect(frame.locator('#player-name')).toHaveAttribute('title', '프로필 보기');
  await expect(frame.locator('#room-code')).toHaveText('FIRE012345');
  await expect(frame.locator('#user-pill span')).toHaveText('게스트');
  await popup.locator('#enabled').uncheck();
  await expect(frame.locator('#news-body h3')).toHaveText('Recover your account with Gmail');
  await expect(frame.locator('#player-name')).toHaveAttribute('title', 'Ver su Profile');
});

test('resolves ambiguous action labels and keeps keyboard hints intact', async () => {
  await frame.locator('body').evaluate((body) => {
    document.querySelector('#set-body').insertAdjacentHTML('beforeend', '<div id="key-choice"><kbd>Esc</kbd> o <kbd>P</kbd></div>');
    body.insertAdjacentHTML('beforeend', `
      <label class="bind-slot"><select><option value="">Free</option></select></label>
      <button id="save-layout">Save</button>
      <section id="scr-pause"><p class="kbd-hint"><kbd>WASD</kbd> move · <kbd>1</kbd>–<kbd>4</kbd> move · </p></section>
    `);
  });
  await expect(frame.locator('.bind-slot option')).toHaveText('빈 슬롯');
  await expect(frame.locator('#save-layout')).toHaveText('저장');
  await expect(frame.locator('#key-choice')).toHaveText('Esc 또는 P');
  await expect(frame.locator('.kbd-hint')).toHaveText('WASD 이동 · 1–4 기술 ·');
  expect(errors).toEqual([]);
});

test('multiplayer waiting messages preserve names and translate list separators', async () => {
  await frame.locator('body').evaluate((body) => {
    body.insertAdjacentHTML('beforeend', '<p id="lvl-wait">Faltan por elegir: Pikachu, Alice y tú</p>');
  });
  await expect(frame.locator('#lvl-wait')).toHaveText('아직 선택 중: Pikachu, Alice, 나');
  await frame.locator('#lvl-wait').evaluate((node) => { node.textContent = 'Waiting for Lucky Robin y Brave Otter…'; });
  await expect(frame.locator('#lvl-wait')).toHaveText('Lucky Robin, Brave Otter 대기 중…');
});

test('leaves canvas text outside the game and letter-animated boss headings unchanged', async () => {
  const measure = (page) => page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '20px monospace';
    return ctx.measureText('Bulbasaur').width;
  });
  const hostWidth = await measure(page);
  const bossWidth = await frame.locator('canvas').evaluate((canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.font = '20px monospace';
    return ctx.measureText('THE JUDGMENT').width;
  });
  await popup.locator('#enabled').uncheck();
  await expect(frame.locator('#pokemon')).toHaveText('Bulbasaur');
  expect(await measure(page)).toBe(hostWidth);
  expect(await frame.locator('canvas').evaluate((canvas) => canvas.getContext('2d').measureText('THE JUDGMENT').width)).toBe(bossWidth);
  expect(errors).toEqual([]);
});
