// ── UNIT TESTS: architecture boundary (src/core stays free of Three.js) ──
//
// CLAUDE.md rule: "Keep core/ free of Three.js". This test walks the static
// import graph of every src/core module and fails if it reaches the bare
// `three` specifier, a `three/addons/*` path, or anything under src/rendering/.
// It reads source text only, so it never executes browser code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const IMPORT_RE = /^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm;

function importsOf(file) {
  const text = readFileSync(file, 'utf8');
  return [...text.matchAll(IMPORT_RE)].map(m => m[1] ?? m[2]);
}

// Returns the chain of files from `entry` to the first forbidden import, or null.
function findForbidden(entry) {
  const seen = new Set();
  const walk = (file, chain) => {
    if (seen.has(file)) return null;
    seen.add(file);
    for (const spec of importsOf(file)) {
      if (spec === 'three' || spec.startsWith('three/')) return [...chain, spec];
      if (!spec.startsWith('.')) continue;
      const next = resolve(dirname(file), spec);
      if (next.startsWith(join(SRC, 'rendering'))) return [...chain, relative(ROOT, next)];
      const hit = walk(next, [...chain, relative(ROOT, next)]);
      if (hit) return hit;
    }
    return null;
  };
  return walk(entry, [relative(ROOT, entry)]);
}

const coreDir = join(SRC, 'core');
for (const name of readdirSync(coreDir).filter(n => n.endsWith('.js'))) {
  test(`src/core/${name} does not reach Three.js or src/rendering`, () => {
    const chain = findForbidden(join(coreDir, name));
    assert.equal(chain, null, chain ? `forbidden import chain: ${chain.join(' -> ')}` : '');
  });
}
