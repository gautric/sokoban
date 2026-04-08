/**
 * CREATIONAL PATTERNS — Applied to Sokoban game with Three.js
 *
 * 1. Singleton       — GameRegistry: single source of truth for all game subsystems
 * 2. Factory Method  — TileFactory: subclasses decide which tile mesh to create
 * 3. Abstract Factory — ThemeFactory: families of themed tiles (pixel, neon, retro)
 * 4. Builder         — LevelBuilder: step-by-step level construction
 * 5. Prototype       — EntityPrototype: clone pre-built Three.js meshes for perf
 */

import * as THREE from 'three';
import { TileType, EntityType, TILE_SIZE, WALL_HEIGHT, BOX_SIZE } from '../config.js';
import { PixelTextures } from '../rendering/PixelTextures.js';

// ─── 1. SINGLETON — GameRegistry ────────────────────────────────────────────
// Central registry holding references to all game subsystems.
// Avoids passing 6+ dependencies through every constructor.

export class GameRegistry {
  static #instance = null;

  constructor() {
    if (GameRegistry.#instance) return GameRegistry.#instance;
    this._services = new Map();
    GameRegistry.#instance = this;
  }

  static getInstance() {
    if (!GameRegistry.#instance) new GameRegistry();
    return GameRegistry.#instance;
  }

  register(name, service) { this._services.set(name, service); }
  get(name) { return this._services.get(name); }
  has(name) { return this._services.has(name); }

  static reset() { GameRegistry.#instance = null; } // for testing
}

// ─── 2. FACTORY METHOD — TileMeshFactory ────────────────────────────────────
// Base class defines the interface; subclasses override createMesh().
// GameScene calls factory.create(type) without knowing the concrete class.

class TileMeshCreator {
  create(tileType, options = {}) {
    const mesh = this.createMesh(tileType, options);
    this.configureShadows(mesh);
    return mesh;
  }
  createMesh(/* tileType, options */) { throw new Error('Subclass must implement createMesh'); }
  configureShadows(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
}

export class WallMeshCreator extends TileMeshCreator {
  createMesh() {
    const geo = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
    const side = new THREE.MeshLambertMaterial({ map: PixelTextures.getWallTexture() });
    const top = new THREE.MeshLambertMaterial({ map: PixelTextures.getWallTopTexture() });
    const mesh = new THREE.Mesh(geo, [side, side, top, side, side, side]);
    mesh.position.y = WALL_HEIGHT / 2;
    return mesh;
  }
}

export class FloorMeshCreator extends TileMeshCreator {
  createMesh() {
    const geo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const mat = new THREE.MeshLambertMaterial({ map: PixelTextures.getFloorTexture() });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.001;
    return mesh;
  }
  configureShadows(mesh) { mesh.receiveShadow = true; }
}

export class BoxMeshCreator extends TileMeshCreator {
  createMesh(_type, { onTarget = false } = {}) {
    const geo = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
    const side = onTarget ? PixelTextures.getBoxOnTargetTexture() : PixelTextures.getBoxTexture();
    const top = onTarget ? PixelTextures.getBoxOnTargetTopTexture() : PixelTextures.getBoxTopTexture();
    const dark = onTarget ? PixelTextures.getBoxOnTargetDarkTexture() : PixelTextures.getBoxDarkTexture();
    const label = onTarget ? PixelTextures.getBoxOnTargetLabelTexture() : PixelTextures.getBoxLabelTexture();
    const mesh = new THREE.Mesh(geo, [
      new THREE.MeshLambertMaterial({ map: dark }),
      new THREE.MeshLambertMaterial({ map: side }),
      new THREE.MeshLambertMaterial({ map: top }),
      new THREE.MeshLambertMaterial({ map: top }),
      new THREE.MeshLambertMaterial({ map: label }),
      new THREE.MeshLambertMaterial({ map: dark }),
    ]);
    mesh.position.y = BOX_SIZE / 2;
    return mesh;
  }
}

// ─── 3. ABSTRACT FACTORY — ThemeFactory ─────────────────────────────────────
// Produces families of related tile creators. Swap themes without touching game logic.

export class ThemeFactory {
  createWallCreator() { throw new Error('Abstract'); }
  createFloorCreator() { throw new Error('Abstract'); }
  createBoxCreator() { throw new Error('Abstract'); }
}

export class PixelThemeFactory extends ThemeFactory {
  createWallCreator() { return new WallMeshCreator(); }
  createFloorCreator() { return new FloorMeshCreator(); }
  createBoxCreator() { return new BoxMeshCreator(); }
}

// ─── 4. BUILDER — LevelBuilder ──────────────────────────────────────────────
// Constructs a level object step-by-step. Useful for procedural generation
// or editor tools where you add tiles/entities incrementally.

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

// ─── 5. PROTOTYPE — EntityPrototype ─────────────────────────────────────────
// Pre-build expensive Three.js meshes once, then clone them.
// Massive perf win for boards with many boxes/walls.

export class EntityPrototype {
  constructor() { this._prototypes = new Map(); }

  register(name, mesh) { this._prototypes.set(name, mesh); }

  clone(name) {
    const proto = this._prototypes.get(name);
    if (!proto) throw new Error(`No prototype: ${name}`);
    const cloned = proto.clone();
    // Deep-clone materials so each instance can be independently modified
    if (Array.isArray(cloned.material)) {
      cloned.material = cloned.material.map(m => m.clone());
    } else if (cloned.material) {
      cloned.material = cloned.material.clone();
    }
    return cloned;
  }

  has(name) { return this._prototypes.has(name); }
}
