import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'extension/manifest.json'), 'utf8'));
const output = path.join(root, 'dist', `pokesurvivor-korean-${manifest.version}.zip`);
const temporary = path.join(await mkdtemp(path.join(tmpdir(), 'pokesurvivor-package-')), 'extension.zip');
await mkdir(path.dirname(output), { recursive: true });
// Package only installable files and instructions, never dev dependencies or test profiles.
execFileSync('zip', ['-q', '-r', temporary, 'extension', 'README.md'], { cwd: root, stdio: 'inherit' });
await rename(temporary, output);
console.log(output);
