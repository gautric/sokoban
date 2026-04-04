# Services — Kiro's Ghost Sokoban

This is a client-side game with no backend services. The "service layer" is the orchestration pattern within the application.

## Orchestration: main.js (App Bootstrap)
- **Role**: Entry point, wires all components together
- **Responsibilities**:
  - Initialize Three.js renderer and attach to DOM
  - Create singleton instances: AudioManager, StateManager, LevelManager, InputHandler, SceneManager
  - Load level packs via LevelManager
  - Initialize AudioContext on first user interaction
  - Start SceneManager with MenuScene
  - Run requestAnimationFrame game loop

## Orchestration: GameScene (Gameplay Coordinator)
- **Role**: Central coordinator during gameplay — the "game service"
- **Responsibilities**:
  - Receives input events from InputHandler → translates to Board.tryMove()
  - On move result: updates StateManager (undo stack, counters), triggers BoardRenderer animation, triggers SFXEngine
  - On win: triggers AudioManager (jingle), StateManager (save progress), LevelCompleteUI
  - On undo: pops StateManager, restores Board state, updates BoardRenderer
  - On restart: reloads level from LevelManager, resets StateManager
  - Each frame: updates IsometricCamera tweens, PlayerRenderer animations, BoardRenderer occlusion, CompassOverlay rotation, HUD timer

## Orchestration: SceneManager (Navigation Coordinator)
- **Role**: Manages screen transitions
- **Responsibilities**:
  - MenuScene → GameScene (Play button or level select)
  - MenuScene → LevelSelectScene
  - LevelSelectScene → GameScene (level chosen)
  - GameScene → PauseMenu → MenuScene / LevelSelectScene
  - GameScene → LevelCompleteUI → next level / replay / LevelSelectScene
  - Coordinates AudioManager track changes on scene switch

## Data Flow Pattern
```
InputHandler → GameScene → Board (state change)
                        → StateManager (undo/counters)
                        → BoardRenderer (visual update)
                        → PlayerRenderer (animation)
                        → SFXEngine (sound)
                        → HUD (stats update)
```
