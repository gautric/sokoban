# Component Methods — Kiro's Ghost Sokoban

## SceneManager
- `switchTo(sceneName: string): void` — Transition to named scene, deactivate current
- `getCurrentScene(): Scene` — Return active scene reference

## MenuScene
- `activate(): void` — Show menu UI, start background animation
- `deactivate(): void` — Hide menu UI, stop background animation

## LevelSelectScene
- `activate(): void` — Show level grid, load progress data
- `deactivate(): void` — Hide level grid
- `selectLevel(levelId: number): void` — Trigger transition to GameScene with selected level

## GameScene
- `activate(levelId: number): void` — Load level, init board/renderer, start game loop
- `deactivate(): void` — Stop game loop, clean up Three.js objects
- `update(dt: number): void` — Per-frame update: input, animations, occlusion, particles
- `render(): void` — Render main scene + compass overlay
- `onLevelComplete(): void` — Trigger win flow: save progress, show LevelCompleteUI

## Board
- `loadLevel(levelData: TileEnum[][]): void` — Initialize board from parsed level data
- `tryMove(direction: Direction): MoveResult` — Validate and apply move, return result (moved/pushed/blocked)
- `isComplete(): boolean` — Check if all targets have boxes
- `getState(): BoardState` — Return current tile grid + player position (for undo snapshots)
- `setState(state: BoardState): void` — Restore board from snapshot
- `getPlayerPosition(): {x, y}` — Return current player grid coordinates
- `getTile(x, y): TileEnum` — Return tile at grid position

## LevelParser
- `parseSOK(text: string): ParsedPack` — Parse .sok file text into array of level objects with metadata
- `validateLevel(level: TileEnum[][]): ValidationResult` — Check player count, box/target balance

## LevelManager
- `loadPacks(): Promise<void>` — Fetch and parse all .sok files
- `getLevelList(): LevelInfo[]` — Return curated level list with metadata and progress
- `getLevel(id: number): ParsedLevel` — Return specific level data
- `nextLevel(currentId: number): number|null` — Return next level id or null
- `saveProgress(levelId, moves, pushes): void` — Record completion via StateManager
- `isUnlocked(levelId: number): boolean` — Check if level is accessible
- `getStarRating(levelId, moves): number` — Calculate stars from hardcoded optimal values

## InputHandler
- `init(callbacks: InputCallbacks): void` — Register keyboard and mouse listeners
- `destroy(): void` — Remove all listeners
- `setRotation(angle: number): void` — Update current camera rotation for direction mapping
- `mapDirection(key: string): Direction` — Translate key to board direction based on camera rotation

## StateManager
- `pushUndo(state: BoardState): void` — Push board snapshot to undo stack
- `popUndo(): BoardState|null` — Pop and return last snapshot
- `clearUndo(): void` — Reset undo stack
- `getMoveCount(): number` / `getPushCount(): number` — Return current counters
- `incrementMoves(): void` / `incrementPushes(): void` — Bump counters
- `resetCounters(): void` — Reset move/push counters
- `saveToStorage(key, value): void` — Persist to localStorage
- `loadFromStorage(key): any` — Read from localStorage
- `saveAudioSettings(settings): void` / `loadAudioSettings(): AudioSettings` — Audio prefs

## IsometricCamera
- `init(boardWidth, boardHeight): void` — Create orthographic camera, fit to board
- `rotateLeft(): void` / `rotateRight(): void` — 90° snap rotation with tween
- `zoomIn(): void` / `zoomOut(): void` — Adjust zoom within ±45% range
- `setZoomFromScroll(delta: number): void` — Handle mouse wheel zoom
- `getRotationAngle(): number` — Current Y rotation in degrees
- `getZoomPercent(): number` — Current zoom as percentage
- `getCamera(): THREE.OrthographicCamera` — Return camera object
- `update(dt: number): void` — Update tweens

## BoardRenderer
- `buildBoard(board: Board): void` — Create all tile meshes from board state
- `updateBoard(board: Board): void` — Update mesh states (box positions, target highlights)
- `animateMove(from, to, duration): Promise` — Lerp entity between grid positions
- `updateOcclusion(playerPos, cameraDir): void` — Fade/restore walls occluding player
- `dispose(): void` — Clean up all meshes and materials

## TileFactory
- `createWall(): THREE.Mesh` — 1×1×1 cube with stone texture
- `createFloor(): THREE.Mesh` — Flat quad with floor texture
- `createTarget(): THREE.Mesh` — Floor with glowing marker
- `createBox(onTarget: boolean): THREE.Mesh` — 0.8×0.8×0.8 cube, green/gold tint if on target

## PlayerRenderer
- `init(scene: THREE.Scene): void` — Create billboard sprite, shadow, particle system
- `setPosition(x, y, animated: boolean): void` — Move to grid position, optionally lerp
- `setDirection(dir: Direction): void` — Flip sprite horizontally
- `update(dt: number): void` — Bobbing animation, particle emission, particle lifecycle
- `setMoving(isMoving: boolean): void` — Increase/decrease particle intensity
- `dispose(): void` — Clean up sprite and particles

## PixelTextures
- `getWallTexture(): THREE.Texture` — Stone/brick pattern
- `getFloorTexture(): THREE.Texture` — Subtle tile pattern
- `getTargetTexture(): THREE.Texture` — Glowing diamond marker
- `getBoxTexture(): THREE.Texture` — Wooden crate
- `getBoxOnTargetTexture(): THREE.Texture` — Crate with green/gold tint

## AudioManager
- `init(): void` — Create AudioContext (on user gesture)
- `setMasterVolume(v: number): void` — Set master volume 0–1
- `toggleMute(): void` — Toggle mute state
- `isMuted(): boolean` — Return mute state
- `getMusicVolume(): number` / `setMusicVolume(v): void` — Music volume
- `getSFXVolume(): number` / `setSFXVolume(v): void` — SFX volume

## MusicEngine
- `playMenu(): void` — Start menu theme loop
- `playGameplay(): void` — Start gameplay theme loop
- `playLevelComplete(): void` — Play jingle (one-shot)
- `stop(): void` — Stop current track
- `setVolume(v: number): void` — Set music volume

## SFXEngine
- `playMove(): void` — Soft step sound
- `playPush(): void` — Heavier thud
- `playBoxOnTarget(): void` — Satisfying chime
- `playUndo(): void` — Reverse/rewind sound
- `playMenuClick(): void` — Button click
- `setVolume(v: number): void` — Set SFX volume

## HUD
- `show(): void` / `hide(): void` — Toggle visibility
- `update(level, moves, pushes, time): void` — Refresh displayed values

## PauseMenu
- `show(): void` / `hide(): void` — Toggle pause overlay
- `isVisible(): boolean` — Check if paused

## LevelCompleteUI
- `show(stars, moves, pushes, time): void` — Animate star reveal, display stats
- `hide(): void` — Dismiss overlay

## PixelButton
- `constructor(text, onClick): HTMLElement` — Create styled button element

## CompassOverlay
- `init(container: HTMLElement): void` — Create separate renderer/scene/camera
- `setRotation(angle: number): void` — Sync with main camera rotation
- `render(): void` — Render compass frame

## ZoomIndicator
- `init(container: HTMLElement): void` — Create HTML/CSS bar element
- `setZoom(percent: number): void` — Update bar fill and label
