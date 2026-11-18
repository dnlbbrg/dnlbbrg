// Renders the newest Alles Automatisch videos as cards (thumbnail plus outlined date and title)
// and writes them into README.md between the VIDEOS markers. Runs daily in GitHub Actions.
// Fail-open: if the feed cannot be read, nothing is changed; a missing thumbnail only drops the image.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { F, THEMES, CARD, renderText, wrap, measure, arrow, svg, esc } from './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FEED_URL = 'https://alles-automatisch.de/feed.xml';
export const COUNT = 4;

const decode = (s) =>
  s
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].trim()) : '';
};

export function parseFeed(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const url = tag(item, 'link');
    const d = new Date(tag(item, 'pubDate'));
    const date = `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;
    return { title: tag(item, 'title'), url, date, slug: url.replace(/\/+$/, '').split('/').pop() };
  });
}

const THUMB_W = CARD - 12;
const THUMB_H = Math.round((THUMB_W * 9) / 16);

// One card: thumbnail (embedded, so camo never has to fetch it), date label, title in up to two lines.
export function videoCard(v, t, thumb) {
  const top = thumb ? THUMB_H + 22 : 0;
  const image = thumb
    ? `<image href="${thumb}" x="0" y="0" width="${THUMB_W}" height="${THUMB_H}" preserveAspectRatio="xMidYMid slice"/>`
    : '';
  const date = renderText(F.label(), v.date, 0, top + 18, 13, t.accent, { tracking: 0.12 });
  let lines = wrap(F.display(), v.title, 28, THUMB_W - 4);
  if (lines.length > 2) {
    let second = lines[1];
    while (second.includes(' ') && measure(F.display(), `${second} …`, 28) > THUMB_W - 4) second = second.replace(/\s+\S+$/, '');
    lines = [lines[0], `${second.replace(/[,:;.]$/, '')} …`];
  }
  const title = lines.map((l, i) => renderText(F.display(), l, 0, top + 54 + i * 32, 28, t.ink)).join('');
  const height = top + 54 + 32 + 26;
  return svg(CARD, height, image + date + arrow(THUMB_W - 12, top + 6, 12, t.accent, 1.75) + title, esc(`${v.date}: ${v.title}`));
}

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function videoBlock(videos) {
  const cards = videos
    .map(
      (v) =>
        `<a href="${attr(v.url)}"><picture><source media="(prefers-color-scheme: dark)" srcset="img/videos/${v.slug}-dark.svg"><img src="img/videos/${v.slug}-light.svg" alt="${attr(`Video vom ${v.date}: ${v.title}`)}" width="${CARD}"></picture></a>`,
    )
    .join('\n');
  return `<!-- VIDEOS:START -->\n<p>${cards}</p>\n<!-- VIDEOS:END -->`;
}

export function replaceBlock(readme, block) {
  return readme.replace(/<!-- VIDEOS:START -->[\s\S]*?<!-- VIDEOS:END -->/, block);
}

async function defaultFetchText(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

async function defaultFetchThumb(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const jpg = await sharp(Buffer.from(await r.arrayBuffer()))
    .resize(THUMB_W * 2, THUMB_H * 2, { fit: 'cover' })
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
}

function defaultWriteFiles({ cards, block }) {
  const dir = path.join(root, 'img/videos');
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set(cards.map((c) => c.file));
  for (const f of fs.readdirSync(dir)) if (!keep.has(f)) fs.unlinkSync(path.join(dir, f));
  for (const c of cards) fs.writeFileSync(path.join(dir, c.file), c.content);
  const file = path.join(root, 'README.md');
  fs.writeFileSync(file, replaceBlock(fs.readFileSync(file, 'utf8'), block));
}

export async function run({ fetchText = defaultFetchText, fetchThumb = defaultFetchThumb, writeFiles = defaultWriteFiles } = {}) {
  let videos;
  try {
    videos = parseFeed(await fetchText(FEED_URL)).slice(0, COUNT);
    if (!videos.length) throw new Error('feed has no items');
  } catch (e) {
    console.warn(`videos: feed not readable, README kept as is (${e.message})`);
    return 'kept';
  }
  const cards = [];
  for (const v of videos) {
    let thumb = null;
    try {
      const page = await fetchText(v.url);
      const og = page.match(/<meta property="og:image" content="([^"]+)"/);
      if (og) thumb = await fetchThumb(og[1]);
    } catch (e) {
      console.warn(`videos: no thumbnail for ${v.slug} (${e.message})`);
    }
    for (const [theme, t] of Object.entries(THEMES)) cards.push({ file: `${v.slug}-${theme}.svg`, content: videoCard(v, t, thumb) });
  }
  writeFiles({ cards, block: videoBlock(videos) });
  return 'updated';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(await run());
