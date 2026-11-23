import { TileType, EntityType } from '../config.js';
import { LevelBuilder } from '../patterns/level-builder.js';

/**
 * LevelParser — BUILDER + INTERPRETER patterns.
 *
 * INTERPRETER: CHAR_MAP is the grammar — each SOK character is a terminal expression.
 *              parseSOK() interprets the SOK format line by line.
 * BUILDER:     Uses LevelBuilder to construct levels step-by-step from parsed data.
 */

// ── INTERPRETER: terminal expressions (SOK character grammar) ──
const CHAR_MAP = {
  '#': { tile: TileType.WALL,   entity: EntityType.NONE },
  ' ': { tile: TileType.FLOOR,  entity: EntityType.NONE },
  '.': { tile: TileType.TARGET, entity: EntityType.NONE },
  '@': { tile: TileType.FLOOR,  entity: EntityType.PLAYER },
  '+': { tile: TileType.TARGET, entity: EntityType.PLAYER },
  '$': { tile: TileType.FLOOR,  entity: EntityType.BOX },
  '*': { tile: TileType.TARGET, entity: EntityType.BOX },
};

export class LevelParser {
  /** INTERPRETER: parse SOK format text into level objects */
  static parseSOK(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').split('\n');
    let collection = '', author = '';
    const levels = [];
    let currentLines = [];
    let currentTitle = '';

    const flushLevel = () => {
      if (currentLines.length === 0) return;
      const level = LevelParser._buildLevel(currentLines, currentTitle);
      if (level) levels.push(level);
      currentLines = [];
      currentTitle = '';
    };

    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (/^Collection:\s*/i.test(trimmed)) { collection = trimmed.replace(/^Collection:\s*/i, ''); continue; }
      if (/^Author:\s*/i.test(trimmed)) { author = trimmed.replace(/^Author:\s*/i, ''); continue; }
      if (/^Title:\s*/i.test(trimmed)) continue;
      if (/^;\s*/.test(trimmed)) { currentTitle = trimmed.replace(/^;\s*/, ''); continue; }

      const isGridLine = /[#@+$*. ]/.test(trimmed) && /[#$@*.]/.test(trimmed);
      if (trimmed === '' || !isGridLine) flushLevel();
      else currentLines.push(trimmed);
    }
    flushLevel();

    return { collection, author, levels };
  }

  /** BUILDER: construct level using LevelBuilder */
  static _buildLevel(lines, title) {
    const height = lines.length;
    const width = Math.max(...lines.map(l => l.length));
    const builder = new LevelBuilder();
    builder.setSize(width, height).setTitle(title || '');

    let hasPlayer = false, boxCount = 0, targetCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const ch = x < lines[y].length ? lines[y][x] : ' ';
        const mapped = CHAR_MAP[ch] || { tile: TileType.EMPTY, entity: EntityType.NONE };

        builder.setTile(x, y, mapped.tile);
        if (mapped.tile === TileType.TARGET) targetCount++;

        if (mapped.entity === EntityType.PLAYER) {
          builder.placePlayer(x, y);
          hasPlayer = true;
        } else if (mapped.entity === EntityType.BOX) {
          builder.placeBox(x, y);
          boxCount++;
        }
      }
    }

    if (!hasPlayer || boxCount === 0 || boxCount !== targetCount) return null;
    return builder.build();
  }
}
