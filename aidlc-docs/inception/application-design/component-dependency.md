# Component Dependencies — Kiro's Ghost Sokoban

## Dependency Matrix

| Component | Depends On |
|---|---|
| main.js | SceneManager, AudioManager, StateManager, LevelManager, InputHandler |
| SceneManager | MenuScene, LevelSelectScene, GameScene, AudioManager |
| MenuScene | PixelButton, BoardRenderer (demo), SceneManager |
| LevelSelectScene | PixelButton, LevelManager, StateManager, SceneManager |
| GameScene | Board, BoardRenderer, PlayerRenderer, IsometricCamera, InputHandler, StateManager, LevelManager, AudioManager, HUD, PauseMenu, LevelCompleteUI, CompassOverlay, ZoomIndicator |
| Board | (none — pure state) |
| LevelParser | (none — pure function) |
| LevelManager | LevelParser, StateManager |
| InputHandler | (none — event listener, callbacks) |
| StateManager | (none — localStorage wrapper) |
| IsometricCamera | (Three.js only) |
| BoardRenderer | TileFactory, PixelTextures, Board |
| TileFactory | PixelTextures |
| PlayerRenderer | PixelTextures |
| PixelTextures | (Canvas2D only) |
| AudioManager | MusicEngine, SFXEngine |
| MusicEngine | (Web Audio API only) |
| SFXEngine | (Web Audio API only) |
| HUD | (DOM only) |
| PauseMenu | PixelButton |
| LevelCompleteUI | PixelButton |
| PixelButton | (DOM only) |
| CompassOverlay | (Three.js only) |
| ZoomIndicator | (DOM only) |

## Dependency Layers

```
Layer 0 (No deps):  Board, LevelParser, InputHandler, StateManager,
                     PixelTextures, MusicEngine, SFXEngine,
                     PixelButton, ZoomIndicator, HUD

Layer 1:            LevelManager (→ LevelParser, StateManager)
                     TileFactory (→ PixelTextures)
                     AudioManager (→ MusicEngine, SFXEngine)
                     IsometricCamera, CompassOverlay
                     PauseMenu, LevelCompleteUI (→ PixelButton)

Layer 2:            BoardRenderer (→ TileFactory, PixelTextures, Board)
                     PlayerRenderer (→ PixelTextures)

Layer 3:            MenuScene, LevelSelectScene, GameScene
                     (→ Layer 0-2 components)

Layer 4:            SceneManager (→ all scenes, AudioManager)

Layer 5:            main.js (→ SceneManager + singletons)
```

## Communication Patterns
- **Callbacks/Events**: InputHandler fires callbacks registered by GameScene
- **Direct method calls**: GameScene calls Board.tryMove(), BoardRenderer.updateBoard(), etc.
- **State reads**: LevelSelectScene reads LevelManager.getLevelList() and StateManager progress
- **Singleton access**: AudioManager, StateManager, LevelManager are created once in main.js and passed via constructor injection
