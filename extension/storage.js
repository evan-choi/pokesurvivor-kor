(() => {
  'use strict';

  let enabled = true;
  let initialized = false;
  const network = { lanDirect: false, debug: false };
  let networkInitialized = false;
  const changedNetworkKeys = new Set();
  const publishNetwork = () => {
    if (networkInitialized) document.dispatchEvent(new CustomEvent('psko:network-settings', { detail: { ...network } }));
  };
  document.addEventListener('psko:network-ready', publishNetwork);
  const publish = () => {
    if (initialized) document.dispatchEvent(new CustomEvent('psko:settings', { detail: enabled }));
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
    for (const key of ['lanDirect', 'debug']) {
      if (changes[key]) {
        changedNetworkKeys.add(key);
        network[key] = changes[key].newValue === true;
      }
    }
    if (changes.lanDirect || changes.debug) {
      publishNetwork();
    }
    if (!changes.enabled) return;
    enabled = changes.enabled.newValue !== false;
    initialized = true;
    publish();
  });
  chrome.storage.local.get({ enabled: true, lanDirect: false, debug: false }).then((settings) => {
    enabled = settings.enabled !== false;
    for (const key of ['lanDirect', 'debug']) {
      if (!changedNetworkKeys.has(key)) network[key] = settings[key] === true;
    }
    networkInitialized = true;
    initialized = true;
    publish();
    publishNetwork();
  }).catch((error) => {
    console.error('[PokéSurvivor 한국어] 설정 읽기 실패', error);
    initialized = true;
    networkInitialized = true;
    publish();
    publishNetwork();
  });
})();
