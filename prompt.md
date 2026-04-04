# Kiro's Ghost Sokoban — Project Specification

Build a browser-based 3D isometric Sokoban puzzle game called **"Kiro's Ghost Sokoban"** using **Three.js** for rendering with a **pixel art** aesthetic. The game runs entirely client-side (HTML/CSS/JS, no backend).

---

## 1. Project Structure

```
/
├── index.html                  # Single entry point
├── css/
│   └── style.css               # Global styles, pixel font, UI layout
├── assets/
│   ├── ghosty.png              # Kiro ghost sprite (existing)
│   ├── game_over.wav           # Game over sound (existing)
│   └── jump.wav                # Jump sound (existing)
├── src/
│   ├── main.js                 # App bootstrap, scene init, game loop
│   ├── config.js               # Constants: tile size, colors, camera defaults
│   ├── scenes/
│   │   ├── SceneManager.js     # Switches between menu, game, level-select scenes
│   │   ├── MenuScene.js        # Start screen / main menu
│   │   ├── LevelSelectScene.js # Level selection grid
│   │   └── GameScene.js        # Core gameplay scene
│   ├── core/
│   │   ├── Board.js            # Sokoban board state, move logic, win detection
│   │   ├── LevelParser.js      # Parses XSB-format level strings into board data
│   │   ├── LevelManager.js     # Loads level packs, tracks progress, provides levels
│   │   ├── InputHandler.js     # Keyboard input mapping (move, undo, restart, camera)
│   │   └── StateManager.js     # Undo stack, move/push counters, localStorage persistence
│   ├── rendering/
│   │   ├── IsometricCamera.js  # Isometric OrthographicCamera setup + rotation (Q/E)
│   │   ├── BoardRenderer.js    # Creates/updates Three.js meshes from board state
│   │   ├── TileFactory.js      # Generates wall, floor, target, box meshes (pixel art)
│   │   ├── PlayerRenderer.js   # Ghost character: sprite billboard + bobbing animation
│   │   └── PixelTextures.js    # Procedural pixel art texture generation (Canvas2D → Texture)
│   ├── audio/
│   │   ├── AudioManager.js     # Master audio controller, volume, mute (M key)
│   │   ├── MusicEngine.js      # Chiptune music via Web Audio API oscillators
│   │   └── SFXEngine.js        # 8-bit sound effects via Web Audio API
│   ├── ui/
│   │   ├── HUD.js              # In-game HUD: level, moves, pushes, timer
│   │   ├── PauseMenu.js        # Pause overlay (Escape key)
│   │   ├── LevelCompleteUI.js  # Win screen: stars, stats, next/replay
│   │   └── PixelButton.js      # Reusable pixel-art styled button component
│   └── data/                   # (empty — levels loaded from /levels/*.sok)
├── levels/
│   ├── microban.sok            # Microban level pack (plain-text .sok format)
│   └── microban2.sok           # Microban II level pack
└── lib/
    └── three.min.js            # Three.js library (r160+ via CDN or local)
```

---

## 2. Core Sokoban Rules

- Player controls a ghost character (Kiro) on a grid-based board
- Board contains: walls `#`, floor ` `, boxes `$`, targets `.`, player `@`, player-on-target `+`, box-on-target `*`
- Movement: arrow keys + WASD (up/down/left/right)
- Push one box at a time by walking into it
- Boxes cannot be pulled, only pushed
- A box cannot be pushed into a wall or another box
- Level solved when every target has a box on it
- Track move count and push count per level
- Undo last move: `Z` key (full undo stack, unlimited)
- Restart level: `R` key

---

## 3. Level System — XSB Format from Sokoban Libraries

**No procedural generator.** All levels are sourced from well-known, freely available Sokoban level collections using the standard **XSB text format**.

### XSB Format Reference
| Symbol | Meaning         |
|--------|-----------------|
| `#`    | Wall            |
| `@`    | Player          |
| `+`    | Player on target|
| `$`    | Box             |
| `*`    | Box on target   |
| `.`    | Target          |
| ` `    | Floor           |

