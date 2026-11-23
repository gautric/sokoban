---
name: 3d
description: 3D math and visual design for the isometric scene — coordinates (grid to world), camera angles, rotation and tilt, lerp/easing, quaternions, lighting, shadows, pixel-art post-processing, occlusion fade, particles, picking. Use when placing, moving or animating anything in 3D space or changing the look of the scene.
---

# 3D (isometric, pixel-art)

## Coordinates

- Board grid is `(x, y)` with `y` going down rows. World is Three.js Y-up.
  Mapping convention: grid `x` → world `x`, grid `y` → world `z`, height → world `y`.
  Check `BoardRenderer.js` / `TileFactory.js` for the exact offsets (tile centre,
  board centring) and reuse their helper — do not re-derive it.
- One tile = 1 world unit. Keep it that way so lerps and distances stay readable.
- Camera rotation is in 90° steps around the board centre. Movement keys stay
  board-relative; if a change makes them camera-relative, remap through the current
  camera quadrant in one place.

## Camera

- `IsometricCamera.js` uses a `PerspectiveCamera` at an iso-like angle (not an
  `OrthographicCamera`). Tilt and zoom have min/max in `src/config.js`; clamp to them.
- Animate camera with eased tweens over a duration, not a fixed step per frame.
- After any change to fov/aspect/near/far: `camera.updateProjectionMatrix()`.

## Animation math

```js
const t = Math.min(1, elapsed / duration);
const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
obj.position.lerpVectors(from, to, e);
```

- Frame-rate independent smoothing: `k = 1 - Math.exp(-speed * dt)` then
  `x += (target - x) * k`.
- Rotations: `Quaternion.slerp`, or lerp the angle with wrap-around (shortest path).
- Reuse scratch vectors; no `new Vector3()` per frame.

## Look

- Pixel art: low internal resolution then upscale with `NearestFilter`; pixel size is
  user-adjustable (`[` / `]`). Textures use `NearestFilter`, no mipmaps.
- Palette: keep colours in `config.js` / `PixelTextures.js`, not inline.
- Lighting: one ambient/hemisphere + one directional light with shadows is the budget.
  Tight shadow camera bounds around the board → sharper shadows, less cost.
- Wall occlusion: walls between camera and player fade (`transparent`, lowered
  `opacity`, `depthWrite` handled carefully). Reuse the existing fade, don't add a new one.
- Particles: use the `ParticleSOA` / `ObjectPool` patterns in
  `src/patterns/game-patterns.js` — pooled, no per-particle allocation.

## Picking (mouse / touch on the board)

`Raycaster.setFromCamera(ndc, camera)` → intersect a ground plane or tile meshes →
world point → grid cell via the inverse of the grid→world helper. Convert screen to NDC
with the canvas `getBoundingClientRect()`, not `window` size.

## Verify

Look at it. Serve with `make serve`, open `http://localhost:8080/`, rotate (Q/E),
tilt (P), zoom (+/-), change pixel size, and check: no z-fighting, no shadow acne, no
popping, smooth easing, and the same look at all 4 rotations.
