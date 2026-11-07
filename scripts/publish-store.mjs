import { appendFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { setTimeout } from 'node:timers/promises';

export async function connectStore({ env, request = fetch }) {
  for (const key of ['CWS_PUBLISHER_ID', 'CWS_ITEM_ID', 'CWS_CLIENT_ID', 'CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN']) {
    if (!env[key]) throw new Error(`Missing ${key}. See docs/store-publishing.md.`);
  }
  if (!/^[a-p]{32}$/.test(env.CWS_ITEM_ID) || !/^[\w-]+$/.test(env.CWS_PUBLISHER_ID)) throw new Error('Invalid store item or publisher ID.');
  async function json(url, options) {
    const response = await request(url, { ...options, signal: AbortSignal.timeout(120_000) });
    // OAuth error bodies can contain credentials; never log response bodies.
    if (!response.ok) throw new Error(`Chrome Web Store request failed (HTTP ${response.status}). Check the dashboard and CI credentials.`);
    return response.json();
  }
  const auth = await json('https://oauth2.googleapis.com/token', {
    method: 'POST', body: new URLSearchParams({ client_id: env.CWS_CLIENT_ID, client_secret: env.CWS_CLIENT_SECRET, refresh_token: env.CWS_REFRESH_TOKEN, grant_type: 'refresh_token' }),
  });
  if (!auth.access_token) throw new Error('OAuth did not return an access token.');
  const headers = { Authorization: `Bearer ${auth.access_token}` };
  const name = `publishers/${env.CWS_PUBLISHER_ID}/items/${env.CWS_ITEM_ID}`;
  const base = `https://chromewebstore.googleapis.com/v2/${name}`;
  return { json, headers, name, base };
}

export async function publishStore({ env, version, zip, request = fetch, sleep = setTimeout }) {
  if (!/^\d+(\.\d+){0,3}$/.test(version)) throw new Error('Invalid extension version.');
  const { json, headers, name, base } = await connectStore({ env, request });
  const status = await json(`${base}:fetchStatus`, { headers });
  if (status.takenDown || status.warned) throw new Error('Resolve the store policy notice in the dashboard first.');
  const published = status.publishedItemRevisionStatus;
  const atLeast = (other) => {
    const left = other.split('.').map(Number), right = version.split('.').map(Number);
    for (let i = 0; i < 4; i++) {
      if ((left[i] ?? 0) !== (right[i] ?? 0)) return (left[i] ?? 0) > (right[i] ?? 0);
    }
    return true;
  };
  if (published?.distributionChannels?.some((channel) => atLeast(channel.crxVersion))) return `Version ${version} or newer is already published; no upload.`;
  const pending = status.submittedItemRevisionStatus;
  if (pending && !['REJECTED', 'CANCELLED'].includes(pending.state)) {
    if (pending.distributionChannels?.some((channel) => channel.crxVersion === version)) return `Version ${version} is already submitted (${pending.state}); no upload.`;
    throw new Error('Another submission is active. Wait for review, then rerun this workflow.');
  }
  if (!published) throw new Error('Complete the first publication in the developer dashboard before enabling CI updates.');
  const uploaded = await json(`https://chromewebstore.googleapis.com/upload/v2/${name}:upload`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/zip' }, body: zip,
  });
  let state = uploaded.uploadState;
  // Some API documentation still uses the older UPLOAD_IN_PROGRESS spelling.
  for (let attempt = 0; ['IN_PROGRESS', 'UPLOAD_IN_PROGRESS'].includes(state) && attempt < 30; attempt++) {
    await sleep(5_000);
    state = (await json(`${base}:fetchStatus`, { headers })).lastAsyncUploadState;
  }
  if (state !== 'SUCCEEDED') throw new Error(`Store upload did not succeed (${state}); nothing was submitted. Check the dashboard before retrying.`);
  if (uploaded.crxVersion && uploaded.crxVersion !== version) throw new Error('Uploaded version differs from manifest.');
  const result = await json(`${base}:publish`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ publishType: 'DEFAULT_PUBLISH' }),
  });
  if (!['PENDING_REVIEW', 'PUBLISHED', 'PUBLISHED_TO_TESTERS'].includes(result.state)) throw new Error(`Unexpected publication state: ${result.state}. Check the dashboard.`);
  return `Version ${version}: ${result.state}. Chrome Web Store review controls when users receive the update.`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { version } = JSON.parse(await readFile(new URL('../extension/manifest.json', import.meta.url), 'utf8'));
    const zip = await readFile(new URL(`../dist/pokesurvivor-store-${version}.zip`, import.meta.url));
    const result = await publishStore({ env: process.env, version, zip });
    console.log(result);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${result}\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