### Level Sources (embed in `src/data/levels.js`)
- **Microban** (by David W. Skinner) — 155 levels, beginner to intermediate. Freely redistributable.
- **Microban II** (by David W. Skinner) — 135 levels, intermediate to advanced.
- Select a curated subset of ~40 levels across both packs, ordered by increasing difficulty.

### Level Data Format — `.sok` files
Levels are stored as plain-text `.sok` files (standard Sokoban format) in the `levels/` directory, one file per pack:

```
/
├── levels/
│   ├── microban.sok        # Microban pack
│   └── microban2.sok       # Microban II pack
```

Each `.sok` file uses the standard format:
- Levels separated by a blank line
- Optional metadata lines prefixed with `Title:`, `Author:`, `Collection:` at the top of the file
- Optional per-level title as a comment line (`;` prefix) before each level grid
- Example:

```
Collection: Microban
Author: David W. Skinner

; Level 1
####
#.@#
#$ #
#  #
####

; Level 2
######
#    #
# #@ #
# $* #
# .* #
#    #
######
```

### LevelParser.js
- Load `.sok` files via `fetch()` at startup
- Parse the plain-text content: split on blank lines to separate levels, strip metadata/comment lines
- Convert each level's XSB grid into a 2D array of tile enums: `WALL, FLOOR, TARGET, BOX, BOX_ON_TARGET, PLAYER, PLAYER_ON_TARGET`
- Extract `Collection:` and `Author:` metadata for display in level select
- Extract per-level title from `;` comment lines (fall back to "Level N" if absent)
- Validate level integrity: exactly one player, at least one box, box count equals target count
- Compute board dimensions from the XSB data

### LevelManager.js
- Load level packs from `levels.js`
- Track per-level completion: solved, best move count, best push count, star rating
- Star rating: 3 stars = optimal or near-optimal, 2 stars = within 1.5× optimal, 1 star = solved
- Persist progress to `localStorage`
- Provide `nextLevel()`, `getLevel(id)`, `getLevelList()` APIs

---

## 4. Three.js Isometric Rendering

### Camera — `IsometricCamera.js`
- **Orthographic camera** positioned for true isometric view (rotation around Y-axis at 45°, X-axis tilt ~35.264°)
- Camera framing: auto-fit board with padding
- Rotate view with `Q` / `E` keys (90° snap rotations around the board center, smooth tween)
- Zoom: mouse wheel or `+`/`-` keys

### Board Rendering — `BoardRenderer.js`
- Each tile = 1×1 unit on the XZ plane
- Walls: extruded cubes (1×1×1), pixel art stone/brick texture
- Floor: flat quads with pixel art floor texture
- Targets: floor tile with a glowing pixel art marker (pulsing subtle animation)
- Boxes: slightly smaller cubes (0.8×0.8×0.8) with pixel art crate texture; change color/texture when on a target
- Player movement: smooth lerp between grid positions (~150ms)
- Box push: smooth lerp following player movement

### Pixel Art Textures — `PixelTextures.js`
- Generate all textures procedurally using **Canvas2D** (16×16 or 32×32 pixel canvases)
- Apply `THREE.NearestFilter` for `magFilter` and `minFilter` — no texture smoothing
- Textures to generate:
  - Wall: stone/brick pattern (grays, browns)
  - Floor: subtle tile pattern (light gray/beige)
  - Target: glowing diamond/circle marker
  - Box: wooden crate with cross-planks
  - Box-on-target: same crate but with green/gold tint
- Color palette: limited 8-bit style (16–32 colors max)

