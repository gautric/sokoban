# Integration Test Instructions — Kiro's Ghost Sokoban

## Purpose
Verify that all 5 units work together as a complete game.

## Scenario 1: Full Game Flow (Menu → Play → Win → Next Level)
1. Open game in browser
2. Click "Play" on menu screen
3. Complete Level 1 by pushing all boxes to targets
4. On Level Complete screen, click "Next Level"
5. **Expected**: Level 2 loads, HUD shows new level name, counters reset

## Scenario 2: Level Select Flow
1. Complete Level 1
2. Return to Main Menu
3. Click "Level Select"
4. **Expected**: Level 1 shows as solved with stars, Level 2 is unlocked, remaining locked
5. Click Level 2
6. **Expected**: Level 2 loads in game scene

## Scenario 3: Audio Integration
1. Click anywhere to initialize audio (required for Web Audio API)
2. On menu: **Expected**: Menu theme plays (chiptune melody)
3. Start a level: **Expected**: Gameplay theme plays
4. Move ghost: **Expected**: Move SFX plays
5. Push box: **Expected**: Push SFX plays
6. Push box onto target: **Expected**: Chime SFX plays
7. Press Z (undo): **Expected**: Undo SFX plays
8. Complete level: **Expected**: Level complete jingle plays
9. Press M: **Expected**: All audio mutes/unmutes

## Scenario 4: Rendering Integration
1. Start a level
2. Verify: walls are 3D cubes with brick texture, floor has tile pattern, targets have red diamond markers, boxes are smaller cubes with crate texture
3. Verify: ghost sprite (ghosty.png) floats with bobbing animation
4. Verify: violet particles emit around ghost
5. Rotate camera (Q/E): verify compass rotates in sync
6. Zoom (+/-/scroll): verify zoom indicator updates
7. Move behind a wall: verify wall becomes transparent

## Scenario 5: State Persistence
1. Complete Level 1, note star rating
2. Close browser tab
3. Reopen game
4. Go to Level Select
5. **Expected**: Level 1 shows as solved with correct stars, Level 2 is unlocked

## Scenario 6: Pause Integration
1. During gameplay, press Escape
2. **Expected**: Pause overlay appears, game input disabled, timer pauses
3. Click Resume
4. **Expected**: Overlay hides, input re-enabled, timer resumes
5. Press Escape again, click "Main Menu"
6. **Expected**: Returns to menu screen, menu music plays
