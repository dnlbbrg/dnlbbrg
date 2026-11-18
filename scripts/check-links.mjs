// Checks every link of the profile: exits 1 if one does not answer with 2xx or 3xx.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const profile = JSON.parse(fs.readFileSync(path.join(root, 'content/profile.json'), 'utf8'));
const urls = new Set([
  ...[...readme.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]),
  ...[...readme.matchAll(/\]\((https?:[^)]+)\)/g)].map((m) => m[1]),
  profile.header.url,
  ...profile.ha.map((i) => i.url),
  ...profile.more.map((i) => i.url),
  ...profile.contact.map((c) => c.url),
]);

async function status(url) {
  const opts = { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 link-check' } };
  try {
    let r = await fetch(url, { ...opts, method: 'HEAD' });
    if (r.status >= 400) r = await fetch(url, { ...opts, method: 'GET' });
    return r.status;
  } catch (e) {
    return `error ${e.name}`;
  }
}

const results = await Promise.all([...urls].map(async (u) => [u, await status(u)]));
const bad = results.filter(([, s]) => typeof s !== 'number' || s < 200 || s >= 400);
for (const [u, s] of results) console.log(`${s}\t${u}`);
if (bad.length) {
  console.error(`\n${bad.length} broken link(s)`);
  process.exit(1);
}
