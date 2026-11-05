import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';

const extensionPath = path.resolve(process.env.PSKO_EXTENSION_PATH || 'extension');
const species = [
  [890, 'Eternatus', 'S'], [150, 'Mewtwo', 'A'], [243, 'Raikou', 'B'],
  [25, 'Pikachu', 'C'], [1, 'Bulbasaur', 'D'],
];
const tierHtml = species.map(([, name, tier], index) => `<div data-tier-block>
  <h3 id="tier-${tier.toLowerCase()}">${tier} tier</h3><table><tbody><tr>
  <td>${index + 1}</td><td><a href="/pokedex/${name.toLowerCase()}/">${name}</a></td>
  </tr></tbody></table></div>`).join('');
const dexHtml = '<table>' + species.map(([dex, name]) => `<tr><td><a href="/pokedex/${name.toLowerCase()}/"><span class="no">#${dex}</span>${name}</a></td></tr>`).join('') + '</table>';
const game = '<!doctype html><html><body><div id="tap-start">Press to start</div><div id="dex-grid"></div></body></html>';
const tinyGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

let context, page, popup, gameFrame, popupUrl;
let failGuide = false;
let guideRequests = 0;
let imageRequests = [];
let errors = [];

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  await context.route('https://pokesurvivor.pro/**', (route) => route.fulfill({
    contentType: 'text/html', body: `<iframe srcdoc="${game.replaceAll('"', '&quot;')}"></iframe>`,
  }));
  await context.route('https://pokesurvivor.net/**', (route) => {
    guideRequests++;
    return failGuide ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.fulfill({
      contentType: 'text/html', body: route.request().url().includes('/tier-list/') ? tierHtml : dexHtml,
    });
  });
  await context.route('https://raw.githubusercontent.com/PokeAPI/sprites/**', (route) => {
    imageRequests.push(route.request().url());
    if (route.request().url().endsWith('/25.gif')) return route.fulfill({ status: 404, body: '' });
    if (route.request().url().includes('/9999.')) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ contentType: 'image/gif', body: tinyGif });
  });
  page = await context.newPage();
  popup = await context.newPage();
  const management = await context.newPage();
  await management.goto('chrome://extensions');
  const id = await management.locator('extensions-item').filter({ hasText: 'PokeSurvivor' }).getAttribute('id');
  popupUrl = `chrome-extension://${id}/popup.html`;
  await management.close();
  popup.on('pageerror', (error) => errors.push(error.message));
});

test.afterAll(async () => { await context?.close(); });

async function openPopup() {
  await page.bringToFront();
  await popup.goto(popupUrl);
  await expect(popup.locator('#refresh-collection')).toBeEnabled();
}

test.beforeEach(async () => {
  await popup.goto('about:blank');
  failGuide = false;
  guideRequests = 0;
  imageRequests = [];
  errors = [];
  await page.goto('https://pokesurvivor.pro/play');
  gameFrame = page.frames().find((frame) => frame.url() === 'about:srcdoc');
  await gameFrame.locator('#dex-grid').waitFor({ state: 'attached' });
  await gameFrame.evaluate(() => {
    localStorage.clear();
    window.PS_PLATFORM_MODE = true;
    window.PS_HOST_USER = null;
    localStorage.setItem('ps.save.platform.active', JSON.stringify({ owned: { 243: {}, 890: {}, 25: {} } }));
    localStorage.setItem('ps.save.platform.another', JSON.stringify({ owned: { 150: {} } }));
  });
  await page.bringToFront();
  await popup.goto(popupUrl);
  await expect(popup.locator('#collection-status')).toContainText('로그인하세요');
  await popup.evaluate(() => chrome.storage.local.clear());
  await gameFrame.evaluate(() => { window.PS_HOST_USER = { id: 'active' }; });
});

test('renders only owned Pokémon in tier order with Korean names and runtime images', async () => {
  await openPopup();
  await expect(popup.locator('#collection-count')).toHaveText('3마리');
  await expect(popup.locator('.pokemon-name a')).toHaveText(['무한다이노', '라이코', '피카츄']);
  await expect(popup.locator('.pokemon-rank')).toHaveText(['1위', '3위', '4위']);
  await expect(popup.locator('.tier')).toHaveText(['S', 'B', 'C']);
  await expect(popup.locator('.pokemon-name a').nth(1)).toHaveAttribute('href', 'https://pokesurvivor.net/pokedex/raikou/');
  await expect(popup.locator('.pokemon-image img').nth(1)).toHaveJSProperty('naturalWidth', 1);
  await expect(popup.locator('.pokemon-image img').nth(2)).toHaveAttribute('src', /\/25\.png$/);
  expect(imageRequests.some((url) => url.endsWith('/243.gif'))).toBe(true);
  expect(guideRequests).toBe(2);
  expect(await gameFrame.evaluate(() => JSON.parse(localStorage.getItem('ps.save.platform.active')))).toEqual({ owned: { 243: {}, 890: {}, 25: {} } });
  expect(await popup.evaluate(() => chrome.storage.local.get(null))).not.toHaveProperty('owned');
  await popup.setViewportSize({ width: 380, height: 600 });
  expect(await popup.evaluate(() => document.documentElement.scrollWidth)).toBe(380);
  expect(await popup.locator('body').evaluate((body) => body.scrollHeight)).toBeLessThanOrEqual(600);
  expect(errors).toEqual([]);
});

