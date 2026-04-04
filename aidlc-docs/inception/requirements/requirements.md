# Requirements — Kiro's Ghost Sokoban

## Intent Analysis
- **User Request**: Build a browser-based 3D isometric Sokoban puzzle game with pixel art aesthetic using Three.js
- **Request Type**: New Project (Greenfield)
- **Scope Estimate**: System-wide — full game with rendering, audio, UI, state management, level system
- **Complexity Estimate**: Complex — multiple subsystems (3D rendering, audio synthesis, game logic, UI, persistence)

---

## Functional Requirements

### FR-01: Core Sokoban Gameplay
- Grid-based board with tiles: wall `#`, floor ` `, box `$`, target `.`, player `@`, player-on-target `+`, box-on-target `*`
- Player moves in 4 cardinal directions via arrow keys + WASD
- Movement directions are relative to current camera rotation
- Push one box at a time by walking into it; cannot push into walls or other boxes
- Boxes cannot be pulled
- Level solved when every target has a box on it
- Track move count and push count per level
- Undo last move: `Z` key (unlimited undo stack)
- Restart level: `R` key

### FR-02: Level System (XSB Format)
- Load levels from `.sok` files in `levels/` directory via `fetch()` at runtime
- Two packs: Microban (155 levels) and Microban II (135 levels)
- Curated subset of ~40 levels, interleaved from both packs, ordered by level number within each pack
- Parse XSB format: split on blank lines, strip metadata/comments, convert to 2D tile arrays
- Extract `Collection:`, `Author:` metadata and per-level titles from `;` comment lines
- Validate: exactly one player, at least one box, box count equals target count

### FR-03: Star Rating System
- Hardcoded optimal move/push counts per curated level (sourced from Sokoban community databases)
- 3 stars: moves ≤ optimal or near-optimal
- 2 stars: moves ≤ 1.5× optimal
- 1 star: solved (any move count)

### FR-04: Level Progression
- Strict sequential unlock: must complete level N to unlock level N+1
- Level 1 unlocked by default
- Persist per-level: solved status, best moves, best pushes, star rating

### FR-05: Game Screens
- **Start Screen**: Pixel art title, animated ghost, buttons (Play, Level Select, How to Play), rotating demo board background
- **Level Select**: Grid of level tiles with lock/unlock status, star ratings, best move count, pack name, pagination
- **Game HUD**: Level name/number, move count, push count, elapsed timer
- **Pause Menu**: Escape key trigger, options (Resume, Restart, Level Select, Main Menu), semi-transparent overlay
- **Level Complete**: Star animation, stats (moves, pushes, time), buttons (Next Level, Replay, Level Select), celebratory animation

### FR-06: Camera Controls
- Isometric orthographic camera (45° Y rotation, ~35.264° X tilt)
- Auto-fit board with padding
- Keyboard: Q/E for 90° snap rotation, +/- for zoom
- Mouse: click-drag to rotate camera, scroll wheel to zoom
- Smooth tweened transitions for rotation

### FR-07: Input Mapping
- Arrow keys + WASD: move player (keyboard only)
- Z: undo, R: restart, M: mute toggle, Escape: pause
- Q/E: rotate camera, +/-: zoom
- Mouse: drag to rotate camera, scroll to zoom

### FR-08: State Persistence (localStorage)
- Per-level: solved, best moves, best pushes, star rating
- Current level progress for resume
- Undo stack for current session
- Audio settings (volume, mute)
- Unlocked level index

---

## Non-Functional Requirements

### NFR-01: Rendering
- Three.js with orthographic isometric camera
- Procedural pixel art textures via Canvas2D (16×16 or 32×32), `THREE.NearestFilter`
- Limited 8-bit color palette (16–32 colors)
- Smooth player/box movement lerp (~150ms)
- Wall occlusion transparency: fade walls between camera and player to opacity 0.15 (~200ms tween)
- Violet particle aura around ghost player (`#7B61FF`, additive blending)
- 3D compass indicator (separate scene overlay, bottom-right, ~100×100px)
- Zoom indicator (HTML/CSS overlay above compass, ±45% range, Kiro violet fill)

### NFR-02: Audio
- Chiptune music via Web Audio API oscillators (no audio files for music)
- Menu theme: synth-pop inspired, square + triangle wave
- Gameplay theme: upbeat puzzle loop
- Level complete jingle
- SFX via Web Audio API: move, push, box-on-target chime, undo, menu click
- Can use existing `jump.wav` and `game_over.wav` where appropriate
- Master volume, mute toggle (M key), separate music/SFX volume, persisted

### NFR-03: Performance
- Target 60fps via `requestAnimationFrame`
- Responsive: scales to fit desktop browser windows (min 800×600)

### NFR-04: Technology Constraints
- Vanilla JS with ES modules (`<script type="module">`)
- Three.js via CDN (`https://unpkg.com/three@0.160.0/build/three.module.js`)
- Single HTML entry point (`index.html`)
- No build tools, no backend, no external game frameworks
- Pixel font: "Press Start 2P" from Google Fonts
- HTML/CSS overlays for all UI on top of Three.js canvas

### NFR-05: Player Character
- `ghosty.png` billboard sprite (always faces camera)
- Bobbing animation: sinusoidal Y offset (~0.1 unit, ~2s period)
- Shadow blob on floor
- Flip sprite horizontally based on last movement direction
- Violet particle aura with additive blending, intensity increases on move/push

---

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| security/baseline | No | Requirements Analysis |

---

## Project Structure
As specified in the original request — see project structure in the specification document.
