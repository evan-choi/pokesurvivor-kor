(() => {
  'use strict';

  let enabled = true;
  let initialized = false;
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
    if (area !== 'local' || !changes.enabled) return;
    enabled = changes.enabled.newValue !== false;
    initialized = true;
    publish();
  });
  chrome.storage.local.get({ enabled: true }).then((settings) => {
    enabled = settings.enabled !== false;
    initialized = true;
    publish();
  }).catch((error) => {
    console.error('[PokéSurvivor 한국어] 설정 읽기 실패', error);
    initialized = true;
    publish();
  });
})();
