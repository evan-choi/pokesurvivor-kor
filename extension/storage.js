(() => {
  'use strict';

  let enabled = true;
  let initialized = false;
  const network = { lanDirect: false, debug: false };
  let networkInitialized = false;
  let networkChanged = false;
  let networkSaving = false;
  let networkError = '';
  let networkTabSelected = false;
  const publishNetwork = () => {
    if (networkInitialized) document.dispatchEvent(new CustomEvent('psko:network-settings', { detail: { ...network } }));
    renderNetworkSettings();
  };
  document.addEventListener('psko:network-ready', publishNetwork);
  const publish = () => {
    if (initialized) document.dispatchEvent(new CustomEvent('psko:settings', { detail: enabled }));
    renderNetworkSettings();
  };
  document.addEventListener('psko:ready', publish);
  document.addEventListener('psko:canvas-ready', publish);

  // Only a boolean preference crosses from the page into the extension's isolated world.
  document.addEventListener('psko:set-enabled', async (event) => {
    if (typeof event.detail !== 'boolean') return;
    const value = event.detail;
    try {
      await chrome.storage.local.set({ enabled: value });
      enabled = value;
      initialized = true;
      publish();
    } catch (error) {
      console.error('[PokéSurvivor 한국어] 설정 저장 실패', error);
      document.dispatchEvent(new Event('psko:storage-error'));
    }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.lanDirect) {
      networkChanged = true;
      network.lanDirect = changes.lanDirect.newValue === true;
      networkError = '';
      publishNetwork();
    }
    if (!changes.enabled) return;
    enabled = changes.enabled.newValue !== false;
    initialized = true;
    publish();
  });
  chrome.storage.local.get({ enabled: true, lanDirect: false }).then((settings) => {
    enabled = settings.enabled !== false;
    if (!networkChanged) network.lanDirect = settings.lanDirect === true;
    networkInitialized = true;
    initialized = true;
    publish();
    publishNetwork();
  }).catch((error) => {
    console.error('[PokéSurvivor 한국어] 설정 읽기 실패', error);
    networkError = networkChanged ? '' : 'read';
    initialized = true;
    networkInitialized = true;
    publish();
    publishNetwork();
  });

  function renderNetworkSettings() {
    const tabs = document.querySelector('#set-tabs');
    const body = document.querySelector('#set-body');
    const account = tabs?.querySelector('[data-t="acc"]');
    if (!body || !account) return;
    const ko = document.documentElement.lang === 'ko';
    let tab = tabs.querySelector('[data-t="network"]');
    if (!tab) {
      tab = document.createElement('button');
      tab.type = 'button';
      tab.className = account.className;
      tab.classList.remove('on');
      tab.dataset.t = 'network';
      tab.dataset.pskoUi = '';
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        networkTabSelected = true;
        body.replaceChildren();
        renderNetworkSettings();
      });
      account.before(tab);
    }
    const title = ko ? '네트워크' : 'Network';
    if (tab.textContent !== title) tab.textContent = title;
    if (!networkTabSelected) return;
    for (const button of tabs.querySelectorAll('[data-t]')) button.classList.toggle('on', button === tab);

    let section = body.querySelector('[data-psko-network]');
    if (!section) {
      section = document.createElement('div');
      section.dataset.pskoNetwork = '';
      section.dataset.pskoUi = '';
      section.innerHTML = `
        <div class="set-row">
          <div class="grow">
            <b id="psko-lan-label"></b>
            <small id="psko-lan-description"></small>
          </div>
          <button type="button" class="btn small" id="psko-lan-direct" role="switch"
            aria-labelledby="psko-lan-label" aria-describedby="psko-lan-description psko-network-status"></button>
        </div>
        <p class="sub" id="psko-network-status" role="status"></p>`;
      section.querySelector('#psko-lan-direct').addEventListener('click', async () => {
        networkSaving = true;
        networkError = '';
        renderNetworkSettings();
        try {
          const lanDirect = !network.lanDirect;
          await chrome.storage.local.set({ lanDirect });
        } catch (error) {
          console.error('[PokéSurvivor 한국어] 네트워크 설정 저장 실패', error);
          networkError = 'write';
        } finally {
          networkSaving = false;
          renderNetworkSettings();
        }
      });
      body.replaceChildren(section);
    }
    section.querySelector('#psko-lan-label').textContent = ko ? 'LAN 직접 연결' : 'Direct LAN connection';
    section.querySelector('#psko-lan-description').textContent = ko
      ? '멀티플레이에서 다른 플레이어와 직접 연결할 수 있습니다. 다음 연결부터 적용됩니다.'
      : 'Allow direct multiplayer connections with other players. Changes apply to new connections.';
    const toggle = section.querySelector('#psko-lan-direct');
    toggle.setAttribute('aria-checked', String(network.lanDirect));
    toggle.textContent = ko ? (network.lanDirect ? '예' : '아니요') : (network.lanDirect ? 'Yes' : 'No');
    toggle.disabled = !networkInitialized || networkSaving || networkError === 'read';
    const status = section.querySelector('#psko-network-status');
    status.hidden = !networkError;
    status.textContent = networkError === 'read'
      ? (ko ? '설정을 불러오지 못했습니다. 게임을 새로고침해 주세요.' : 'Could not load the setting. Reload the game.')
      : networkError === 'write'
        ? (ko ? '설정을 저장하지 못했습니다. 다시 시도해 주세요.' : 'Could not save the setting. Try again.')
        : '';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelector('#set-tabs');
    const body = document.querySelector('#set-body');
    if (!tabs || !body) return;
    const observer = new MutationObserver(renderNetworkSettings);
    tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-t]');
      if (tab && tab.dataset.t !== 'network') networkTabSelected = false;
    }, true);
    observer.observe(tabs, { childList: true });
    observer.observe(body, { childList: true });
    renderNetworkSettings();
  }, { once: true });
})();
