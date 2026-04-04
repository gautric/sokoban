# Business Logic Model — Unit 3: Rendering Engine

## IsometricCamera

### Setup
- OrthographicCamera with frustum sized to fit board + padding
- Initial rotation: Y = 45°, X = -35.264° (true isometric)
- Frustum recalculated on board load: `halfWidth = max(boardW, boardH) / 2 + padding`

### Rotation
- Q/E triggers 90° snap: target angle += ±90°, tween over CAMERA_ROTATION_DURATION
- Mouse drag: accumulate deltaX → continuous rotation (snap to nearest 90° on release optional)
- Current rotation stored as one of [0, 90, 180, 270] for InputHandler direction mapping

### Zoom
- Zoom factor: 1.0 = default (fit board). Range: 0.55 to 1.45 (±45%)
- Scroll/+/-: adjust by ZOOM_STEP, clamp to range
- Apply by scaling orthographic frustum

## BoardRenderer

### Mesh Creation
- For each tile in board: create floor mesh at (x, 0, y) in world space
- Walls: add 1×1×1 cube at (x, 0.5, y)
- Targets: floor + emissive marker mesh (pulsing opacity animation)
- Boxes: 0.8×0.8×0.8 cube at (x, 0.4, y), swap material when on target

### Wall Occlusion Algorithm
```
updateOcclusion(playerPos, camera):
  playerScreen = project playerPos to screen space
  for each wall mesh:
    wallScreen = project wall center to screen space
    if wallScreen overlaps playerScreen AND wall is closer to camera than player:
      tween wall opacity → 0.15, set depthWrite = false
    else:
      tween wall opacity → 1.0, restore depthWrite = true
  
  Also check boxes near player for occlusion
```

### Move Animation
- On MOVED/PUSHED result: lerp player mesh from old to new position over 150ms
- On PUSHED: simultaneously lerp box mesh
- Block input during animation

## PlayerRenderer

### Billboard Sprite
- Load ghosty.png as SpriteMaterial
- Always faces camera (Sprite default behavior)
- Flip: scale.x = -1 when facing left, +1 when facing right

### Bobbing
```
update(dt):
  elapsed += dt
  sprite.position.y = baseY + sin(elapsed / BOB_PERIOD * 2π) * BOB_AMPLITUDE
```

### Particle Aura
- Pool of ~50 particle objects (THREE.Points or small billboard sprites)
- Each frame: spawn SPAWN_RATE particles at player position + random offset in ring
- Each particle: drift outward + upward, shrink, fade alpha over PARTICLE_LIFETIME
- AdditiveBlending, color = PARTICLE_COLOR with slight random brightness
- On move/push: temporarily increase spawn rate

## PixelTextures

### Generation Pattern
- Create offscreen Canvas (16×16 or 32×32)
- Draw pixel patterns using fillRect calls
- Convert to THREE.CanvasTexture with NearestFilter for both mag and min
- Cache textures — generate once, reuse

### Texture Definitions
- **Wall**: Gray/brown brick pattern with mortar lines
- **Floor**: Light beige/gray subtle tile grid
- **Target**: Dark floor with glowing diamond shape (bright center pixel)
- **Box**: Brown wooden crate with cross-plank pattern
- **Box on target**: Same crate with green/gold tint overlay

## CompassOverlay
- Separate THREE.Scene + OrthographicCamera rendered to a viewport region (bottom-right 100×100px)
- 4 lines from origin along ±X and ±Z axes
- Letter labels (N, W, E, S) as canvas-texture billboard sprites at line tips
- N line + label: color #7B61FF, others: #FFFFFF
- Rotation synced: compass camera rotation = main camera rotation

## ZoomIndicator
- HTML div with CSS: dark track bar, violet (#7B61FF) fill
- Fill grows from center: zoom in → fill right, zoom out → fill left
- Label shows percentage text in pixel font
