import { appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { connectStore } from './publish-store.mjs';

export async function resolveStoreLink({ env, request = fetch }) {
  if (!env.CWS_ITEM_ID && !env.CWS_PUBLISHER_ID) return { url: '', deploy: env.GITHUB_EVENT_NAME !== 'schedule' };
  const { json, headers, base } = await connectStore({ env, request });
  const status = await json(`${base}:fetchStatus`, { headers });
  const publicUrl = `https://chromewebstore.google.com/detail/${env.CWS_ITEM_ID}`;
  const url = !status.takenDown && status.publishedItemRevisionStatus?.state === 'PUBLISHED' ? publicUrl : '';
  if (env.GITHUB_EVENT_NAME !== 'schedule') return { url, deploy: true };

  const live = await request('https://evan-choi.github.io/pokesurvivor-kor/', { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
  if (!live.ok) throw new Error(`Website status check failed (HTTP ${live.status}); keeping the current deployment.`);
  const linked = (await live.text()).includes(`href="${publicUrl}"`);
  return { url, deploy: Boolean(url) !== linked };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { url, deploy } = await resolveStoreLink({ env: process.env });
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `store_url=${url}\ndeploy=${deploy}\n`);
    console.log(`Installation link: ${url || 'ZIP (store not public)'}. Website deployment: ${deploy ? 'needed' : 'unchanged'}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
