'use strict';

import { TIER_SOURCE, DEX_SOURCE, readOwnedPokemon, parseRankings, validateRankings, rankOwnedPokemon } from './owned-pokemon.mjs';
import { createPokemonSearch } from './pokemon-search.mjs';

const collectionStatus = document.getElementById('collection-status');
const collectionCount = document.getElementById('collection-count');
const pokemonList = document.getElementById('pokemon-list');
const tierUpdated = document.getElementById('tier-updated');
const refreshCollection = document.getElementById('refresh-collection');
const pokemonSearch = document.getElementById('pokemon-search');
const gameControls = document.getElementById('game-controls');
const play = document.querySelector('.play');
const cacheDuration = 24 * 60 * 60 * 1000;
const formNames = new Map((globalThis.PSKO_MESSAGES || []).map(([source, , korean]) => [source, korean]));
const formEnglishNames = new Map((globalThis.PSKO_MESSAGES || []).map(([source, english]) => [source, english]));
let ownedPokemon = [];
let searchPokemon = createPokemonSearch([], () => []);
let rankingNotice = '';

function pokemonName(entry) {
  return globalThis.PSKO_POKEMON[entry.name] || formNames.get(entry.name) || entry.name || `도감 #${entry.dex}`;
}

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
    const spriteId = entry.spriteId || entry.dex;
    let fallback = matchMedia('(prefers-reduced-motion: reduce)').matches;
    image.src = fallback ? `${spriteBase}${spriteId}.png` : `${spriteBase}other/showdown/${spriteId}.gif`;
    image.addEventListener('error', () => {
      if (!fallback) {
        fallback = true;
        image.src = `${spriteBase}${spriteId}.png`;
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
    label.textContent = pokemonName(entry);
    if (entry.path) {
      label.href = new URL(entry.path, DEX_SOURCE).href;
      label.target = '_blank';
      label.rel = 'noreferrer';
    }
    const number = document.createElement('small');
    number.textContent = `No. ${String(entry.nationalDex || entry.dex).padStart(3, '0')}`;
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

function filterPokemon() {
  const query = pokemonSearch.value.trim();
  const entries = searchPokemon(query);
  renderPokemon(entries);
  collectionCount.textContent = query ? `${entries.length} / ${ownedPokemon.length}마리` : `${ownedPokemon.length}마리`;
  collectionStatus.textContent = [entries.length ? '' : '검색 결과가 없습니다.', rankingNotice].filter(Boolean).join(' ');
  collectionStatus.hidden = !collectionStatus.textContent;
}

async function loadCollection(refresh = false) {
  refreshCollection.disabled = true;
  pokemonSearch.disabled = true;
  ownedPokemon = [];
  searchPokemon = createPokemonSearch([], () => []);
  rankingNotice = '';
  collectionStatus.hidden = false;
  collectionStatus.textContent = '보유 목록 불러오는 중…';
  collectionCount.textContent = '';
  tierUpdated.textContent = '';
  pokemonList.replaceChildren();
  try {
    const tabs = await chrome.tabs.query({ url: ['https://pokesurvivor.com/*', 'https://www.pokesurvivor.com/*'] });
    const tab = tabs.filter(tab => tab.id && !tab.url?.includes('/game-auth'))
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
    gameControls.hidden = !tab;
    play.hidden = !!tab;
    if (!tab) return;
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
    ownedPokemon = rankOwnedPokemon(collection.owned, rankings.entries);
    searchPokemon = createPokemonSearch(ownedPokemon, entry => [
      pokemonName(entry), entry.name, formEnglishNames.get(entry.name),
    ]);
    rankingNotice = rankings.notice || '';
    pokemonSearch.disabled = false;
    filterPokemon();
    tierUpdated.textContent = `티어 확인: ${new Date(rankings.fetchedAt).toLocaleString('ko-KR')}`;
  } catch (error) {
    collectionStatus.textContent = error.message || '보유 목록을 불러오지 못했습니다. 다시 시도하세요.';
  } finally {
    refreshCollection.disabled = false;
  }
}

refreshCollection.addEventListener('click', () => loadCollection(true));
pokemonSearch.addEventListener('input', filterPokemon);
loadCollection();
