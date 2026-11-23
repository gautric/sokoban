// ── UNIT TESTS: index.html import map (pinned CDN + integrity coverage) ──
//
// Offline check (no network): every bare import used in src/ resolves through
// the import map, Three.js stays pinned to one version, and every addon module
// imported by src/ has a Subresource Integrity hash. The addons' own relative
// imports (Pass.js, shaders…) are listed by hand in index.html; refresh them
// when you add an addon.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);

function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? jsFiles(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []);
}
const bare = new Set(jsFiles(join(ROOT, 'src')).flatMap(f =>
  [...readFileSync(f, 'utf8').matchAll(/from\s*'([^'.][^']*)'/g)].map(m => m[1])));

function resolveBare(spec) {
  if (map.imports[spec]) return map.imports[spec];
  const prefix = Object.keys(map.imports).filter(k => k.endsWith('/') && spec.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? map.imports[prefix] + spec.slice(prefix.length) : null;
}

test('every bare import in src/ resolves through the import map', () => {
  for (const spec of bare) assert.ok(resolveBare(spec), `"${spec}" is not in the import map`);
});

test('Three.js is pinned to a single exact version', () => {
  const versions = new Set(Object.values(map.imports).map(u => u.match(/three@([^/]+)\//)?.[1]));
  assert.equal(versions.size, 1);
  assert.match([...versions][0], /^\d+\.\d+\.\d+$/);
});

test('every module imported from src/ has an integrity hash', () => {
  for (const spec of bare) {
    const url = resolveBare(spec);
    assert.match(map.integrity?.[url] ?? '', /^sha(256|384|512)-/, `no integrity for ${url}`);
  }
});
