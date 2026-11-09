import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../workers/turn-credentials/worker.mts';

const keys = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const publicKey = { ...await crypto.subtle.exportKey('jwk', keys.publicKey), kid: 'test' };
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
async function token(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = `${encode({ alg: 'RS256', kid: 'test' })}.${encode({ sub: 'player', aud: 'pokesurvivor-free',
    iss: 'https://securetoken.google.com/pokesurvivor-free', iat: now, auth_time: now, exp: now + 300, ...overrides })}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey, new TextEncoder().encode(payload));
  return `${payload}.${Buffer.from(signature).toString('base64url')}`;
}
const env = { TURN_KEY_ID: 'private-key-id', TURN_API_TOKEN: 'private-secret', TURN_REQUESTS: { limit: async () => ({ success: true }) } };
const request = value => new Request('https://worker.example/v1/ice', { method: 'POST',
  headers: { Origin: 'https://pokesurvivor.com', Authorization: `Bearer ${value}` } });

test('only a verified game user can receive temporary TURN credentials', async t => {
  let issued = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('googleapis.com')) return Response.json({ keys: [publicKey] });
    issued++;
    assert.equal(options.headers.Authorization, 'Bearer private-secret');
    return Response.json({ iceServers: [{ urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turn:untrusted.example:3478'],
      username: 'temporary-user', credential: 'temporary-password' }] });
  });
  for (const invalid of ['malformed', `${encode(null)}.${encode(null)}.abc`, await token({ exp: 1 }), await token({ aud: 'different-game' })]) {
    assert.equal((await worker.fetch(request(invalid), env)).status, 401);
  }
  const forged = (await token()).split('.');
  forged[1] = encode({ ...JSON.parse(Buffer.from(forged[1], 'base64url').toString()), sub: 'other-user' });
  assert.equal((await worker.fetch(request(forged.join('.')), env)).status, 401);
  assert.equal(issued, 0);
  const response = await worker.fetch(request(await token()), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://pokesurvivor.com');
  const result = await response.json();
  assert.deepEqual(result.iceServers, [{ urls: ['turn:turn.cloudflare.com:3478?transport=udp'], username: 'temporary-user', credential: 'temporary-password' }]);
  assert.ok(!JSON.stringify(result).includes('private-secret'));
  assert.equal(issued, 1);
});

test('rate limits and provider failure stop credential issuance', async t => {
  const jwt = await token();
  assert.equal((await worker.fetch(request(jwt), { ...env, TURN_REQUESTS: { limit: async () => ({ success: false }) } })).status, 429);
  t.mock.method(globalThis, 'fetch', async () => new Response('Unavailable', { status: 503 }));
  assert.equal((await worker.fetch(request(jwt), env)).status, 502);
  assert.equal((await worker.fetch(request(jwt), { ...env, TURN_API_TOKEN: '' })).status, 503);
});
