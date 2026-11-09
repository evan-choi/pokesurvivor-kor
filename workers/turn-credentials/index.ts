interface RateLimit {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}
interface Env {
  TURN_KEY_ID: string;
  TURN_API_TOKEN: string;
  TURN_REQUESTS: RateLimit;
}
interface SigningKey extends JsonWebKey { kid: string }
const origins = new Set(['https://pokesurvivor.com', 'https://www.pokesurvivor.com']);
const project = 'pokesurvivor-free';
const keyUrl = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const credentialLifetime = 86400;
let signingKeys: { keys: SigningKey[]; expires: number } | undefined;

function decodeBase64(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid_token');
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
}

async function verifyUser(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid_token');
  const header = JSON.parse(new TextDecoder().decode(decodeBase64(parts[0])));
  const claims = JSON.parse(new TextDecoder().decode(decodeBase64(parts[1])));
  const now = Math.floor(Date.now() / 1000);
  if (!header || !claims || header.alg !== 'RS256' || typeof header.kid !== 'string'
    || claims.aud !== project || claims.iss !== `https://securetoken.google.com/${project}`
    || typeof claims.sub !== 'string' || !claims.sub.length || claims.sub.length > 128
    || !Number.isFinite(claims.exp) || claims.exp <= now
    || !Number.isFinite(claims.iat) || claims.iat > now
    || !Number.isFinite(claims.auth_time) || claims.auth_time > now) throw new Error('invalid_token');
  if (!signingKeys || signingKeys.expires <= Date.now()) {
    const response = await fetch(keyUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('authentication_unavailable');
    const body = await response.json() as { keys?: SigningKey[] };
    if (!Array.isArray(body.keys)) throw new Error('authentication_unavailable');
    const maxAge = Number(response.headers.get('Cache-Control')?.match(/max-age=(\d+)/)?.[1] ?? 300);
    signingKeys = { keys: body.keys, expires: Date.now() + Math.min(maxAge, 3600) * 1000 };
  }
  const jwk = signingKeys.keys.find(key => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) throw new Error('invalid_token');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBase64(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid) throw new Error('invalid_token');
  return claims.sub as string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Vary': 'Origin' });
    const reply = (status: number, body: unknown) => Response.json(body, { status, headers });
    if (origins.has(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Headers', 'Authorization');
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    } else if (origin) return reply(403, { error: 'origin_not_allowed' });
    if (new URL(request.url).pathname !== '/v1/ice') return reply(404, { error: 'not_found' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
    if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN || !env.TURN_REQUESTS) return reply(503, { error: 'turn_unavailable' });
    const authorization = request.headers.get('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ') || authorization.length > 8192) return reply(401, { error: 'sign_in_required' });
    try {
      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      if (!(await env.TURN_REQUESTS.limit({ key: `ip:${ip}` })).success) return reply(429, { error: 'too_many_requests' });
      const uid = await verifyUser(authorization.slice(7));
      if (!(await env.TURN_REQUESTS.limit({ key: `user:${uid}` })).success) return reply(429, { error: 'too_many_requests' });
      const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.TURN_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: credentialLifetime }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return reply(502, { error: 'turn_unavailable' });
      const body = await response.json() as { iceServers?: Array<{ urls: string | string[]; username?: string; credential?: string }> };
      if (!Array.isArray(body.iceServers)) return reply(502, { error: 'turn_unavailable' });
      const iceServers = body.iceServers.filter(server => typeof server.username === 'string' && typeof server.credential === 'string')
        .map(server => ({ username: server.username, credential: server.credential, urls: [server.urls].flat().filter(url => typeof url === 'string'
          && /^turns?:turn\.cloudflare\.com:(3478|443|80|5349)(\?transport=(udp|tcp))?$/.test(url)) }))
        .filter(server => server.urls.length);
      if (!iceServers.length) return reply(502, { error: 'turn_unavailable' });
      return reply(200, { iceServers, expiresAt: Date.now() + credentialLifetime * 1000 });
    } catch (error) {
      if (error instanceof Error && (error.message === 'invalid_token' || error instanceof SyntaxError || error.name === 'InvalidCharacterError')) {
        return reply(401, { error: 'sign_in_required' });
      }
      return reply(503, { error: 'turn_unavailable' });
    }
  },
};
