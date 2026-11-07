import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishStore } from '../scripts/publish-store.mjs';

const env = { CWS_PUBLISHER_ID: 'publisher-1', CWS_ITEM_ID: 'a'.repeat(32), CWS_CLIENT_ID: 'client', CWS_CLIENT_SECRET: 'secret', CWS_REFRESH_TOKEN: 'refresh' };
const revision = (version, state = 'PUBLISHED') => ({ state, distributionChannels: [{ crxVersion: version }] });
function fixture(responses) {
  const calls = [];
  return { calls, request: async (url, options = {}) => {
    calls.push({ url, ...options });
    assert.ok(responses.length, `Unexpected request: ${url}`);
    const response = responses.shift();
    return new Response(JSON.stringify(response.body ?? response), { status: response.status ?? 200 });
  } };
}
const options = { env, version: '0.2.20', zip: Buffer.from('zip'), sleep: async () => {} };

test('store upload waits for processing before submitting for automatic publication', async () => {
  const mock = fixture([{ access_token: 'token' }, { publishedItemRevisionStatus: revision('0.2.19') },
    { uploadState: 'IN_PROGRESS' }, { lastAsyncUploadState: 'SUCCEEDED' }, { state: 'PENDING_REVIEW' }]);
  assert.match(await publishStore({ ...options, ...mock }), /PENDING_REVIEW/);
  assert.equal(mock.calls.length, 5);
  assert.match(mock.calls[2].url, /\/upload\/v2\/publishers\/publisher-1\/items\/a+:upload$/);
  assert.deepEqual(JSON.parse(mock.calls[4].body), { publishType: 'DEFAULT_PUBLISH' });
});

test('same or newer published versions and the same pending version are not uploaded again', async () => {
  for (const status of [
    { publishedItemRevisionStatus: revision('0.2.20') },
    { publishedItemRevisionStatus: revision('0.2.21') },
    { publishedItemRevisionStatus: revision('0.2.19'), submittedItemRevisionStatus: revision('0.2.20', 'PENDING_REVIEW') },
  ]) {
    const mock = fixture([{ access_token: 'token' }, status]);
    assert.match(await publishStore({ ...options, ...mock }), /already/);
    assert.equal(mock.calls.length, 2);
  }
});

test('an older active review is not cancelled or overwritten', async () => {
  const mock = fixture([{ access_token: 'token' }, { publishedItemRevisionStatus: revision('0.2.18'), submittedItemRevisionStatus: revision('0.2.19', 'PENDING_REVIEW') }]);
  await assert.rejects(publishStore({ ...options, ...mock }), /review|submission/i);
  assert.equal(mock.calls.length, 2);
});

test('failed upload is never published and missing configuration makes no request', async () => {
  const mock = fixture([{ access_token: 'token' }, { publishedItemRevisionStatus: revision('0.2.19') }, { uploadState: 'FAILED' }]);
  await assert.rejects(publishStore({ ...options, ...mock }), /upload.*FAILED/i);
  assert.equal(mock.calls.length, 3);
  await assert.rejects(publishStore({ ...options, env: {}, ...fixture([]) }), /CWS_PUBLISHER_ID/);
});

test('authentication errors do not expose credentials or response body', async () => {
  const mock = fixture([{ status: 401, body: { error: 'refresh secret' } }]);
  await assert.rejects(publishStore({ ...options, ...mock }), (error) => {
    assert.match(error.message, /401/);
    assert.doesNotMatch(error.message, /secret|refresh/);
    return true;
  });
});

test('first publication remains a dashboard step', async () => {
  const mock = fixture([{ access_token: 'token' }, {}]);
  await assert.rejects(publishStore({ ...options, ...mock }), /first.*dashboard/i);
});
