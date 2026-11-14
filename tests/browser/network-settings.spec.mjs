import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const storageSource = readFileSync(new URL('../../extension/storage.js', import.meta.url), 'utf8');

async function fixture(page) {
  await page.addInitScript({ content: `
    window.testNetworkStorage = { writes: [] };
    window.chrome = { storage: {
      local: {
        get: () => new Promise((resolve, reject) => {
          testNetworkStorage.finishRead = resolve;
          testNetworkStorage.failRead = reject;
        }),
        set: values => new Promise((resolve, reject) => {
          testNetworkStorage.writes.push(values);
          testNetworkStorage.finishWrite = resolve;
          testNetworkStorage.failWrite = reject;
        }),
      },
      onChanged: { addListener: listener => { testNetworkStorage.changed = listener; } },
    } };
    ${storageSource}
  ` });
  await page.route('https://pokesurvivor.com/', route => route.fulfill({ contentType: 'text/html', body: `
    <!doctype html><html lang="ko"><body>
      <div id="set-tabs">
        <button data-t="sound" class="on">소리</button><button data-t="gfx">그래픽</button>
        <button data-t="ctl">조작</button><button data-t="a11y">접근성</button>
        <button data-t="acc">계정</button><button data-t="about">정보</button>
      </div><div id="set-body"><h3>소리</h3></div>
    </body></html>
  ` }));
  await page.goto('https://pokesurvivor.com/');
  await page.locator('#set-tabs [data-t="network"]').click();
}

test('network settings wait for storage and expose read errors until a saved change arrives', async ({ page }) => {
  await fixture(page);
  const toggle = page.getByRole('switch', { name: 'P2P 직접 연결' });
  const status = page.getByRole('status');
  await expect(toggle).toBeDisabled();
  await expect(status).toBeHidden();
  await page.evaluate(() => testNetworkStorage.failRead(new Error('Storage unavailable')));
  await expect(toggle).toBeDisabled();
  await expect(status).toHaveText('설정을 불러오지 못했습니다. 게임을 새로고침해 주세요.');
  await page.evaluate(() => testNetworkStorage.changed({ lanDirect: { newValue: true } }, 'local'));
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(status).toBeHidden();
  await page.evaluate(() => testNetworkStorage.changed({ lanDirect: { newValue: false } }, 'sync'));
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.evaluate(() => testNetworkStorage.changed({ lanDirect: { newValue: false } }, 'local'));
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
});

test('network settings retain the saved value on write failure and permit a successful retry', async ({ page }) => {
  await fixture(page);
  const toggle = page.getByRole('switch', { name: 'P2P 직접 연결' });
  const status = page.getByRole('status');
  await page.evaluate(() => testNetworkStorage.finishRead({ enabled: true, lanDirect: false }));
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(toggle).toBeDisabled();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(await page.evaluate(() => testNetworkStorage.writes)).toEqual([{ lanDirect: true }]);
  await page.evaluate(() => testNetworkStorage.failWrite(new Error('Storage full')));
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(status).toHaveText('설정을 저장하지 못했습니다. 다시 시도해 주세요.');
  await toggle.click();
  await expect(toggle).toBeDisabled();
  await expect(status).toBeHidden();
  await page.evaluate(() => {
    testNetworkStorage.changed({ lanDirect: { newValue: true } }, 'local');
    testNetworkStorage.finishWrite();
  });
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => testNetworkStorage.writes)).toEqual([{ lanDirect: true }, { lanDirect: true }]);
  await toggle.click();
  await page.evaluate(() => {
    testNetworkStorage.changed({ lanDirect: { newValue: false } }, 'local');
    testNetworkStorage.changed({ lanDirect: { newValue: true } }, 'local');
    testNetworkStorage.finishWrite();
  });
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
});

test('network guides open the matching instructions and keep the setting intact', async ({ page }) => {
  await fixture(page);
  await page.context().route('https://github.com/evan-choi/pokesurvivor-kor/**', route => route.fulfill({
    contentType: 'text/html', body: '<h1>Connection guide</h1>',
  }));
  await page.evaluate(() => testNetworkStorage.finishRead({ enabled: true, lanDirect: false }));
  const toggle = page.getByRole('switch', { name: 'P2P 직접 연결' });
  for (const [name, filename] of [
    ['같은 공유기 연결', 'same-router-connection.md'],
    ['Radmin VPN 연결', 'radmin-vpn-connection.md'],
  ]) {
    const guide = page.getByRole('link', { name, exact: true });
    const url = `https://github.com/evan-choi/pokesurvivor-kor/blob/main/docs/${filename}`;
    await expect(guide).toHaveAttribute('href', url);
    await expect(guide).toHaveAttribute('target', '_blank');
    await expect(guide).toHaveAttribute('rel', 'noopener noreferrer');
    await guide.focus();
    const opened = page.waitForEvent('popup');
    await page.keyboard.press('Enter');
    const instructions = await opened;
    await expect(instructions).toHaveURL(new URL(url).href);
    expect(await instructions.evaluate(() => window.opener)).toBeNull();
    await instructions.close();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  }
  expect(await page.evaluate(() => testNetworkStorage.writes)).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.lang = 'en';
    testNetworkStorage.changed({ enabled: { newValue: false } }, 'local');
  });
  await expect(page.locator('#psko-network-guides a')).toHaveText(['Same router', 'Radmin VPN']);
});
