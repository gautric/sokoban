// ── 4. BUILDER: LevelBuilder ──
//
// Step-by-step construction of a level object (the shape Board.loadLevel
// expects). Pure data: depends only on config.js, never on Three.js, so the
// core layer (LevelParser, LevelManager) and the Node tests can import it.
// Re-exported by creational.js and index.js with the other creational patterns.

import { TileType, EntityType } from '../config.js';

export class LevelBuilder {
  constructor() { this.reset(); }

  reset() {
    this._level = { width: 0, height: 0, tiles: [], entities: [], playerStart: null, targetPositions: [], title: '' };
    return this;
  }

  setSize(w, h) {
    this._level.width = w;
    this._level.height = h;
    this._level.tiles = Array.from({ length: h }, () => new Array(w).fill(TileType.EMPTY));
    this._level.entities = Array.from({ length: h }, () => new Array(w).fill(EntityType.NONE));
    return this;
  }

  setTitle(title) { this._level.title = title; return this; }

  setTile(x, y, type) {
    if (x >= 0 && x < this._level.width && y >= 0 && y < this._level.height) {
      this._level.tiles[y][x] = type;
      if (type === TileType.TARGET) this._level.targetPositions.push({ x, y });
    }
    return this;
  }

  placePlayer(x, y) {
    this._level.playerStart = { x, y };
    this._level.entities[y][x] = EntityType.PLAYER;
    if (this._level.tiles[y][x] === TileType.EMPTY) this._level.tiles[y][x] = TileType.FLOOR;
    return this;
  }

  placeBox(x, y) {
    this._level.entities[y][x] = EntityType.BOX;
    if (this._level.tiles[y][x] === TileType.EMPTY) this._level.tiles[y][x] = TileType.FLOOR;
    return this;
  }

  build() {
    const result = { ...this._level, targetPositions: [...this._level.targetPositions] };
    this.reset();
    return result;
  }
}
