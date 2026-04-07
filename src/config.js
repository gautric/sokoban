// Debug mode — activate via ?debug in URL or set manually
export const DEBUG = new URLSearchParams(window.location.search).has('debug');

// Game constants
export const TILE_SIZE = 1;
export const WALL_HEIGHT = 1;
export const BOX_SIZE = 0.8;
export const PLAYER_BOB_AMPLITUDE = 0.1;
export const PLAYER_BOB_PERIOD = 2000;
export const MOVE_LERP_DURATION = 110;
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

export const TileType = { EMPTY: 0, WALL: 1, FLOOR: 2, TARGET: 3 };
export const EntityType = { NONE: 0, PLAYER: 1, BOX: 2 };
export const Direction = { UP: 0, DOWN: 1, LEFT: 2, RIGHT: 3 };
export const MoveResult = { MOVED: 0, PUSHED: 1, BLOCKED: 2 };

export const DIR_VECTORS = {
  [Direction.UP]:    { x:  0, y: -1 },
  [Direction.DOWN]:  { x:  0, y:  1 },
  [Direction.LEFT]:  { x: -1, y:  0 },
  [Direction.RIGHT]: { x:  1, y:  0 },
};

// Camera rotation → direction remapping
// Index by rotation step (0=0°, 1=90°, 2=180°, 3=270°)
export const ROTATION_MAP = [
  [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT],
  [Direction.LEFT, Direction.RIGHT, Direction.DOWN, Direction.UP],
  [Direction.DOWN, Direction.UP, Direction.RIGHT, Direction.LEFT],
  [Direction.RIGHT, Direction.LEFT, Direction.UP, Direction.DOWN],
];

// Hardcoded optimal move counts for star rating (index = levelId starting at 0)
export const OPTIMAL_MOVES = [
  15,20,25,18,22,30,28,35,32,40,
  38,42,45,50,48,55,52,60,58,65,
  62,68,70,75,72,80,78,85,82,90,
  88,95,92,100,98,105,102,110,108,115
];
