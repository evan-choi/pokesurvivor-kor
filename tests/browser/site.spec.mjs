import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const site = path.join(root, 'dist/site');
const publicUrl = 'https://evan-choi.github.io/pokesurvivor-kor/';
const { version } = JSON.parse(await readFile(path.join(root, 'extension/manifest.json'), 'utf8'));
let server;
let origin;

test.beforeAll(async () => {
  for (const script of ['scripts/package.mjs', 'scripts/build-site.mjs']) {
    execFileSync(process.execPath, [script], { cwd: root });
  }
  const types = { '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.xml': 'application/xml', '.zip': 'application/zip' };
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.resolve(site, `.${pathname}${pathname.endsWith('/') ? 'index.html' : ''}`);
    if (!file.startsWith(`${site}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

for (const [language, pathname] of [['ko', '/'], ['en', '/en/']]) {
  test(`${language} website has working navigation, metadata, and an installable download`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`${origin}${pathname}`);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${publicUrl}${pathname.slice(1)}`);
    await expect(page.locator('link[hreflang="ko"]')).toHaveAttribute('href', publicUrl);
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', `${publicUrl}en/`);
    const metadata = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    expect(metadata.softwareVersion).toBe(version);
    expect(metadata.downloadUrl).toBe(`${publicUrl}downloads/pokesurvivor-korean-${version}.zip`);
    expect(await page.locator('body').innerText()).not.toContain('{{');
    await expect(page.locator('a[href="https://pokesurvivor.com/"]')).toHaveCount(2);

    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('.button.primary')).toBeVisible();
    }
    for (const href of await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))) {
      if (href.startsWith('#')) {
        expect(await page.locator(href).count()).toBe(1);
      } else if (!href.startsWith('https:')) {
        expect((await page.request.get(new URL(href, page.url()).href)).ok()).toBe(true);
      }
    }
    await page.locator('details summary').first().click();
    await expect(page.locator('details').first()).toHaveAttribute('open', '');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('a[download]').first().click(),
    ]);
    const manifest = JSON.parse(execFileSync('unzip', ['-p', await download.path(), 'manifest.json'], { encoding: 'utf8' }));
    expect(manifest.version).toBe(version);
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.host_permissions).toContain('https://pokesurvivor.com/*');
    expect(manifest.host_permissions.some((host) => host.includes('pokesurvivor.pro'))).toBe(false);
    const stableDownload = await page.request.get(`${origin}/downloads/pokesurvivor-korean.zip`);
    expect(stableDownload.ok()).toBe(true);
    expect(await stableDownload.body()).toEqual(await readFile(await download.path()));
    const storeZip = path.join(site, 'downloads/pokesurvivor-store.zip');
    const storeFiles = execFileSync('unzip', ['-Z1', storeZip], { encoding: 'utf8' }).trim().split(/\r?\n/);
    expect(storeFiles).toContain('manifest.json');
    expect(storeFiles).toContain('LICENSE');
    expect(storeFiles.some((file) => /windows-lan|\.cmd$|\.ps1$/.test(file))).toBe(false);
    expect(JSON.parse(execFileSync('unzip', ['-p', storeZip, 'manifest.json'], { encoding: 'utf8' }))).toEqual(manifest);
    const helper = await page.request.get(`${origin}/downloads/pokesurvivor-lan-helper.zip`);
    expect(helper.ok()).toBe(true);
    const helperPath = path.join(site, 'downloads/pokesurvivor-lan-helper.zip');
    expect(await helper.body()).toEqual(await readFile(helperPath));
    const helperFiles = execFileSync('unzip', ['-Z1', helperPath], { encoding: 'utf8' }).trim().split(/\r?\n/).sort();
    expect(helperFiles).toEqual(['LICENSE', 'README.md', 'lan-firewall.ps1', 'run-as-administrator.cmd']);
    const helperScript = execFileSync('unzip', ['-p', helperPath, 'lan-firewall.ps1']);
    expect(helperScript.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(execFileSync('unzip', ['-p', await download.path(), 'windows-lan/lan-firewall.ps1'])).toEqual(helperScript);
    expect(errors).toEqual([]);
  });
}

test('published store link replaces ZIP CTA in both languages without changing README', async ({ page }) => {
  const storeUrl = 'https://chromewebstore.google.com/detail/onfhhekmpdnbgpklcghiejdmgnbmjhci';
  try {
    execFileSync(process.execPath, ['scripts/build-site.mjs'], { cwd: root, env: { ...process.env, CWS_STORE_URL: storeUrl } });
    for (const pathname of ['/', '/en/']) {
      await page.goto(`${origin}${pathname}`);
      await expect(page.locator('.button.primary')).toHaveAttribute('href', storeUrl);
      expect(await page.locator('.button.primary').getAttribute('download')).toBeNull();
      await expect(page.locator('.store-install')).toBeVisible();
      expect(await page.locator('body').innerText()).not.toContain('{{');
      expect(await page.locator('.release').innerText()).not.toMatch(/준비 중|preparation/);
      await page.locator('.manual-install summary').click();
      await expect(page.locator('.manual-install a[download]')).toBeVisible();
    }
    expect(() => execFileSync(process.execPath, ['scripts/build-site.mjs'], { cwd: root, env: { ...process.env, CWS_STORE_URL: 'https://example.com/evil' }, stdio: 'pipe' })).toThrow();
  } finally {
    execFileSync(process.execPath, ['scripts/build-site.mjs'], { cwd: root, env: { ...process.env, CWS_STORE_URL: '' } });
  }
});
