# Unit of Work Dependencies — Kiro's Ghost Sokoban

## Dependency Matrix

| Unit | Depends On | Dependency Type |
|---|---|---|
| Unit 1: Foundation & Core Logic | (none) | — |
| Unit 2: Level Data & Management | Unit 1 | Uses LevelParser, StateManager |
| Unit 3: Rendering Engine | Unit 1 | Reads Board state for rendering |
| Unit 4: Audio Engine | (none) | Standalone, receives play commands |
| Unit 5: UI & Scenes | Units 1, 2, 3, 4 | Orchestrates all units |

## Build Order (Implementation Sequence)

```
Unit 1: Foundation & Core Logic     (no dependencies)
    ↓
Unit 2: Level Data & Management     (depends on Unit 1)
Unit 3: Rendering Engine            (depends on Unit 1 for Board state)
Unit 4: Audio Engine                (independent, can parallel with 2/3)
    ↓
Unit 5: UI & Scenes                 (integrates all units)
```

**Recommended implementation order**: 1 → 2 → 3 → 4 → 5

Units 2, 3, and 4 could theoretically be built in parallel after Unit 1, but sequential order is simpler for a single developer and allows each unit to be tested incrementally.

## Integration Points

| From → To | Interface |
|---|---|
| Unit 5 → Unit 1 | GameScene calls Board.tryMove(), StateManager.pushUndo(), InputHandler callbacks |
| Unit 5 → Unit 2 | GameScene/LevelSelectScene calls LevelManager.getLevel(), getLevelList() |
| Unit 5 → Unit 3 | GameScene calls BoardRenderer.buildBoard(), PlayerRenderer.setPosition(), IsometricCamera.rotateLeft() |
| Unit 5 → Unit 4 | GameScene calls AudioManager/SFXEngine.playMove(), MusicEngine.playGameplay() |
| Unit 2 → Unit 1 | LevelManager uses LevelParser.parseSOK(), StateManager for persistence |
| Unit 3 → Unit 1 | BoardRenderer reads Board.getState() for mesh updates |
