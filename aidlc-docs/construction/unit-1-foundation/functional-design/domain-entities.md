# Domain Entities — Unit 1: Foundation & Core Logic

## Enums

### TileType
`EMPTY` | `WALL` | `FLOOR` | `TARGET`

### EntityType
`NONE` | `PLAYER` | `BOX`

### Direction
`UP` | `DOWN` | `LEFT` | `RIGHT`

### MoveResult
`MOVED` | `PUSHED` | `BLOCKED`

## Data Structures

### BoardState
```
{ tiles: TileType[][], entities: EntityType[][], playerPos: {x, y}, boxPositions: [{x, y}] }
```

### ParsedLevel
```
{ title: string, width: int, height: int, tiles: TileType[][], entities: EntityType[][], playerStart: {x, y}, boxStarts: [{x, y}], targetPositions: [{x, y}] }
```

### ParsedPack
```
{ collection: string, author: string, levels: ParsedLevel[] }
```

### LevelProgress
```
{ solved: bool, bestMoves: int, bestPushes: int, stars: int }
```

### AudioSettings
```
{ masterVolume: float, musicVolume: float, sfxVolume: float, muted: bool }
```

### InputCallbacks
```
{ onMove: (Direction) => void, onUndo: () => void, onRestart: () => void, onRotateLeft: () => void, onRotateRight: () => void, onZoomIn: () => void, onZoomOut: () => void, onToggleMute: () => void, onPause: () => void }
```
