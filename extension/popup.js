'use strict';

const toggle = document.getElementById('enabled');
const status = document.getElementById('status');

function render(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled ? '한국어 모드가 켜져 있습니다.' : '게임의 원래 언어를 사용합니다.';
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
