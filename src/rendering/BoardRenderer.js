import * as THREE from 'three';
import { TileType, EntityType, TILE_SIZE, OCCLUSION_FADE_DURATION, OCCLUSION_MIN_OPACITY, MOVE_LERP_DURATION } from '../config.js';
import { TileFactory } from './TileFactory.js';
import { PixelTextures } from './PixelTextures.js';

export class BoardRenderer {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.wallMeshes = [];
    this.boxMeshes = {};
    this.targetMeshes = [];
    this._animating = false;
    this._animPromise = null;
  }

  buildBoard(board) {
    this.dispose();
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.wallMeshes = [];
    this.boxMeshes = {};
    this.targetMeshes = [];

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const tile = board.tiles[y][x];
        if (tile === TileType.EMPTY) continue;

        if (tile === TileType.WALL) {
          const wall = TileFactory.createWall();
          wall.position.x = x * TILE_SIZE;
          wall.position.z = y * TILE_SIZE;
          wall.userData.gridX = x;
          wall.userData.gridY = y;
          wall.userData.opacity = 1;
          wall.userData.targetOpacity = 1;
          this.group.add(wall);
          this.wallMeshes.push(wall);
        } else {
          const floor = TileFactory.createFloor();
          floor.position.x = x * TILE_SIZE;
          floor.position.z = y * TILE_SIZE;
          this.group.add(floor);

          if (tile === TileType.TARGET) {
            const target = TileFactory.createTarget();
            target.position.x = x * TILE_SIZE;
            target.position.z = y * TILE_SIZE;
            this.group.add(target);
            this.targetMeshes.push(target);
          }
        }

        if (board.entities[y][x] === EntityType.BOX) {
          this._addBox(x, y, board.tiles[y][x] === TileType.TARGET);
        }
      }
    }
  }

  _addBox(x, y, onTarget) {
    const box = TileFactory.createBox(onTarget);
    box.position.x = x * TILE_SIZE;
    box.position.z = y * TILE_SIZE;
    const key = `${x},${y}`;
    this.boxMeshes[key] = box;
    this.group.add(box);
  }

  updateBoard(board) {
    // Remove old boxes
    for (const key in this.boxMeshes) {
      this.group.remove(this.boxMeshes[key]);
    }
    this.boxMeshes = {};
    // Re-add boxes at current positions
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (board.entities[y][x] === EntityType.BOX) {
          this._addBox(x, y, board.tiles[y][x] === TileType.TARGET);
        }
      }
    }
  }

  animateBoxPush(fromX, fromY, toX, toY, board) {
    const key = `${fromX},${fromY}`;
    const mesh = this.boxMeshes[key];
    if (!mesh) return;
    delete this.boxMeshes[key];
    const sx = fromX * TILE_SIZE, sz = fromY * TILE_SIZE;
    const tx = toX * TILE_SIZE, tz = toY * TILE_SIZE;
    const start = performance.now();
    const anim = () => {
      const t = Math.min((performance.now() - start) / MOVE_LERP_DURATION, 1);
      const e = t * (2 - t);
      mesh.position.x = sx + (tx - sx) * e;
      mesh.position.z = sz + (tz - sz) * e;
      if (t < 1) requestAnimationFrame(anim);
      else {
        this.group.remove(mesh);
        this._addBox(toX, toY, board.tiles[toY][toX] === TileType.TARGET);
      }
    };
    anim();
  }

  animateMove(mesh, fromX, fromZ, toX, toZ) {
    return new Promise(resolve => {
      this._animating = true;
      const startTime = performance.now();
      const animate = () => {
        const t = Math.min((performance.now() - startTime) / MOVE_LERP_DURATION, 1);
        const ease = t * (2 - t); // ease-out quad
        mesh.position.x = fromX + (toX - fromX) * ease;
        mesh.position.z = fromZ + (toZ - fromZ) * ease;
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this._animating = false;
          resolve();
        }
      };
      animate();
    });
  }

  isAnimating() { return this._animating; }

  updateOcclusion() {}

  updateOcclusionTween() {}

  updateTargetPulse(time) {
    const pulse = 0.3 + Math.sin(time * 3) * 0.15;
    for (const t of this.targetMeshes) {
      t.userData.baseMat.emissiveIntensity = pulse;
    }
  }

  dispose() {
    this.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => m.dispose());
      }
    });
    this.scene.remove(this.group);
  }
}
