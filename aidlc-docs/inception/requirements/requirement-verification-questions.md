# Requirements Verification Questions

Your specification is comprehensive. These questions address the remaining ambiguities to ensure a complete requirements baseline.

## Question 1
The spec mentions star ratings based on "optimal or near-optimal" move/push counts. How should optimal values be determined?

A) Hardcode known optimal solutions for each curated level (from Sokoban community databases)
B) Use a simple heuristic (e.g., 1 star = solved, 2 stars = under 2× box count moves, 3 stars = under 1.5× box count moves)
C) Skip star ratings entirely — just track solved/unsolved and best scores
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
The spec says "select a curated subset of ~40 levels across both packs, ordered by increasing difficulty." How should difficulty ordering be determined?

A) Order by level number within each pack (Microban levels are already roughly difficulty-ordered), interleave packs
B) Order by board size (smaller boards first) as a proxy for difficulty
C) Manually curate a specific list of 40 level numbers from each pack (you'll provide the list)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
For the level select screen, the spec says "levels unlock sequentially." Should the player be required to complete level N before accessing level N+1, or should a few levels ahead be unlocked?

A) Strict sequential — must complete level N to unlock level N+1
B) Unlock next 2-3 levels ahead so the player can skip a frustrating puzzle temporarily
C) All levels unlocked from the start (no gating)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
The spec mentions loading `.sok` files via `fetch()` but also says "embed in `src/data/levels.js`". Which approach should be used?

A) Embed level data directly in a JS module (`src/data/levels.js`) — no fetch needed, simpler deployment
B) Load `.sok` files from `levels/` directory via `fetch()` at runtime — keeps level data separate
C) Both — embed a default set in JS, but also support loading external `.sok` files
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 5
Should the game support mobile/touch input, or is desktop keyboard-only sufficient for this version?

A) Desktop keyboard-only (as specified in the input mapping table)
B) Add basic touch/swipe support for mobile browsers as well
X) Other (please describe after [Answer]: tag below)

[Answer]: use mouse to move the camera, use keyboard for player to move the ghost 

## Question 6: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: B
