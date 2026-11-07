import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';

test('skill hover shows Korean descriptions and stacks every linked move upward without blocking clicks', async ({}, testInfo) => {
  const extension = path.resolve('extension');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium', headless: true, viewport: { width: 1100, height: 800 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    await context.route('https://pokesurvivor.com/**', route => route.fulfill({ contentType: 'text/html', body: `
      <style>body{margin:0;background:#16292a}#game{width:100vw;height:100vh}</style>
      <div id="scr-settings" style="display:none"><p id="pokemon">Eternatus</p></div>
      <canvas id="game" width="1100" height="800"></canvas>
      <script>
        const icons=new Map(),canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
        for(const id of ['dragon-breath','sludge','nasty-plot','hyper-voice']) {
          const icon=document.createElement('canvas');icon.width=icon.height=16;
          icon.getContext('2d').fillRect(0,0,16,16);icons.set('move:'+id,icon);
        }
        for(const id of ['lifeorb','shellbell']) {
          const icon=document.createElement('canvas');icon.width=icon.height=16;
          icon.getContext('2d').fillRect(0,0,16,16);icons.set(id,icon);
        }
        window.item='lifeorb';
        window.clicks=0;canvas.onclick=()=>window.clicks++;
        window.groups=[['dragon-breath'],['sludge','nasty-plot']];
        window.paint=()=>{
          ctx.clearRect(0,0,1100,800);ctx.save();ctx.font='800 13px sans-serif';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('Eternatus',16,30);
          ctx.font='800 26px sans-serif';ctx.textAlign='center';ctx.fillText('1:10',550,42);
          groups.forEach((moves,i)=>{
            const x=400+63*i,y=700;ctx.strokeStyle='#123456';
            moves.forEach((id,j)=>{
              const ix=x+4+(j%2)*25,iy=y+4+Math.floor(j/2)*25;
              ctx.drawImage(icons.get('move:'+id),ix,iy,16,16);
              if(id==='sludge'){ctx.strokeStyle='#ffd23f';ctx.strokeRect(ix-.5,iy-.5,17,17);}
            });
            ctx.font='800 9px sans-serif';ctx.textAlign='left';ctx.fillText(String(i+1),x+3,y+10);
          });
          if(item){ctx.drawImage(icons.get(item),337,709,36,36);ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffd23f';ctx.fillText(item,355,694);}
          ctx.restore();
        };window.paint();setInterval(window.paint, 50);
      </script>` }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('https://pokesurvivor.com/');
    await expect(page.locator('#pokemon')).toHaveText('무한다이노');
    await page.evaluate(() => paint());
    await page.mouse.move(420, 725);
    const tooltip = page.locator('#psko-move-tooltips');
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator('article')).toHaveCount(1);
    await expect(tooltip).toContainText('용의숨결');
    await expect(tooltip).toContainText('느리');
    await page.mouse.move(490, 725);
    await expect(tooltip.locator('article')).toHaveCount(2);
    await expect(tooltip).toContainText('오물공격');
    await expect(tooltip).toContainText('나쁜음모');
    await expect(tooltip.locator('article b').nth(0)).toHaveText('오물공격 +');
    await expect(tooltip.locator('article b').nth(1)).toHaveText('나쁜음모');
    await expect(tooltip.locator('article').nth(0)).toContainText('피해 ×1.8');
    const boxes = await tooltip.locator('article').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().toJSON()));
    expect(boxes[0].y).toBeGreaterThan(boxes[1].y);
    await page.mouse.click(490, 725);
    expect(await page.evaluate(() => clicks)).toBe(1);
    await page.evaluate(() => { groups[1]=['sludge','nasty-plot','hyper-voice','dragon-breath'];paint(); });
    await expect(tooltip.locator('article')).toHaveCount(4);
    await page.locator('body').screenshot({ path: testInfo.outputPath('linked-move-tooltips.png') });
    await page.mouse.move(355,725);
    await expect(tooltip.locator('article')).toHaveCount(1);
    await expect(tooltip.locator('b')).toHaveText('생명의구슬');
    await expect(tooltip).toContainText('피해가 30% 증가하지만');
    await page.evaluate(() => { item='shellbell';paint(); });
    await expect(tooltip.locator('b')).toHaveText('조개껍질방울');
    await expect(tooltip).toContainText('가한 피해에 따라 체력을 회복합니다.');
    await page.evaluate(() => { item='';paint(); });
    await expect(tooltip).toBeHidden();
    await page.setViewportSize({ width: 375, height: 640 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.mouse.move(490/1100*375, 725/800*640);
    await page.evaluate(() => paint());
    await expect(tooltip.locator('article')).toHaveCount(4);
    await expect(tooltip).toBeVisible();
    const box = await tooltip.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(375);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y+box.height).toBeLessThanOrEqual(640);
    await page.mouse.move(20, 20);
    await expect(tooltip).toBeHidden();
    await page.mouse.move(420/1100*375, 725/800*640);
    await expect(tooltip).toBeVisible();
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('psko:settings', { detail: false })));
    await expect(tooltip.locator('b')).toHaveText('Dragon Breath');
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('psko:settings', { detail: true })));
    await expect(tooltip.locator('b')).toHaveText('용의숨결');
    await page.evaluate(() => { groups=[];paint(); });
    await expect(tooltip).toBeHidden();
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});
