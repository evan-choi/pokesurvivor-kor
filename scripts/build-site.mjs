import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist/site');
const { version } = JSON.parse(await readFile(path.join(root, 'extension/manifest.json'), 'utf8'));
const baseUrl = 'https://evan-choi.github.io/pokesurvivor-kor/';

for (const directory of ['assets', 'downloads', 'en']) {
  await mkdir(path.join(output, directory), { recursive: true });
}
for (const file of ['index.html', 'en/index.html', 'styles.css']) {
  const source = await readFile(path.join(root, 'site', file), 'utf8');
  const rendered = source.replaceAll('{{VERSION}}', version);
  if (/\{\{[^}]+\}\}/.test(rendered)) throw new Error(`Unresolved website placeholder in ${file}`);
  await writeFile(path.join(output, file), rendered);
}
await copyFile(path.join(root, 'docs/assets/settings-korean.png'), path.join(output, 'assets/settings-korean.png'));
await copyFile(path.join(root, 'extension/icons/128.png'), path.join(output, 'assets/icon.png'));
const packageName = `pokesurvivor-korean-${version}.zip`;
await copyFile(path.join(root, 'dist', packageName), path.join(output, 'downloads', packageName));
await copyFile(path.join(root, 'dist', packageName), path.join(output, 'downloads/pokesurvivor-korean.zip'));
await copyFile(path.join(root, 'dist/pokesurvivor-lan-helper.zip'), path.join(output, 'downloads/pokesurvivor-lan-helper.zip'));
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}</loc></url>
  <url><loc>${baseUrl}en/</loc></url>
</urlset>
`);
console.log(output);
