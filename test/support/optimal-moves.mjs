// ── TOOL: recompute OPTIMAL_MOVES (par values for the star rating) ──
//
// Solves every shipped level move-optimally, in the same interleaved order as
// LevelManager.loadPacks(), and prints the array to paste into src/config.js.
// Run after editing levels/*.sok:   make par
import { readFileSync } from 'node:fs';
import { LevelParser } from '../../src/core/LevelParser.js';
import { solve } from './solver.js';

const read = f => LevelParser.parseSOK(readFileSync(new URL(`../../levels/${f}`, import.meta.url), 'utf8')).levels;
const packs = [read('microban.sok'), read('microban2.sok')];
const out = [];
for (let i = 0; i < Math.max(...packs.map(p => p.length)); i++) {
  for (const p of packs) {
    if (!p[i]) continue;
    const r = solve(p[i], 30_000_000);
    if (!r || r.unsolvable) throw new Error(`cannot solve "${p[i].title}"`);
    out.push(r.moves);
  }
}
const rows = [];
for (let i = 0; i < out.length; i += 10) rows.push('  ' + out.slice(i, i + 10).join(','));
console.log(`export const OPTIMAL_MOVES = Object.freeze([\n${rows.join(',\n')}\n]);`);
