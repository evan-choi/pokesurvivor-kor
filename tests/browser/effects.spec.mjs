import { test, expect } from '@playwright/test';
import path from 'node:path';

async function fixture(page, supported = true) {
  await page.addInitScript({ path: path.resolve('extension/temp-melee-target.js') });
  await page.addInitScript({ path: path.resolve('extension/effects.js') });
  await page.route('https://pokesurvivor.com/', route => route.fulfill({ contentType: 'text/html', body: `
    <meta charset="utf-8"><style>.chips{display:flex;flex-wrap:wrap;gap:4px}button{padding:8px}</style>
    <script>window.PS_LOCALES={lang:'ko'};</script>
    <div id="set-tabs"><button data-t="gfx" class="on">그래픽</button><button data-t="sound">소리</button><button data-t="ctl">조작</button></div>
    <div id="set-body"><h3>화면</h3></div>
    <script src="/js/app.min.js"></script>
    <script>document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('[data-t]').forEach(c=>c.classList.toggle('on',b===c));
      document.querySelector('#set-body').innerHTML='<h3>'+b.textContent+'</h3>';
    });</script>` }));
  await page.route('**/js/app.min.js', route => route.fulfill({ contentType: 'text/javascript', body: supported ? `
    var game=Object.create(null);
    game.FX={sp(){},draw(){}};
    game.Main={startRun(){},player:{}};
    game.Coop={players(){return []},puppets(){}};
    game.Shots={spawnOrb(){},clearOrbs(){},draw(){}};
    game.Combat={tick(){},resolve(){},ghostCast(){},drawGroundFields(){},drawAirFields(){}};
    game.Enemies={queryCircle(){return []},rebuildGrid(){}};
  ` : 'var game=Object.create(null);' }));
  await page.goto('https://pokesurvivor.com/');
  await page.addStyleTag({ path: path.resolve('extension/korean.css') });
}

test('effect settings persist independently and survive native settings re-rendering', async ({ page }) => {
  await fixture(page);
  const own = page.getByRole('combobox', { name: '내 이펙트', exact: true });
  const party = page.getByRole('combobox', { name: '파티원 이펙트', exact: true });
  await expect(own).toHaveValue('1');
  await expect(page.locator('[data-psko-effects] .set-row').first().locator('small')).toHaveText('내 기술 이펙트의 투명도를 조절합니다.');
  await own.selectOption('0');
  await party.selectOption('0.5');
  await expect(party).toHaveValue('0.5');
  await page.getByRole('button', { name: '소리', exact: true }).click();
  await expect(own).toHaveCount(0);
  await page.getByRole('button', { name: '그래픽', exact: true }).click();
  await expect(own).toHaveCount(1);
  await expect(own).toHaveValue('0');
  await page.reload();
  await expect(own).toHaveValue('0');
  await expect(party).toHaveValue('0.5');
});

test('an incompatible game keeps the controls disabled and original creation API restored', async ({ page }) => {
  await fixture(page, false);
  await expect(page.locator('[data-psko-effects] select:disabled')).toHaveCount(2);
  expect(await page.evaluate(() => String(Object.create).includes('[native code]'))).toBe(true);
});

test('expanded effect choices have an opaque background and readable text', async ({ page }) => {
  await fixture(page);
  // The game's button style supplies white text; Windows supplies a white popup
  // when option backgrounds are transparent.
  await page.addStyleTag({ content: '.btn { color: white; background: #243e7c; }' });
  const select = page.getByRole('combobox', { name: '내 이펙트', exact: true });
  await expect(select.locator('option')).toHaveText(['기본', '약간 투명', '매우 투명', '숨김']);
  for (const option of await select.locator('option').all()) {
    await expect(option).toHaveCSS('background-color', 'rgb(36, 62, 124)');
    await expect(option).toHaveCSS('color', 'rgb(255, 255, 255)');
  }
  await select.selectOption({ label: '매우 투명' });
  await expect(select).toHaveValue('0.2');
});

test('temporary targeting fix can be disabled and the choice survives reload', async ({ page }) => {
  await fixture(page);
  await page.getByRole('button', { name: '조작', exact: true }).click();
  const toggle = page.getByRole('button', { name: '근접 자동 조준 보정 (임시)', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('psko.temp-melee-target'))).toBe('false');
  await page.reload();
  await page.getByRole('button', { name: '조작', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});
