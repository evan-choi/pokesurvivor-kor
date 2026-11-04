(() => {
  'use strict';

  let enabled = true;
  const publish = () => document.dispatchEvent(new CustomEvent('psko:settings', { detail: enabled }));
  document.addEventListener('psko:ready', publish);
  document.addEventListener('psko:canvas-ready', publish);

  // Only a boolean preference crosses from the page into the extension's isolated world.
  document.addEventListener('psko:set-enabled', async (event) => {
    if (typeof event.detail !== 'boolean') return;
    const value = event.detail;
    try {
      await chrome.storage.local.set({ enabled: value });
      enabled = value;
      publish();
    } catch (error) {
      console.error('[PokeSurvivor 한국어] 설정 저장 실패', error);
      document.dispatchEvent(new Event('psko:storage-error'));
    }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.enabled) return;
    enabled = changes.enabled.newValue !== false;
    publish();
  });
  chrome.storage.local.get({ enabled: true }).then((settings) => {
    enabled = settings.enabled !== false;
    publish();
  }).catch((error) => {
    console.error('[PokeSurvivor 한국어] 설정 읽기 실패', error);
    publish();
  });
})();
