/**
 * config.js — FLYWEIGHT pattern.
 *
 * All constant objects are frozen and shared across the entire application.
 * No component creates its own copy — they all reference these flyweight instances.
 * Object.freeze() ensures immutability (true intrinsic state).
 */

// ── LOG MODE: add ?log to the URL to log game events to the console. It only
//    logs: no cheats, no console hooks. Guarded so Node (tests) can import this. ──
export const LOG = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('log');

// ── FLYWEIGHT: frozen shared game constants ──
export const TILE_SIZE = 1;
export const WALL_HEIGHT = 1;
export const BOX_SIZE = 0.8;
export const PLAYER_BOB_AMPLITUDE = 0.1;
export const PLAYER_BOB_PERIOD = 2000;
export const MOVE_LERP_DURATION = 110;
export const MOVE_SETTLE_DURATION = 160;   // delay after a move before the board redraws / win is checked
export const WIN_SCREEN_DELAY = 5000;      // auto-reveal of the level-complete screen after a win
export const OCCLUSION_FADE_DURATION = 200;
export const OCCLUSION_MIN_OPACITY = 0.15;
export const CAMERA_ROTATION_DURATION = 300;
export const CAMERA_TILT = 52;
export const TILT_MIN = 0;
export const TILT_MAX = 90;
export const TILT_STEP = 1;
export const ZOOM_MIN = -85;
export const ZOOM_MAX = 95;
export const ZOOM_STEP = 5;
export const PIXEL_SIZE_DEFAULT = 1;
export const PIXEL_SIZE_MIN = 1;
export const PIXEL_SIZE_MAX = 16;
export const PIXEL_SIZE_STEP = 1;
export const PARTICLE_COLOR = 0x7B61FF;
export const PARTICLE_LIFETIME = 800;
export const PARTICLE_SPAWN_RATE_IDLE = 3;
export const PARTICLE_SPAWN_RATE_MOVING = 5;
export const BOARD_PADDING = 2;

// ── FLYWEIGHT: frozen enum objects — shared intrinsic state ──
export const TileType = Object.freeze({ EMPTY: 0, WALL: 1, FLOOR: 2, TARGET: 3 });
export const EntityType = Object.freeze({ NONE: 0, PLAYER: 1, BOX: 2 });
export const Direction = Object.freeze({ UP: 0, DOWN: 1, LEFT: 2, RIGHT: 3 });
export const MoveResult = Object.freeze({ MOVED: 0, PUSHED: 1, BLOCKED: 2 });

export const DIR_VECTORS = Object.freeze({
  [Direction.UP]:    Object.freeze({ x:  0, y: -1 }),
  [Direction.DOWN]:  Object.freeze({ x:  0, y:  1 }),
  [Direction.LEFT]:  Object.freeze({ x: -1, y:  0 }),
  [Direction.RIGHT]: Object.freeze({ x:  1, y:  0 }),
});

// ── FLYWEIGHT: frozen rotation map — shared across InputHandler + PlayerRenderer ──
export const ROTATION_MAP = Object.freeze([
  Object.freeze([Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]),
  Object.freeze([Direction.LEFT, Direction.RIGHT, Direction.DOWN, Direction.UP]),
  Object.freeze([Direction.DOWN, Direction.UP, Direction.RIGHT, Direction.LEFT]),
  Object.freeze([Direction.RIGHT, Direction.LEFT, Direction.UP, Direction.DOWN]),
]);

// ── FLYWEIGHT: frozen optimal moves array ──
// Minimum moves per level (interleaved order of LevelManager.loadPacks()),
// computed by a move-optimal solver. Regenerate after editing levels: `make par`.
export const OPTIMAL_MOVES = Object.freeze([
  33,44,16,27,41,46,23,61,25,61,
  107,55,26,47,97,40,30,32,89,23,
  78,39,49,87,52,75,51,29,37,40,
  100,80,25,40,71,71,41,50,17,47
]);
