import * as THREE from 'three';

const cache = {};
const S = 64;

function createTexture(drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');
  drawFn(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

function noise(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

function lerpColor(r1,g1,b1, r2,g2,b2, t) {
  return [r1+(r2-r1)*t|0, g1+(g2-g1)*t|0, b1+(b2-b1)*t|0];
}

export class PixelTextures {
  static getWallTexture() {
    if (cache.wall) return cache.wall;
    const tex = new THREE.TextureLoader().load('assets/wall.jpg');
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    cache.wall = tex;
    return cache.wall;
  }

  static getFloorTexture() {
    if (cache.floor) return cache.floor;
    cache.floor = createTexture(ctx => {
      ctx.fillStyle = '#C8BCA0';
      ctx.fillRect(0, 0, S, S);
      // Subtle stone variation
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 7);
          if (n > 0.6) {
            const a = (n - 0.6) * 0.15;
            ctx.fillStyle = `rgba(0,0,0,${a})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
    return cache.floor;
  }

  static getTargetTexture() {
    if (cache.target) return cache.target;
    cache.target = createTexture(ctx => {
      ctx.fillStyle = '#2E5E2E';
      ctx.fillRect(0, 0, S, S);
      // Subtle variation
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 11);
          if (n > 0.65) {
            ctx.fillStyle = `rgba(80,180,80,0.12)`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
    return cache.target;
  }

  static getBoxTexture() {
    if (cache.box) return cache.box;
    const tex = new THREE.TextureLoader().load('assets/wood.webp');
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    cache.box = tex;
    return cache.box;
  }

  static getBoxOnTargetTexture() {
    if (cache.boxTarget) return cache.boxTarget;
    const tex = new THREE.TextureLoader().load('assets/wood.webp');
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    cache.boxTarget = tex;
    return cache.boxTarget;
  }

  static getWallTopTexture() {
    if (cache.wallTop) return cache.wallTop;
    cache.wallTop = createTexture(ctx => {
      ctx.fillStyle = '#8B7B6F';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#7B6B5F';
      ctx.fillRect(2, 2, S-4, S-4);
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          if (noise(x, y, 13) > 0.8) {
            ctx.fillStyle = `rgba(0,0,0,0.08)`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
    return cache.wallTop;
  }
}
