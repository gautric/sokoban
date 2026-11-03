// ── UNIT TESTS: LevelParser.parseSOK (.sok format → level objects) ──
//
// LevelParser transitively imports the Three.js-backed pattern layer (via
// LevelBuilder), so we register a resolve hook that stubs the bare `three`
// specifier, then dynamically import the parser once the hook is active.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mod from 'node:module';

// Stub the bare `three` specifier before the parser's import graph loads.
// Prefer the in-thread registerHooks() API (Node >= 22.15 / 23.5); fall back to
// the worker-thread register() on older runtimes.
const STUB = new URL('./support/three-stub.mjs', import.meta.url).href;
const resolveThree = (specifier, context, nextResolve) =>
  (specifier === 'three' || specifier.startsWith('three/'))
    ? { url: STUB, shortCircuit: true }
    : nextResolve(specifier, context);

if (typeof mod.registerHooks === 'function') mod.registerHooks({ resolve: resolveThree });
else mod.register('./support/three-loader.mjs', import.meta.url);

const { LevelParser } = await import('../src/core/LevelParser.js');

test('parses a valid .sok pack with header + titled level', () => {
  const sok = [
    'Collection: Test',
    'Author: Me',
    '; First',
    '#####',
    '#@$.#',
    '#####',
  ].join('\n');

  const pack = LevelParser.parseSOK(sok);
  assert.equal(pack.collection, 'Test');
  assert.equal(pack.author, 'Me');
  assert.equal(pack.levels.length, 1);

  const lvl = pack.levels[0];
  assert.equal(lvl.title, 'First');
  assert.equal(lvl.width, 5);
  assert.equal(lvl.height, 3);
  assert.deepEqual(lvl.playerStart, { x: 1, y: 1 });
  assert.deepEqual(lvl.targetPositions, [{ x: 3, y: 1 }]);
});

test('rejects a level with no player', () => {
  const sok = [
    '####',
    '#$.#',
    '####',
  ].join('\n');
  assert.equal(LevelParser.parseSOK(sok).levels.length, 0);
});

test('rejects a level with no boxes', () => {
  const sok = [
    '####',
    '#@.#',
    '####',
  ].join('\n');
  assert.equal(LevelParser.parseSOK(sok).levels.length, 0);
});

test('rejects a level where box count != target count', () => {
  const sok = [
    '######',
    '#@$$.#',
    '######',
  ].join('\n');
  assert.equal(LevelParser.parseSOK(sok).levels.length, 0);
});

test('keeps only the valid levels when a pack mixes valid and invalid', () => {
  const sok = [
    '; good',
    '#####',
    '#@$.#',
    '#####',
    '',
    '; bad-no-player',
    '####',
    '#$.#',
    '####',
  ].join('\n');
  const pack = LevelParser.parseSOK(sok);
  assert.equal(pack.levels.length, 1);
  assert.equal(pack.levels[0].title, 'good');
});
