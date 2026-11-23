// ── UNIT TESTS: StateManager persistence (localStorage) ──
//
// Node has no localStorage, so each test installs a tiny in-memory stand-in on
// globalThis. Covers defaults, corrupted JSON, best-score merging and sessions.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { StateManager } from '../src/core/StateManager.js';
import { MoveResult } from '../src/config.js';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  keys() { return [...this.map.keys()]; }
}

let storage;
beforeEach(() => { storage = new MemoryStorage(); globalThis.localStorage = storage; });

test('defaults when nothing is stored', () => {
  const s = new StateManager();
  assert.deepEqual(s.getProgress(), { levels: {}, unlockedLevel: 1 });
  assert.equal(s.getLevelProgress(0), null);
  assert.equal(s.getAudioSettings().muted, false);
  assert.equal(s.loadSession(), null);
});

test('corrupted JSON falls back to defaults instead of throwing', () => {
  storage.setItem('kiro-sokoban-progress', '{not json');
  storage.setItem('kiro-sokoban-audio', '{not json');
  storage.setItem('kiro-sokoban-session', '{not json');
  const s = new StateManager();
  assert.deepEqual(s.getProgress(), { levels: {}, unlockedLevel: 1 });
  assert.equal(s.getAudioSettings().masterVolume, 0.5);
  assert.equal(s.loadSession(), null);
});

test('saveProgress keeps the best moves/pushes and the most stars', () => {
  const s = new StateManager();
  s.saveProgress(3, 40, 10, 2);
  s.saveProgress(3, 30, 12, 1);
  assert.deepEqual(s.getLevelProgress(3), { solved: true, bestMoves: 30, bestPushes: 10, stars: 2 });
  assert.equal(s.getUnlockedLevel(), 5);
});

test('all keys are namespaced kiro-sokoban-*', () => {
  const s = new StateManager();
  s.saveProgress(0, 1, 1, 3);
  s.saveAudioSettings({ masterVolume: 1, musicVolume: 1, sfxVolume: 1, muted: true });
  s.saveSession(0);
  assert.ok(storage.keys().length === 3);
  for (const k of storage.keys()) assert.match(k, /^kiro-sokoban-/);
});

test('session round-trip restores counters, clearSession removes it', () => {
  const a = new StateManager();
  a.recordMove(MoveResult.MOVED); a.recordMove(MoveResult.PUSHED);
  a.saveSession(7);

  const b = new StateManager();
  assert.deepEqual(b.loadSession(), { levelId: 7, moves: 2, pushes: 1 });
  assert.equal(b.getMoveCount(), 2);
  assert.equal(b.getPushCount(), 1);
  b.clearSession();
  assert.equal(b.loadSession(), null);
});
