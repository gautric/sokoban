# CLAUDE.md

Guidance for working in this repository. Read this before making changes.

## What this is

**Kiro's Ghost Sokoban** (キロのゴースト倉庫番) — a 3D isometric Sokoban (倉庫番 /
box-pushing) puzzle game that runs in the browser. The player is a ghost (Kiro) who
pushes boxes onto target tiles. The board is rendered in Three.js with an isometric
camera and a pixel-art post-processing pass; UI is plain HTML/CSS overlaid on the canvas.

- **No build step, no bundler, no dependencies, no `node_modules`.** Pure vanilla
  JavaScript ES modules loaded directly by the browser. The root `package.json` only
  sets `"type": "module"` so Node treats `src/` and `test/` as ES modules — never add
  `dependencies` to it.
- **Three.js r0.160.0** is pulled from a CDN via an `importmap` in `index.html`
  (`https://unpkg.com/three@0.160.0/...`). There is no local copy. Import it as
  `import * as THREE from 'three'` and addons as `'three/addons/...'`.
- Bilingual: English / Japanese, toggled at runtime (see `src/i18n.js`). The HTML ships
  Japanese as the default; strings are swapped by `data-i18n` attributes.

## Running and checking

ES modules and `fetch()` of the `.sok` level files **do not work over `file://`** — you
must serve over HTTP. Use the Makefile (needs Node.js ≥ 18.19):

```bash
make run      # open Firefox on the game + start a server on :8080 (the one you want)
make serve    # just serve current dir at http://localhost:8080 (PORT=xxxx to change)
make stop     # kill whatever is listening on the serve port
make check    # node --check on src/ + levels + entrypoints + unit tests (offline)
make test     # unit tests only (Node built-in runner, no dependencies)
make lint     # ESLint 9 via npx, config in eslint.config.js (needs network once)
make par      # recompute OPTIMAL_MOVES after editing levels/*.sok
make clean    # remove .DS_Store and __pycache__
```

Run `make check` and `make lint` after every JS change; CI (`.github/workflows/pages.yml`)
runs both before deploying. Unit tests live in `test/*.test.js` and cover:

| Test file | Guards |
|---|---|
| `board`, `undo`, `scoring` | Sokoban rules, Memento undo, star rating |
| `state-manager` | localStorage defaults, bad JSON, best scores, session |
| `levels` | every `.sok` puzzle parses, walls closed, **solvable**, par table size |
| `level-parser`, `visitor` | `.sok` grammar, parse → export round trip |
| `i18n` | EN/JA key parity, every `data-i18n` / `t('key')` exists |
| `log`, `no-cheat` | log mode output; no cheat code, `window.__*` hook or `DEBUG` flag in `src/` |
| `importmap` | Three.js pinned, every imported CDN module has an SRI hash |
| `core-boundary` | `src/core/` never reaches `three` or `src/rendering/` |

`test/support/solver.js` is a small Sokoban solver used by the tests and `make par`.
Rendering and game feel are still verified by hand (procedures in
`aidlc-docs/construction/build-and-test/`): after a gameplay or rendering change, load
the game and play a level.

Add `?log` to the URL (`http://localhost:8080/?log`) for **log mode**: `LOG` in
`config.js` turns on `src/log.js`, which prints game events to the console
(`[scene] menu -> game 0`, `[move] UP PUSHED (1,3)`, `[audio] toggleMute`, …). It only
logs: there are no cheats and no `window.__*` hooks — `test/no-cheat.test.js` fails if
one comes back.

## Architecture

Entry point is `index.html` → `src/main.js`. `main.js` constructs every subsystem, wires
them together, starts scenes, and runs a `requestAnimationFrame` loop that calls
`sceneManager.update(dt)` then `sceneManager.render(renderer)`.

```
src/
  config.js            Frozen shared constants + enums (TileType, EntityType,
                       Direction, MoveResult, DIR_VECTORS). LOG flag (?log). Tunables for
                       camera tilt/zoom, lerp durations, particle params, OPTIMAL_MOVES.
  main.js              Bootstrap + game loop. Instantiates and wires all subsystems.
  i18n.js              EN/JA translations, lang toggle (key J), data-i18n DOM updates.
  log.js               Log mode (?log): scoped console logger, silent otherwise.

  core/                Pure game logic — NO Three.js in here.
    Board.js           Grid model. tryMove() is the Sokoban rules engine; isComplete()
                       checks win. Also the Memento originator (snapshots for undo).
    LevelParser.js     Parses the .sok (Sokoban) text format into level objects.
    LevelManager.js    Loads/holds level packs, star ratings, next-level logic.
    StateManager.js    Progress/audio/session persistence via localStorage.
    InputHandler.js    Keyboard → gameplay callbacks (key map below).

  rendering/           Everything Three.js.
    IsometricCamera.js PerspectiveCamera driven at an iso angle; rotate/tilt/zoom,
                       eased tweens.
    BoardRenderer.js   Builds/updates wall/floor/target/box meshes; box-push animation,
                       wall occlusion fade, target pulse.
    PlayerRenderer.js  The ghost: bob, facing direction, win celebration.
    TileFactory.js / PixelTextures.js   Mesh + procedural pixel-texture creation.
    Minimap.js, CompassOverlay.js, Zoom/Tilt/Pixel/SliderIndicator.js   HUD-adjacent
                       overlays and a second viewport render.

  scenes/              SceneManager + MenuScene, LevelSelectScene, GameScene.
                       GameScene is the heart of gameplay — it owns the Board, camera,
                       renderers, HUD, pause/complete UI, and the move/undo/win flow.
  ui/                  HUD, PauseMenu, LevelCompleteUI, PixelButton (DOM overlay UI).
  audio/               AudioManager + MusicEngine + SFXEngine. Fully procedural Web
                       Audio (oscillators) — no audio files are fetched. AudioContext
                       is created lazily on the first click/keydown (browser autoplay).
  patterns/            See below.

levels/   *.sok level packs (Microban / Microban II by David W. Skinner).
assets/   Fonts, SVGs (ghost, Kiro), textures, two .wav SFX (mostly unused — SFX is
          synthesized).
```

