# Business Logic Model — Unit 5: UI & Scenes

## SceneManager
- Maintains reference to current active scene
- switchTo(name): calls current.deactivate(), sets new scene, calls new.activate()
- Scene map: { menu: MenuScene, levelSelect: LevelSelectScene, game: GameScene }
- On switch: coordinate AudioManager track changes (menu→menu theme, game→gameplay theme)

## MenuScene
- **UI**: HTML overlay with title "Kiro's Ghost Sokoban", animated ghost (CSS bobbing), 3 PixelButtons (Play, Level Select, How to Play)
- **Background**: Three.js scene with a small demo board slowly rotating
- **Play button**: switch to GameScene with first unlocked level
- **Level Select**: switch to LevelSelectScene
- **How to Play**: show modal overlay with controls reference

## LevelSelectScene
- **UI**: Grid of numbered level tiles (HTML divs)
- Each tile shows: level number, lock icon (if locked), star rating (0-3 star icons), best move count
- Locked tiles are grayed out and non-clickable
- Click unlocked tile → switch to GameScene with that level
- Pack name displayed at top
- Pagination: show ~20 levels per page, prev/next buttons if >20

## GameScene — Gameplay Orchestrator
- **activate(levelId)**: load level from LevelManager, init Board, build BoardRenderer, init PlayerRenderer, start HUD timer, play gameplay music
- **Game loop** (called each rAF frame):
  1. Update IsometricCamera tweens
  2. Update PlayerRenderer (bobbing, particles)
  3. Update BoardRenderer (occlusion, target pulse)
  4. Update HUD timer
  5. Render main scene
  6. Render CompassOverlay
- **Input flow**: InputHandler callback → if not animating and not paused → Board.tryMove() → handle result
- **On MOVED**: pushUndo, incrementMoves, animate player, play move SFX, update HUD
- **On PUSHED**: pushUndo, incrementMoves+Pushes, animate player+box, play push SFX, check win, update HUD
- **On win**: save progress, play jingle, show LevelCompleteUI after animation completes
- **On undo**: popUndo, restore board, update renderer, play undo SFX, update HUD
- **On restart**: reload level, clear undo, reset counters, rebuild renderer

## HUD
- HTML overlay: level name (top-left), moves counter, pushes counter, timer (MM:SS)
- Timer starts on first move, pauses when paused
- Updated each frame from GameScene

## PauseMenu
- Triggered by Escape key (via InputHandler)
- Semi-transparent dark overlay with 4 PixelButtons: Resume, Restart, Level Select, Main Menu
- Resume: hide overlay, unpause timer
- Restart: restart level via GameScene
- Level Select / Main Menu: switch scene via SceneManager

## LevelCompleteUI
- Overlay with stats: moves, pushes, time
- Star animation: stars appear one by one with delay (CSS animation)
- 3 PixelButtons: Next Level, Replay, Level Select
- Confetti: simple CSS particle animation (colored squares falling)

## PixelButton
- Creates styled HTML button element
- Pixel font ("Press Start 2P"), retro border (double border, pixel-stepped)
- Hover: slight color shift, click: inset shadow effect
- Constructor: (text, onClick) → returns HTMLElement

## main.js Bootstrap
```
1. Create Three.js WebGLRenderer, attach to #game-container
2. Create singletons: StateManager, AudioManager, LevelManager, InputHandler
3. await LevelManager.loadPacks()
4. Create scenes: MenuScene, LevelSelectScene, GameScene
5. Create SceneManager with scene map
6. Init AudioContext on first user click (event listener)
7. SceneManager.switchTo('menu')
8. Start rAF loop: scene.update(dt), scene.render()
```

## index.html Structure
```html
<div id="game-container">         <!-- Three.js canvas injected here -->
  <div id="ui-overlay">           <!-- All HTML UI layers -->
    <div id="menu-screen">...</div>
    <div id="level-select-screen">...</div>
    <div id="hud">...</div>
    <div id="pause-menu">...</div>
    <div id="level-complete">...</div>
    <div id="compass-container">...</div>
    <div id="zoom-indicator">...</div>
  </div>
</div>
```
