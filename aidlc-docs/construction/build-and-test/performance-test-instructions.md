# Performance Test Instructions — Kiro's Ghost Sokoban

## Performance Requirements
- **Frame Rate**: 60fps target (minimum 30fps acceptable)
- **Level Load Time**: < 500ms
- **Initial Page Load**: < 3s (including Three.js CDN)

## Test 1: Frame Rate
1. Open DevTools → Performance tab (Chrome) or equivalent
2. Start a level, move around, rotate camera
3. Record a 10-second performance trace
4. **Expected**: Frame rate stays at or near 60fps
5. **Check**: No long frames (>33ms) during normal gameplay

## Test 2: Particle Performance
1. During gameplay, move rapidly to increase particle spawn rate
2. Monitor frame rate
3. **Expected**: No significant frame drops from particle system

## Test 3: Level Load Time
1. Open DevTools → Network tab
2. Click Play or select a level
3. **Expected**: .sok files load in < 200ms (after initial cache)

## Test 4: Memory
1. Open DevTools → Memory tab
2. Play through several levels (complete, restart, switch levels)
3. Take heap snapshots before and after
4. **Expected**: No significant memory growth (meshes disposed properly on level switch)

## Optimization Notes
If performance issues found:
- Reduce particle count in config.js (PARTICLE_SPAWN_RATE_IDLE/MOVING)
- Simplify wall occlusion check (reduce radius)
- Use InstancedMesh for floor tiles if many tiles