### The design-pattern layer (read before "simplifying")

This codebase is intentionally a **teaching showcase of design patterns**: 23 Gang-of-Four
patterns plus 13 of Robert Nystrom's *Game Programming Patterns*. `src/patterns/` holds
`creational.js`, `structural.js`, `behavioral.js`, `game-patterns.js`, re-exported from
`index.js`. Nearly every module's header comment names the patterns it embodies (e.g.
`config.js` is Flyweight, `Board.js` is Memento, `LevelParser.js` is Interpreter+Builder,
`GameScene.js` wires Command/State/Mediator/Observer/Strategy).

**This is a deliberate constraint, not accidental complexity.** Do not collapse a pattern
into "simpler" direct code just because it would be shorter — the indirection is the
point. If a change genuinely needs to remove or restructure a pattern, call it out
explicitly and confirm first. Prefer extending within the existing pattern vocabulary.

## Level format (.sok)

Standard Sokoban text format, parsed by `LevelParser.parseSOK`. Header lines
(`Collection:`, `Author:`), `;`-prefixed titles, blank-line-separated puzzles. Grid chars
(the `CHAR_MAP` grammar):

| Char | Meaning            | Char | Meaning              |
|------|--------------------|------|----------------------|
| `#`  | wall               | `@`  | player               |
| ` `  | floor              | `+`  | player on target     |
| `.`  | target             | `$`  | box                  |
|      |                    | `*`  | box on target        |

A level is rejected if it has no player, no boxes, or box count ≠ target count. The two
packs are interleaved into one list at load time in `LevelManager.loadPacks()`.

The packs hold the **original** Microban levels 1–22 and Microban II levels 1–18
(40 levels). `OPTIMAL_MOVES` in `config.js` holds the true minimum move count of each
level in that interleaved order. When you add, remove or edit a level: run `make test`
(it proves every level is solvable) then `make par` and paste the new table.

## Controls (InputHandler)

Arrows = move · `Q`/`E` (or Space) = rotate camera · `+`/`-` = zoom · `P` = tilt ·
`[`/`]` = pixel size · `Z` = undo · `R` = restart · `M` = mute · `Esc` = pause ·
`J` = language. Mouse drag rotates, scroll zooms; touch swipes map to moves via a
`TouchInputAdapter`.

## Conventions

- Keep `core/` free of Three.js. Rendering talks to the board through plain data; the
  board never imports from `rendering/`. Preserve that boundary — `core-boundary.test.js`
  enforces it. A pattern used by `core/` must live in a Three.js-free module (see
  `src/patterns/level-builder.js`, re-exported by `creational.js`).
- New Three.js addon import? Add its SRI hash (and its own relative imports') to the
  `integrity` block of the import map in `index.html`.
- Every UI string goes in `src/i18n.js` in **both** `en` and `ja`.
- No `innerHTML` with dynamic text; build DOM with `textContent` / `createElement`.
- Game constants belong in `config.js` as frozen exports — don't scatter magic numbers.
- Match the existing style: ES module imports, 2-space indent, the `// ── NAME ──` banner
  comments that tag patterns. New modules should carry a header comment naming their role.
- Dispose Three.js resources. `GameScene._loadLevel` / `deactivate` traverse and
  `.dispose()` geometries, materials, and textures on teardown — follow that when adding
  meshes so levels don't leak GPU memory.
- Persistence keys are namespaced `kiro-sokoban-*` in localStorage.

## Git workflow (summary — full rules in `.kiro/steering/git-flow.md`)

- Remote is `origin` = `github.com/gautric/sokoban`; the only branch is **`main`**.
  **A push to `main` deploys to production** (GitHub Pages, `sokoban.autric.net`).
  Work on a `feat/…`, `fix/…`, `refactor/…`, `docs/…` or `test/…` branch and open a
  pull request; never push to `main` directly. Verify with `git status -sb` first.
- History is strictly linear — rebase, never merge commits.
- **Commit only when the user explicitly asks.** Stage named files (`git add path`);
  never `git add -A`/`.`. One logical change per commit. Keep hooks on (no `--no-verify`).
- Conventional Commits with a scope: `feat(rendering): …`. Reuse existing scopes:
  `rendering, ui, input, audio, config, assets, i18n, typography, kiro, levels, seo, ci, patterns`.
- Never commit `.venv/`, `static/`, `.DS_Store`, or anything in `.gitignore`.
- When you create a commit or tag, append a line to `aidlc-docs/audit.md`.

## AI-DLC

The project was scaffolded with the AWS AI-DLC methodology; requirements and design docs
are under `aidlc-docs/`, and steering rules for other assistants live in `.kiro/` and
`.amazonq/`. These are reference material — consult `aidlc-docs/` for intended behavior,
but Git operations are not an AI-DLC stage and only need the user's explicit request.
