// ── LOG MODE wiring (?log): OBSERVER — listen to scene and game events and
//    print them. Read-only: it never changes the game. ──
import { Direction, MoveResult } from '../config.js';
import { log as consoleLog, nameOf } from '../log.js';

const GAME_EVENTS = ['game:paused', 'game:resumed', 'game:won'];

/** `gameEvents` is GameScene's EventBus. `log` is injectable for tests. */
export function attachLogMode({ sceneManager, gameEvents, levelCount, log = consoleLog }) {
  log('boot', `${levelCount} levels loaded`);
  sceneManager.onSceneChange(({ from, to, args }) => log('scene', `${from} -> ${to}`, ...args));
  gameEvents.on('level:loaded', ({ levelId }) => log('level', 'loaded', levelId));
  gameEvents.on('player:moved', ({ direction, result, pos }) =>
    log('move', nameOf(Direction, direction), nameOf(MoveResult, result), `(${pos.x},${pos.y})`));
  for (const e of GAME_EVENTS) gameEvents.on(e, () => log('game', e.slice('game:'.length)));
}
