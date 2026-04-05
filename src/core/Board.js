import { TileType, EntityType, Direction, MoveResult, DIR_VECTORS } from '../config.js';

export class Board {
  constructor() {
    this.tiles = [];
    this.entities = [];
    this.playerPos = { x: 0, y: 0 };
    this.width = 0;
    this.height = 0;
    this.targetPositions = [];
  }

  loadLevel(level) {
    this.width = level.width;
    this.height = level.height;
    this.tiles = level.tiles.map(r => [...r]);
    this.entities = level.entities.map(r => [...r]);
    this.playerPos = { ...level.playerStart };
    this.targetPositions = level.targetPositions.map(p => ({ ...p }));
    this.boxesLocked = false;
  }

  getTile(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return TileType.WALL;
    return this.tiles[y][x];
  }

  getEntity(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return EntityType.NONE;
    return this.entities[y][x];
  }

  tryMove(direction) {
    const dv = DIR_VECTORS[direction];
    const nx = this.playerPos.x + dv.x;
    const ny = this.playerPos.y + dv.y;

    if (this.getTile(nx, ny) === TileType.WALL || this.getTile(nx, ny) === TileType.EMPTY) {
      return MoveResult.BLOCKED;
    }

    if (this.getEntity(nx, ny) === EntityType.BOX) {
      if (this.boxesLocked) return MoveResult.BLOCKED;
      const bx = nx + dv.x;
      const by = ny + dv.y;
      if (this.getTile(bx, by) === TileType.WALL || this.getTile(bx, by) === TileType.EMPTY ||
          this.getEntity(bx, by) === EntityType.BOX) {
        return MoveResult.BLOCKED;
      }
      this.entities[by][bx] = EntityType.BOX;
      this.entities[ny][nx] = EntityType.NONE;
      this.entities[ny][nx] = EntityType.PLAYER;
      this.entities[this.playerPos.y][this.playerPos.x] = EntityType.NONE;
      this.playerPos = { x: nx, y: ny };
      return MoveResult.PUSHED;
    }

    this.entities[ny][nx] = EntityType.PLAYER;
    this.entities[this.playerPos.y][this.playerPos.x] = EntityType.NONE;
    this.playerPos = { x: nx, y: ny };
    return MoveResult.MOVED;
  }

  isComplete() {
    for (const t of this.targetPositions) {
      if (this.entities[t.y][t.x] !== EntityType.BOX) return false;
    }
    return true;
  }

  getState() {
    return {
      entities: this.entities.map(r => [...r]),
      playerPos: { ...this.playerPos },
    };
  }

  setState(state) {
    this.entities = state.entities.map(r => [...r]);
    this.playerPos = { ...state.playerPos };
  }
}
