import { copyFile, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
await mkdir(new URL('extension/vendor/', root), { recursive: true });
for (const [source, destination] of [
  ['es-hangul/dist/index.mjs', 'es-hangul.mjs'],
  ['es-hangul/LICENSE', 'es-hangul.LICENSE'],
  ['fuse.js/dist/fuse.basic.mjs', 'fuse.mjs'],
  ['fuse.js/LICENSE', 'fuse.LICENSE'],
]) {
  await copyFile(new URL(`node_modules/${source}`, root), new URL(`extension/vendor/${destination}`, root));
}
