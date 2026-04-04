# Components — Kiro's Ghost Sokoban

## 1. SceneManager
- **Purpose**: Orchestrates transitions between game screens (menu, level select, gameplay)
- **Responsibilities**: Activate/deactivate scenes, manage scene lifecycle, coordinate with AudioManager on scene changes

## 2. MenuScene
- **Purpose**: Start screen with title, animated ghost, and navigation buttons
- **Responsibilities**: Render menu UI overlay, manage background demo board animation, handle button clicks to transition scenes

## 3. LevelSelectScene
- **Purpose**: Grid-based level selection with progress display
- **Responsibilities**: Render level grid with lock/star/score status, handle level selection, paginate levels, read progress from StateManager

## 4. GameScene
- **Purpose**: Core gameplay scene — owns the Three.js scene, camera, renderer, and game loop
- **Responsibilities**: Initialize Three.js scene/renderer, coordinate Board + BoardRenderer + PlayerRenderer, run game loop (update + render), handle win detection, trigger LevelCompleteUI

## 5. Board
- **Purpose**: Pure game state — the Sokoban board model
- **Responsibilities**: Store 2D tile grid, execute move logic (validate + apply), detect win condition, provide state for undo/redo

## 6. LevelParser
- **Purpose**: Parse `.sok` file text into structured level data
- **Responsibilities**: Split levels on blank lines, strip metadata/comments, convert XSB characters to tile enums, validate level integrity, extract titles and metadata

## 7. LevelManager
- **Purpose**: Manage level packs, progression, and star ratings
- **Responsibilities**: Load `.sok` files via fetch, provide level list and individual levels, track completion/stars/best scores, determine unlock status, persist progress via StateManager

## 8. InputHandler
- **Purpose**: Centralized keyboard and mouse input mapping
- **Responsibilities**: Listen for keydown events, map keys to game actions, translate movement directions based on camera rotation, handle mouse drag (camera rotate) and scroll (zoom)

## 9. StateManager
- **Purpose**: Persistence and undo system
- **Responsibilities**: Maintain undo stack (board snapshots), track move/push counters, persist to localStorage (progress, settings, undo stack), provide save/load/reset APIs

## 10. IsometricCamera
- **Purpose**: Orthographic camera with isometric projection
- **Responsibilities**: Set up orthographic camera at isometric angles, auto-fit to board, handle 90° snap rotation (Q/E) with tween, handle zoom (+/-/scroll) with clamping (±45%)

## 11. BoardRenderer
- **Purpose**: Create and update Three.js meshes from board state
- **Responsibilities**: Build mesh grid from tile data (walls, floors, targets, boxes), update mesh positions/materials on state change, implement wall occlusion transparency, animate box movement lerp

## 12. TileFactory
- **Purpose**: Generate individual tile meshes with pixel art materials
- **Responsibilities**: Create wall cubes, floor quads, target markers, box cubes with appropriate geometry and textures from PixelTextures

## 13. PlayerRenderer
- **Purpose**: Ghost character rendering and animation
- **Responsibilities**: Billboard sprite from ghosty.png, bobbing animation, shadow blob, sprite flip on direction change, violet particle aura system

## 14. PixelTextures
- **Purpose**: Procedural pixel art texture generation
- **Responsibilities**: Generate Canvas2D textures (wall, floor, target, box, box-on-target) at 16×16 or 32×32, apply NearestFilter, manage texture cache

## 15. AudioManager
- **Purpose**: Master audio controller
- **Responsibilities**: Initialize Web Audio context, manage master/music/SFX volume, mute toggle, persist settings, coordinate MusicEngine and SFXEngine

## 16. MusicEngine
- **Purpose**: Chiptune music synthesis
- **Responsibilities**: Generate menu theme, gameplay theme, level complete jingle using oscillators (square + triangle wave), manage playback state, loop tracks

## 17. SFXEngine
- **Purpose**: 8-bit sound effects
- **Responsibilities**: Generate short oscillator-based SFX (move, push, chime, undo, click), play existing wav files (jump.wav, game_over.wav)

## 18. HUD
- **Purpose**: In-game heads-up display
- **Responsibilities**: Render HTML overlay showing level name, move count, push count, elapsed timer

## 19. PauseMenu
- **Purpose**: Pause overlay
- **Responsibilities**: Show/hide on Escape, render options (Resume, Restart, Level Select, Main Menu), handle button clicks

## 20. LevelCompleteUI
- **Purpose**: Win screen
- **Responsibilities**: Animate star rating reveal, display stats (moves, pushes, time), render buttons (Next Level, Replay, Level Select), celebratory particle animation

## 21. PixelButton
- **Purpose**: Reusable pixel-art styled button
- **Responsibilities**: Render styled HTML button with pixel font and retro borders, handle click/hover states

## 22. CompassOverlay
- **Purpose**: 3D compass indicator
- **Responsibilities**: Render small 3D compass in separate scene/viewport (bottom-right), rotate in sync with main camera, display N/W/E/S labels (N in Kiro violet)

## 23. ZoomIndicator
- **Purpose**: Zoom level display
- **Responsibilities**: Render HTML/CSS bar above compass showing current zoom percentage (±45%), update in real time on zoom changes
