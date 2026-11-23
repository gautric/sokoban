---
name: game-dev
description: Design or change gameplay in this browser game — Sokoban rules, levels (.sok), game loop, scenes, input, undo, scoring/stars, audio, HUD and menus, save state. Use for new mechanics, new levels, game-feel tweaks, or any bug in how the game plays.
---

# Game development (Kiro's Ghost Sokoban)

## Mental model

```
input (InputHandler / TouchInputAdapter)
  -> Command (CommandHistory, undoable)
    -> Board.tryMove()      pure rules, returns MoveResult
      -> EventBus / Mediator  notify
        -> renderers animate, HUD updates, SFX play
          -> Board.isComplete() -> LevelComplete scene/UI -> stars saved
```

- **Rules live in `src/core/Board.js` only.** Rendering never decides if a move is legal.
- Game states go through `GameStateMachine`; scenes through `SceneManager`
  (`MenuScene`, `LevelSelectScene`, `GameScene`).
- Undo = Command + Memento (`Board` snapshots, `MementoCaretaker`). Every new action that
  changes the board must be undoable.
- Score strategy = `ScoringContext` + `MoveBasedScoring`; par values in
  `OPTIMAL_MOVES` in `src/config.js`.

## Game loop

`requestAnimationFrame` in `GameFacade` (`src/patterns/structural.js`) calls `sceneManager.update(dt)` then
`render(renderer)`.

- Everything time-based uses `dt` in milliseconds. Clamp big `dt` (tab switch) before use.
- Logic is instant (grid step); visuals lerp toward the logical state. Never wait for an
  animation to finish before updating the model. Buffer or ignore input while a push
  animation runs, as the existing code does.
- Pause stops `update`, not `render`.

## Levels (.sok)

Format and char table: see `/CLAUDE.md`. Packs in `/levels/`, parsed by
`LevelParser.parseSOK`, interleaved by `LevelManager.loadPacks()`.

A new level must have: one player, ≥ 1 box, boxes = targets, closed walls, and be
**solvable**. Test it by playing it (`make test` also proves it is solvable). Keep the
author credit lines (`Collection:`, `Author:`).

## Input

Key map is in `src/input/InputHandler.js` (and in `/CLAUDE.md`). When adding a key:
check it is free, add it to the HUD/help text in **both EN and JA** (`src/i18n.js`),
and support touch if it is a gameplay action.

## Game feel

Small, cheap wins: easing on moves (tunables in `config.js`), a short SFX on push / on
target / on blocked, a brief squash on the ghost, target pulse, a clear win moment.
Audio is fully synthesized in `src/audio/` (Web Audio oscillators); the
`AudioContext` starts on the first user gesture — keep it that way.

## Persistence

`StateManager` writes to `localStorage` with keys `kiro-sokoban-*`. If you change a
stored shape, read old data defensively (missing fields → defaults). Never crash on bad
JSON.

## UI text

All visible strings go through `src/i18n.js` (`data-i18n` attributes). Add the key in
EN **and** JA.

## Verify

1. `make check` (syntax + unit tests on `Board`, parser, scoring).
2. Add or update a test in `/test/` for any rule change.
3. `make serve`, open `http://localhost:8080/`, play one full level: move, push,
   undo, restart, win, next level, reload (progress kept).
