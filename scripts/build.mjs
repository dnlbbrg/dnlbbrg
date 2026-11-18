// Builds every profile image from content/profile.json: one light and one dark SVG per image.
// All text is converted to outlines, so the images never depend on fonts on the viewer's machine.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const THEMES = {
  light: { ink: '#10172B', text: '#4A5263', hair: '#D0D7DE', accent: '#C0392F', mark: '#F0665B', mint: '#2F7D6B' },
  dark: { ink: '#E6EDF3', text: '#9DA5B0', hair: '#3D444D', accent: '#F0665B', mark: '#F0665B', mint: '#89C9BA' },
};

const fontCache = new Map();
export function loadFont(file) {
  if (!fontCache.has(file)) {
    const buf = fs.readFileSync(path.join(root, 'fonts', file));
    fontCache.set(file, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return fontCache.get(file);
}

export const F = {
  text: () => loadFont('DDINRegular.ttf'),
  bold: () => loadFont('DDINDINBold.ttf'),
  display: () => loadFont('DDINCondensedDINCondensedBold.ttf'),
  label: () => loadFont('DDINExpDINExpBold.ttf'),
};

// opentype.js 2.0 returns NaN for some GPOS kerning pairs in D-DIN, which truncates the path.
// So glyphs are laid out here, with kerning applied only when it is a finite number.
function layout(font, text, size, tracking = 0) {
  const glyphs = font.stringToGlyphs(text);
  const scale = size / font.unitsPerEm;
  const out = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    out.push({ glyph: g, x });
    let adv = (g.advanceWidth || 0) * scale;
    const next = glyphs[i + 1];
    if (next) {
      const k = font.getKerningValue(g, next);
      if (Number.isFinite(k)) adv += k * scale;
      adv += tracking * size;
    }
    x += adv;
  });
  return { out, width: x };
}

