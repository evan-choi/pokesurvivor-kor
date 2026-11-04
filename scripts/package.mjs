import { execFileSync } from 'node:child_process';
import { cp, copyFile, mkdtemp, mkdir, readFile, readdir, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'extension/manifest.json'), 'utf8'));
const output = path.join(root, 'dist', `pokesurvivor-korean-${manifest.version}.zip`);
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'pokesurvivor-package-'));
const staging = path.join(temporaryDirectory, 'contents');
const temporary = path.join(temporaryDirectory, 'extension.zip');
await mkdir(path.dirname(output), { recursive: true });
await cp(path.join(root, 'extension'), staging, { recursive: true });
await copyFile(path.join(root, 'README.md'), path.join(staging, 'README.md'));
// Package only installable files and instructions, never dev dependencies or test profiles.
// Chrome must find manifest.json directly in the folder created by extracting this ZIP.
execFileSync('zip', ['-q', '-r', temporary, ...(await readdir(staging)).sort()], { cwd: staging, stdio: 'inherit' });
await rename(temporary, output);
console.log(output);
