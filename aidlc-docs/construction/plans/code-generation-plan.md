# Code Generation Plan — Kiro's Ghost Sokoban

## Overview
Generate all application code for 5 units in build-order sequence. Single static web app — all code at workspace root.

---

## Unit 1: Foundation & Core Logic
- [x] Step 1: Create `src/config.js` — game constants
- [x] Step 2: Create `src/core/Board.js` — Sokoban state machine (move logic, win detection, state snapshots)
- [x] Step 3: Create `src/core/LevelParser.js` — XSB .sok file parser
- [x] Step 4: Create `src/core/InputHandler.js` — keyboard + mouse input with camera-relative direction mapping
- [x] Step 5: Create `src/core/StateManager.js` — undo stack, move/push counters, localStorage persistence

## Unit 2: Level Data & Management
- [x] Step 6: Create `levels/microban.sok` — Microban level pack (~22 curated levels)
- [x] Step 7: Create `levels/microban2.sok` — Microban II level pack (~18 curated levels)
- [x] Step 8: Create `src/core/LevelManager.js` — load packs, curate levels, star ratings, progression, unlock logic

## Unit 3: Rendering Engine
- [x] Step 9: Create `src/rendering/PixelTextures.js` — procedural Canvas2D texture generation
- [x] Step 10: Create `src/rendering/TileFactory.js` — wall, floor, target, box mesh creation
- [x] Step 11: Create `src/rendering/IsometricCamera.js` — orthographic camera, rotation, zoom
- [x] Step 12: Create `src/rendering/BoardRenderer.js` — mesh grid, wall occlusion, move animation
- [x] Step 13: Create `src/rendering/PlayerRenderer.js` — ghost sprite, bobbing, particle aura
- [x] Step 14: Create `src/rendering/CompassOverlay.js` — 3D compass in separate viewport
- [x] Step 15: Create `src/rendering/ZoomIndicator.js` — HTML/CSS zoom bar

## Unit 4: Audio Engine
- [x] Step 16: Create `src/audio/MusicEngine.js` — chiptune oscillator tracks
- [x] Step 17: Create `src/audio/SFXEngine.js` — 8-bit sound effects
- [x] Step 18: Create `src/audio/AudioManager.js` — master controller, volume, mute

## Unit 5: UI & Scenes
- [x] Step 19: Create `src/ui/PixelButton.js` — reusable styled button
- [x] Step 20: Create `src/ui/HUD.js` — in-game HUD overlay
- [x] Step 21: Create `src/ui/PauseMenu.js` — pause overlay
- [x] Step 22: Create `src/ui/LevelCompleteUI.js` — win screen with stars and confetti
- [x] Step 23: Create `src/scenes/SceneManager.js` — scene lifecycle
- [x] Step 24: Create `src/scenes/MenuScene.js` — start screen
- [x] Step 25: Create `src/scenes/LevelSelectScene.js` — level grid
- [x] Step 26: Create `src/scenes/GameScene.js` — gameplay orchestrator
- [x] Step 27: Create `src/main.js` — app bootstrap
- [x] Step 28: Create `css/style.css` — global styles, pixel font, UI layout
- [x] Step 29: Create `index.html` — single entry point

---

**Total**: 29 steps across 5 units
