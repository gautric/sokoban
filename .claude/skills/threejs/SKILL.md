---
name: threejs
description: Work with Three.js r0.160.0 in this repo — meshes, materials, textures, lights, shadows, cameras, render targets, post-processing, addons. Use for any change in src/rendering/, scene setup in src/scenes/, or the WebGLRenderer in src/main.js.
---

# Three.js (r0.160.0 via CDN importmap)

## Loading

- Three.js comes from `https://unpkg.com/three@0.160.0/` through the `importmap` in
  `/index.html`. There is no local copy.
- Import: `import * as THREE from 'three';`
  Addons: `import { OrbitControls } from 'three/addons/controls/OrbitControls.js';`
- Use only APIs that exist in **r160**. Do not copy code written for newer releases
  (WebGPU renderer, TSL nodes, `three/webgpu`) or for old ones (`Geometry`,
  `THREE.Math`, `sRGBEncoding`). In r160: `renderer.outputColorSpace`,
  `texture.colorSpace = THREE.SRGBColorSpace`, `BufferGeometry` only.
- Never bump the version on your own. If you must, change every URL in the importmap
  together and say so.

## Where Three.js is allowed

Only in `src/rendering/`, `src/scenes/`, `src/main.js` and `src/patterns/` adapters.
**Never in `src/core/`.** Renderers read plain board data (tiles, entities, positions);
the board never knows about meshes.

## Project specifics

- Renderer is created in `src/main.js`: `antialias: false`, `setPixelRatio(1)`,
  `shadowMap.enabled = true`, `autoClear = false` (scenes clear and may render a second
  viewport — the minimap). Keep pixel ratio at 1: the pixel-art look depends on it.
- Camera: `src/rendering/IsometricCamera.js` drives a `PerspectiveCamera` at an iso
  angle with eased tweens. Tunables (tilt, zoom, lerp) live in `src/config.js`.
- Meshes come from `TileFactory.js`; procedural textures from `PixelTextures.js`
  (`CanvasTexture`, `NearestFilter`, no mipmaps). Use `magFilter = minFilter =
  THREE.NearestFilter` for every pixel texture.
- Textures are shared through the `TextureCache` flyweight — reuse it, do not create a
  new texture per tile.

## Resource lifecycle (mandatory)

Every geometry, material and texture you create must be disposed on teardown. Follow
`GameScene._loadLevel` / `deactivate`:

```js
obj.traverse(child => {
  if (child.geometry) child.geometry.dispose();
  if (child.material) {
    (Array.isArray(child.material) ? child.material : [child.material])
      .forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
  }
});
scene.remove(obj);
```

Renderers expose a `dispose()` method; call it from the scene. Shared (cached)
textures are disposed by their owner only, not by each mesh.

## Performance

- Share one geometry + one material across identical tiles; prefer `InstancedMesh`
  when a level has many identical objects.
- No allocation in the frame loop: reuse `Vector3`/`Quaternion` scratch objects held
  on the instance (`this._tmp = new THREE.Vector3()`).
- Animate with `dt` (seconds) passed to `update(dt)`, never with frame counts.
- Toggle `castShadow` / `receiveShadow` deliberately; shadows are the main GPU cost.
- On resize: update `camera.aspect`, `camera.updateProjectionMatrix()`,
  `renderer.setSize()`, and any render target size.

## Debugging

Open `http://localhost:8080/`. Check the console for WebGL warnings. Count live
resources with `renderer.info.memory` (geometries, textures) before and after a level
change — the numbers must not grow.
