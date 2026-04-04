# Business Logic Model — Unit 1: Foundation & Core Logic

## Board — Sokoban Game State Machine

### State Representation
- 2D array of `TileType` enums: `EMPTY`, `WALL`, `FLOOR`, `TARGET`
- Separate entity layer: `EntityType` enums: `NONE`, `PLAYER`, `BOX`
- Player position: `{x, y}` grid coordinates
- Box positions: array of `{x, y}`

### Move Algorithm
```
tryMove(direction):
  nextPos = playerPos + directionVector[direction]
  
  if outOfBounds(nextPos) or isWall(nextPos):
    return BLOCKED
  
  if hasBox(nextPos):
    pushPos = nextPos + directionVector[direction]
    if outOfBounds(pushPos) or isWall(pushPos) or hasBox(pushPos):
      return BLOCKED
    moveBox(nextPos, pushPos)
    movePlayer(nextPos)
    return PUSHED
  
  movePlayer(nextPos)
  return MOVED
```

### Win Detection
```
isComplete():
  for each target position:
    if no box at target position: return false
  return true
```

### State Snapshot (for undo)
- Deep copy of entity layer + player position + box positions
- Lightweight: only entity positions, not tile grid (tiles don't change)

---

## LevelParser — XSB Format Parser

### Parse Algorithm
```
parseSOK(text):
  strip BOM if present
  extract metadata lines (Collection:, Author:)
  split remaining text on blank lines → level blocks
  for each block:
    extract title from leading ; comment lines
    parse grid lines: map characters to TileType + EntityType
    pad rows to equal width
    validate: exactly 1 player, boxCount == targetCount, boxCount >= 1
  return { metadata, levels[] }
```

### Character Mapping
| Char | Tile | Entity |
|---|---|---|
| `#` | WALL | NONE |
| ` ` | FLOOR | NONE |
| `.` | TARGET | NONE |
| `@` | FLOOR | PLAYER |
| `+` | TARGET | PLAYER |
| `$` | FLOOR | BOX |
| `*` | TARGET | BOX |

---

## StateManager — Persistence & Undo

### Undo Stack
- Array of BoardState snapshots
- pushUndo(): push current state before each move
- popUndo(): pop last state, restore board, decrement counters appropriately
- clearUndo(): reset on level load/restart

### localStorage Schema
```
kiro-sokoban-progress: {
  levels: {
    [levelId]: { solved: bool, bestMoves: int, bestPushes: int, stars: int }
  },
  currentLevel: int,
  unlockedLevel: int
}
kiro-sokoban-audio: { masterVolume: float, musicVolume: float, sfxVolume: float, muted: bool }
kiro-sokoban-session: { levelId: int, undoStack: BoardState[], moves: int, pushes: int }
```

---

## InputHandler — Direction Mapping with Camera Rotation

### Camera-Relative Direction Mapping
The camera can be at 0°, 90°, 180°, or 270°. "Up" on screen always means "away from camera."

```
Direction vectors (board space):
  UP    = {x: 0, y: -1}
  DOWN  = {x: 0, y: +1}
  LEFT  = {x: -1, y: 0}
  RIGHT = {x: +1, y: 0}

Rotation mapping (cameraAngle → key-to-direction):
  0°:   Up→UP, Down→DOWN, Left→LEFT, Right→RIGHT
  90°:  Up→LEFT, Down→RIGHT, Left→DOWN, Right→UP
  180°: Up→DOWN, Down→UP, Left→RIGHT, Right→LEFT
  270°: Up→RIGHT, Down→LEFT, Left→UP, Right→DOWN
```

### Mouse Input
- Mouse drag: track deltaX on mousemove while mousedown → accumulate rotation
- Scroll wheel: deltaY → zoom adjustment
- No player movement from mouse

---

## config.js — Constants

```
TILE_SIZE: 1
WALL_HEIGHT: 1
BOX_SIZE: 0.8
PLAYER_BOB_AMPLITUDE: 0.1
PLAYER_BOB_PERIOD: 2000 (ms)
MOVE_LERP_DURATION: 150 (ms)
OCCLUSION_FADE_DURATION: 200 (ms)
OCCLUSION_MIN_OPACITY: 0.15
CAMERA_ROTATION_DURATION: 300 (ms)
ZOOM_MIN: -45 (%)
ZOOM_MAX: 45 (%)
ZOOM_STEP: 5 (%)
PARTICLE_COLOR: 0x7B61FF
PARTICLE_LIFETIME: 800 (ms)
PARTICLE_SPAWN_RATE_IDLE: 3
PARTICLE_SPAWN_RATE_MOVING: 5
```
