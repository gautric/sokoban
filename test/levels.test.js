// ── UNIT TESTS: shipped level packs (levels/*.sok) + LevelManager.loadPacks ──
//
// Parses the real Microban packs and checks every level is playable in shape:
// one player, boxes = targets, and closed walls (the player can never walk off
// the grid or onto an EMPTY cell). Then loads both packs through LevelManager
// with a file-backed fetch() to check interleaving and ids.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LevelParser } from '../src/core/LevelParser.js';
import { LevelManager } from '../src/core/LevelManager.js';
import { TileType, EntityType, DIR_VECTORS, OPTIMAL_MOVES } from '../src/config.js';
import { isSolvable } from './support/solver.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LEVELS = join(ROOT, 'levels');
const packs = readdirSync(LEVELS).filter(n => n.endsWith('.sok'));

// Flood fill from the player over non-wall cells; true if it escapes the board.
function leaks(level) {
  const { width, height, tiles, playerStart } = level;
  const seen = new Set();
  const stack = [playerStart];
  while (stack.length) {
    const { x, y } = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) return true;
    if (tiles[y][x] === TileType.EMPTY) return true;
    const key = `${x},${y}`;
    if (seen.has(key) || tiles[y][x] === TileType.WALL) continue;
    seen.add(key);
    for (const d of Object.values(DIR_VECTORS)) stack.push({ x: x + d.x, y: y + d.y });
  }
  return false;
}

test('there is at least one level pack', () => {
  assert.ok(packs.length >= 1);
});

for (const file of packs) {
  test(`${file}: every puzzle parses and is well formed`, () => {
    const text = readFileSync(join(LEVELS, file), 'utf8');
    const { levels } = LevelParser.parseSOK(text);
    const titles = text.split('\n').filter(l => /^;/.test(l)).length;
    assert.ok(levels.length > 0, 'no level parsed');
    assert.equal(levels.length, titles, 'a titled puzzle was rejected by the parser');

    levels.forEach((lv, i) => {
      const where = `${file} #${i + 1} "${lv.title}"`;
      let players = 0, boxes = 0;
      for (const row of lv.entities) for (const e of row) {
        if (e === EntityType.PLAYER) players++;
        if (e === EntityType.BOX) boxes++;
      }
      assert.equal(players, 1, `${where}: player count`);
      assert.equal(boxes, lv.targetPositions.length, `${where}: boxes vs targets`);
      assert.equal(leaks(lv), false, `${where}: walls are not closed`);
    });
  });

  test(`${file}: every puzzle can be solved`, () => {
    const { levels } = LevelParser.parseSOK(readFileSync(join(LEVELS, file), 'utf8'));
    for (const lv of levels) {
      const r = isSolvable(lv);
      assert.ok(r !== null, `${file} "${lv.title}": solver budget exceeded`);
      assert.ok(!r.unsolvable, `${file} "${lv.title}": impossible to finish`);
    }
  });
}

test('OPTIMAL_MOVES has one par value per shipped level', async () => {
  const total = packs.reduce((n, f) =>
    n + LevelParser.parseSOK(readFileSync(join(LEVELS, f), 'utf8')).levels.length, 0);
  assert.equal(OPTIMAL_MOVES.length, total);
  for (const v of OPTIMAL_MOVES) assert.ok(Number.isInteger(v) && v > 0);
});

test('LevelManager.loadPacks interleaves both packs and numbers levels', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const text = readFileSync(join(ROOT, String(url)), 'utf8');
    return { ok: true, status: 200, text: async () => text };
  };
  try {
    const lm = new LevelManager({ getLevelProgress: () => null });
    await lm.loadPacks();
    const n1 = LevelParser.parseSOK(readFileSync(join(LEVELS, 'microban.sok'), 'utf8')).levels.length;
    const n2 = LevelParser.parseSOK(readFileSync(join(LEVELS, 'microban2.sok'), 'utf8')).levels.length;
    assert.equal(lm.getLevelCount(), n1 + n2);
    lm.levels.forEach((l, i) => assert.equal(l.id, i));
    assert.notEqual(lm.getLevel(0).pack, lm.getLevel(1).pack, 'packs alternate');
    assert.equal(lm.nextLevel(lm.getLevelCount() - 1), null);
    assert.equal(lm.getLevelList().length, n1 + n2);
  } finally {
    globalThis.fetch = realFetch;
  }
});
