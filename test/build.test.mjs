import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadFont, renderText, wrap, measure } from '../scripts/build.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('renderText returns outlined path markup', () => {
  const font = loadFont('DDINRegular.ttf');
  const out = renderText(font, 'Grüße', 0, 20, 20, '#000');
  assert.match(out, /^<path /);
  assert.doesNotMatch(out, /<text/);
  assert.match(out, /d="M/);
});

test('wrap breaks lines within the width', () => {
  const font = loadFont('DDINRegular.ttf');
  const lines = wrap(font, 'eins zwei drei vier fünf sechs sieben acht', 20, 120);
  assert.ok(lines.length > 1);
  for (const l of lines) assert.ok(measure(font, l, 20) <= 120 || !l.includes(' '), l);
});

test('build is deterministic', () => {
  const run = () => execFileSync('node', ['scripts/build.mjs'], { cwd: root });
  run();
  const first = fs.readFileSync(path.join(root, 'img/header-light.svg'), 'utf8');
  run();
  assert.equal(fs.readFileSync(path.join(root, 'img/header-light.svg'), 'utf8'), first);
});

test('kerned strings never produce NaN path data', () => {
  const font = loadFont('DDINDINBold.ttf');
  assert.doesNotMatch(renderText(font, 'YouTube', 0, 30, 20, '#000'), /NaN/);
});
