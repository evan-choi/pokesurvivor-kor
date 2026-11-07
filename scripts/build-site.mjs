import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist/site');
const { version } = JSON.parse(await readFile(path.join(root, 'extension/manifest.json'), 'utf8'));
const baseUrl = 'https://evan-choi.github.io/pokesurvivor-kor/';
// Set this only after the public listing is available, independently of CI credentials.
const storeUrl = process.env.CWS_STORE_URL || '';
if (storeUrl && !/^https:\/\/chromewebstore\.google\.com\/detail\/(?:[a-zA-Z0-9_-]+\/)?[a-p]{32}$/.test(storeUrl)) {
  throw new Error('CWS_STORE_URL must be a public Chrome Web Store item URL without query parameters.');
}

for (const directory of ['assets', 'downloads', 'en']) {
  await mkdir(path.join(output, directory), { recursive: true });
}
for (const file of ['index.html', 'en/index.html', 'privacy.html', 'styles.css']) {
  const source = await readFile(path.join(root, 'site', file), 'utf8');
  const english = file.startsWith('en/');
  const download = `${english ? '../' : ''}downloads/pokesurvivor-korean.zip`;
  const rendered = source.replaceAll('{{VERSION}}', version)
    .replaceAll('{{INSTALL_URL}}', storeUrl || download)
    .replaceAll('{{INSTALL_ATTR}}', storeUrl ? '' : 'download')
    .replaceAll('{{INSTALL_LABEL}}', storeUrl ? (english ? 'Add to Chrome' : 'Chrome에 추가') : (english ? 'Download ZIP' : 'ZIP 다운로드'))
    .replaceAll('{{STORE_STATUS}}', storeUrl
      ? (english ? 'Chrome Web Store installation · Automatic updates' : 'Chrome 웹 스토어 설치 · 자동 업데이트')
      : (english ? 'Chrome Web Store release in preparation. ZIP installation is available now.' : 'Chrome 웹 스토어 등록 준비 중입니다. 지금은 ZIP으로 설치할 수 있습니다.'))
    .replaceAll('{{STORE_INSTALL}}', storeUrl
      ? (english ? `<p class="store-install">Open <a href="${storeUrl}">Chrome Web Store</a>, choose <strong>Add to Chrome</strong>, then reload the game. Chrome delivers approved updates automatically.</p>` : `<p class="store-install"><a href="${storeUrl}">Chrome 웹 스토어</a>에서 <strong>Chrome에 추가</strong>를 누른 뒤 게임을 새로고침하세요. 승인된 업데이트는 Chrome이 자동으로 설치합니다.</p>`)
      : '');
  if (/\{\{[^}]+\}\}/.test(rendered)) throw new Error(`Unresolved website placeholder in ${file}`);
  await writeFile(path.join(output, file), rendered);
}
await copyFile(path.join(root, 'docs/assets/settings-korean.png'), path.join(output, 'assets/settings-korean.png'));
await copyFile(path.join(root, 'extension/icons/128.png'), path.join(output, 'assets/icon.png'));
const packageName = `pokesurvivor-korean-${version}.zip`;
await copyFile(path.join(root, 'dist', packageName), path.join(output, 'downloads', packageName));
await copyFile(path.join(root, 'dist', packageName), path.join(output, 'downloads/pokesurvivor-korean.zip'));
await copyFile(path.join(root, 'dist', `pokesurvivor-store-${version}.zip`), path.join(output, 'downloads/pokesurvivor-store.zip'));
await copyFile(path.join(root, 'dist/pokesurvivor-lan-helper.zip'), path.join(output, 'downloads/pokesurvivor-lan-helper.zip'));
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}</loc></url>
  <url><loc>${baseUrl}en/</loc></url>
</urlset>
`);
console.log(output);