// Scales the glyph's raw outline directly (opentype's glyph.getPath emitted NaN in some runs).
function glyphPath(font, glyph, x, y, size) {
  const sc = size / font.unitsPerEm;
  const f = (v) => (Math.round(v * 100) / 100).toFixed(2);
  const X = (v) => f(x + v * sc);
  const Y = (v) => f(y - v * sc);
  let d = '';
  for (const c of glyph.path.commands) {
    if (c.type === 'M' || c.type === 'L') d += `${c.type}${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'Q') d += `Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'C') d += `C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  if (d.includes('NaN')) throw new Error(`NaN in outline of glyph ${glyph.name}`);
  return d;
}

// Width of a string including optional tracking (in em).
export function measure(font, text, size, tracking = 0) {
  return layout(font, text, size, tracking).width;
}

// Outlined text as one <path>. Tracking is in em.
export function renderText(font, text, x, y, size, fill, { tracking = 0, attrs = '' } = {}) {
  const d = layout(font, text, size, tracking)
    .out.map(({ glyph, x: gx }) => glyphPath(font, glyph, x + gx, y, size))
    .join('');
  return `<path ${attrs}fill="${fill}" d="${d}"/>`;
}

// Greedy word wrap by measured width.
export function wrap(font, text, size, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(font, next, size) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// A north-east arrow drawn as strokes (D-DIN has no arrow glyphs).
export function arrow(x, y, s, color, w = 2) {
  return `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="square" d="M${x} ${y + s}L${x + s} ${y}M${x + s * 0.3} ${y}H${x + s}V${y + s * 0.7}"/>`;
}

export function svg(width, height, body, title, extraStyle = '') {
  const style = extraStyle ? `<style>${extraStyle}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${title}</title>${style}${body}</svg>\n`;
}

export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---- Images ---------------------------------------------------------------

// One header for every width: sizes are chosen so the text stays legible when GitHub scales the
// 840 wide image down to a phone (about 0.4). GitHub rewrites the media of themed pictures when a
// user picks a theme explicitly, so width media queries next to color-scheme ones are not safe.
const HEADER = { w: 840, label: 24, name: 150, nameY: 186, text: 36, lh: 48, textY: 250, measure: 836, n: 14 };

function header(p, t) {
  const h = p.header;
  const L = HEADER;
  const W = L.w;
  const label = renderText(F.label(), h.label.toUpperCase(), 0, 40, L.label, t.accent, { tracking: 0.14 });
  const name = renderText(F.display(), h.name, -L.name / 30, L.nameY, L.name, t.ink);
  // Compact: each sentence starts a new line, so no single word is left hanging.
  // Each sentence starts a new line, so no single word is left hanging.
  const lines = h.line.split(/(?<=\.)\s+/).flatMap((sentence) => wrap(F.text(), sentence, L.text, L.measure));
  const line = lines.map((l, i) => renderText(F.text(), l, 0, L.textY + i * L.lh, L.text, t.text)).join('');
  // The motif: a row of circuit breakers on a DIN rail, switching on one after another.
  const top = L.textY + (lines.length - 1) * L.lh + 48;
  const n = L.n, mw = 46, gap = 14;
  // The rail shows only between and after the modules, so nothing runs through them.
  let railD = '';
  for (let i = 0; i < n; i++) {
    const from = i * (mw + gap) + mw, to = i === n - 1 ? W : from + gap;
    railD += `M${from} ${top + 34}H${to}M${from} ${top + 70}H${to}`;
  }
  const rail = `<path stroke="${t.hair}" stroke-width="1" d="${railD}"/>`;
  let mods = '';
  for (let i = 0; i < n; i++) {
    const x = i * (mw + gap);
    const lit = i === 2 || i === 7;
    const lever = lit ? t.mark : t.ink;
    mods += `<rect x="${x + 0.5}" y="${top + 0.5}" width="${mw - 1}" height="103" rx="5" fill="none" stroke="${t.ink}" stroke-opacity="0.55"/>`;
    mods += `<rect x="${x + 14.5}" y="${top + 30.5}" width="${mw - 29}" height="44" rx="3" fill="none" stroke="${t.hair}"/>`;
    mods += `<rect class="lv" style="animation-delay:${(0.35 + i * 0.07).toFixed(2)}s" x="${x + 17}" y="${top + 33}" width="${mw - 34}" height="18" rx="2" fill="${lever}"/>`;
    mods += renderText(F.label(), String(i + 1).padStart(2, '0'), x + 6, top + 18, 10, t.text, { tracking: 0.1 });
  }
  const height = top + 104 + 4;
  const css = '.lv{animation:on .28s cubic-bezier(.2,.7,.2,1) both}@keyframes on{from{transform:translateY(20px)}to{transform:none}}@media (prefers-reduced-motion:reduce){.lv{animation:none}}';
  return svg(W, height, label + name + line + rail + mods, esc(`${h.name}. ${h.line}`), css);
}

function section(s, t, W = 840) {
  const size = 30;
  const index = renderText(F.label(), s.index, 0, 70, size, t.accent, { tracking: 0.08 });
  const x = measure(F.label(), s.index, size, 0.08) + 22;
  const title = renderText(F.label(), s.title.toUpperCase(), x, 70, size, t.ink, { tracking: 0.12 });
  const tw = x + measure(F.label(), s.title.toUpperCase(), size, 0.12) + 20;
  const rule = `<rect x="0" y="0" width="${W}" height="3" fill="${t.ink}"/><path stroke="${t.hair}" d="M${tw} 59.5H${W}"/>`;
  return svg(W, 96, rule + index + title, esc(s.title));
}

export const CARD = 412;

function haCard(item, t, height) {
  const title = renderText(F.display(), item.title, -2, 70, 54, t.ink);
  const lines = wrap(F.text(), item.line, 22, CARD - 28);
  const body = lines.map((l, i) => renderText(F.text(), l, 0, 112 + i * 31, 22, t.text)).join('');
  const meta = renderText(F.label(), item.meta.toUpperCase(), 0, 112 + (lines.length - 1) * 31 + 40, 13, t.accent, { tracking: 0.12 });
  const rule = `<rect x="0" y="0" width="${CARD - 12}" height="2" fill="${t.ink}"/>`;
  return svg(CARD, height, rule + title + arrow(CARD - 40, 26, 16, t.accent) + body + meta, esc(`${item.title}: ${item.line}`));
}

function haHeight(item) {
  return 112 + (wrap(F.text(), item.line, 22, CARD - 28).length - 1) * 31 + 64;
}

function moreCard(item, t, height) {
  const title = renderText(F.display(), item.title, -1, 50, 34, t.ink);
  const lines = wrap(F.text(), item.line, 21, CARD - 52);
  const body = lines.map((l, i) => renderText(F.text(), l, 0, 82 + i * 28, 21, t.text)).join('');
  const rule = `<path stroke="${t.hair}" d="M0 0.5H${CARD - 12}"/>`;
  return svg(CARD, height, rule + title + arrow(CARD - 36, 26, 12, t.accent, 1.75) + body, esc(`${item.title}: ${item.line}`));
}

function moreHeight(item) {
  return 82 + (wrap(F.text(), item.line, 21, CARD - 52).length - 1) * 28 + 28;
}

function contactPlate(c, t) {
  const text = c.label;
  const w = Math.ceil(measure(F.bold(), text, 20) + 40);
  const label = renderText(F.bold(), text, 0, 30, 20, t.ink);
  const under = `<rect x="0" y="40" width="${w - 32}" height="2" fill="${t.mark}"/>`;
  return svg(w, 52, label + arrow(w - 24, 15, 10, t.accent, 1.75) + under, esc(c.label));
}

export function build() {
  const p = JSON.parse(fs.readFileSync(path.join(root, 'content/profile.json'), 'utf8'));
  const out = path.join(root, 'img');
  fs.mkdirSync(out, { recursive: true });
  const write = (key, theme, content) => fs.writeFileSync(path.join(out, `${key}-${theme}.svg`), content);
  const haH = Math.max(...p.ha.map(haHeight));
  const moreH = Math.max(...p.more.map(moreHeight));
  for (const [theme, t] of Object.entries(THEMES)) {
    write('header', theme, header(p, t));
    for (const [k, s] of Object.entries(p.sections)) write(`section-${k}`, theme, section(s, t));
    for (const item of p.ha) write(item.key, theme, haCard(item, t, haH));
    for (const item of p.more) write(item.key, theme, moreCard(item, t, moreH));
    for (const c of p.contact) write(c.key, theme, contactPlate(c, t));
  }
}


// ---- README -----------------------------------------------------------------

// Only color-scheme media: GitHub rewrites these to follow the viewer's GitHub theme.
function picture(key, alt, { width } = {}) {
  const w = width ? ` width="${width}"` : ' width="100%"';
  return `<picture><source media="(prefers-color-scheme: dark)" srcset="img/${key}-dark.svg"><img src="img/${key}-light.svg" alt="${alt.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"${w}></picture>`;
}

const link = (url, inner) => `<a href="${url}">${inner}</a>`;

export function readme(p, videoBlock) {
  const sec = (k) => `<p>${picture(`section-${k}`, p.sections[k].title, {})}</p>`;
  return [
    `<p>${link(p.header.url, picture('header', `${p.header.name}. ${p.header.line}`, {}))}</p>`,
    '',
    sec('ha'),
    '',
    `<p>${p.ha.map((i) => link(i.url, picture(i.key, `${i.title}: ${i.line}`, { width: CARD }))).join('\n')}</p>`,
    '',
    sec('videos'),
    '',
    videoBlock,
    '',
    sec('more'),
    '',
    `<p>${p.more.map((i) => link(i.url, picture(i.key, `${i.title}: ${i.line}`, { width: CARD }))).join('\n')}</p>`,
    '',
    sec('contact'),
    '',
    `<p>${p.contact.map((c) => link(c.url, picture(c.key, c.label, { width: null }).replace(' width="100%"', ''))).join('\n')}</p>`,
    '',
  ].join('\n');
}

// Keeps whatever scripts/videos.mjs last wrote between its markers.
export function writeReadme() {
  const p = JSON.parse(fs.readFileSync(path.join(root, 'content/profile.json'), 'utf8'));
  const file = path.join(root, 'README.md');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const m = current.match(/<!-- VIDEOS:START -->[\s\S]*?<!-- VIDEOS:END -->/);
  const block = m ? m[0] : '<!-- VIDEOS:START -->\n<!-- VIDEOS:END -->';
  fs.writeFileSync(file, readme(p, block));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build();
  writeReadme();
}
