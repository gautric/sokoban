// ── UNIT TESTS: VISITOR (acceptBoard + BoardStatsVisitor + BoardExportVisitor) ──
//
// Round trip: every shipped level, parsed then exported back to .sok text by
// BoardExportVisitor, must give the same grid (right-trimmed). Stats must match
// the parsed level.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LevelParser } from '../src/core/LevelParser.js';
import { acceptBoard, BoardStatsVisitor, BoardExportVisitor } from '../src/patterns/behavioral.js';

const LEVELS = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'levels');

function gridsOf(text) {
  return text.replace(/\r/g, '').split('\n\n')
    .map(b => b.split('\n').filter(l => /#/.test(l) && !/^;|:/.test(l)))
    .filter(g => g.length);
}

for (const file of readdirSync(LEVELS).filter(n => n.endsWith('.sok'))) {
  test(`${file}: export visitor reproduces every grid`, () => {
    const text = readFileSync(join(LEVELS, file), 'utf8');
    const { levels } = LevelParser.parseSOK(text);
    const grids = gridsOf(text);
    assert.equal(levels.length, grids.length);
    levels.forEach((lv, i) => {
      const v = new BoardExportVisitor(lv.width, lv.height);
      acceptBoard(lv, v);
      const out = v.toString().split('\n').map(l => l.trimEnd());
      assert.deepEqual(out, grids[i].map(l => l.trimEnd()), `${file} "${lv.title}"`);
    });
  });
}

test('stats visitor counts tiles and boxes', () => {
  const { levels: [lv] } = LevelParser.parseSOK(['#####', '#@$.#', '#*  #', '#####'].join('\n'));
  const s = new BoardStatsVisitor();
  acceptBoard(lv, s);
  assert.equal(s.walls, 14);
  assert.equal(s.targets, 2);
  assert.equal(s.boxes, 2);
  assert.equal(s.boxesOnTarget, 1);
  assert.equal(s.floors, 4);
});

test('player standing on a target exports as +', () => {
  const { levels: [lv] } = LevelParser.parseSOK(['#####', '#+$ #', '#$. #', '#####'].join('\n'));
  const v = new BoardExportVisitor(lv.width, lv.height);
  acceptBoard(lv, v);
  assert.equal(v.toString().split('\n')[1], '#+$ #');
});
