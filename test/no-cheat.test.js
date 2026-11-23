// ── UNIT TESTS: no cheat surface in the shipped game ──
// ?log only turns on log mode (console output). This test fails if a cheat
// or a console hook comes back: a window.__* hook, the cheat-code interpreter,
// or a DEBUG flag that could gate more than logging.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname;

function jsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? jsFiles(p) : p.endsWith('.js') ? [p] : [];
  });
}

const FORBIDDEN = [
  [/\bDEBUG\b/, 'DEBUG flag (use LOG)'],
  [/window\.__(?!boot)/, 'window.__* console hook'],
  [/CheatCode|__cheat/, 'cheat code'],
  [/AxesHelper/, 'visual debug helper'],
  [/\?debug|['"]debug['"]/, '?debug switch (renamed ?log)'],
];

test('log mode is switched on by ?log', () => {
  const text = readFileSync(join(SRC, 'config.js'), 'utf8');
  assert.match(text, /\.has\('log'\)/);
});

test('src/ has no cheat or console hook', () => {
  const hits = [];
  for (const file of jsFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const [re, what] of FORBIDDEN) {
      if (re.test(text)) hits.push(`${file.slice(SRC.length)}: ${what}`);
    }
  }
  assert.deepEqual(hits, []);
});

test('config.js exports LOG (off under Node) and no DEBUG', async () => {
  const config = await import('../src/config.js');
  assert.equal('DEBUG' in config, false);
  assert.equal(config.LOG, false);
});
