import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';

const extensionPath = path.resolve('extension');
const game = `<!doctype html><html lang="en"><body>
  <div id="tap-start">Press to start</div>
  <section id="scr-settings"><h1>Settings</h1><div id="set-body">
    <div translate="no"><button data-lang="es">Español</button><button data-lang="en" class="on">English</button></div>
  </div></section>
  <p id="pokemon">Bulbasaur</p><p id="dynamic">Fire</p>
  <p id="untouched" translate="no">Fire</p><input value="Bulbasaur" placeholder="Password">
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
    contentType: 'text/html',
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
