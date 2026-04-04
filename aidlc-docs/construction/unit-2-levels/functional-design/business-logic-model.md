# Business Logic Model — Unit 2: Level Data & Management

## LevelManager — Level Loading, Curation & Progression

### Level Loading
```
loadPacks():
  fetch levels/microban.sok → parse with LevelParser
  fetch levels/microban2.sok → parse with LevelParser
  interleave: take levels sequentially from each pack, alternating
  select ~40 levels total (first ~22 from Microban, first ~18 from Microban II)
  assign sequential IDs 1..N
  attach hardcoded optimal move counts per level
```

### Star Rating Calculation
```
getStarRating(levelId, moves):
  optimal = OPTIMAL_MOVES[levelId]
  if moves <= optimal: return 3
  if moves <= optimal * 1.5: return 2
  return 1
```

### Unlock Logic
```
isUnlocked(levelId):
  if levelId == 1: return true
  return progress[levelId - 1].solved == true
```

### Progress Persistence
- On level complete: save { solved: true, bestMoves: min(current, stored), bestPushes: min(current, stored), stars: max(current, stored) }
- Update unlockedLevel = max(unlockedLevel, completedLevelId + 1)
