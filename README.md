# Kiro's Ghost Sokoban (キロのゴースト倉庫番)

A 3D isometric [Sokoban](https://en.wikipedia.org/wiki/Sokoban) (倉庫番, "warehouse
keeper") puzzle game that runs entirely in the browser. You play Kiro, a ghost who
pushes boxes onto target tiles. The board is rendered with [Three.js](https://threejs.org/)
through an isometric camera and a pixel-art post-processing pass; the UI is plain
HTML/CSS overlaid on the canvas. The game is bilingual (English / 日本語), toggled at
runtime.

**No build step.** Pure vanilla JavaScript ES modules loaded directly by the browser.
No bundler, no `npm install`, no `node_modules`. Three.js (r0.160.0) is pulled from a
CDN via an import map in `index.html`, with Subresource Integrity hashes. The
`package.json` has no dependencies: it only marks the code as ES modules for Node.

## Running

ES modules and `fetch()` of the `.sok` level files do **not** work over `file://`, so
the game must be served over HTTP. A `Makefile` wraps the common tasks:

```bash
make run     # open the game in Firefox and serve it on :8080 (the one you want)
make serve   # just serve the current directory on http://localhost:8080 (PORT=xxxx to change)
make stop    # stop whatever is listening on the serve port
make check   # static checks (JS syntax + levels + entrypoints) and the unit tests
make test    # just the unit tests (Node's built-in runner, no dependencies)
make lint    # ESLint 9 through npx (nothing installed in the repo)
make par     # recompute the per-level par move counts after editing levels
```

Requires Node.js 18.19 or newer for the checks (CI uses Node 24).

Add `?log` to the URL (`http://localhost:8080/?log`) for log mode: game events
(scenes, levels, moves, audio) are printed to the browser console. There are no cheats.

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

Levels use the standard Sokoban text format (`.sok`) in `levels/`. The game ships 40
levels: Microban 1–22 and Microban II 1–18 by David W. Skinner, unchanged. A built-in
solver test proves every level can be finished, and the star rating compares your moves
with each level's true minimum. See `CLAUDE.md` for the grid grammar
(`#` wall, `@` player, `$` box, `.` target, `*` box on target, `+` player on target).

## Tests

The pure game logic (`src/core/`) carries no Three.js dependency (a test enforces it),
so it is unit-tested with Node's built-in test runner — no dependencies to install.
The suite also checks every level is solvable, EN/JA translations match, and the CDN
import map is pinned and hashed:

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
