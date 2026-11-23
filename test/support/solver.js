// ── TEST SUPPORT: tiny Sokoban solver (move-optimal BFS) ──
//
// Breadth-first search over (player, boxes) states with a simple dead-square
// prune (a box on a non-target corner can never move again). Good enough for the
// small Microban puzzles shipped in levels/. Used by levels.test.js to prove each
// level can be finished and by test/support/optimal-moves.mjs to compute par values.
import { TileType, EntityType, DIR_VECTORS } from '../../src/config.js';

const DIRS = Object.values(DIR_VECTORS);

// Shared grid preparation: wall/target/dead-square maps and sorted box cells.
function prepare(level) {
  const { width: w, height: h, tiles, entities, playerStart } = level;
  const idx = (x, y) => y * w + x;
  const wall = new Uint8Array(w * h);
  const target = new Uint8Array(w * h);
  const boxes = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = tiles[y][x];
    wall[idx(x, y)] = (t === TileType.WALL || t === TileType.EMPTY) ? 1 : 0;
    target[idx(x, y)] = t === TileType.TARGET ? 1 : 0;
    if (entities[y][x] === EntityType.BOX) boxes.push(idx(x, y));
  }
  const isWall = (x, y) => x < 0 || y < 0 || x >= w || y >= h || wall[idx(x, y)] === 1;
  const dead = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (isWall(x, y) || target[idx(x, y)]) continue;
    if ((isWall(x, y - 1) || isWall(x, y + 1)) && (isWall(x - 1, y) || isWall(x + 1, y))) dead[idx(x, y)] = 1;
  }
  return { w, idx, isWall, target, dead, boxes: boxes.sort((a, b) => a - b), start: idx(playerStart.x, playerStart.y) };
}

/**
 * Fast solvability check: BFS over box configurations (one step = one push),
 * with the player normalised to the smallest cell it can reach.
 * @returns {{ pushes: number } | { unsolvable: true } | null}  null = budget hit
 */
export function isSolvable(level, maxStates = 1_000_000) {
  const { w, idx, isWall, target, dead, boxes, start } = prepare(level);
  const done = bs => bs.every(b => target[b] === 1);
  // Flood fill the player's reachable area for a given box set.
  const reach = (p, boxSet) => {
    const seen = new Set([p]);
    const stack = [p];
    let min = p;
    while (stack.length) {
      const c = stack.pop();
      if (c < min) min = c;
      const cx = c % w, cy = (c - cx) / w;
      for (const dv of DIRS) {
        const nx = cx + dv.x, ny = cy + dv.y;
        if (isWall(nx, ny)) continue;
        const n = idx(nx, ny);
        if (seen.has(n) || boxSet.has(n)) continue;
        seen.add(n); stack.push(n);
      }
    }
    return { seen, min };
  };
  if (done(boxes)) return { pushes: 0 };
  const r0 = reach(start, new Set(boxes));
  const visited = new Set([r0.min + ':' + boxes.join(',')]);
  let frontier = [{ p: start, bs: boxes }];
  for (let depth = 1; frontier.length; depth++) {
    const next = [];
    for (const { p, bs } of frontier) {
      const boxSet = new Set(bs);
      const { seen } = reach(p, boxSet);
      for (let i = 0; i < bs.length; i++) {
        const b = bs[i], bx = b % w, by = (b - bx) / w;
        for (const dv of DIRS) {
          const fx = bx - dv.x, fy = by - dv.y; // player stands here to push
          const tx = bx + dv.x, ty = by + dv.y; // box goes here
          if (isWall(fx, fy) || isWall(tx, ty) || !seen.has(idx(fx, fy))) continue;
          const t = idx(tx, ty);
          if (boxSet.has(t) || dead[t]) continue;
          const nbs = bs.slice(); nbs[i] = t; nbs.sort((a, c) => a - c);
          if (done(nbs)) return { pushes: depth };
          const { min } = reach(b, new Set(nbs));
          const k = min + ':' + nbs.join(',');
          if (visited.has(k)) continue;
          visited.add(k);
          if (visited.size > maxStates) return null;
          next.push({ p: b, bs: nbs });
        }
      }
    }
    frontier = next;
  }
  return { unsolvable: true };
}

/**
 * Move-optimal BFS (slow on big puzzles — used offline to compute par values).
 * @param {object} level  level object from LevelParser (tiles, entities, playerStart)
 * @param {number} maxStates  search budget; returns null past it
 * @returns {{ moves: number } | { unsolvable: true } | null}
 */
export function solve(level, maxStates = 2_000_000) {
  const { width: w, height: h, tiles, entities, playerStart } = level;
  const idx = (x, y) => y * w + x;
  const wall = new Uint8Array(w * h);
  const target = new Uint8Array(w * h);
  const boxes = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = tiles[y][x];
    wall[idx(x, y)] = (t === TileType.WALL || t === TileType.EMPTY) ? 1 : 0;
    target[idx(x, y)] = t === TileType.TARGET ? 1 : 0;
    if (entities[y][x] === EntityType.BOX) boxes.push(idx(x, y));
  }
  const isWall = (x, y) => x < 0 || y < 0 || x >= w || y >= h || wall[idx(x, y)] === 1;
  const dead = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (isWall(x, y) || target[idx(x, y)]) continue;
    const v = isWall(x, y - 1) || isWall(x, y + 1);
    const hz = isWall(x - 1, y) || isWall(x + 1, y);
    if (v && hz) dead[idx(x, y)] = 1;
  }
  const key = (p, bs) => p + ':' + bs.join(',');
  const done = bs => bs.every(b => target[b] === 1);

  const start = { p: idx(playerStart.x, playerStart.y), bs: boxes.sort((a, b) => a - b), d: 0 };
  if (done(start.bs)) return { moves: 0 };
  const seen = new Set([key(start.p, start.bs)]);
  let frontier = [start];
  while (frontier.length) {
    const next = [];
    for (const { p, bs, d } of frontier) {
      const px = p % w, py = (p - px) / w;
      for (const dv of DIRS) {
        const nx = px + dv.x, ny = py + dv.y;
        if (isWall(nx, ny)) continue;
        const np = idx(nx, ny);
        let nbs = bs;
        const bi = bs.indexOf(np);
        if (bi !== -1) {
          const bx = nx + dv.x, by = ny + dv.y;
          if (isWall(bx, by)) continue;
          const nb = idx(bx, by);
          if (bs.includes(nb) || dead[nb]) continue;
          nbs = bs.slice(); nbs[bi] = nb; nbs.sort((a, b) => a - b);
          if (done(nbs)) return { moves: d + 1 };
        }
        const k = key(np, nbs);
        if (seen.has(k)) continue;
        seen.add(k);
        if (seen.size > maxStates) return null;
        next.push({ p: np, bs: nbs, d: d + 1 });
      }
    }
    frontier = next;
  }
  return { unsolvable: true };
}
