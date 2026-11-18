import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const profile = JSON.parse(read('content/profile.json'));
const readme = read('README.md');

const imageKeys = () => [
  'header',
  ...Object.keys(profile.sections).map((k) => `section-${k}`),
  ...profile.ha.map((p) => p.key),
  ...profile.more.map((p) => p.key),
  ...profile.contact.map((c) => c.key),
];

test('no emoji in copy and README', () => {
  for (const [name, text] of [['profile.json', read('content/profile.json')], ['README.md', readme]]) {
    assert.doesNotMatch(text, /\p{Extended_Pictographic}/u, name);
    assert.doesNotMatch(text, /(^|\s):[a-z0-9_+-]+:(\s|$)/m, `${name} emoji shortcode`);
  }
});

test('no dash punctuation', () => {
  for (const [name, text] of [['profile.json', read('content/profile.json')], ['README.md', readme]]) {
    assert.doesNotMatch(text, /[—–]/, name);
  }
});

test('no comma next to "und" in copy', () => {
  assert.doesNotMatch(read('content/profile.json'), /, und\b|\bund,/);
});

test('every image has both themes', () => {
  for (const key of imageKeys()) {
    for (const theme of ['light', 'dark']) {
      assert.ok(fs.existsSync(path.join(root, 'img', `${key}-${theme}.svg`)), `img/${key}-${theme}.svg`);
    }
  }
});

test('svgs are outlined and self-contained', () => {
  const files = fs.readdirSync(path.join(root, 'img')).filter((f) => f.endsWith('.svg'));
  assert.ok(files.length > 0);
  for (const f of files) {
    const svg = read(`img/${f}`);
    assert.doesNotMatch(svg, /<text/, f);
    assert.doesNotMatch(svg, /href="http/, f);
  }
});

test('readme references every image key in both themes', () => {
  for (const key of imageKeys()) {
    assert.ok(readme.includes(`img/${key}-dark.svg`), `${key} dark`);
    assert.ok(readme.includes(`img/${key}-light.svg`), `${key} light`);
  }
});

test('readme keeps video markers', () => {
  assert.equal(readme.split('<!-- VIDEOS:START -->').length - 1, 1);
  assert.equal(readme.split('<!-- VIDEOS:END -->').length - 1, 1);
});

test('readme has no stock widgets', () => {
  for (const w of ['capsule-render', 'readme-typing-svg', 'shields.io', 'skillicons', 'komarev', 'streak-stats', 'activity-graph', 'snake', 'profile-3d-contrib']) {
    assert.ok(!readme.includes(w), w);
  }
});

test('every img has alt', () => {
  const imgs = readme.match(/<img\b[^>]*>/g) ?? [];
  assert.ok(imgs.length > 0);
  for (const img of imgs) assert.match(img, /\balt="[^"]+"/, img);
});

test('no private material in README', () => {
  for (const w of ['Sutton', 'Verlassene Orte', 'Pixelgranaten', 'Kamerakram', 'instagram', 'ZDF', 'tageslicht']) {
    assert.ok(!readme.toLowerCase().includes(w.toLowerCase()), w);
  }
});

test('video cards are linked and embed their thumbnails', () => {
  const block = readme.match(/<!-- VIDEOS:START -->([\s\S]*?)<!-- VIDEOS:END -->/)[1];
  const cards = [...block.matchAll(/img\/videos\/([a-z0-9-]+)-light\.svg/g)].map((m) => m[1]);
  assert.ok(cards.length > 0, 'no video cards');
  for (const slug of cards) {
    const svg = read(`img/videos/${slug}-dark.svg`);
    assert.doesNotMatch(svg, /<text|href="http/, slug);
  }
});

test('no LinkedIn', () => {
  assert.ok(!readme.toLowerCase().includes('linkedin'));
  assert.ok(!read('content/profile.json').toLowerCase().includes('linkedin'));
});

test('picture sources use only color-scheme media', () => {
  // GitHub replaces the whole media of themed sources when a viewer picks a theme explicitly,
  // so any width condition next to a color-scheme one would break for those viewers.
  for (const m of readme.matchAll(/<source media="([^"]+)"/g)) assert.equal(m[1], '(prefers-color-scheme: dark)');
});
