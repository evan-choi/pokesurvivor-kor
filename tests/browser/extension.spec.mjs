import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const extensionPath = path.resolve(process.env.PSKO_EXTENSION_PATH || 'extension');
const { moves: shopMoves } = JSON.parse(readFileSync(new URL('../fixtures/official-game-moves.json', import.meta.url), 'utf8'));
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
  await context.route('https://pokesurvivor.com/**', (route) => route.fulfill({
    contentType: 'text/html; charset=utf-8',
    body: `<html><body><h1>Host page</h1><iframe srcdoc="${game.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></iframe></body></html>`,
  }));
  page = await context.newPage();
  errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const management = await context.newPage();
  await management.goto('chrome://extensions');
  const item = management.locator('extensions-item').filter({ hasText: 'PokéSurvivor' });
  await expect(item).toHaveCount(1);
  const id = await item.getAttribute('id');
  popup = await context.newPage();
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await management.close();
});

test.afterAll(async () => { await context?.close(); });

test.beforeEach(async () => {
  await popup.locator('#enabled').check();
  await page.goto('https://pokesurvivor.com/');
  frame = page.frameLocator('iframe');
  await expect(frame.locator('#pokemon')).toHaveText('이상해씨');
  await frame.locator('body').evaluate(() => document.fonts.ready);
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

test('translates the official game directly on root and localized pages', async () => {
  for (const url of ['https://pokesurvivor.com/', 'https://pokesurvivor.com/en/', 'https://www.pokesurvivor.com/']) {
    await page.route(url, (route) => route.fulfill({ contentType: 'text/html', body: game }));
    try {
      await page.goto(url);
      await expect(page.locator('#pokemon')).toHaveText('이상해씨');
      await expect(page.locator('[data-psko-language]')).toHaveAttribute('aria-pressed', 'true');
      await popup.locator('#enabled').uncheck();
      await expect(page.locator('#pokemon')).toHaveText('Bulbasaur');
      await popup.locator('#enabled').check();
    } finally {
      await page.unroute(url);
    }
  }
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

test('starter info translates move and personality changes while preserving the type label', async () => {
  await frame.locator('body').evaluate((body) => {
    body.insertAdjacentHTML('beforeend', '<span id="starter-info"><span class="type">Fire</span> Ember · Loner, Proud</span>');
  });
  const info = frame.locator('#starter-info');
  await expect(info).toHaveText('불꽃 불꽃세례 · 독립적, 자부심');
  await info.evaluate((element) => {
    element.innerHTML = '<span class="type">Psychic</span> Psychic · Proud, Clever';
  });
  await expect(info).toHaveText('에스퍼 사이코키네시스 · 자부심, 영리함');
  await info.evaluate((element) => {
    element.innerHTML = '<span class="type">Psychic</span> Confusion · Chaotic, Shy';
  });
  await expect(info).toHaveText('에스퍼 염동력 · 예측 불가, 수줍음');
  await popup.locator('#enabled').uncheck();
  await expect(info).toHaveText('Psychic Confusion · Chaotic, Shy');
  expect(errors).toEqual([]);
});

test('shop translates every rotating TM while keeping type badges and prices intact', async () => {
  for (const language of [0, 1]) {
    await frame.locator('body').evaluate((body, { moves, language }) => {
      document.querySelector('#scr-shop')?.remove();
      const shop = document.createElement('section');
      shop.id = 'scr-shop';
      shop.innerHTML = '<h2>Today’s TMs</h2><div id="shop-body"></div>';
      for (const move of moves) {
        const card = document.createElement('div');
        card.className = 'upg-item';
        const title = document.createElement('b');
        title.textContent = `${language ? 'TM' : 'MT'} ${move.name[language]}`;
        const type = document.createElement('span');
        type.className = 'tag-chip';
        type.textContent = language ? 'Psychic' : 'Psíquico';
        title.append(type);
        const category = document.createElement('span');
        category.className = 'tag-chip cat';
        category.textContent = language ? 'Special' : 'Especial';
        const description = document.createElement('div');
        description.className = 'sub';
        description.textContent = move.desc[language];
        const price = document.createElement('button');
        price.textContent = '1,500';
        card.append(title, category, description, price);
        shop.querySelector('#shop-body').append(card);
      }
      body.append(shop);
    }, { moves: shopMoves, language });
    const titles = frame.locator('#shop-body .upg-item b');
    await expect.poll(() => titles.evaluateAll((nodes) => nodes.map((node) => node.firstChild.nodeValue)))
      .toEqual(shopMoves.map((move) => `기술머신 ${move.name[2]}`));
    await expect(frame.locator('#shop-body b .tag-chip')).toHaveText(shopMoves.map(() => '에스퍼'));
    await expect(frame.locator('#shop-body .cat')).toHaveText(shopMoves.map(() => '특수'));
    expect(await frame.locator('#shop-body .sub').allTextContents()).toEqual(expect.arrayContaining([expect.stringContaining('마비')]));
    expect((await frame.locator('#shop-body .sub').allTextContents()).some((text) => /[A-Za-z]/.test(text))).toBe(false);
    await expect(frame.locator('#shop-body button')).toHaveText(shopMoves.map(() => '1,500'));
  }
  await popup.locator('#enabled').uncheck();
  expect(await frame.locator('#shop-body .upg-item b').first().evaluate((node) => node.firstChild.nodeValue)).toBe('TM Tackle');
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

test('profile title selector keeps its action on a separate line with and without unlocked titles', async () => {
  await page.locator('iframe').evaluate((iframe) => {
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = '0';
    document.body.style.margin = '0';
  });
  await frame.locator('body').evaluate((body) => {
    body.insertAdjacentHTML('beforeend', `
      <style>
        #goals-body { width: calc(100% - 32px); max-width: 760px; margin: 16px; }
        #goals-body, #goals-body * { box-sizing: border-box; }
        #goals-body .field { width: 100%; padding: 10px 12px; border: 2px solid; font-size: 17px; }
        #goals-body .btn { padding: 10px 20px; border: 3px solid; font-size: 17px; }
      </style>
      <section id="scr-goals"><div id="goals-body"></div></section>
    `);
  });
  const select = frame.locator('#goals-body > select');
  const button = frame.locator('#goals-body > button');
  for (const hasTitle of [false, true]) {
    await frame.locator('#goals-body').evaluate((body, hasTitle) => {
      // The game omits this block-level hint once the player earns a title.
      const hint = hasTitle ? '' : '<p class="note">Consigue logros para desbloquear títulos.</p>';
      const titleOption = hasTitle ? '<option value="bright">Brillante</option>' : '';
      body.innerHTML = '<h3>Título</h3><select class="field" style="max-width:320px"><option value="">(Sin título)</option>' + titleOption + '</select>' + hint + '<button class="btn gold" style="margin-top:16px">Ver mi perfil público</button>';
    }, hasTitle);
    await expect(button).toHaveText('내 공개 프로필 보기');
    await select.selectOption(hasTitle ? 'bright' : '');
    for (const width of [1200, 640, 360]) {
      await page.setViewportSize({ width, height: 800 });
      const fieldRect = await select.boundingBox();
      const actionRect = await button.boundingBox();
      const bodyRect = await frame.locator('#goals-body').boundingBox();
      expect(actionRect.y - (fieldRect.y + fieldRect.height)).toBeGreaterThanOrEqual(12);
      expect(Math.abs(actionRect.x - fieldRect.x)).toBeLessThan(1);
      expect(actionRect.x + actionRect.width).toBeLessThanOrEqual(bodyRect.x + bodyRect.width + 1);
      expect(fieldRect.x + fieldRect.width).toBeLessThanOrEqual(bodyRect.x + bodyRect.width + 1);
    }
    await expect(select).toHaveValue(hasTitle ? 'bright' : '');
  }
  await popup.locator('#enabled').uncheck();
  await expect(select).toHaveCSS('display', 'inline-block');
  await expect(select).toHaveValue('bright');
  await page.setViewportSize({ width: 1280, height: 720 });
});

test('leaves host canvas unchanged and measures boss headings in the drawing font', async () => {
  const measure = (page) => page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '20px monospace';
    return ctx.measureText('Bulbasaur').width;
  });
  const hostWidth = await measure(page);
  const drawingFont = '20px "NeoDunggeunmo", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  const expectedBossWidth = await page.evaluate(async (font) => {
    await document.fonts.load(font, 'THE JUDGMENT');
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = font;
    return ctx.measureText('THE JUDGMENT').width;
  }, drawingFont);
  const bossWidth = await frame.locator('canvas').evaluate((canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.font = '20px monospace';
    return ctx.measureText('THE JUDGMENT').width;
  });
  expect(bossWidth).toBe(expectedBossWidth);
  await popup.locator('#enabled').uncheck();
  await expect(frame.locator('#pokemon')).toHaveText('Bulbasaur');
  expect(await measure(page)).toBe(hostWidth);
  expect(await frame.locator('canvas').evaluate((canvas, font) => {
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText('THE JUDGMENT').width;
  }, drawingFont)).toBe(expectedBossWidth);
  expect(errors).toEqual([]);
});

test('loads the supplied Korean font and centers menu icons across title and description', async () => {
  expect(await frame.locator('body').evaluate(async () => (await document.fonts.load('16px "NeoDunggeunmo"', '한글 ABC')).length)).toBe(1);
  await expect(frame.locator('body')).toHaveCSS('font-family', /^NeoDunggeunmo,/);
  const glyphHeight = await frame.locator('body').evaluate(() => {
    const context = document.createElement('canvas').getContext('2d');
    context.font = '16px "NeoDunggeunmo"';
    const metrics = context.measureText('한글 모부기 ABC');
    return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  });
  expect(glyphHeight).toBeCloseTo(13, 0);
  await frame.locator('body').evaluate((body) => {
    body.insertAdjacentHTML('beforeend', `<style>
      .menu-item { display: grid; grid-template-columns: 30px 1fr; gap: 4px 8px; padding: 12px; width: 220px; text-shadow: 2px 2px 0 #0a1430; }
      .menu-item small { grid-column: 2; }
      .mi-ico { display: flex; width: 24px; height: 24px; }
    </style><button class="menu-item"><span class="mi-ico">●</span><strong>플레이</strong><small>던전 입장</small></button>
    <button class="menu-item"><span class="mi-ico">●</span><strong>뽑기</strong><small>여러 줄로 길게 표시되는 포켓몬과 색이 다른 포켓몬 설명</small></button>`);
  });
  const offsets = await frame.locator('.menu-item').evaluateAll((buttons) => buttons.map((button) => {
    const box = button.getBoundingClientRect();
    const icon = button.querySelector('.mi-ico').getBoundingClientRect();
    return Math.abs(icon.y + icon.height / 2 - box.y - box.height / 2);
  }));
  expect(offsets).toHaveLength(2);
  expect(offsets.every((offset) => offset < 1)).toBe(true);
  await expect(frame.locator('.menu-item').first()).toHaveCSS('text-shadow', 'rgb(10, 20, 48) 2px 2px 0px');
  await expect(frame.locator('.menu-item small').first()).toHaveCSS('text-shadow', 'rgb(10, 20, 48) 2px 2px 0px');
});

test('centers Korean glyphs and counters across common control sizes', async () => {
  const offsets = await frame.locator('body').evaluate(() => {
    const context = document.createElement('canvas').getContext('2d');
    return [13, 14, 16, 22].flatMap((size) => ['600', '0', '풀', '전체', '최근 포획순'].map((text) => {
      context.font = `700 ${size}px "NeoDunggeunmo"`;
      const m = context.measureText(text);
      return {
        size, text,
        offset: (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent - m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2,
      };
    }));
  });
  for (const sample of offsets) {
    expect(Math.abs(sample.offset), `${sample.size}px ${sample.text}`).toBeLessThan(0.9);
  }
});

test('centers direct and wrapped dex filter icons at the same height', async () => {
  await frame.locator('body').evaluate((body) => {
    const icon = `<img class="pix" width="12" height="12" alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Ccircle cx='6' cy='6' r='6'/%3E%3C/svg%3E">`;
    body.insertAdjacentHTML('beforeend', `<style>
      .chip { border: 2px solid; padding: 4px 10px; }
      img.pix { vertical-align: middle; }
    </style><section id="scr-dex"><div id="dex-filters">
      <button class="chip">${icon} 색이 다른</button>
      <button class="chip">${icon} 즐겨찾기</button>
      <button class="chip"><span class="rarity-ball">${icon}</span> 전설</button>
      <button class="chip"><span class="rarity-ball">${icon}</span> 일반</button>
    </div></section>`);
  });
  const offsets = await frame.locator('#dex-filters .chip').evaluateAll((buttons) => buttons.map((button) => {
    const box = button.getBoundingClientRect();
    const icon = button.querySelector('img').getBoundingClientRect();
    return Math.abs(icon.top + icon.height / 2 - box.top - box.height / 2);
  }));
  expect(offsets).toHaveLength(4);
  expect(offsets.every((offset) => offset < 0.5)).toBe(true);
});

test('translates dex controls and protected nature and ability names without changing player names', async () => {
  await frame.locator('#dex-detail').evaluate((detail) => {
    detail.innerHTML = `<input placeholder="Search by name or number"><select><option value="grass">All types</option></select>
      <button>Rarity</button><button>Recently caught</button><button>Most played</button><button>Favorites</button>
      <button>Mark as favorite</button><span>Sort:</span><span>Sp. Atk</span><span>Defense</span><span>Sp. Def</span>
      <p>Hits harder with <b>physical moves</b></p>
      <div class="mon-extra">
        <div class="mx-row"><span>Nature</span><b translate="no">Rash</b><small>+Sp. Atk −Sp. Def</small></div>
        <div class="mx-row"><span>Ability</span><b translate="no">Overgrow</b></div>
        <p>+35% Grass-type damage at low HP (under 1/3).</p>
        <div class="mx-row"><span>TM</span><small>It has not learned any yet</small></div>
      </div><p>Single type: +20% damage with its Grass-type moves</p>
      <div class="player-name" translate="no">Rash</div>`;
  });
  const detail = frame.locator('#dex-detail');
  await expect(detail.locator('button')).toHaveText(['희귀도', '최근 포획순', '많이 사용한 순', '즐겨찾기', '즐겨찾기 추가']);
  await expect(detail.locator('input')).toHaveAttribute('placeholder', '이름 또는 도감 번호로 검색');
  await expect(detail.locator('option')).toHaveAttribute('value', 'grass');
  await expect(detail.locator('.mx-row > b')).toHaveText(['덜렁', '심록']);
  await expect(detail.locator('.mx-row > small').first()).toHaveText('+특수공격 −특수방어');
  await expect(detail.locator('.player-name')).toHaveText('Rash');
  await detail.locator('button').last().evaluate((button) => { button.textContent = '★ Favorite'; });
  await expect(detail.locator('button').last()).toHaveText('★ 즐겨찾기');
  await detail.locator('button').last().evaluate((button) => { button.textContent = 'Mark as favorite'; });
  await expect(detail.locator('button').last()).toHaveText('즐겨찾기 추가');
  expect(await detail.evaluate((element) => {
    const copy = element.cloneNode(true);
    copy.querySelector('.player-name').remove();
    return copy.textContent;
  })).not.toMatch(/[a-z]/i);
  await detail.locator('.mx-row > b').first().evaluate((node) => { node.textContent = 'Calm'; });
  await expect(detail.locator('.mx-row > b').first()).toHaveText('차분');
  await popup.locator('#enabled').uncheck();
  await expect(detail.locator('.mx-row > b')).toHaveText(['Calm', 'Overgrow']);
  await expect(detail.locator('button').first()).toHaveText('Rarity');
});

test('leaves authentication pages untouched and preserves native registration forms', async () => {
  const auth = await context.newPage();
  await auth.route('**/*', (route) => route.fulfill({ contentType: 'text/html', body: `
    <!doctype html><html lang="en"><body>
      <form><label>Name<input name="name" required></label>
        <label>Email<input name="email" type="email" required></label>
        <label>Password<input name="password" type="password" minlength="8" required></label>
        <button type="submit">Create account</button>
      </form><p id="result"></p>
      <script>document.querySelector('form').onsubmit = (event) => {
        event.preventDefault();
        document.querySelector('#result').textContent = 'Submitted';
      };</script>
    </body></html>` }));
  try {
    for (const url of [
      'https://pokesurvivor.com/game-auth?mode=login&embed=1',
      'https://pokesurvivor.com/ko/game-auth?mode=login',
      'https://www.pokesurvivor.com/game-auth?mode=google',
    ]) {
      await auth.goto(url);
      expect(await auth.evaluate(() => typeof globalThis.PSKO)).toBe('undefined');
      expect(await auth.evaluate(() => /\[native code\]/.test(window.alert.toString()))).toBe(true);
      await auth.locator('[name="name"]').fill('LocalTest');
      await auth.locator('[name="email"]').fill('local-test@example.com');
      await auth.locator('[name="password"]').fill('LocalTestOnly9!');
      await auth.getByRole('button', { name: 'Create account' }).click();
      await expect(auth.locator('#result')).toHaveText('Submitted');
    }
  } finally {
    await auth.close();
  }
});
