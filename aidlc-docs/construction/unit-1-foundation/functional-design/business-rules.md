# Business Rules — Unit 1: Foundation & Core Logic

## Board Rules
- BR-01: Player can only move to FLOOR or TARGET tiles (not WALL, not out of bounds)
- BR-02: Player can push exactly one box — if box is in the way, check the tile beyond it
- BR-03: Box cannot be pushed into WALL, out of bounds, or another box
- BR-04: A move that pushes a box increments both move count and push count
- BR-05: A move without pushing increments only move count
- BR-06: Level is complete when every TARGET tile has a BOX on it
- BR-07: Undo restores the exact previous board state (entity positions + counters)

## LevelParser Rules
- BR-08: A valid level has exactly 1 player
- BR-09: A valid level has at least 1 box
- BR-10: Box count must equal target count
- BR-11: Rows are padded with FLOOR to the width of the longest row
- BR-12: Lines starting with `;` are comments (level titles)
- BR-13: Lines matching `Key: Value` pattern are metadata
- BR-14: Levels are separated by one or more blank lines

## StateManager Rules
- BR-15: Undo stack is cleared on level load and restart
- BR-16: Session state (undo stack, counters) is saved to localStorage on each move
- BR-17: Progress is saved only on level completion (not mid-level)
- BR-18: Best scores are only updated if new score is better than stored score

## InputHandler Rules
- BR-19: Movement keys are mapped through camera rotation before being sent to Board
- BR-20: Input is ignored while move animation is in progress (prevent queuing)
- BR-21: Input is ignored when pause menu or level complete overlay is visible
