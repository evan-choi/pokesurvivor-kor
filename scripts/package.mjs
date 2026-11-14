import { execFileSync } from 'node:child_process';
import { cp, copyFile, mkdtemp, mkdir, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'extension/manifest.json'), 'utf8'));
const output = path.join(root, 'dist', `pokesurvivor-korean-${manifest.version}.zip`);
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'pokesurvivor-package-'));
const staging = path.join(temporaryDirectory, 'contents');
await mkdir(path.dirname(output), { recursive: true });
await cp(path.join(root, 'extension'), staging, { recursive: true });
const storeStaging = path.join(temporaryDirectory, 'store');
await cp(staging, storeStaging, { recursive: true });
for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  await copyFile(path.join(root, file), path.join(storeStaging, file));
}
await cp(path.join(root, 'tools/windows-lan'), path.join(staging, 'windows-lan'), { recursive: true });
await copyFile(path.join(root, 'LICENSE'), path.join(staging, 'windows-lan/LICENSE'));
await copyFile(path.join(root, 'docs/install.md'), path.join(staging, 'README.md'));
for (const file of ['same-router-connection.md', 'radmin-vpn-connection.md']) {
  await copyFile(path.join(root, 'docs', file), path.join(staging, file));
}
for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  await copyFile(path.join(root, file), path.join(staging, file));
}
// Package only installable files and instructions, never dev dependencies or test profiles.
// Chrome must find manifest.json directly in the folder created by extracting this ZIP.
async function archive(directory, destination) {
  const temporary = path.join(temporaryDirectory, path.basename(destination));
  const files = (await readdir(directory)).sort();
  const options = { cwd: directory, stdio: 'inherit' };
  if (process.platform === 'win32') {
    execFileSync('tar.exe', ['-a', '-c', '-f', temporary, ...files], options);
  } else {
    execFileSync('zip', ['-q', '-r', temporary, ...files], options);
  }
  // The system temp directory and CI workspace may be on different filesystems.
  await copyFile(temporary, destination);
  console.log(destination);
}
await archive(staging, output);
await archive(storeStaging, path.join(root, 'dist', `pokesurvivor-store-${manifest.version}.zip`));
await archive(path.join(staging, 'windows-lan'), path.join(root, 'dist/pokesurvivor-lan-helper.zip'));