### Player (Ghost) — `PlayerRenderer.js`
- Use `ghosty.png` as a billboard sprite (always faces camera)
- Floating/bobbing animation: sinusoidal Y offset (~0.1 unit amplitude, ~2s period)
- Subtle shadow blob on the floor beneath the ghost
- Face direction of last movement (flip sprite horizontally)
- **Violet particle aura**: emit small pixel-like square particles around the ghost that drift outward and fade
  - Color: Kiro violet (`#7B61FF`) with slight random brightness variation
  - Each particle is a tiny quad (2–4px screen size) using `THREE.Points` or billboard sprites
  - Spawn 3–5 particles per frame in a ring around the player's position with random offset
  - Particles drift slowly outward + upward, shrinking and fading to transparent over ~0.6–1s lifetime
  - Apply a soft blur/glow via additive blending (`THREE.AdditiveBlending`) to give a dreamy haze effect
  - Intensity increases slightly when the player moves or pushes a box, then settles back to idle rate

### Wall Occlusion Transparency — `BoardRenderer.js`
- In an isometric view, walls closer to the camera can hide the player (and boxes) behind them
- Each frame, determine which walls sit between the camera and the player's current tile
- Use the camera's forward direction projected onto the XZ plane to identify "occluding" walls — any wall whose screen-space bounding box overlaps the player's screen-space position and is closer to the camera than the player
- Smoothly fade those walls to a low opacity (e.g., `opacity: 0.15`, ~200ms tween) so the player is always visible
- Restore wall opacity back to `1.0` when they no longer occlude the player (same ~200ms tween out)
- Set `material.transparent = true` and `material.depthWrite = false` on faded walls to avoid z-fighting artifacts
- Restore `material.depthWrite = true` when the wall returns to full opacity
- This check should also apply to boxes — if a wall hides a box the player is about to push, fade that wall too
- Recalculate occlusion whenever the camera rotates (Q/E) or the player moves

### Lighting
- Ambient light (soft, warm tone)
- Single directional light casting subtle shadows (shadow map optional for performance)
- Slight emissive glow on target tiles

---

## 5. Audio System

### Music — `MusicEngine.js`
- Chiptune/8-bit music generated via **Web Audio API** oscillators (no audio files for music)
- Tracks:
  - **Menu theme**: chiptune arrangement inspired by the synth-pop feel of OMD's "Electricity" — pulsing bass line, arpeggiated synth melody, driving electronic rhythm. Recreate the vibe using square wave + triangle wave oscillators (original composition, not a direct copy)
  - **Gameplay theme**: upbeat puzzle-style loop that keeps the same electronic/synth-pop energy — rhythmic pulse, catchy melodic hook, 8-bit reinterpretation of that new-wave aesthetic
  - **Level complete jingle**: short celebratory fanfare with a synthy flourish
- Use square wave + triangle wave oscillators
- Tempo, note sequences defined as data arrays

### Sound Effects — `SFXEngine.js`
- All SFX generated via Web Audio API (short oscillator bursts + envelopes):
  - Player move (soft step)
  - Box push (heavier thud)
  - Box placed on target (satisfying chime)
  - Level complete (fanfare, reuse jingle)
  - Undo (reverse/rewind sound)
  - Menu select / button click
- Can also use existing `assets/jump.wav` and `assets/game_over.wav` where appropriate

### AudioManager.js
- Master volume control
- Mute toggle: `M` key
- Separate music/SFX volume
- Persist volume settings in `localStorage`

---

## 5b. 3D Compass Indicator

### Compass — rendered in a separate Three.js scene overlay (bottom-right corner)
- A small 3D compass rendered in its own `WebGLRenderer` viewport or a second `Scene` + `OrthographicCamera`, displayed in the bottom-right corner of the screen (~100×100px)
- Four axis lines extending from a center origin, representing N, S, E, W
- Each line is a simple `THREE.Line` (or `THREE.BufferGeometry` line)
- At the tip of each line, render a letter label (N, W, E, S) using a small canvas texture billboard sprite
- **N line and label**: Kiro violet (`#7B61FF`) — matching the kiro.dev brand color
- **W, E, S lines and labels**: white (`#FFFFFF`)
- The compass rotates in sync with the main isometric camera — when the player presses Q/E to rotate the board view, the compass rotates identically so cardinal directions stay accurate
- No interaction / not clickable — purely a visual orientation aid
- Render on top of the game scene (use `renderer.autoClear = false` or a separate overlay canvas)

