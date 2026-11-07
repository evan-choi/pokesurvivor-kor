'use strict';

import { TIER_SOURCE, DEX_SOURCE, readOwnedPokemon, parseRankings, validateRankings, rankOwnedPokemon } from './owned-pokemon.mjs';

const toggle = document.getElementById('enabled');
const status = document.getElementById('status');

function render(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled ? '한국어 · 전환하면 게임 새로고침' : '원본 언어 · 전환하면 게임 새로고침';
}

chrome.storage.local.get({ enabled: true }).then(({ enabled }) => {
  render(enabled !== false);
  toggle.disabled = false;
}).catch((error) => {
  console.error(error);
  status.textContent = '설정을 불러오지 못했습니다. 팝업을 다시 열어 주세요.';
});

toggle.addEventListener('change', async () => {
  toggle.disabled = true;
  try {
    await chrome.storage.local.set({ enabled: toggle.checked });
    render(toggle.checked);
  } catch (error) {
    console.error(error);
    toggle.checked = !toggle.checked;
    status.textContent = '설정을 저장하지 못했습니다. 다시 시도해 주세요.';
  } finally {
    toggle.disabled = false;
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.enabled) render(changes.enabled.newValue !== false);
});

const collectionStatus = document.getElementById('collection-status');
const collectionCount = document.getElementById('collection-count');
const pokemonList = document.getElementById('pokemon-list');
const tierUpdated = document.getElementById('tier-updated');
const refreshCollection = document.getElementById('refresh-collection');
const cacheDuration = 24 * 60 * 60 * 1000;

async function loadRankings(refresh) {
  const { tierCache } = await chrome.storage.local.get('tierCache');
  let cached;
  if (tierCache) {
    try {
      validateRankings(tierCache.entries);
      if (!Number.isFinite(tierCache.fetchedAt) || tierCache.fetchedAt <= 0 || tierCache.fetchedAt > Date.now()) {
        throw new Error('티어 저장 시간이 올바르지 않습니다.');
      }
      cached = tierCache;
    } catch (error) {
      console.error('[PokéSurvivor 한국어] 저장된 티어 읽기 실패', error);
    }
  }
  if (!refresh && cached && Date.now() - cached.fetchedAt < cacheDuration) return cached;
  try {
    const [tierHtml, dexHtml] = await Promise.all([TIER_SOURCE, DEX_SOURCE].map(async (url) => {
      const response = await fetch(url, { credentials: 'omit', cache: 'no-cache', signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`PokéSurvivor Guide: HTTP ${response.status}`);
      return response.text();
    }));
    const result = { entries: parseRankings(tierHtml, dexHtml), fetchedAt: Date.now() };
    try {
      await chrome.storage.local.set({ tierCache: result });
    } catch (error) {
      console.error('[PokéSurvivor 한국어] 티어 저장 실패', error);
      return { ...result, notice: '티어를 표시했지만 기기에 저장하지 못했습니다.' };
    }
    return result;
  } catch (error) {
    console.error('[PokéSurvivor 한국어] 티어 불러오기 실패', error);
    if (cached) return { ...cached, notice: '티어를 갱신하지 못해 마지막으로 저장한 티어를 표시합니다.' };
    throw new Error('티어를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도하세요.');
  }
}

function renderPokemon(entries) {
  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    const row = document.createElement('li');
    row.className = 'pokemon-row';
    const portrait = document.createElement('div');
    portrait.className = 'pokemon-image';
    const image = document.createElement('img');
    image.alt = '';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    const spriteBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
    let fallback = matchMedia('(prefers-reduced-motion: reduce)').matches;
    image.src = fallback ? `${spriteBase}${entry.dex}.png` : `${spriteBase}other/showdown/${entry.dex}.gif`;
    image.addEventListener('error', () => {
      if (!fallback) {
        fallback = true;
        image.src = `${spriteBase}${entry.dex}.png`;
      } else {
        const placeholder = document.createElement('span');
        placeholder.textContent = '이미지 없음';
        portrait.replaceChildren(placeholder);
      }
    });
    portrait.append(image);
    const name = document.createElement('div');
    name.className = 'pokemon-name';
    const label = document.createElement(entry.path ? 'a' : 'strong');
    label.textContent = globalThis.PSKO_POKEMON[entry.name] || entry.name || `도감 #${entry.dex}`;
    if (entry.path) {
      label.href = new URL(entry.path, DEX_SOURCE).href;
      label.target = '_blank';
      label.rel = 'noreferrer';
    }
    const number = document.createElement('small');
    number.textContent = `No. ${String(entry.dex).padStart(3, '0')}`;
    name.append(label, number);
    const rank = document.createElement('span');
    rank.className = 'pokemon-rank';
    rank.textContent = entry.rank ? `${entry.rank}위` : '순위 없음';
    const tier = document.createElement('span');
    tier.className = entry.tier ? `tier tier-${entry.tier.toLowerCase()}` : 'tier';
    tier.textContent = entry.tier || '—';
    tier.setAttribute('aria-label', entry.tier ? `${entry.tier}등급` : '미분류');
    row.append(portrait, name, rank, tier);
    fragment.append(row);
  }
  pokemonList.replaceChildren(fragment);
}

async function loadCollection(refresh = false) {
  refreshCollection.disabled = true;
  collectionStatus.textContent = '보유 목록 불러오는 중…';
  collectionCount.textContent = '';
  tierUpdated.textContent = '';
  pokemonList.replaceChildren();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https:\/\/(?:www\.)?pokesurvivor\.com\//.test(tab.url || '')) {
      throw new Error('게임 탭에서 이 메뉴를 열어 주세요.');
    }
    const frames = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      world: 'MAIN',
      func: readOwnedPokemon,
    });
    const collection = frames.find(({ result }) => result)?.result;
    if (!collection) throw new Error('게임 로딩 후 다시 시도하세요.');
    if (collection.error) throw new Error(collection.error);
    if (!Array.isArray(collection.owned)) throw new Error('보유 목록 형식을 확인할 수 없습니다.');
    if (!collection.owned.length) {
      collectionCount.textContent = '0마리';
      collectionStatus.textContent = '아직 보유한 포켓몬이 없습니다.';
      return;
    }
    collectionStatus.textContent = '티어 불러오는 중…';
    const rankings = await loadRankings(refresh);
    const entries = rankOwnedPokemon(collection.owned, rankings.entries);
    renderPokemon(entries);
    collectionCount.textContent = `${entries.length}마리`;
    collectionStatus.textContent = rankings.notice || '전체 순위가 높은 순서입니다.';
    tierUpdated.textContent = `티어 확인: ${new Date(rankings.fetchedAt).toLocaleString('ko-KR')}`;
  } catch (error) {
    collectionStatus.textContent = error.message || '보유 목록을 불러오지 못했습니다. 다시 시도하세요.';
  } finally {
    refreshCollection.disabled = false;
  }
}

refreshCollection.addEventListener('click', () => loadCollection(true));
loadCollection();
