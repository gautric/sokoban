// ── UNIT TESTS: ScoringContext / MoveBasedScoring (STRATEGY) ──
//
// The scoring strategies live in the behavioral pattern layer and depend only on
// config.js, so they import cleanly under Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ScoringContext, MoveBasedScoring, TimeBasedScoring } from '../src/patterns/behavioral.js';
import { OPTIMAL_MOVES } from '../src/config.js';

test('MoveBasedScoring: 3 stars at or under the optimal move count', () => {
  const s = new ScoringContext(new MoveBasedScoring());
  const optimal = 20;
  assert.equal(s.calculate(1, optimal, 0, 0, optimal), 3);
  assert.equal(s.calculate(1, optimal - 1, 0, 0, optimal), 3);
});

test('MoveBasedScoring: 2 stars between optimal and 1.5x optimal (inclusive)', () => {
  const s = new ScoringContext(new MoveBasedScoring());
  const optimal = 20; // 1.5x = 30
  assert.equal(s.calculate(1, optimal + 1, 0, 0, optimal), 2);
  assert.equal(s.calculate(1, 30, 0, 0, optimal), 2);
});

test('MoveBasedScoring: 1 star beyond 1.5x optimal', () => {
  const s = new ScoringContext(new MoveBasedScoring());
  const optimal = 20;
  assert.equal(s.calculate(1, 31, 0, 0, optimal), 1);
  assert.equal(s.calculate(1, 100, 0, 0, optimal), 1);
});

test('uses the real OPTIMAL_MOVES table for a 3-star run', () => {
  const s = new ScoringContext(new MoveBasedScoring());
  const optimal = OPTIMAL_MOVES[0]; // 15
  assert.equal(s.calculate(0, optimal, 0, 0, optimal), 3);
  assert.equal(s.calculate(0, optimal + 1, 0, 0, optimal), 2);
});

test('ScoringContext delegates to a swapped strategy at runtime', () => {
  const s = new ScoringContext(new MoveBasedScoring());
  assert.equal(s.calculate(1, 999, 0, 10, 20), 1); // move-based: far over optimal
  s.setStrategy(new TimeBasedScoring());
  assert.equal(s.calculate(1, 999, 0, 10, 20), 3); // time-based: 10s is fast
});
