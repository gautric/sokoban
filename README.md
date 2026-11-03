# Kiro's Ghost Sokoban (キロのゴースト倉庫番)

A 3D isometric [Sokoban](https://en.wikipedia.org/wiki/Sokoban) (倉庫番, "warehouse
keeper") puzzle game that runs entirely in the browser. You play Kiro, a ghost who
pushes boxes onto target tiles. The board is rendered with [Three.js](https://threejs.org/)
through an isometric camera and a pixel-art post-processing pass; the UI is plain
HTML/CSS overlaid on the canvas. The game is bilingual (English / 日本語), toggled at
runtime.

**No build step.** Pure vanilla JavaScript ES modules loaded directly by the browser.
No bundler, no `npm install`, no `node_modules`. Three.js (r0.160.0) is pulled from a
CDN via an import map in `index.html`.

## Running

ES modules and `fetch()` of the `.sok` level files do **not** work over `file://`, so
the game must be served over HTTP. A `Makefile` wraps the common tasks:

```bash
make run     # open the game in Firefox and serve it on :8080 (the one you want)
make serve   # just serve the current directory on http://localhost:8080 (PORT=xxxx to change)
make stop    # stop whatever is listening on the serve port
make check   # static checks (JS syntax + levels + entrypoints) and the unit tests
make test    # just the unit tests (Node's built-in runner, no dependencies)
```

Add `?debug` to the URL (`http://localhost:8080/?debug`) to enable verbose audio
logging and the `window.__cheat` / `__services` / `__registry` console hooks.

## Controls

| Key | Action | Key | Action |
|-----|--------|-----|--------|
| Arrows | Move | `Z` | Undo |
| `Q` / `E` / Space | Rotate camera | `R` | Restart |
| `+` / `-` | Zoom | `M` | Mute |
| `P` | Tilt | `Esc` | Pause |
| `[` / `]` | Pixel size | `J` | Toggle language |

Mouse drag rotates the camera and the scroll wheel zooms; touch swipes map to moves.

## Levels

Levels use the standard Sokoban text format (`.sok`) in `levels/`. The packs shipped are
Microban and Microban II by David W. Skinner. See `CLAUDE.md` for the grid grammar
(`#` wall, `@` player, `$` box, `.` target, `*` box on target, `+` player on target).

## Tests

The pure game logic (`src/core/`) carries no Three.js dependency, so it is unit-tested
with Node's built-in test runner — no dependencies to install:

```bash
make test
```

Rendering and gameplay feel are verified by hand; the manual procedures live in
`aidlc-docs/construction/build-and-test/`.

## Architecture & design patterns

This codebase is intentionally a **teaching showcase of design patterns**: 23 Gang-of-Four
patterns plus 13 of Robert Nystrom's *Game Programming Patterns*. Most modules carry a
header comment naming the pattern(s) they embody. The indirection is deliberate — see
`CLAUDE.md` for the architecture map and the conventions to follow when extending it.

## License

See `LICENCE.md`.
