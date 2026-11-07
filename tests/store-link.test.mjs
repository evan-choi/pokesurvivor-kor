import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveStoreLink } from '../scripts/store-link.mjs';

const env = { CWS_PUBLISHER_ID: 'publisher-1', CWS_ITEM_ID: 'a'.repeat(32), CWS_CLIENT_ID: 'client', CWS_CLIENT_SECRET: 'secret', CWS_REFRESH_TOKEN: 'refresh' };
const url = `https://chromewebstore.google.com/detail/${env.CWS_ITEM_ID}`;
function requestFor(status, html = '<a href="downloads/pokesurvivor-korean.zip">Download</a>') {
  const calls = [];
  return { calls, request: async (target, options = {}) => {
    calls.push({ target, ...options });
    if (target === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'token' });
    if (target.endsWith(':fetchStatus')) return Response.json(status);
    assert.equal(target, 'https://evan-choi.github.io/pokesurvivor-kor/');
    assert.equal(options.headers?.Authorization, undefined);
    return new Response(html);
  } };
}

test('only a publicly published revision switches the install link', async () => {
  for (const state of ['PENDING_REVIEW', 'STAGED', 'PUBLISHED_TO_TESTERS', 'REJECTED']) {
    const mock = requestFor({ submittedItemRevisionStatus: { state } });
    assert.deepEqual(await resolveStoreLink({ env, ...mock }), { url: '', deploy: true });
  }
  assert.equal((await resolveStoreLink({ env, ...requestFor({ publishedItemRevisionStatus: { state: 'PUBLISHED_TO_TESTERS' } }) })).url, '');
  assert.equal((await resolveStoreLink({ env, ...requestFor({ publishedItemRevisionStatus: { state: 'PUBLISHED' } }) })).url, url);
  assert.equal((await resolveStoreLink({ env, ...requestFor({ publishedItemRevisionStatus: { state: 'PUBLISHED' }, submittedItemRevisionStatus: { state: 'PENDING_REVIEW' } }) })).url, url);
  assert.equal((await resolveStoreLink({ env, ...requestFor({ publishedItemRevisionStatus: { state: 'PUBLISHED' }, takenDown: true }) })).url, '');
});

test('hourly runs deploy only when the public website link needs to change', async () => {
  const scheduledEnv = { ...env, GITHUB_EVENT_NAME: 'schedule' };
  for (const published of [false, true]) {
    for (const linked of [false, true]) {
      const mock = requestFor(published ? { publishedItemRevisionStatus: { state: 'PUBLISHED' } } : {}, linked ? `<a href="${url}">Store</a>` : '<a href="downloads/pokesurvivor-korean.zip">ZIP</a>');
      assert.deepEqual(await resolveStoreLink({ env: scheduledEnv, ...mock }), { url: published ? url : '', deploy: published !== linked });
      assert.equal(mock.calls.length, 3);
    }
  }
});

test('failed status lookup never emits a replacement link or exposes response bodies', async () => {
  await assert.rejects(resolveStoreLink({ env, request: async () => new Response('private secret', { status: 401 }) }), error => {
    assert.match(error.message, /401/);
    assert.doesNotMatch(error.message, /private secret/);
    return true;
  });
});

test('unconfigured repositories retain ZIP deployment without requesting credentials', async () => {
  const request = () => assert.fail('No request without store configuration');
  assert.deepEqual(await resolveStoreLink({ env: {}, request }), { url: '', deploy: true });
  assert.deepEqual(await resolveStoreLink({ env: { GITHUB_EVENT_NAME: 'schedule' }, request }), { url: '', deploy: false });
});

test('a failed live-site lookup stops scheduled deployment', async () => {
  const mock = requestFor({ publishedItemRevisionStatus: { state: 'PUBLISHED' } });
  await assert.rejects(resolveStoreLink({ env: { ...env, GITHUB_EVENT_NAME: 'schedule' }, request: (url, options) => url.includes('github.io') ? new Response('', { status: 503 }) : mock.request(url, options) }), /503/);
});
