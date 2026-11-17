import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { chromium } from '@playwright/test';

export const EXTRACTOR_VERSION = 2;
const require = createRequire(import.meta.url);
const obfuscated = /^(?:a0_)?_?0x[\da-f]+$|^_[\da-f]{7}$/;

async function parseSource(source) {
  let parser;
  try {
    const packageDirectory = path.dirname(require.resolve('playwright/package.json'));
    parser = (await import(path.join(packageDirectory, 'lib/transform/babelBundle.js'))).default;
  } catch (cause) {
    throw new Error('Installed Playwright parser is unavailable; update the snapshot extractor.', { cause });
  }
  return { ast: parser.babelParse(source, 'app.js', false), traverse: parser.traverse };
}

async function decodeSource(source) {
  const application = /a0_0x[\da-f]+\(\),\(\(\(\)=>\{/.exec(source);
  const decoder = /const _0x[\da-f]+=(a0_0x[\da-f]+)(?=[,;])/.exec(source);
  if (!application || !decoder) throw new Error('Game decoder structure changed; update the snapshot extractor.');
  const context = vm.createContext({});
  vm.runInContext(source.slice(0, application.index), context, { timeout: 10000 });
  if (typeof context[decoder[1]] !== 'function') throw new Error('Game string decoder is unavailable.');
  const aliases = new Set([decoder[1]]);
  let previousSize;
  do {
    previousSize = aliases.size;
    for (const match of source.matchAll(/(_0x[\da-f]+)=(a0_0x[\da-f]+|_0x[\da-f]+)(?=[,;])/g)) {
      if (aliases.has(match[2])) aliases.add(match[1]);
    }
  } while (aliases.size !== previousSize);
  const calls = new RegExp(`(?:${[...aliases].join('|')})\\((0x[\\da-f]+)\\)`, 'g');
  return source.replace(calls, (_, index) => JSON.stringify(context[decoder[1]](Number(index))));
}

function literal(node) {
  if (['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].includes(node.type)) return node.value;
  if (node.type === 'NullLiteral') return null;
  if (node.type === 'UnaryExpression' && node.operator === '-') return -literal(node.argument);
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(property => {
    if (property.type !== 'ObjectProperty' || property.computed) throw new Error('Non-literal news entry.');
    return [property.key.name ?? property.key.value, literal(property.value)];
  }));
  throw new Error(`Unsupported news value: ${node.type}`);
}

function staticData(ast, traverse, minimumOffset) {
  const strings = new Set();
  const news = [];
  traverse(ast, {
    StringLiteral(nodePath) {
      const node = nodePath.node;
      if (node.start < minimumOffset) return;
      if (nodePath.parent.type === 'ObjectProperty' && nodePath.key === 'key') return;
      if (nodePath.parent.type === 'MemberExpression' && nodePath.key === 'property') return;
      if (node.value.length >= 3 && /\p{L}/u.test(node.value) && !obfuscated.test(node.value)) strings.add(node.value);
    },
    ObjectExpression(nodePath) {
      if (nodePath.node.start < minimumOffset) return;
      const date = nodePath.node.properties.find(property => property.key?.value === 'd' || property.key?.name === 'd');
      const title = nodePath.node.properties.find(property => property.key?.value === 'title' || property.key?.name === 'title');
      if (date?.value?.type === 'StringLiteral' && /^\d{4}-\d{2}-\d{2}$/.test(date.value.value) && title?.value?.type === 'ArrayExpression') {
        news.push(literal(nodePath.node));
      }
    },
  });
  if (!news.length) throw new Error('Game news catalog was not found.');
  const dates = news.map(entry => entry.d);
  if (new Set(dates).size !== dates.length) throw new Error('Game news dates are ambiguous.');
  return {
    strings: Object.fromEntries([...strings].sort().map(value => [value, true])),
    news: Object.fromEntries(news.map(({ d, ...entry }) => [d, entry])),
  };
}

async function runtimeData(sourceDirectory, decoded) {
  const registry = /var (_0x[\da-f]+)=Object\['create'\]\(null\);/.exec(decoded);
  if (!registry) throw new Error('Game module registry changed; update the snapshot extractor.');
  const html = await readFile(path.join(sourceDirectory, 'index.html'), 'utf8');
  const locales = await readFile(path.join(sourceDirectory, 'locales.js'), 'utf8');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ locale: 'en-GB', serviceWorkers: 'block', bypassCSP: true });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    await page.setContent(html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ''));
    await page.evaluate(() => {
      Object.defineProperty(document, 'readyState', { get: () => 'loading' });
      globalThis.__snapshotDictionaries = [];
      const entries = Object.entries;
      Object.entries = function (object) {
        const values = entries(object);
        if (values.length > 10 && values.every(([key, value]) => typeof value === 'string')) {
          globalThis.__snapshotDictionaries.push(object);
        }
        return values;
      };
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addScriptTag({ content: locales });
    await page.addScriptTag({ content: decoded.replace(registry[0], `${registry[0]}globalThis.__snapshotModules=${registry[1]};`) });
    if (errors.length) throw new Error(`Game snapshot initialization failed: ${errors.join('; ')}`);
    return await page.evaluate(() => {
      const root = globalThis.__snapshotModules;
      const values = Object.values(root).filter(value => value && typeof value === 'object');
      const find = (name, predicate) => {
        const matches = values.filter(predicate);
        if (matches.length !== 1) throw new Error(`Expected one ${name} catalog, found ${matches.length}.`);
        return matches[0];
      };
      const records = value => value && !Array.isArray(value) ? Object.values(value) : [];
      const keyed = entries => Object.fromEntries(entries.map(entry => [entry.id, entry]));
      const moves = find('moves', value => Array.isArray(value.ALL) && value.EVO && value.BY_ID);
      const items = find('items', value => value.TREATS && Array.isArray(value.LIST));
      const stats = find('stat upgrades', value => Array.isArray(value.STATS));
      const powers = find('power moves', value => value.Z_BY_TYPE && value.MAX_BY_TYPE && value.GMAX);
      const forms = find('form definitions', value => Array.isArray(value.list) && value.fnames && value.names);
      const species = find('species', value => records(value).length > 1000 && records(value).every(entry => entry && entry.dex && entry.name && !entry.form));
      const formStats = find('form stats', value => records(value).length > 100 && records(value).every(entry => entry && entry.form && entry.name));
      const natures = find('natures', value => Array.isArray(value) && value.length === 25 && value.every(entry => entry.id && Array.isArray(entry.n) && 'up' in entry));
      const abilities = find('abilities', value => records(value).length > 250 && records(value).every(entry => Array.isArray(entry) && entry.length >= 2 && entry.every(name => typeof name === 'string')));
      const rifts = find('rift settings', value => value.NUM && value.KITS && value.NUM.RING_SPEED);
      const copy = value => JSON.parse(JSON.stringify(value));
      const catalogs = copy({ species, formStats, forms, natures: keyed(natures), abilities,
        moves: keyed(moves.ALL), evolutions: moves.EVO, powerMoves: powers,
        items: keyed(items.LIST), treats: keyed(items.TREATS), statUpgrades: keyed(stats.STATS), rifts: rifts.NUM });
      const shapes = [];
      for (const [name, value] of Object.entries(root)) {
        if (!value || !['object', 'function'].includes(typeof value)) continue;
        const keys = Object.getOwnPropertyNames(value).filter(key => !/^_[\da-f]{7}$/.test(key)).sort();
        const prototype = typeof value === 'function' ? Object.getOwnPropertyNames(value.prototype || {}).sort() : [];
        shapes.push({ name: /^_[\da-f]{7}$/.test(name) ? null : name, type: Array.isArray(value) ? 'array' : typeof value, keys, prototype });
      }
      const locale = Object.assign({}, ...globalThis.__snapshotDictionaries);
      if (Object.keys(locale).length < 1000) throw new Error('English locale dictionary was not captured.');
      return { locale, catalogs, shapes };
    });
  } finally {
    await browser.close();
  }
}

export async function extractSnapshot(sourceDirectory) {
  const source = await readFile(path.join(sourceDirectory, 'app.min.js'), 'utf8');
  const decoded = await decodeSource(source);
  const { ast, traverse } = await parseSource(decoded);
  const { news, strings } = staticData(ast, traverse, decoded.indexOf("=Object['create'](null)"));
  const { locale, catalogs, shapes } = await runtimeData(sourceDirectory, decoded);
  const modules = {};
  for (const shape of shapes) {
    const key = shape.name || createHash('sha256').update(JSON.stringify(shape)).digest('hex').slice(0, 16);
    if (modules[key]) modules[key].count++;
    else modules[key] = { ...shape, count: 1 };
  }
  return { locale, news, catalogs, modules, strings };
}
