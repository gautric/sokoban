// ── UNIT TESTS: undo (COMMAND + MEMENTO) ──
//
// GameScene runs each move as a MoveCommand. The command takes a BoardMemento
// (Board is the originator) and CommandHistory keeps the commands (caretaker).
// StateManager only counts moves and pushes. These tests drive the same flow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Board } from '../src/core/Board.js';
import { StateManager } from '../src/core/StateManager.js';
import { BoardMemento, MoveCommand, CommandHistory } from '../src/patterns/behavioral.js';
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

// Same steps as GameScene._handleMove / _handleUndo.
function play(board, history, state, dir) {
  const r = history.execute(new MoveCommand(board, dir));
  state.recordMove(r);
  return r;
}
function undo(history, state) {
  const cmd = history.undo();
  if (cmd) state.undoMove(cmd.getResult());
  return cmd;
}

test('memento is an independent deep copy of the board', () => {
  const b = corridor();
  const m = b.createMemento();
  b.tryMove(Direction.RIGHT);
  assert.deepEqual(m.getPlayerPos(), { x: 1, y: 1 });
  assert.equal(m.getEntities()[1][1], P);
  m.getEntities()[1][1] = N;
  assert.equal(m.getEntities()[1][1], P);
  assert.ok(Object.isFrozen(m));
});

test('MoveCommand keeps a BoardMemento of the board before the move', () => {
  const b = corridor();
  const cmd = new MoveCommand(b, Direction.RIGHT);
  cmd.execute();
  assert.ok(cmd.memento instanceof BoardMemento);
  assert.deepEqual(cmd.memento.getPlayerPos(), { x: 1, y: 1 });
});

test('undo restores box, player and both counters, step by step', () => {
  const b = corridor();
  const h = new CommandHistory();
  const s = new StateManager();
  assert.equal(play(b, h, s, Direction.RIGHT), MoveResult.MOVED);
  assert.equal(play(b, h, s, Direction.RIGHT), MoveResult.PUSHED);
  assert.equal(play(b, h, s, Direction.RIGHT), MoveResult.PUSHED);
  assert.equal(b.isComplete(), true);
  assert.equal(s.getMoveCount(), 3);
  assert.equal(s.getPushCount(), 2);

  undo(h, s);
  assert.equal(b.isComplete(), false);
  assert.equal(b.getEntity(4, 1), B);
  assert.deepEqual(b.playerPos, { x: 3, y: 1 });
  assert.equal(s.getMoveCount(), 2);
  assert.equal(s.getPushCount(), 1, 'undoing a push gives the push back');

  undo(h, s);
  undo(h, s);
  assert.deepEqual(b.playerPos, { x: 1, y: 1 });
  assert.equal(b.getEntity(3, 1), B);
  assert.equal(s.getMoveCount(), 0);
  assert.equal(s.getPushCount(), 0);
  assert.equal(undo(h, s), null, 'nothing left to undo');
});

test('blocked moves are not recorded or counted', () => {
  const b = corridor();
  const h = new CommandHistory();
  const s = new StateManager();
  assert.equal(play(b, h, s, Direction.LEFT), MoveResult.BLOCKED);
  assert.equal(h.length, 0);
  assert.equal(s.getMoveCount(), 0);
});

test('redo replays an undone move', () => {
  const b = corridor();
  const h = new CommandHistory();
  const s = new StateManager();
  play(b, h, s, Direction.RIGHT);
  undo(h, s);
  assert.equal(h.redo(), true);
  assert.deepEqual(b.playerPos, { x: 2, y: 1 });
});

test('resetCounters sets moves and pushes back to zero', () => {
  const s = new StateManager();
  s.recordMove(MoveResult.PUSHED);
  s.resetCounters();
  assert.equal(s.getMoveCount(), 0);
  assert.equal(s.getPushCount(), 0);
});

test('BoardMemento records a timestamp', () => {
  const m = new BoardMemento([[N]], { x: 0, y: 0 });
  assert.equal(typeof m.timestamp, 'number');
});
