import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';

test('installed extension enlarges only the player HUD and keeps party bars below buffs', async ({}, testInfo) => {
  const extension = path.resolve('extension');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium', headless: true, viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    await context.route('https://pokesurvivor.com/**', route => route.fulfill({ contentType: 'text/html', body: `
      <div id="scr-settings"><p id="pokemon">Eternatus</p></div>
      <canvas id="game" width="1280" height="700"></canvas>
      <script>window.rawText = CanvasRenderingContext2D.prototype.fillText;</script>` }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('https://pokesurvivor.com/');
    await expect(page.locator('#pokemon')).toHaveText('무한다이노');
    const result = await page.evaluate(() => {
      const ctx = document.querySelector('#game').getContext('2d');
      const states = [];
      const record = () => states.push([ctx.getTransform().a, ctx.getTransform().f]);
      ctx.fillStyle = '#16292a'; ctx.fillRect(0, 0, 1280, 700);
      for (let frame = 0; frame < 2; frame++) {
        ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.font = '800 13px sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText('Eternatus', 16, 30); record();
        ctx.font = '700 11px sans-serif'; ctx.fillText('Lv. 1', 16, 46);
        ctx.fillStyle = '#f56'; ctx.fillRect(64, 37, 168, 11);
        ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        ctx.fillText('100 / 133', 148, 46); record();
        ctx.textAlign = 'left'; ctx.font = '800 9px sans-serif'; ctx.fillText('AT.E ×3', 22, 65);
        ctx.textAlign = 'center'; ctx.font = '800 26px sans-serif'; ctx.fillText('1:10', 640, 42); record();
        ctx.textAlign = 'left'; ctx.font = '800 9px sans-serif'; ctx.measureText('FOCUS ORB 12s'); record();
        ctx.fillText('FOCUS ORB 12s', 100, 65); record();
        ctx.font = '800 10px sans-serif'; window.rawText.call(ctx, 'Teammate', 16, 85); record();
        ctx.fillStyle = '#5d8'; ctx.fillRect(94, 77, 110, 8);
        ctx.save(); ctx.beginPath(); ctx.rect(94, 77, 110, 8); ctx.clip(); ctx.fillRect(94, 77, 80, 8); ctx.restore(); record();
        ctx.restore(); record();
      }
      return states;
    });
    const expectedFrame = [[1.5, -10], [1.5, -10], [1, 0], [1.5, -10], [1, 0], [1, 28], [1, 0], [1, 0]];
    expect(result).toEqual([...expectedFrame, ...expectedFrame]);
    expect(errors).toEqual([]);
    await page.locator('#game').screenshot({ path: testInfo.outputPath('korean-hud.png') });
  } finally { await context.close(); }
});
