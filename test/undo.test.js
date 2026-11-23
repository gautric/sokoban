// ── UNIT TESTS: undo (MEMENTO — Board originator + StateManager caretaker) ──
//
// GameScene saves a memento before every move and pops it on Z. These tests
// drive the same sequence on the pure core: Board + StateManager.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Board } from '../src/core/Board.js';
import { StateManager } from '../src/core/StateManager.js';
import { BoardMemento } from '../src/patterns/behavioral.js';
import { TileType, EntityType, Direction, MoveResult } from '../src/config.js';

const F = TileType.FLOOR, W = TileType.WALL, T = TileType.TARGET;
const N = EntityType.NONE, P = EntityType.PLAYER, B = EntityType.BOX;

// #######
// #@ $ .#
// #######
function corridor() {
  const b = new Board();
  b.loadLevel({
    width: 7, height: 3, title: 'corridor',
    tiles: [[W, W, W, W, W, W, W], [W, F, F, F, F, T, W], [W, W, W, W, W, W, W]],
    entities: [[N, N, N, N, N, N, N], [N, P, N, B, N, N, N], [N, N, N, N, N, N, N]],
    playerStart: { x: 1, y: 1 },
    targetPositions: [{ x: 5, y: 1 }],
  });
  return b;
}

function move(board, state, dir) {
  const snap = board.createMemento();
  const r = board.tryMove(dir);
  if (r !== MoveResult.BLOCKED) {
    state.pushUndo(snap);
    state.incrementMoves();
    if (r === MoveResult.PUSHED) state.incrementPushes();
  }
  return r;
}

test('memento is an independent deep copy of the board', () => {
  const b = corridor();
  const m = b.createMemento();
  b.tryMove(Direction.RIGHT);
  assert.deepEqual(m.getPlayerPos(), { x: 1, y: 1 });
  assert.equal(m.getEntities()[1][1], P);
  // Mutating what the memento hands out must not change the memento.
  m.getEntities()[1][1] = N;
  assert.equal(m.getEntities()[1][1], P);
  assert.ok(Object.isFrozen(m));
});

test('undo restores box and player after a push, step by step', () => {
  const b = corridor();
  const s = new StateManager();
  assert.equal(move(b, s, Direction.RIGHT), MoveResult.MOVED);
  assert.equal(move(b, s, Direction.RIGHT), MoveResult.PUSHED);
  assert.equal(move(b, s, Direction.RIGHT), MoveResult.PUSHED);
  assert.equal(b.isComplete(), true);
  assert.equal(s.getMoveCount(), 3);
  assert.equal(s.getPushCount(), 2);

  b.restoreMemento(s.popUndo());
  assert.equal(b.isComplete(), false);
  assert.equal(b.getEntity(4, 1), B);
  assert.deepEqual(b.playerPos, { x: 3, y: 1 });

  b.restoreMemento(s.popUndo());
  b.restoreMemento(s.popUndo());
  assert.deepEqual(b.playerPos, { x: 1, y: 1 });
  assert.equal(b.getEntity(3, 1), B);
  assert.equal(s.popUndo(), null, 'stack is empty after undoing every move');
});

test('blocked moves are not recorded', () => {
  const b = corridor();
  const s = new StateManager();
  assert.equal(move(b, s, Direction.LEFT), MoveResult.BLOCKED);
  assert.equal(s.popUndo(), null);
  assert.equal(s.getMoveCount(), 0);
});

test('clearUndo empties the stack and resets counters', () => {
  const b = corridor();
  const s = new StateManager();
  move(b, s, Direction.RIGHT);
  s.clearUndo();
  assert.equal(s.popUndo(), null);
  assert.equal(s.getMoveCount(), 0);
  assert.equal(s.getPushCount(), 0);
});

test('BoardMemento records a timestamp', () => {
  const m = new BoardMemento([[N]], { x: 0, y: 0 });
  assert.equal(typeof m.timestamp, 'number');
});
