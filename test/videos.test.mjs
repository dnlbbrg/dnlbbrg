import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed, videoCard, videoBlock, replaceBlock, run } from '../scripts/videos.mjs';
import { THEMES } from '../scripts/build.mjs';

const FEED = `<?xml version="1.0"?><rss><channel><title>Alles Automatisch</title>
<item><title>Mealie &amp; Home Assistant: Rezepte</title><link>https://alles-automatisch.de/videos/mealie</link><pubDate>Wed, 18 Nov 2026 08:00:00 GMT</pubDate></item>
<item><title><![CDATA[SolarEdge Modbus lokal]]></title><link>https://alles-automatisch.de/videos/solaredge</link><pubDate>Tue, 17 Nov 2026 10:00:00 GMT</pubDate></item>
</channel></rss>`;

test('parseFeed reads title, url and date in German format', () => {
  const items = parseFeed(FEED);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], { title: 'Mealie & Home Assistant: Rezepte', url: 'https://alles-automatisch.de/videos/mealie', date: '18.11.2026', slug: 'mealie' });
  assert.equal(items[1].title, 'SolarEdge Modbus lokal');
});

test('videoCard is outlined, embeds the thumbnail and works without one', () => {
  const v = { title: 'Ein sehr langer Videotitel über Home Assistant, Modbus und noch viel mehr Dinge, die nicht passen', url: 'u', date: '18.11.2026', slug: 's' };
  const withThumb = videoCard(v, THEMES.light, 'data:image/jpeg;base64,AAAA');
  assert.match(withThumb, /<image [^>]*href="data:image\/jpeg;base64,AAAA"/);
  assert.doesNotMatch(withThumb, /<text|href="http/);
  const without = videoCard(v, THEMES.dark, null);
  assert.doesNotMatch(without, /<image/);
});

test('videoBlock links every card and keeps the markers', () => {
  const block = videoBlock(parseFeed(FEED));
  assert.match(block, /^<!-- VIDEOS:START -->\n/);
  assert.match(block, /<!-- VIDEOS:END -->$/);
  assert.match(block, /href="https:\/\/alles-automatisch.de\/videos\/mealie"/);
  assert.match(block, /img\/videos\/mealie-dark\.svg/);
  assert.match(block, /alt="Video vom 18.11.2026: Mealie &amp; Home Assistant: Rezepte"/);
});

test('replaceBlock swaps only the marked block', () => {
  const readme = 'a\n<!-- VIDEOS:START -->\nold\n<!-- VIDEOS:END -->\nb';
  assert.equal(replaceBlock(readme, '<!-- VIDEOS:START -->\nnew\n<!-- VIDEOS:END -->'), 'a\n<!-- VIDEOS:START -->\nnew\n<!-- VIDEOS:END -->\nb');
});

test('run leaves everything untouched when the feed fails', async () => {
  let wrote = false;
  const result = await run({
    fetchText: async () => { throw new Error('offline'); },
    writeFiles: () => { wrote = true; },
  });
  assert.equal(result, 'kept');
  assert.equal(wrote, false);
});

test('run keeps going when one thumbnail fails', async () => {
  let files = null;
  const result = await run({
    fetchText: async (url) => {
      if (url.endsWith('feed.xml')) return FEED;
      if (url.includes('mealie')) return '<meta property="og:image" content="https://alles-automatisch.de/thumbnails/x.jpg"/>';
      throw new Error('page down');
    },
    fetchThumb: async () => { throw new Error('image down'); },
    writeFiles: (f) => { files = f; },
  });
  assert.equal(result, 'updated');
  assert.equal(files.cards.length, 4);
});
