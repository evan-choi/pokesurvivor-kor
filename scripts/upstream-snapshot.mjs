import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { EXTRACTOR_VERSION, extractSnapshot } from './upstream-extract.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceUrl = 'https://pokesurvivor.com/';
const assets = {
  'app.min.js': '/js/app.min.js',
  'locales.js': '/js/core/locales.js',
  'style.css': '/css/style.css',
};
const sections = ['locale', 'news', 'catalogs', 'modules', 'strings'];
const snapshotFiles = ['source/index.html', ...Object.keys(assets).map(name => `source/${name}`),
  ...sections.map(name => `extracted/${name}.json`)];
const hash = value => createHash('sha256').update(value).digest('hex');

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]));
  }
  return value;
}

const json = value => `${JSON.stringify(sorted(value), null, 2)}\n`;

export function compareSnapshots(before, after) {
  const changes = [];
  function compare(left, right, location) {
    if (JSON.stringify(left) === JSON.stringify(right)) return;
    if (left && right && typeof left === 'object' && typeof right === 'object' &&
        Array.isArray(left) === Array.isArray(right)) {
      for (const key of [...new Set([...Object.keys(left), ...Object.keys(right)])].sort()) {
        compare(left[key], right[key], `${location}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`);
      }
    } else {
      changes.push({ path: location, ...(left === undefined ? {} : { before: left }),
        ...(right === undefined ? {} : { after: right }) });
    }
  }
  compare(sorted(before), sorted(after), '');
  return changes;
}

