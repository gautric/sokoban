# Unit Test Instructions — Kiro's Ghost Sokoban

This is a vanilla JS browser game with no test framework. Testing is manual and browser-based.

## Core Logic Verification (Board.js)

### Test 1: Basic Movement
1. Start game → Play → Level 1
2. Press arrow keys / WASD in each direction
3. **Expected**: Ghost moves one tile per keypress, move counter increments

### Test 2: Box Pushing
1. Walk into a box
2. **Expected**: Box moves one tile in push direction, both move and push counters increment

### Test 3: Blocked Movement
1. Walk into a wall
2. Push a box into a wall
3. Push a box into another box
4. **Expected**: No movement occurs, counters don't change

### Test 4: Undo
1. Make several moves
2. Press Z repeatedly
3. **Expected**: Each Z press reverses one move, counters decrement, board state restores

### Test 5: Win Detection
1. Push all boxes onto targets (red diamond markers)
2. **Expected**: Level Complete screen appears with stars, stats, and buttons

### Test 6: Restart
1. Make some moves, press R
2. **Expected**: Level resets to initial state, counters reset to 0

## Level System Verification

### Test 7: Level Loading
1. Open browser console, check for fetch errors
2. **Expected**: No errors, levels load from .sok files

### Test 8: Level Progression
1. Complete Level 1
2. **Expected**: Level 2 unlocks in Level Select

### Test 9: Level Select Lock
1. Go to Level Select
2. **Expected**: Level 1 unlocked, remaining levels locked (grayed out, non-clickable)

### Test 10: Star Rating
1. Complete a level
2. **Expected**: 1-3 stars displayed based on move count vs optimal

## Input Verification

### Test 11: Camera Rotation
1. Press Q/E
2. **Expected**: Camera rotates 90° smoothly, compass updates, movement directions remap correctly

### Test 12: Mouse Camera
1. Click and drag horizontally
2. **Expected**: Camera rotates after sufficient drag distance

### Test 13: Zoom
1. Scroll mouse wheel, press +/-
2. **Expected**: View zooms in/out, zoom indicator bar updates

### Test 14: Mute
1. Press M
2. **Expected**: Audio toggles on/off

### Test 15: Pause
1. Press Escape during gameplay
2. **Expected**: Pause overlay appears with Resume/Restart/Level Select/Main Menu buttons
