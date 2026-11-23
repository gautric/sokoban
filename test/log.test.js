// ── UNIT TESTS: log mode (?log) — logger and LoggingAudioDecorator ──
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLogger, nameOf } from '../src/log.js';
import { Direction, MoveResult } from '../src/config.js';
import { LoggingAudioDecorator } from '../src/patterns/structural.js';

function fakeSink() {
  const lines = [];
  return { lines, info: (...args) => lines.push(args) };
}

test('logger is silent when log mode is off', () => {
  const sink = fakeSink();
  createLogger(false, sink)('scene', 'menu');
  assert.deepEqual(sink.lines, []);
});

test('logger prefixes each line with its scope', () => {
  const sink = fakeSink();
  const log = createLogger(true, sink);
  log('scene', 'menu -> game', 3);
  assert.deepEqual(sink.lines, [['[scene]', 'menu -> game', 3]]);
});

test('nameOf turns an enum value back into its name', () => {
  assert.equal(nameOf(Direction, Direction.LEFT), 'LEFT');
  assert.equal(nameOf(MoveResult, MoveResult.PUSHED), 'PUSHED');
  assert.equal(nameOf(MoveResult, 99), '99');
});

test('LoggingAudioDecorator forwards calls and reports them to the sink', () => {
  const calls = [];
  const inner = {
    init: () => calls.push('init'),
    toggleMute: () => calls.push('toggleMute'),
    isMuted: () => true,
    setMasterVolume: (v) => calls.push(`vol ${v}`),
  };
  const seen = [];
  const audio = new LoggingAudioDecorator(inner, (action) => seen.push(action));
  audio.init();
  audio.toggleMute();
  audio.setMasterVolume(0.5);
  assert.equal(audio.isMuted(), true);
  assert.deepEqual(calls, ['init', 'toggleMute', 'vol 0.5']);
  assert.deepEqual(seen, ['init', 'toggleMute', 'setMasterVolume(0.5)']);
  assert.equal(audio.getLog().length, 3);
});

test('LoggingAudioDecorator works without a sink', () => {
  const audio = new LoggingAudioDecorator({ init() {} });
  audio.init();
  assert.equal(audio.getLog()[0].action, 'init');
});
