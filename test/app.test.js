// ── UNIT TESTS: app wiring — GameFacade (FACADE) and log mode hookup ──
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameFacade } from '../src/patterns/structural.js';
import { EventBus } from '../src/patterns/behavioral.js';
import { attachLogMode } from '../src/app/logMode.js';
import { Direction, MoveResult } from '../src/config.js';

function fakes() {
  const calls = [];
  return {
    calls,
    levels: { loadPacks: async () => calls.push('loadPacks') },
    scenes: {
      switchTo: (n) => calls.push(`switchTo ${n}`),
      update: (dt) => calls.push(`update ${dt}`),
      render: () => calls.push('render'),
      resize: (w, h) => calls.push(`scenes.resize ${w}x${h}`),
    },
    renderer: {
      beginFrame: () => calls.push('beginFrame'),
      resize: (w, h) => calls.push(`renderer.resize ${w}x${h}`),
      target: 'three',
    },
  };
}

test('GameFacade.init loads levels, then opens the menu', async () => {
  const f = fakes();
  await new GameFacade(f).init();
  assert.deepEqual(f.calls, ['loadPacks', 'switchTo menu']);
});

test('GameFacade.tick updates, clears, then renders one frame', () => {
  const f = fakes();
  new GameFacade(f).tick(16);
  assert.deepEqual(f.calls, ['update 16', 'beginFrame', 'render']);
});

test('GameFacade.start runs the loop until stop', () => {
  const f = fakes();
  const frames = [];
  const facade = new GameFacade({ ...f, raf: (cb) => frames.push(cb), now: () => 100 });
  facade.start();
  facade.start(); // second start is ignored
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.equal(frames.length, 1);
  facade.stop();
  frames.shift()();
  assert.equal(frames.length, 0);
});

test('GameFacade.resize resizes the renderer and the scenes', () => {
  const f = fakes();
  new GameFacade(f).resize(800, 600);
  assert.deepEqual(f.calls, ['renderer.resize 800x600', 'scenes.resize 800x600']);
});

test('attachLogMode prints scene, level, move and game lines', () => {
  const lines = [];
  const log = (scope, ...args) => lines.push(`[${scope}] ${args.join(' ')}`);
  const sceneEvents = new EventBus();
  const sceneManager = { onSceneChange: (cb) => sceneEvents.on('scene:changed', cb) };
  const gameEvents = new EventBus();

  attachLogMode({ sceneManager, gameEvents, levelCount: 40, log });
  sceneEvents.emit('scene:changed', { from: 'menu', to: 'game', args: [0] });
  gameEvents.emit('level:loaded', { levelId: 0 });
  gameEvents.emit('player:moved', { direction: Direction.UP, result: MoveResult.PUSHED, pos: { x: 1, y: 3 } });
  gameEvents.emit('game:won');

  assert.deepEqual(lines, [
    '[boot] 40 levels loaded',
    '[scene] menu -> game 0',
    '[level] loaded 0',
    '[move] UP PUSHED (1,3)',
    '[game] won',
  ]);
});
