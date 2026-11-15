(() => {
  'use strict';

  const exact = new Map();
  const exactCase = new Map();
  const terms = new Map();
  const patterns = [];
  const cache = new Map();
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const normalize = (text) => text.replace(/\s+/g, ' ').trim();

  function add(source, target) {
    source = normalize(source);
    target = target.trim();
    if (!source || (source === target && !/\{(?:x|y|name)\}/u.test(source))) return;
    if (/\{(?:x|y|name)\}/u.test(source)) {
      patterns.push({
        regex: new RegExp(`^${source.split(/\{(?:x|y|name)\}/u).map(escape).join('(.+?)')}$`, 'iu'),
        specificity: source.replace(/\{(?:x|y|name)\}/gu, '').length,
        target,
      });
    } else {
      exact.set(source.toLowerCase(), target);
      exactCase.set(source, target);
      if (source.length >= 4 || /\s/.test(source)) terms.set(source.toLowerCase(), target);
    }
  }

  for (const [spanish, english, korean] of globalThis.PSKO_MESSAGES || []) {
    add(spanish, korean);
    add(english, korean);
    // The game can translate a template before inserting names from its catalogs.
    if (/\{(?:x|y|name)\}/u.test(korean)) add(korean, korean);
  }
  for (const [name, korean] of Object.entries(globalThis.PSKO_POKEMON || {})) add(name, korean);
  // A user name can itself contain a phrase matched by another template.
  patterns.sort((a, b) => Number(b.target.includes('{name}')) - Number(a.target.includes('{name}')) ||
    b.specificity - a.specificity);

  const termPattern = terms.size
    ? new RegExp(`(?<![\\p{L}\\p{N}_])(?:${[...terms.keys()].sort((a, b) => b.length - a.length).map(escape).join('|')})(?![\\p{L}\\p{N}_])`, 'giu')
    : null;

  function lookup(text, moveName) {
    const key = text.toLowerCase();
    // Match a complete dictionary term so Psychic Fangs still becomes 사이코팽.
    if (moveName && (key === 'psychic' || key === 'psíquico')) return '사이코키네시스';
    return exactCase.get(text) ?? exact.get(key);
  }

  function translateBody(text, depth = 0, moveName = false) {
    const direct = lookup(text, moveName);
    if (direct !== undefined) return direct;
    if (depth < 3) {
      for (const { regex, target } of patterns) {
        const match = regex.exec(text);
        if (!match) continue;
        let index = 1;
        return target.replace(/\{(x|y|name)\}/g, (_, slot) => {
          const value = match[index++];
          return slot === 'name' ? value : translateBody(value, depth + 1, moveName);
        });
      }
    }
    const translated = termPattern ? text.replace(termPattern, (term) => lookup(term, moveName)) : text;
    // Unknown sentences and player names must not become a few Korean words
    // surrounded by untranslated prose. Known templates still translate their full text.
    const remaining = translated
      .replace(/\b(?:HP|XP|EXP|FPS|DPS|PC)\b/g, '')
      .replace(/\b(?:Nv|Lv|No)\.\s*\d+/g, '')
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:ms|min|s|m|h|d)\b/g, '');
    return translated !== text && /[\p{Script=Latin}\p{Script=Han}]/u.test(remaining) ? text : translated;
  }

  function translate(text, moveName = false) {
    if (typeof text !== 'string' || !/[\p{Script=Latin}\p{Script=Han}]/u.test(text)) return text;
    const cacheKey = (moveName ? 'move:' : 'text:') + text;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const [, before, body, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
    const translated = translateBody(normalize(body), 0, moveName)
      .replace(/(?<![\p{L}\p{N}_])(?:Nv|Lv)\.\s*(\d+)/gu, '레벨 $1');
    // Keep formatting completely intact when the dictionary has no match.
    const result = translated === normalize(body) ? text : before + translated + after;
    if (cache.size >= 4000) cache.clear();
    cache.set(cacheKey, result);
    return result;
  }

  function translateMove(text) {
    return translate(text, true);
  }

  function translateRewardConfirmation(text) {
    if (typeof text !== 'string') return text;
    const request = /^(?:¿(Dar|Quitar) a ([\s\S]+)\?|(?:(지급|회수) 확인 · )([\s\S]+))$/.exec(text);
    if (!request) return text;
    const body = request[2] || request[4];
    const separator = /: (?=\d[\d.,]* (?:monedas|tickets|×10|Pokémon)|(?:MT|objetos|skins|estelas|marcos): )/.exec(body);
    if (!separator) return text;
    const player = body.slice(0, separator.index);
    const payload = body.slice(separator.index + separator[0].length);
    const rewards = payload.split(/, (?=(?:MT|objetos|skins|estelas|marcos): |\d[\d.,]* (?:monedas|tickets|×10|Pokémon))/);
    const translated = rewards.map(reward => {
      const category = /^(MT|objetos|skins|estelas|marcos): (.+?)( \(×\d+ cada una\))?$/.exec(reward);
      if (category) {
        const label = translate(category[1]);
        const translateName = category[1] === 'MT' ? translateMove : translate;
        const summary = /^(\d+) (MT|objetos|skins|estelas|marcos)$/.exec(category[2]);
        const names = summary?.[2] === category[1] ? `${summary[1]}개`
          : category[2].split(', ').map(name => translateName(name)).join(', ');
        return `${label} ${names}${category[3] ? ` ${translate(category[3].trim())}` : ''}`;
      }
      return translate(reward.replace(/^(\d+) ×10$/, '10연속 티켓 $1장')
        .replace(/^(\d+) Pokémon \(y su shiny\)$/, '포켓몬 $1마리와 색이 다른 모습'));
    });
    const action = request[1] === 'Dar' || request[3] === '지급' ? '지급' : '회수';
    return `${player} · ${translated.join(', ')} · ${action}할까요?`;
  }

  globalThis.PSKO = Object.freeze({ translate, translateMove, translateRewardConfirmation });
})();