test('refresh reads account changes, uses cached ranks on reopen and labels stale fallback', async () => {
  await openPopup();
  await expect(popup.locator('#collection-count')).toHaveText('3마리');
  guideRequests = 0;
  await openPopup();
  await expect(popup.locator('#collection-count')).toHaveText('3마리');
  expect(guideRequests).toBe(0);
  await gameFrame.evaluate(() => { window.PS_HOST_USER = { id: 'another' }; });
  failGuide = true;
  await popup.locator('#refresh-collection').click();
  await expect(popup.locator('.pokemon-name a')).toHaveText(['뮤츠']);
  await expect(popup.locator('#collection-status')).toContainText('마지막으로 저장한 티어');
  await expect(popup.locator('#tier-updated')).toContainText('티어 확인:');
  await expect(popup.locator('#refresh-collection')).toBeEnabled();
});

test('shows actionable errors without cached ranks and handles empty or logged-out accounts', async () => {
  failGuide = true;
  await openPopup();
  await expect(popup.locator('#collection-status')).toContainText('티어를 불러오지 못했습니다');
  await expect(popup.locator('.pokemon-row')).toHaveCount(0);
  await gameFrame.evaluate(() => localStorage.setItem('ps.save.platform.active', '{"owned":{}}'));
  await popup.locator('#refresh-collection').click();
  await expect(popup.locator('#collection-count')).toHaveText('0마리');
  await expect(popup.locator('#collection-status')).toContainText('아직 보유한 포켓몬이 없습니다');
  await gameFrame.evaluate(() => { window.PS_HOST_USER = null; });
  await popup.locator('#refresh-collection').click();
  await expect(popup.locator('#collection-status')).toContainText('로그인하세요');
  await page.goto('about:blank');
  await openPopup();
  await expect(popup.locator('#collection-status')).toContainText('게임 탭에서');
});

test('keeps species absent from the ranking and handles missing images', async () => {
  await gameFrame.evaluate(() => localStorage.setItem('ps.save.platform.active', '{"owned":{"9999":true,"243":true}}'));
  await openPopup();
  await expect(popup.locator('#collection-count')).toHaveText('2마리');
  await expect(popup.locator('.pokemon-rank')).toHaveText(['3위', '순위 없음']);
  await expect(popup.locator('.pokemon-name strong')).toHaveText('도감 #9999');
  await expect(popup.locator('.pokemon-image span')).toHaveText('이미지 없음');
});

test('uses still images when reduced motion is requested', async () => {
  await popup.emulateMedia({ reducedMotion: 'reduce' });
  try {
    await openPopup();
    await expect(popup.locator('#collection-count')).toHaveText('3마리');
    await expect(popup.locator('.pokemon-image img').nth(1)).toHaveAttribute('src', /\/pokemon\/243\.png$/);
    expect(imageRequests.some((url) => url.endsWith('.gif'))).toBe(false);
  } finally {
    await popup.emulateMedia({ reducedMotion: 'no-preference' });
  }
});

test('refreshes expired cache and refuses corrupt cached data when the guide is unavailable', async () => {
  await openPopup();
  await expect(popup.locator('#collection-count')).toHaveText('3마리');
  await popup.evaluate(async () => {
    const { tierCache } = await chrome.storage.local.get('tierCache');
    tierCache.fetchedAt = Date.now() - 25 * 60 * 60 * 1000;
    await chrome.storage.local.set({ tierCache });
  });
  guideRequests = 0;
  await openPopup();
  await expect(popup.locator('#collection-count')).toHaveText('3마리');
  expect(guideRequests).toBe(2);
  await popup.evaluate(() => chrome.storage.local.set({ tierCache: { entries: [], fetchedAt: Date.now() } }));
  failGuide = true;
  await popup.locator('#refresh-collection').click();
  await expect(popup.locator('#collection-status')).toContainText('티어를 불러오지 못했습니다');
  await expect(popup.locator('.pokemon-row')).toHaveCount(0);
});

test('parses source tables without running remote scripts and rejects changed or unsafe markup', async () => {
  await openPopup();
  const result = await popup.evaluate(async ({ tierHtml, dexHtml }) => {
    const { parseRankings } = await import('./owned-pokemon.mjs');
    const rankings = parseRankings(tierHtml + '<script>window.remoteScriptRan = true;</script>', dexHtml);
    const invalid = [
      '', tierHtml.replace('tier-d', 'tier-other'),
      tierHtml.replace('>5</td>', '>4</td>'),
      tierHtml.replace('/pokedex/eternatus/', 'https://evil.example/pokedex/eternatus/'),
    ];
    return {
      rankings, remoteScriptRan: Boolean(window.remoteScriptRan),
      rejected: invalid.map((html) => { try { parseRankings(html, dexHtml); return false; } catch { return true; } }),
    };
  }, { tierHtml, dexHtml });
  expect(result.rankings).toHaveLength(5);
  expect(result.rankings[2]).toMatchObject({ dex: 243, name: 'Raikou', tier: 'B', rank: 3 });
  expect(result.remoteScriptRan).toBe(false);
  expect(result.rejected).toEqual([true, true, true, true]);
});
