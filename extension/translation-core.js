(() => {
  'use strict';

  const exact = new Map();
  const terms = new Map();
  const patterns = [];
  const cache = new Map();
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const normalize = (text) => text.replace(/\s+/g, ' ').trim();

  function add(source, target) {
    source = normalize(source);
    if (!source || source === target) return;
    if (source.includes('{x}')) {
      patterns.push({
        regex: new RegExp(`^${source.split('{x}').map(escape).join('(.+?)')}$`, 'iu'),
        specificity: source.replaceAll('{x}', '').length,
        target,
      });
    } else {
      exact.set(source.toLowerCase(), target);
      if (source.length >= 4 || /\s/.test(source)) terms.set(source.toLowerCase(), target);
    }
  }

  for (const [spanish, english, korean] of globalThis.PSKO_MESSAGES || []) {
    add(spanish, korean);
    add(english, korean);
  }
  for (const [name, korean] of Object.entries(globalThis.PSKO_POKEMON || {})) add(name, korean);
  patterns.sort((a, b) => b.specificity - a.specificity);

  const termPattern = terms.size
    ? new RegExp(`(?<![\\p{L}\\p{N}_])(?:${[...terms.keys()].sort((a, b) => b.length - a.length).map(escape).join('|')})(?![\\p{L}\\p{N}_])`, 'giu')
    : null;

  function lookup(text, moveName) {
    const key = text.toLowerCase();
    // Match a complete dictionary term so Psychic Fangs still becomes 사이코팽.
    if (moveName && (key === 'psychic' || key === 'psíquico')) return '사이코키네시스';
    return exact.get(key);
  }

  function translateBody(text, depth = 0, moveName = false) {
    const direct = lookup(text, moveName);
    if (direct !== undefined) return direct;
    if (depth < 3) {
      for (const { regex, target } of patterns) {
        const match = regex.exec(text);
        if (!match) continue;
        let index = 1;
        return target.replace(/\{x\}/g, () => translateBody(match[index++], depth + 1, moveName));
      }
    }
    return termPattern ? text.replace(termPattern, (term) => lookup(term, moveName)) : text;
  }

  function translate(text, moveName = false) {
    if (typeof text !== 'string' || !/[a-záéíóúñü]/i.test(text)) return text;
    const cacheKey = (moveName ? 'move:' : 'text:') + text;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const [, before, body, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
    const translated = translateBody(normalize(body), 0, moveName);
    // Keep formatting completely intact when the dictionary has no match.
    const result = translated === normalize(body) ? text : before + translated + after;
    if (cache.size >= 4000) cache.clear();
    cache.set(cacheKey, result);
    return result;
  }

  function translateMove(text) {
    return translate(text, true);
  }

  globalThis.PSKO = Object.freeze({ translate, translateMove });
})();
