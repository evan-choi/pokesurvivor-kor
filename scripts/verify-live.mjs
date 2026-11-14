import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const extension = path.resolve('extension');
const output = path.resolve('test-results/live');
await mkdir(output, { recursive: true });
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium', headless: true,
  serviceWorkers: 'block',
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  viewport: { width: 1365, height: 960 },
});
const page = await context.newPage();
page.setDefaultTimeout(20_000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

async function enterMenu(language) {
  await page.waitForFunction(lang => globalThis.PS_LOCALES?.lang === lang, language);
  await page.locator('#tap-start:not(.hidden), #scr-login:not(.hidden) #btn-guest, #scr-menu:not(.hidden)').first().waitFor();
  if (await page.locator('#tap-start').isVisible()) await page.locator('#tap-start').click();
  if (await page.locator('#btn-guest').isVisible()) {
    await page.locator('#btn-guest').click();
    for (let i = 0; i < 8; i++) await page.locator('#test-a button').first().click();
    await page.locator('#res-ok').click();
  }
  await page.locator('#scr-menu').waitFor();
}

async function checkTextAlignment(selectors) {
  const samples = await page.locator(selectors).evaluateAll((elements) => elements.filter((element) => element.checkVisibility()).flatMap((element) => {
    const text = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!text) return [];
    const range = document.createRange();
    range.selectNodeContents(text);
    if (range.getClientRects().length !== 1) return [];
    const textBox = range.getBoundingClientRect();
    const box = (element.closest('.pill') || element).getBoundingClientRect();
    const style = getComputedStyle(element);
    const context = document.createElement('canvas').getContext('2d');
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const metrics = context.measureText(text.textContent.trim());
    const baseline = textBox.bottom - metrics.fontBoundingBoxDescent;
    const inkCenter = baseline + (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2;
    return [{ text: text.textContent.trim(), offset: inkCenter - box.top - box.height / 2 }];
  }));
  assert.ok(samples.length > 0, 'The layout check must measure visible text.');
  assert.ok(samples.every(({ offset }) => Math.abs(offset) <= 1), `Off-center text: ${JSON.stringify(samples)}`);
}

try {
  // Run only in this disposable browser; never submit an account, score or save.
  await context.route('**/*', (route) => {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.request().method()) ? route.abort() : route.continue();
  });
  await page.goto('https://pokesurvivor.com/', { waitUntil: 'domcontentloaded' });
  const frame = page;
  await frame.locator('#tap-start:not(.hidden), #scr-login:not(.hidden) #btn-guest').first().waitFor();
  if (await frame.locator('#tap-start').isVisible()) await frame.locator('#tap-start').click();
  await page.waitForFunction(() => typeof globalThis.PSKO_READ_OWNED_POKEMON === 'function');
  assert.equal(await page.evaluate(() => globalThis.PSKO_READ_OWNED_POKEMON()), null);
  console.log('Live game loaded; entering guest setup.');
  await frame.locator('#btn-guest').click();
  for (let i = 0; i < 8; i++) await frame.locator('#test-a button').first().click();
  await frame.locator('#res-ok').click();
  const owned = await page.evaluate(() => globalThis.PSKO_READ_OWNED_POKEMON());
  assert.ok(Array.isArray(owned) && owned.length > 0 && owned.every(id => /^\d+$/.test(id)), 'The live collection reader must return the guest’s owned Pokémon IDs.');
  await frame.locator('#btn-settings').click();
  await frame.locator('#set-tabs [data-t="gfx"]').click();
  await frame.locator('[data-lang="ko"].on').waitFor();
  assert.match(await frame.locator('#scr-settings').innerText(), /한국어/);
  const ownEffects = frame.locator('[data-psko-effects] select').first();
  assert.equal(await ownEffects.isEnabled(), true);
  await ownEffects.selectOption('0.2');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('psko.effect-opacity')).own), 0.2);
  await frame.locator('#set-tabs [data-t="ctl"]').click();
  assert.equal(await frame.locator('[data-psko-melee-fix] button').isEnabled(), true);
  await frame.locator('#set-tabs [data-t="network"]').click();
  const direct = frame.locator('#psko-lan-direct');
  assert.equal(await direct.getAttribute('aria-checked'), 'false');
  await direct.click();
  await page.waitForFunction(() => document.querySelector('#psko-lan-direct').getAttribute('aria-checked') === 'true');
  assert.equal(await direct.getAttribute('aria-checked'), 'true');
  await frame.locator('#set-tabs [data-t="gfx"]').click();
  await page.screenshot({ path: path.join(output, 'settings-korean.png'), animations: 'disabled' });
  const buttonSizes = await frame.locator('.set-row > button.switch').evaluateAll((buttons) => buttons.map((button) => {
    const { width, height } = button.getBoundingClientRect();
    return { width, height };
  }));
  assert.ok(buttonSizes.length > 1);
  assert.ok(buttonSizes.every(({ width, height }) => width === buttonSizes[0].width && height === buttonSizes[0].height));
  console.log('Korean settings:', await frame.locator('#scr-settings').innerText());
  await Promise.all([page.waitForEvent('domcontentloaded'), frame.locator('[data-lang="en"]').click()]);
  await enterMenu('en');
  await frame.locator('#btn-settings').click();
  await frame.locator('#set-tabs [data-t="gfx"]').click();
  await frame.locator('#scr-settings h2').filter({ hasText: /^Settings$/ }).waitFor();
  assert.equal(await frame.locator('[data-psko-effects] select').first().inputValue(), '0.2');
  await frame.locator('[data-psko-effects] select').first().selectOption('1');
  await frame.locator('#set-tabs [data-t="network"]').click();
  assert.equal(await frame.locator('#psko-lan-direct').getAttribute('aria-checked'), 'true');
  await frame.locator('#psko-lan-direct').click();
  await page.waitForFunction(() => document.querySelector('#psko-lan-direct').getAttribute('aria-checked') === 'false');
  assert.equal(await frame.locator('#psko-lan-direct').getAttribute('aria-checked'), 'false');
  await frame.locator('#set-tabs [data-t="gfx"]').click();
  assert.equal(await frame.locator('[data-lang="ko"]').count(), 1);
  await Promise.all([page.waitForEvent('domcontentloaded'), frame.locator('[data-lang="ko"]').click()]);
  await enterMenu('ko');
  await frame.locator('#btn-settings').click();
  await frame.locator('#scr-settings h2').filter({ hasText: /^설정$/ }).waitFor();
  await frame.locator('#set-close').click();
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1365, height: 960 }, { width: 960, height: 600 }]) {
    await page.setViewportSize(viewport);
    await checkTextAlignment('#coins, #btn-logout, #menu-partner-info .type');
  }
  await page.setViewportSize({ width: 1365, height: 960 });
  await page.screenshot({ path: path.join(output, 'menu-korean.png'), animations: 'disabled' });
  const menu = await frame.locator('#scr-menu').innerText();
  assert.match(menu, /켈리몬 상점/);
  assert.match(menu, /가방/);
  assert.equal(await frame.evaluate(async () => (await document.fonts.load('16px "NeoDunggeunmo"', '한글 ABC')).length), 1);
  const menuIcons = await frame.locator('.menu-item').evaluateAll((buttons) => buttons.map((button) => {
    const card = button.getBoundingClientRect();
    const container = button.querySelector('.mi-ico');
    const icon = container.getBoundingClientRect();
    const image = container.querySelector('img').getBoundingClientRect();
    const textRects = [];
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim() || container.contains(walker.currentNode)) continue;
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      textRects.push(...range.getClientRects());
    }
    return {
      name: button.dataset.go,
      contained: icon.left >= card.left && icon.right <= card.right && icon.top >= card.top && icon.bottom <= card.bottom,
      xOffset: Math.abs(image.left + image.width / 2 - icon.left - icon.width / 2),
      yOffset: Math.abs(image.top + image.height / 2 - icon.top - icon.height / 2),
      overlapsText: textRects.some(text => text.width && text.height && text.left < icon.right && text.right > icon.left && text.top < icon.bottom && text.bottom > icon.top),
    };
  }));
  assert.equal(menuIcons.length, 13);
  assert.ok(menuIcons.every(icon => icon.contained && icon.xOffset < 1 && icon.yOffset < 1 && !icon.overlapsText),
    `Menu icons must fit their cards, center their images and leave text clear: ${JSON.stringify(menuIcons)}`);
  console.log('Korean menu:', menu);

  await frame.locator('[data-go="dex"]').click();
  await frame.locator('#dex-grid .cell:not(.locked)').first().click();
  await checkTextAlignment('#dex-filters .chip, .dex-sort .chip, #dex-detail .type');
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
  await shop.locator('[data-tab="tm"]').click();
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
  await frame.locator('#btn-settings').click();
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