### Zoom Indicator — HTML/CSS overlay, positioned directly above the compass (bottom-right)
- A small vertical or horizontal bar (~80px wide) showing the current zoom level
- Range: −45% (zoomed out) to +45% (zoomed in), with 0% as the default fit-to-board zoom
- Display the current percentage value as a label (pixel font) above or beside the bar
- The bar track is a dark/muted background; the filled portion is Kiro violet (`#7B61FF`)
- The violet fill grows from center outward: zooming in fills right, zooming out fills left
- Updates in real time as the player scrolls the mouse wheel or presses `+`/`-`
- Not draggable — read-only indicator, purely visual

---

## 6. Game Screens & UI

All UI uses **HTML/CSS overlays** on top of the Three.js canvas. Pixel art aesthetic throughout: pixel font (e.g., "Press Start 2P" from Google Fonts), retro color palette, pixelated borders.

### Start Screen — `MenuScene.js`
- Pixel art title: "Kiro's Ghost Sokoban"
- Animated ghost character (bobbing)
- Buttons: "Play", "Level Select", "How to Play"
- Pixel art border decorations
- Background: Three.js scene with slowly rotating isometric demo board

### Level Select — `LevelSelectScene.js`
- Grid of level thumbnails (small isometric preview or numbered tiles)
- Lock/unlock status (levels unlock sequentially)
- Star rating display (0–3 stars)
- Best move count shown
- Level pack name displayed
- Scroll or paginate for many levels

### Game HUD — `HUD.js`
- Current level name/number
- Move count
- Push count
- Timer (elapsed)
- Small minimap (optional: 2D top-down pixel grid)

### Pause Menu — `PauseMenu.js`
- Triggered by `Escape` key
- Options: Resume, Restart, Level Select, Main Menu
- Semi-transparent overlay

### Level Complete — `LevelCompleteUI.js`
- Star rating animation (stars fill in one by one)
- Stats: moves, pushes, time
- Buttons: "Next Level", "Replay", "Level Select"
- Celebratory pixel art animation (confetti particles or ghost celebration)

---

## 7. Input Mapping — `InputHandler.js`

| Key(s)         | Action                    |
|----------------|---------------------------|
| `↑` / `W`      | Move up                   |
| `↓` / `S`      | Move down                 |
| `←` / `A`      | Move left                 |
| `→` / `D`      | Move right                |
| `Z`            | Undo last move            |
| `R`            | Restart level             |
| `Q`            | Rotate camera left (−90°) |
| `E`            | Rotate camera right (+90°)|
| `M`            | Toggle mute               |
| `Escape`       | Pause menu                |
| `+` / `-`      | Zoom in / out             |

Movement directions are relative to the current camera rotation (so "up" always means away from the player's screen perspective).

---

## 8. State Persistence — `StateManager.js`

Store in `localStorage`:
- Per-level: solved (bool), best moves, best pushes, star rating
- Current level progress (for resume)
- Undo stack for current session
- Audio settings (volume, mute state)
- Unlocked level index

---

## 9. Technical Requirements

- **No build tools required**: vanilla JS with ES modules (`<script type="module">`)
- **Three.js**: loaded via CDN (`https://unpkg.com/three@0.160.0/build/three.module.js`) or local copy
- **Single page**: `index.html` is the only HTML file
- **Responsive**: scales to fit desktop browser windows (min 800×600)
- **Performance**: target 60fps, use `requestAnimationFrame` loop
- **Pixel font**: "Press Start 2P" from Google Fonts for all UI text
- **No external game frameworks** beyond Three.js
- Use the existing `assets/ghosty.png` as the ghost character texture
