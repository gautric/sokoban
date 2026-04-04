# Application Design — Kiro's Ghost Sokoban

## Overview
Client-side browser game with 23 components across 6 layers. No backend. Three.js for 3D rendering, Web Audio API for sound, HTML/CSS for UI overlays, localStorage for persistence.

## Architecture Summary

**6 Subsystems:**
1. **Core Logic** (Layer 0): Board, LevelParser, InputHandler, StateManager — pure game state and I/O
2. **Data/Levels** (Layer 1): LevelManager — loads .sok files, tracks progress, manages star ratings
3. **Audio** (Layer 1): AudioManager → MusicEngine + SFXEngine — chiptune synthesis via Web Audio API
4. **Rendering** (Layer 1-2): IsometricCamera, BoardRenderer, TileFactory, PlayerRenderer, PixelTextures, CompassOverlay — Three.js isometric scene
5. **UI** (Layer 0-1): HUD, PauseMenu, LevelCompleteUI, PixelButton, ZoomIndicator — HTML/CSS overlays
6. **Scenes** (Layer 3-5): SceneManager, MenuScene, LevelSelectScene, GameScene — screen management and gameplay orchestration

**Key Design Decisions:**
- Board is pure state with no rendering knowledge — clean separation
- All textures generated procedurally via Canvas2D — no texture files needed
- GameScene is the central gameplay coordinator (mediator pattern)
- Components communicate via direct method calls and callback injection — no event bus needed for this scale
- Singletons (AudioManager, StateManager, LevelManager) created in main.js and injected via constructors

**See also:**
- [components.md](components.md) — Full component list with responsibilities
- [component-methods.md](component-methods.md) — Method signatures per component
- [services.md](services.md) — Orchestration patterns and data flow
- [component-dependency.md](component-dependency.md) — Dependency matrix and layer diagram
