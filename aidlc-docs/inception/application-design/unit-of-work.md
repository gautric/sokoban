# Units of Work — Kiro's Ghost Sokoban

## Deployment Model
Single static web application. All units are logical modules within one codebase — no independent deployment.

---

## Unit 1: Foundation & Core Logic
**Components**: Board, LevelParser, StateManager, InputHandler, config.js
**Directory**: `src/core/`, `src/config.js`
**Responsibility**: Pure game state, Sokoban rules, level parsing, undo system, input mapping, persistence. Zero rendering or audio dependencies.
**Why grouped**: These are all Layer 0 components with no external dependencies. They form the testable game engine that everything else builds on.

## Unit 2: Level Data & Management
**Components**: LevelManager, level .sok files
**Directory**: `src/core/LevelManager.js`, `levels/`
**Responsibility**: Load and parse .sok files, curate ~40 levels, track progression, star ratings, unlock logic.
**Why grouped**: Depends only on Unit 1 (LevelParser, StateManager). Self-contained data pipeline.

## Unit 3: Rendering Engine
**Components**: IsometricCamera, BoardRenderer, TileFactory, PlayerRenderer, PixelTextures, CompassOverlay, ZoomIndicator
**Directory**: `src/rendering/`
**Responsibility**: All Three.js rendering — isometric camera, procedural textures, tile meshes, ghost sprite with particles, wall occlusion, compass overlay, zoom indicator.
**Why grouped**: All Three.js-dependent components. BoardRenderer and PlayerRenderer both depend on PixelTextures and TileFactory. CompassOverlay and ZoomIndicator are rendering-adjacent overlays.

## Unit 4: Audio Engine
**Components**: AudioManager, MusicEngine, SFXEngine
**Directory**: `src/audio/`
**Responsibility**: Web Audio API chiptune music synthesis, 8-bit SFX generation, volume/mute management.
**Why grouped**: Self-contained Web Audio API subsystem. No dependencies on other units except receiving play commands.

## Unit 5: UI & Scenes
**Components**: SceneManager, MenuScene, LevelSelectScene, GameScene, HUD, PauseMenu, LevelCompleteUI, PixelButton
**Directory**: `src/scenes/`, `src/ui/`, `index.html`, `css/style.css`
**Responsibility**: All HTML/CSS UI overlays, scene lifecycle management, GameScene gameplay orchestration, main.js bootstrap.
**Why grouped**: These are the integration layer — they wire Units 1-4 together. GameScene is the mediator that coordinates core logic, rendering, and audio. UI components share the PixelButton base and pixel font styling.

---

## Code Organization
```
/
├── index.html
├── css/style.css
├── assets/ (existing)
├── levels/*.sok
├── src/
│   ├── main.js              ← Unit 5 (bootstrap)
│   ├── config.js             ← Unit 1
│   ├── core/                 ← Unit 1 + Unit 2
│   │   ├── Board.js
│   │   ├── LevelParser.js
│   │   ├── LevelManager.js   ← Unit 2
│   │   ├── InputHandler.js
│   │   └── StateManager.js
│   ├── rendering/            ← Unit 3
│   │   ├── IsometricCamera.js
│   │   ├── BoardRenderer.js
│   │   ├── TileFactory.js
│   │   ├── PlayerRenderer.js
│   │   ├── PixelTextures.js
│   │   ├── CompassOverlay.js
│   │   └── ZoomIndicator.js
│   ├── audio/                ← Unit 4
│   │   ├── AudioManager.js
│   │   ├── MusicEngine.js
│   │   └── SFXEngine.js
│   ├── scenes/               ← Unit 5
│   │   ├── SceneManager.js
│   │   ├── MenuScene.js
│   │   ├── LevelSelectScene.js
│   │   └── GameScene.js
│   └── ui/                   ← Unit 5
│       ├── HUD.js
│       ├── PauseMenu.js
│       ├── LevelCompleteUI.js
│       └── PixelButton.js
└── lib/three.min.js
```
