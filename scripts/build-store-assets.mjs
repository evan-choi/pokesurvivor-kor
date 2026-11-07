import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const output = new URL('docs/store-assets/', root);
await mkdir(output, { recursive: true });
const font = (await readFile(new URL('extension/fonts/neodgm/neodgm.woff2', root))).toString('base64');
const source = (await readFile(new URL('game-icon-source.png', output))).toString('base64');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const png = await page.evaluate(async ({ font, source }) => {
    const face = new FontFace('Neo', `url(data:font/woff2;base64,${font})`);
    document.fonts.add(await face.load());
    const original = new Image();
    original.src = `data:image/png;base64,${source}`;
    await original.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // Keep the source mark legible and reserve a separate dark badge for the locale.
    ctx.drawImage(original, 16, 8, 96, 96);
    ctx.fillStyle = '#0a1430';
    ctx.fillRect(44, 84, 76, 36);
    ctx.fillStyle = '#ffda45';
    ctx.fillRect(44, 84, 76, 3);
    ctx.fillRect(44, 117, 76, 3);
    ctx.fillRect(44, 84, 3, 36);
    ctx.fillRect(117, 84, 3, 36);
    ctx.font = '32px Neo';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Kor', 82, 103);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { font, source });
  const target = new URL('store-icon-128.png', output);
  await writeFile(target, Buffer.from(png, 'base64'));
  console.log(fileURLToPath(target));
  for (const size of [16, 48, 128]) {
    const data = await page.evaluate(async ({ png, size }) => {
      const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, size, size);
      return canvas.toDataURL('image/png').split(',')[1];
    }, { png, size });
    await writeFile(new URL(`extension/icons/${size}.png`, root), Buffer.from(data, 'base64'));
  }
  const background = (await readFile(new URL('promo-background.png', output))).toString('base64');
  for (const [width, height, name] of [[440, 280, 'promo-small-440x280.png'], [1400, 560, 'promo-marquee-1400x560.png']]) {
    const data = await page.evaluate(async ({ width, height, background }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${background}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      const scale = Math.max(width / image.width, height / image.height);
      ctx.drawImage(image, width - image.width * scale, (height - image.height * scale) / 2, image.width * scale, image.height * scale);
      const small = width < 500;
      const x = small ? 24 : 90;
      ctx.fillStyle = '#f4f6ff';
      ctx.font = `${small ? 28 : 60}px Neo`;
      ctx.fillText('PokéSurvivor', x, small ? 115 : 235);
      ctx.fillStyle = '#ffda45';
      ctx.font = `${small ? 32 : 88}px Neo`;
      ctx.fillText('한국어 모드', x, small ? 163 : 345);
      return canvas.toDataURL('image/png').split(',')[1];
    }, { width, height, background });
    const bytes = Buffer.from(data, 'base64');
    assert.equal(bytes.readUInt32BE(16), width);
    assert.equal(bytes.readUInt32BE(20), height);
    await writeFile(new URL(name, output), bytes);
    console.log(name);
  }
  // Optional private source paths: menu screenshot, AI nickname edit, upgrades screenshot.
  if (process.argv.length > 2) {
    assert.equal(process.argv.length, 5, 'Pass the menu original, nickname edit, and upgrades original.');
    const inputs = await Promise.all(process.argv.slice(2).map(async (path) => (await readFile(path)).toString('base64')));
    const captures = await page.evaluate(async (inputs) => {
      const images = await Promise.all(inputs.map(async (data) => {
        const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode(); return image;
      }));
      const menu = document.createElement('canvas');
      menu.width = images[0].width; menu.height = images[0].height;
      const ctx = menu.getContext('2d', { alpha: false });
      ctx.drawImage(images[0], 0, 0);
      // Use only the edited nickname pill; all game UI stays from the actual screenshot.
      const [x, y, w, h] = [.668, .008, .07, .034];
      ctx.drawImage(images[1], x * images[1].width, y * images[1].height, w * images[1].width, h * images[1].height,
        x * menu.width, y * menu.height, w * menu.width, h * menu.height);
      return [menu, images[2]].map((image, i) => {
        const out = document.createElement('canvas'); out.width = 1280; out.height = 800;
        const draw = out.getContext('2d', { alpha: false });
        const crop = i === 0 ? [image.width - image.height * 1.6, 0, image.height * 1.6, image.height] : [480, 230, 1600, 1000];
        draw.drawImage(image, ...crop, 0, 0, 1280, 800);
        return out.toDataURL('image/png').split(',')[1];
      });
    }, inputs);
    for (const [i, capture] of captures.entries()) {
      const bytes = Buffer.from(capture, 'base64');
      assert.equal(bytes.readUInt32BE(16), 1280);
      assert.equal(bytes.readUInt32BE(20), 800);
      await writeFile(new URL(`screenshot-${i + 1}-1280x800.png`, output), bytes);
    }
  }
} finally {
  await browser.close();
}
