import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { acceptUpstream, checkUpstream, checkUpstreamSource, compareSnapshots } from '../scripts/upstream-snapshot.mjs';

const html = '<script src="js/app.min.js?v=test1"></script><script src="js/core/locales.js?v=lang1"></script><link href="css/style.css?v=style1">';
const extract = async directory => ({
  locale: { Menu: 'Menu' }, news: [], catalogs: {}, modules: {},
  strings: [(await readFile(path.join(directory, 'app.min.js'), 'utf8'))],
});

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'upstream-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const from = path.join(root, 'input');
  await mkdir(from);
  for (const [name, content] of Object.entries({ 'index.html': html, 'app.min.js': 'first', 'locales.js': '{}', 'style.css': 'body{}' })) {
    await writeFile(path.join(from, name), content);
  }
  return { root, from, extract };
}

test('snapshot comparison ignores object key order and retains added, removed and changed values', () => {
  assert.deepEqual(compareSnapshots({ a: 1, b: { x: 2 } }, { b: { x: 2 }, a: 1 }), []);
  assert.deepEqual(compareSnapshots({ a: 1, b: 2, 'x/y': 3 }, { a: 4, c: 5 }), [
    { path: '/a', before: 1, after: 4 }, { path: '/b', before: 2 },
    { path: '/c', after: 5 }, { path: '/x~1y', before: 3 },
  ]);
});

test('check retains the baseline and accept promotes a reproducible snapshot', async t => {
  const options = await fixture(t);
  await checkUpstream(options);
  assert.equal(await acceptUpstream(options), 'test1');
  const baselinePath = path.join(options.root, 'upstream/current/manifest.json');
  const baseline = await readFile(baselinePath, 'utf8');
  const unchanged = await checkUpstream(options);
  assert.deepEqual(unchanged.sourceChanges, []);
  assert.deepEqual(unchanged.changes, []);
  await writeFile(path.join(options.from, 'app.min.js'), 'second');
  const report = await checkUpstream(options);
  assert.deepEqual(report.sourceChanges, ['source/app.min.js']);
  assert.deepEqual(report.changes, [{ path: '/strings/0', before: 'first', after: 'second' }]);
  assert.equal(await readFile(baselinePath, 'utf8'), baseline);
  await acceptUpstream(options);
  assert.equal(await readFile(path.join(options.root, 'upstream/current/source/app.min.js'), 'utf8'), 'second');
});

test('failed downloads or extraction preserve the current snapshot and the last candidate', async t => {
  const options = await fixture(t);
  await checkUpstream(options);
  await acceptUpstream(options);
  const candidate = path.join(options.root, '_workspace/upstream-candidate/manifest.json');
  const previous = await readFile(candidate, 'utf8');
  await assert.rejects(checkUpstream({ ...options, extract: async () => { throw new Error('changed structure'); } }), /changed structure/);
  await assert.rejects(checkUpstream({ root: options.root, extract, request: async () => new Response('', { status: 503 }) }), /HTTP 503/);
  assert.equal(await readFile(candidate, 'utf8'), previous);
  assert.equal(await readFile(path.join(options.root, 'upstream/current/source/app.min.js'), 'utf8'), 'first');
});

test('source monitoring catches same-version edits without replacing the update candidate', async t => {
  const options = await fixture(t);
  await checkUpstream(options);
  await acceptUpstream(options);
  const candidate = path.join(options.root, '_workspace/upstream-candidate/manifest.json');
  const previous = await readFile(candidate, 'utf8');
  const unchanged = await checkUpstreamSource(options);
  assert.deepEqual(unchanged.sourceChanges, []);
  await writeFile(path.join(options.from, 'app.min.js'), 'second');
  const changed = await checkUpstreamSource(options);
  assert.equal(changed.before, changed.after);
  assert.deepEqual(changed.sourceChanges, ['source/app.min.js']);
  assert.notEqual(changed.fingerprint, unchanged.fingerprint);
  assert.deepEqual(await checkUpstreamSource(options), changed);
  assert.equal(await readFile(candidate, 'utf8'), previous);
  await assert.rejects(checkUpstreamSource({ root: options.root, request: async () => new Response('', { status: 503 }) }), /HTTP 503/);
});

test('accept rejects tampered files, stale comparisons and non-reproducible extraction', async t => {
  const options = await fixture(t);
  await checkUpstream(options);
  const candidate = path.join(options.root, '_workspace/upstream-candidate');
  await writeFile(path.join(candidate, 'source/app.min.js'), 'tampered');
  await assert.rejects(acceptUpstream(options), /손상/);
  await checkUpstream(options);
  await assert.rejects(acceptUpstream({ ...options, extract: async dir => ({ ...await extract(dir), news: ['different'] }) }), /재현/);
  await acceptUpstream(options);
  await assert.rejects(acceptUpstream(options), /비교 이후/);
});

test('simultaneous commands cannot overwrite an in-progress snapshot', async t => {
  const options = await fixture(t);
  const lock = path.join(options.root, '_workspace/upstream-snapshot.lock');
  await mkdir(lock, { recursive: true });
  await assert.rejects(checkUpstream(options), /실행 중/);
});

test('an extractor change re-extracts the saved source before comparing and accepting', async t => {
  const options = await fixture(t);
  await checkUpstream(options);
  await acceptUpstream(options);
  const manifestPath = path.join(options.root, 'upstream/current/manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.extractorVersion += 1;
  await writeFile(manifestPath, JSON.stringify(manifest));
  const report = await checkUpstream(options);
  assert.equal(report.baselineReextracted, true);
  assert.deepEqual(report.changes, []);
  await acceptUpstream(options);
});
