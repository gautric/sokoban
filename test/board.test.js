// ── UNIT TESTS: Board (the Sokoban rules engine) ──
//
// Board is pure game logic with no Three.js dependency, so it runs directly under
// Node's built-in test runner. Levels are built here from tiny ASCII maps (the
// same grammar as the .sok format) to keep these tests independent of LevelParser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Board } from '../src/core/Board.js';
import { TileType, EntityType, Direction, MoveResult } from '../src/config.js';

// Build a level object (the shape Board.loadLevel expects) from an ASCII map.
function makeLevel(rows) {
  const height = rows.length;
  const width = Math.max(...rows.map(r => r.length));
  const CHAR = {
    '#': { tile: TileType.WALL,   entity: EntityType.NONE },
    ' ': { tile: TileType.FLOOR,  entity: EntityType.NONE },
    '.': { tile: TileType.TARGET, entity: EntityType.NONE },
    '@': { tile: TileType.FLOOR,  entity: EntityType.PLAYER },
    '+': { tile: TileType.TARGET, entity: EntityType.PLAYER },
    '$': { tile: TileType.FLOOR,  entity: EntityType.BOX },
    '*': { tile: TileType.TARGET, entity: EntityType.BOX },
  };
  const tiles = [], entities = [], targetPositions = [];
  let playerStart = null;
  for (let y = 0; y < height; y++) {
    const trow = [], erow = [];
    for (let x = 0; x < width; x++) {
      const ch = x < rows[y].length ? rows[y][x] : ' ';
      const m = CHAR[ch] ?? { tile: TileType.EMPTY, entity: EntityType.NONE };
      trow.push(m.tile);
      erow.push(m.entity);
      if (m.tile === TileType.TARGET) targetPositions.push({ x, y });
      if (m.entity === EntityType.PLAYER) playerStart = { x, y };
    }
    tiles.push(trow);
    entities.push(erow);
  }
  return { width, height, tiles, entities, playerStart, targetPositions, title: 'test' };
}

function boardFrom(rows) {
  const b = new Board();
  b.loadLevel(makeLevel(rows));
  return b;
}

test('MOVED: steps onto floor and updates player position + entities', () => {
  const b = boardFrom([
    '#####',
    '#@  #',
    '#####',
  ]);
  assert.equal(b.tryMove(Direction.RIGHT), MoveResult.MOVED);
  assert.deepEqual(b.playerPos, { x: 2, y: 1 });
  assert.equal(b.getEntity(2, 1), EntityType.PLAYER);
  assert.equal(b.getEntity(1, 1), EntityType.NONE);
});

test('BLOCKED: wall stops the player and leaves state unchanged', () => {
  const b = boardFrom([
    '#####',
    '#@  #',
    '#####',
  ]);
  assert.equal(b.tryMove(Direction.LEFT), MoveResult.BLOCKED);
  assert.deepEqual(b.playerPos, { x: 1, y: 1 });
  assert.equal(b.getEntity(1, 1), EntityType.PLAYER);
});

test('BLOCKED: moving out of bounds is treated as a wall', () => {
  const b = boardFrom(['@ ']); // player at (0,0), top edge
  assert.equal(b.tryMove(Direction.UP), MoveResult.BLOCKED);
  assert.deepEqual(b.playerPos, { x: 0, y: 0 });
});

test('PUSHED: box ahead with free space moves both box and player', () => {
  const b = boardFrom([
    '#####',
    '#@$ #',
    '#####',
  ]);
  assert.equal(b.tryMove(Direction.RIGHT), MoveResult.PUSHED);
  assert.deepEqual(b.playerPos, { x: 2, y: 1 });
  assert.equal(b.getEntity(3, 1), EntityType.BOX);
  assert.equal(b.getEntity(2, 1), EntityType.PLAYER);
  assert.equal(b.getEntity(1, 1), EntityType.NONE);
});

test('BLOCKED: box cannot be pushed into a wall', () => {
  const b = boardFrom([
    '####',
    '#@$#',
    '####',
  ]);
  assert.equal(b.tryMove(Direction.RIGHT), MoveResult.BLOCKED);
  assert.deepEqual(b.playerPos, { x: 1, y: 1 });
  assert.equal(b.getEntity(2, 1), EntityType.BOX);
});

test('BLOCKED: box cannot be pushed into another box', () => {
  const b = boardFrom([
    '######',
    '#@$$ #',
    '######',
  ]);
  assert.equal(b.tryMove(Direction.RIGHT), MoveResult.BLOCKED);
  assert.deepEqual(b.playerPos, { x: 1, y: 1 });
  assert.equal(b.getEntity(2, 1), EntityType.BOX);
  assert.equal(b.getEntity(3, 1), EntityType.BOX);
});

test('boxesLocked: boxes cannot be pushed, but plain moves still work', () => {
  const b = boardFrom([
    '######',
    '#@$  #',
    '######',
  ]);
  b.boxesLocked = true;
  assert.equal(b.tryMove(Direction.RIGHT), MoveResult.BLOCKED);
  assert.deepEqual(b.playerPos, { x: 1, y: 1 });
  // A move that does not involve a box is still allowed while locked.
  assert.equal(b.tryMove(Direction.DOWN), MoveResult.BLOCKED); // wall below
  const b2 = boardFrom([
    '#####',
    '#@  #',
    '#####',
  ]);
  b2.boxesLocked = true;
  assert.equal(b2.tryMove(Direction.RIGHT), MoveResult.MOVED);
});

test('isComplete: true when every target holds a box', () => {
  const b = boardFrom([
    '####',
    '#@*#',
    '####',
  ]);
  assert.equal(b.isComplete(), true);
});

test('isComplete: false when a target is still empty', () => {
  const b = boardFrom([
    '#####',
    '#@$.#',
    '#####',
  ]);
  assert.equal(b.isComplete(), false);
  // Pushing the box onto the target completes the level.
  assert.equal(b.tryMove(Direction.RIGHT), MoveResult.PUSHED);
  assert.equal(b.isComplete(), true);
});