async function readCurrent(directory) {
  try { return await readFile(path.join(directory, 'manifest.json'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function verify(directory, requireCurrentExtractor = false) {
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || !Number.isInteger(manifest.extractorVersion) || manifest.extractorVersion < 1 ||
      (requireCurrentExtractor && manifest.extractorVersion !== EXTRACTOR_VERSION) ||
      JSON.stringify(Object.keys(manifest.files || {}).sort()) !== JSON.stringify([...snapshotFiles].sort())) {
    throw new Error('지원하지 않는 스냅샷 형식입니다. 현재 추출기로 다시 생성하세요.');
  }
  for (const name of snapshotFiles) {
    const data = await readFile(path.join(directory, name));
    if (manifest.files[name].sha256 !== hash(data) || manifest.files[name].bytes !== data.length) {
      throw new Error(`스냅샷 파일이 변경되었거나 손상되었습니다. ${name}`);
    }
  }
  return manifest;
}

async function readExtracted(directory) {
  return Object.fromEntries(await Promise.all(sections.map(async section =>
    [section, JSON.parse(await readFile(path.join(directory, `extracted/${section}.json`), 'utf8'))])));
}

async function replaceDirectory(staging, destination) {
  const backup = `${staging}-previous`;
  let previous = false;
  try { await rename(destination, backup); previous = true; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  try { await rename(staging, destination); }
  catch (error) {
    if (previous) await rename(backup, destination);
    throw error;
  }
  if (previous) await rm(backup, { recursive: true });
}

async function withLock(root, operation) {
  const workspace = path.join(root, '_workspace');
  await mkdir(workspace, { recursive: true });
  const lock = path.join(workspace, 'upstream-snapshot.lock');
  try { await mkdir(lock); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`스냅샷 작업이 실행 중이거나 이전 작업이 중단되었습니다. ${lock}`);
    throw error;
  }
  try { return await operation(workspace); }
  finally { await rm(lock, { recursive: true }); }
}

export async function checkUpstream({ root = projectRoot, from, request = fetch, extract = extractSnapshot } = {}) {
  return withLock(root, async workspace => {
    const current = path.join(root, 'upstream/current');
    const baseline = await readCurrent(current);
    if (baseline) await verify(current);
    const staging = await mkdtemp(path.join(workspace, 'upstream-check-'));
    try {
      const source = path.join(staging, 'source');
      await mkdir(source);
      async function download(name, url) {
        if (from) return readFile(path.join(from, name));
        const response = await request(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`원본 다운로드 실패 (HTTP ${response.status}). ${url}`);
        return Buffer.from(await response.arrayBuffer());
      }
      const html = await download('index.html', sourceUrl);
      await writeFile(path.join(source, 'index.html'), html);
      const urls = { 'index.html': sourceUrl };
      const references = [...html.toString('utf8').matchAll(/(?:src|href)=["']([^"']+)["']/g)]
        .map(match => new URL(match[1], sourceUrl));
      for (const [name, pathname] of Object.entries(assets)) {
        const matches = references.filter(url => url.origin === new URL(sourceUrl).origin && url.pathname === pathname);
        if (matches.length !== 1 || !matches[0].searchParams.get('v')) {
          throw new Error(`원본 HTML에서 버전이 지정된 파일을 하나만 찾을 수 있어야 합니다. ${pathname}`);
        }
        urls[name] = matches[0].href;
        await writeFile(path.join(source, name), await download(name, urls[name]));
      }
      const extracted = await extract(source);
      await mkdir(path.join(staging, 'extracted'));
      for (const section of sections) {
        if (extracted[section] === undefined) throw new Error(`추출 결과가 없습니다. ${section}`);
        await writeFile(path.join(staging, `extracted/${section}.json`), json(extracted[section]));
      }
      const files = {};
      for (const name of snapshotFiles) {
        const data = await readFile(path.join(staging, name));
        files[name] = { bytes: data.length, sha256: hash(data),
          ...(name.startsWith('source/') ? { url: urls[path.basename(name)] } : {}) };
      }
      const manifest = {
        schemaVersion: 1, extractorVersion: EXTRACTOR_VERSION,
        gameVersion: new URL(urls['app.min.js']).searchParams.get('v'),
        capturedAt: new Date().toISOString(), sourceUrl,
        comparedWith: baseline === null ? null : hash(baseline), files,
      };
      const previous = baseline === null ? null : JSON.parse(baseline);
      const baselineData = baseline === null ? {} : previous.extractorVersion === EXTRACTOR_VERSION
        ? await readExtracted(current) : await extract(path.join(current, 'source'));
      const report = {
        before: previous?.gameVersion ?? null, after: manifest.gameVersion,
        baselineReextracted: baseline !== null && previous.extractorVersion !== EXTRACTOR_VERSION,
        sourceChanges: snapshotFiles.filter(name => name.startsWith('source/') &&
          previous?.files[name]?.sha256 !== files[name].sha256),
        changes: compareSnapshots(baselineData, extracted),
      };
      await writeFile(path.join(staging, 'manifest.json'), json(manifest));
      await writeFile(path.join(staging, 'diff.json'), json(report));
      await replaceDirectory(staging, path.join(workspace, 'upstream-candidate'));
      return report;
    } finally { await rm(staging, { recursive: true, force: true }); }
  });
}

export async function acceptUpstream({ root = projectRoot, extract = extractSnapshot } = {}) {
  return withLock(root, async workspace => {
    const candidate = path.join(workspace, 'upstream-candidate');
    const manifest = await verify(candidate, true);
    const current = path.join(root, 'upstream/current');
    const baseline = await readCurrent(current);
    if (manifest.comparedWith !== (baseline === null ? null : hash(baseline))) {
      throw new Error('비교 이후 기준 스냅샷이 변경되었습니다. upstream:check를 다시 실행하세요.');
    }
    if (baseline) await verify(current);
    const fresh = await extract(path.join(candidate, 'source'));
    if (compareSnapshots(await readExtracted(candidate), fresh).length) {
      throw new Error('추출 결과를 재현할 수 없습니다. 기준 스냅샷을 유지합니다.');
    }
    await mkdir(path.dirname(current), { recursive: true });
    const staging = await mkdtemp(path.join(path.dirname(current), '.snapshot-'));
    try {
      for (const name of [...snapshotFiles, 'manifest.json']) {
        await mkdir(path.dirname(path.join(staging, name)), { recursive: true });
        await cp(path.join(candidate, name), path.join(staging, name));
      }
      await replaceDirectory(staging, current);
    } finally { await rm(staging, { recursive: true, force: true }); }
    return manifest.gameVersion;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command, flag, directory, ...extra] = process.argv.slice(2);
    if (command === 'check' && ((!flag && !directory) || (flag === '--from' && directory)) && !extra.length) {
      const report = await checkUpstream({ from: directory });
      console.log(`${report.before ?? '기준 없음'} → ${report.after}`);
      console.log(`원본 변경 ${report.sourceChanges.length}개, 추출 데이터 변경 ${report.changes.length}개`);
      console.log(path.join(projectRoot, '_workspace/upstream-candidate/diff.json'));
    } else if (command === 'accept' && !flag) {
      console.log(`기준 스냅샷 저장 완료. ${await acceptUpstream()}`);
    } else {
      throw new Error('사용법: npm run upstream:check [-- --from <원본 폴더>] 또는 npm run upstream:accept');
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
