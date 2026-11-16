import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { extractSnapshot } from '../scripts/upstream-extract.mjs';

const baseline = fileURLToPath(new URL('../upstream/current/source/', import.meta.url));

test('the saved game extracts deterministically without starting a run', async () => {
  const first = await extractSnapshot(baseline);
  const second = await extractSnapshot(baseline);
  assert.deepEqual(first, second);
  for (const section of ['locale', 'news', 'catalogs', 'modules', 'strings']) {
    const saved = JSON.parse(await readFile(path.join(baseline, '../extracted', `${section}.json`), 'utf8'));
    assert.deepEqual(first[section], saved, section);
  }
});

test('an unsupported game decoder fails instead of returning an empty snapshot', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pokesurvivor-extractor-test-'));
  try {
    await writeFile(path.join(directory, 'app.min.js'), 'console.log("changed format");');
    await assert.rejects(extractSnapshot(directory), /Game decoder structure changed/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
