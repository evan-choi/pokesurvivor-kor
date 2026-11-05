export const TIER_SOURCE = 'https://pokesurvivor.net/tier-list/';
export const DEX_SOURCE = 'https://pokesurvivor.net/pokedex/';

// Chrome runs this function in the game's frame without the module's outer scope.
export function readOwnedPokemon() {
  if (!document.querySelector('#dex-grid')) return null;
  try {
    let key;
    if (window.PS_PLATFORM_MODE) {
      const id = window.PS_HOST_USER?.id;
      if (!id) return { error: '보유 목록을 보려면 게임 계정에 로그인하세요.' };
      key = 'ps.save.platform.' + encodeURIComponent(id);
    } else {
      const session = JSON.parse(localStorage.getItem('ps.session') || 'null');
      if (typeof session !== 'string' || !session) {
        return { error: '보유 목록을 보려면 게임 계정에 로그인하세요.' };
      }
      key = 'ps.save.' + session;
    }
    const save = JSON.parse(localStorage.getItem(key) || 'null');
    if (!save?.owned || typeof save.owned !== 'object' || Array.isArray(save.owned)) {
      return { error: '보유 목록을 읽지 못했습니다. 게임 로딩 후 다시 시도하세요.' };
    }
    const owned = Object.keys(save.owned).filter((dex) => save.owned[dex]);
    if (owned.some((dex) => !/^[1-9]\d*$/.test(dex) || !Number.isSafeInteger(Number(dex)))) {
      return { error: '게임의 보유 목록 형식을 확인할 수 없습니다.' };
    }
    return { owned: owned.map(Number) };
  } catch (error) {
    console.error('[PokeSurvivor 한국어] 보유 목록 읽기 실패', error);
    return { error: '보유 목록을 읽지 못했습니다. 게임을 새로고침해 주세요.' };
  }
}

function pokedexPath(link) {
  const url = new URL(link.getAttribute('href'), DEX_SOURCE);
  if (url.origin !== new URL(DEX_SOURCE).origin || !/^\/pokedex\/[\w%-]+\/$/.test(url.pathname)) {
    throw new Error('도감 링크 형식이 변경되었습니다.');
  }
  return url.pathname;
}

export function validateRankings(entries) {
  if (!Array.isArray(entries) || !entries.length) throw new Error('티어 목록이 비어 있습니다.');
  const dexNumbers = new Set();
  const ranks = new Set();
  for (const entry of entries) {
    if (!entry || !Number.isSafeInteger(entry.dex) || entry.dex <= 0 ||
        !Number.isSafeInteger(entry.rank) || entry.rank <= 0 ||
        typeof entry.name !== 'string' || !entry.name.trim() ||
        !/^[SABCD]$/.test(entry.tier) ||
        typeof entry.path !== 'string' || !/^\/pokedex\/[\w%-]+\/$/.test(entry.path) ||
        dexNumbers.has(entry.dex) || ranks.has(entry.rank)) {
      throw new Error('티어 목록 형식을 확인할 수 없습니다.');
    }
    dexNumbers.add(entry.dex);
    ranks.add(entry.rank);
  }
  if (Math.max(...ranks) !== entries.length) throw new Error('티어 목록 일부가 누락되었습니다.');
  return entries;
}

export function parseRankings(tierHtml, dexHtml) {
  const parser = new DOMParser();
  const dexDocument = parser.parseFromString(dexHtml, 'text/html');
  const dexByPath = new Map();
  for (const number of dexDocument.querySelectorAll('a[href] > .no')) {
    const link = number.parentElement;
    const text = number.textContent.trim();
    if (!/^#\s*\d+$/.test(text)) throw new Error('도감 번호 형식이 변경되었습니다.');
    const dex = Number(text.replace(/\D/g, ''));
    dexByPath.set(pokedexPath(link), dex);
  }
  const tierDocument = parser.parseFromString(tierHtml, 'text/html');
  const entries = [];
  for (const tier of ['S', 'A', 'B', 'C', 'D']) {
    const block = tierDocument.getElementById(`tier-${tier.toLowerCase()}`)?.closest('[data-tier-block]');
    const rows = block?.querySelectorAll('tbody tr');
    if (!rows?.length) throw new Error(`${tier}등급을 읽지 못했습니다.`);
    for (const row of rows) {
      const link = row.querySelector('td:nth-child(2) a[href]');
      if (!link) throw new Error('티어 목록의 도감 링크가 누락되었습니다.');
      const path = pokedexPath(link);
      entries.push({
        dex: dexByPath.get(path),
        name: link.textContent.trim(),
        rank: Number(row.cells[0].textContent.trim()),
        tier,
        path,
      });
    }
  }
  return validateRankings(entries);
}

export function rankOwnedPokemon(owned, rankings) {
  if (!Array.isArray(owned) || owned.some((dex) => !Number.isSafeInteger(dex) || dex <= 0)) {
    throw new Error('보유 목록 형식을 확인할 수 없습니다.');
  }
  const byDex = new Map(rankings.map((entry) => [entry.dex, entry]));
  return [...new Set(owned)].map((dex) => byDex.get(dex) || { dex })
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.dex - b.dex);
}
