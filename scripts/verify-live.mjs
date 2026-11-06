import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const extension = path.resolve('extension');
const output = path.resolve('test-results/live');
await mkdir(output, { recursive: true });
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  viewport: { width: 1365, height: 960 },
});
const page = await context.newPage();
page.setDefaultTimeout(20_000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
  // Run only in this disposable browser; never submit an account, score or save.
  await context.route('**/*', (route) => {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.request().method()) ? route.abort() : route.continue();
  });
  await page.goto('https://pokesurvivor.com/', { waitUntil: 'domcontentloaded' });
  const frame = page;
  await frame.locator('#tap-start:not(.hidden), #scr-login:not(.hidden) #btn-guest').first().waitFor();
  if (await frame.locator('#tap-start').isVisible()) await frame.locator('#tap-start').click();
  console.log('Live game loaded; entering guest setup.');
  await frame.locator('#btn-guest').click();
  for (let i = 0; i < 8; i++) await frame.locator('#test-a button').first().click();
  await frame.locator('#res-ok').click();
  await frame.locator('[data-go="settings"]').click();
  await frame.locator('#set-tabs [data-t="gfx"]').click();
  await frame.locator('[data-psko-language].on').waitFor();
  assert.match(await frame.locator('#scr-settings').innerText(), /한국어/);
  await page.screenshot({ path: path.join(output, 'settings-korean.png'), animations: 'disabled' });
  const buttonSizes = await frame.locator('.set-row > .btn').evaluateAll((buttons) => buttons.map((button) => {
    const { width, height } = button.getBoundingClientRect();
    return { width, height };
  }));
  assert.ok(buttonSizes.length > 1);
  assert.ok(buttonSizes.every(({ width, height }) => width === buttonSizes[0].width && height === buttonSizes[0].height));
  console.log('Korean settings:', await frame.locator('#scr-settings').innerText());
  await frame.locator('[data-lang="en"]').click();
  await frame.locator('#scr-settings h2').filter({ hasText: /^Settings$/ }).waitFor();
  await frame.locator('[data-psko-language]').click();
  await frame.locator('#scr-settings h2').filter({ hasText: /^설정$/ }).waitFor();
  await frame.locator('#set-close').click();
  await page.screenshot({ path: path.join(output, 'menu-korean.png'), animations: 'disabled' });
  const menu = await frame.locator('#scr-menu').innerText();
  assert.match(menu, /켈리몬 상점/);
  assert.match(menu, /가방/);
  assert.equal(await frame.evaluate(async () => (await document.fonts.load('16px "Pokemon DPPt"', '한글 ABC')).length), 1);
  const iconOffsets = await frame.locator('.menu-item').evaluateAll((buttons) => buttons.map((button) => {
    const bounds = button.getBoundingClientRect();
    const icon = button.querySelector('.mi-ico').getBoundingClientRect();
    return Math.abs(icon.y + icon.height / 2 - bounds.y - bounds.height / 2);
  }));
  assert.equal(iconOffsets.length, 10);
  assert.ok(iconOffsets.every((offset) => offset < 1), 'Menu icons must be centered across the title and description.');
  console.log('Korean menu:', menu);

  await frame.locator('[data-go="dex"]').click();
  await frame.locator('#dex-grid .cell:not(.locked)').first().click();
  const dexText = await frame.locator('#scr-dex').innerText();
  assert.match(dexText, /희귀도/);
  assert.match(dexText, /최근 포획순/);
  assert.match(dexText, /많이 사용한 순/);
  assert.doesNotMatch(dexText.replace(/(?:No\.|Nº)\s*\d+/g, ''), /[\p{Script=Latin}\p{Script=Han}]/u);
  const filterIconOffsets = await frame.locator('#dex-filters .chip img').evaluateAll((icons) => icons.map((icon) => {
    const button = icon.closest('.chip').getBoundingClientRect();
    const bounds = icon.getBoundingClientRect();
    return Math.abs(bounds.top + bounds.height / 2 - button.top - button.height / 2);
  }));
  assert.equal(filterIconOffsets.length, 7);
  assert.ok(filterIconOffsets.every((offset) => offset < 0.5), 'All filter icons must be vertically centered.');
  await frame.locator('#dex-detail').getByRole('button', { name: '즐겨찾기 추가', exact: true }).click();
  await frame.locator('#dex-detail').getByRole('button', { name: '즐겨찾기', exact: true }).waitFor();
  await frame.locator('#dex-detail').getByRole('button', { name: '즐겨찾기', exact: true }).click();
  await frame.locator('#dex-detail').getByRole('button', { name: '즐겨찾기 추가', exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, 'pokedex-korean.png'), animations: 'disabled' });
  await frame.locator('#scr-dex [data-back]').click();
  await frame.locator('[data-go="shop"]').click();
  const shop = frame.locator('#scr-shop');
  await shop.getByRole('heading', { name: '오늘의 기술머신' }).waitFor();
  assert.match(await shop.innerText(), /특성캡슐/);
  assert.doesNotMatch(await shop.innerText(), /[\p{Script=Latin}\p{Script=Han}]/u);
  await page.screenshot({ path: path.join(output, 'shop-korean.png'), animations: 'disabled' });
  await shop.locator('[data-back]').click();
  await frame.locator('[data-go="bag"]').click();
  assert.match(await frame.locator('#scr-bag').innerText(), /가방이 비어 있습니다/);
  assert.doesNotMatch(await frame.locator('#scr-bag').innerText(), /[\p{Script=Latin}\p{Script=Han}]/u);
  await frame.locator('#scr-bag [data-back]').click();
  await frame.locator('[data-go="upgrades"]').click();
  await page.screenshot({ path: path.join(output, 'upgrades-korean.png'), animations: 'disabled' });
  await frame.locator('#scr-upgrades [data-back]').click();
  await page.setViewportSize({ width: 960, height: 600 });
  await frame.locator('[data-go="settings"]').click();
  await page.screenshot({ path: path.join(output, 'settings-compact.png'), animations: 'disabled' });
  const settingsFit = await frame.locator('#scr-settings .box').evaluate((box) => {
    const rect = box.getBoundingClientRect();
    const close = document.querySelector('#set-close').getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth && close.top >= 0 && close.bottom <= innerHeight && box.scrollWidth <= box.clientWidth;
  });
  assert.ok(settingsFit, 'Settings and its close button must fit the compact viewport.');
  await frame.locator('#set-close').click();
  await page.setViewportSize({ width: 1365, height: 960 });

  await frame.locator('[data-go="play"]').click();
  console.log('Play screen:', await frame.locator('body').innerText());
  await page.screenshot({ path: path.join(output, 'play-korean.png'), animations: 'disabled' });
  assert.deepEqual(errors, []);
  console.log(`Live verification passed. Screenshots: ${output}`);
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png') });
  for (const frame of page.frames()) {
    console.error(frame.url(), (await frame.locator('body').innerText().catch(() => '')).slice(0,4000));
  }
  throw error;
} finally {
  await context.close();
}
