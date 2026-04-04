import { TileType, EntityType } from '../config.js';

const CHAR_MAP = {
  '#': { tile: TileType.WALL, entity: EntityType.NONE },
  ' ': { tile: TileType.FLOOR, entity: EntityType.NONE },
  '.': { tile: TileType.TARGET, entity: EntityType.NONE },
  '@': { tile: TileType.FLOOR, entity: EntityType.PLAYER },
  '+': { tile: TileType.TARGET, entity: EntityType.PLAYER },
  '$': { tile: TileType.FLOOR, entity: EntityType.BOX },
  '*': { tile: TileType.TARGET, entity: EntityType.BOX },
};

export class LevelParser {
  static parseSOK(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').split('\n');
    let collection = '', author = '';
    const levels = [];
    let currentLines = [];
    let currentTitle = '';

    const flushLevel = () => {
      if (currentLines.length === 0) return;
      const level = LevelParser._parseGrid(currentLines, currentTitle);
      if (level && LevelParser._validate(level)) levels.push(level);
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
      if (trimmed === '' || !isGridLine) {
        flushLevel();
      } else {
        currentLines.push(trimmed);
      }
    }
    flushLevel();

    return { collection, author, levels };
  }

  static _parseGrid(lines, title) {
    const height = lines.length;
    const width = Math.max(...lines.map(l => l.length));
    const tiles = [];
    const entities = [];
    let playerStart = null;
    const targetPositions = [];

    for (let y = 0; y < height; y++) {
      const tileRow = [];
      const entityRow = [];
      for (let x = 0; x < width; x++) {
        const ch = x < lines[y].length ? lines[y][x] : ' ';
        const mapped = CHAR_MAP[ch] || { tile: TileType.EMPTY, entity: EntityType.NONE };
        tileRow.push(mapped.tile);
        entityRow.push(mapped.entity);
        if (mapped.entity === EntityType.PLAYER) playerStart = { x, y };
        if (mapped.tile === TileType.TARGET) targetPositions.push({ x, y });
      }
      tiles.push(tileRow);
      entities.push(entityRow);
    }

    return { title: title || null, width, height, tiles, entities, playerStart, targetPositions };
  }

  static _validate(level) {
    if (!level.playerStart) return false;
    let boxCount = 0;
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (level.entities[y][x] === EntityType.BOX) boxCount++;
      }
    }
    return boxCount > 0 && boxCount === level.targetPositions.length;
  }
}
