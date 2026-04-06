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

function _drawTape(ctx, color = 'rgba(60,30,5,0.7)') {
  const tw = 10;
  const cy = S / 2;
  ctx.fillStyle = color;
  ctx.fillRect(0, cy - tw / 2, S, tw);
}

function _drawLabel(ctx) {
  const lw = 34, lh = 22, lx = (S - lw) / 2, ly = (S - lh) / 2 + 8;
  ctx.fillStyle = '#fff';
  ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = '#bbb';
  for (let i = 0; i < 4; i++) ctx.fillRect(lx + 3, ly + 4 + i * 5, lw - 6, 2);
}

export class PixelTextures {
  static getWallTexture() {
    if (cache.wall) return cache.wall;
    const tex = new THREE.TextureLoader().load('assets/wall.png');
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
    cache.box = createTexture(ctx => {
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 20);
          if (n > 0.6) { ctx.fillStyle = `rgba(0,0,0,${(n - 0.6) * 0.15})`; ctx.fillRect(x, y, 1, 1); }
        }
    });
    return cache.box;
  }

  static getBoxTopTexture() {
    if (cache.boxTop) return cache.boxTop;
    cache.boxTop = createTexture(ctx => {
      ctx.fillStyle = '#A0724A';
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 21);
          if (n > 0.6) { ctx.fillStyle = `rgba(0,0,0,${(n - 0.6) * 0.12})`; ctx.fillRect(x, y, 1, 1); }
        }
      _drawTape(ctx);
    });
    return cache.boxTop;
  }

  static getBoxDarkTexture() {
    if (cache.boxDark) return cache.boxDark;
    cache.boxDark = createTexture(ctx => {
      ctx.fillStyle = '#6B3A22';
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 22);
          if (n > 0.6) { ctx.fillStyle = `rgba(0,0,0,${(n - 0.6) * 0.18})`; ctx.fillRect(x, y, 1, 1); }
        }
    });
    return cache.boxDark;
  }

  static getBoxLabelTexture() {
    if (cache.boxLabel) return cache.boxLabel;
    cache.boxLabel = createTexture(ctx => {
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 20);
          if (n > 0.6) { ctx.fillStyle = `rgba(0,0,0,${(n - 0.6) * 0.15})`; ctx.fillRect(x, y, 1, 1); }
        }
      _drawLabel(ctx);
    });
    return cache.boxLabel;
  }

  static getBoxOnTargetLabelTexture() {
    if (cache.boxTargetLabel) return cache.boxTargetLabel;
    cache.boxTargetLabel = createTexture(ctx => {
      ctx.fillStyle = '#4C944C';
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 23);
          if (n > 0.6) { ctx.fillStyle = `rgba(0,0,0,${(n - 0.6) * 0.15})`; ctx.fillRect(x, y, 1, 1); }
        }
      _drawLabel(ctx);
    });
    return cache.boxTargetLabel;
  }

  static getBoxOnTargetTexture() {
    if (cache.boxTarget) return cache.boxTarget;
    cache.boxTarget = createTexture(ctx => {
      ctx.fillStyle = '#4C944C';
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 23);
          if (n > 0.6) { ctx.fillStyle = `rgba(0,0,0,${(n - 0.6) * 0.15})`; ctx.fillRect(x, y, 1, 1); }
        }
    });
    return cache.boxTarget;
  }

  static getBoxOnTargetTopTexture() {
    if (cache.boxTargetTop) return cache.boxTargetTop;
    cache.boxTargetTop = createTexture(ctx => {
      ctx.fillStyle = '#5CA85C';
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 24);
          if (n > 0.6) { ctx.fillStyle = `rgba(0,0,0,${(n - 0.6) * 0.12})`; ctx.fillRect(x, y, 1, 1); }
        }
      _drawTape(ctx, 'rgba(15,50,15,0.7)');
    });
    return cache.boxTargetTop;
  }

  static getBoxOnTargetDarkTexture() {
    if (cache.boxTargetDark) return cache.boxTargetDark;
    cache.boxTargetDark = createTexture(ctx => {
      ctx.fillStyle = '#3A6E3A';
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const n = noise(x, y, 25);
          if (n > 0.6) { ctx.fillStyle = `rgba(0,0,0,${(n - 0.6) * 0.18})`; ctx.fillRect(x, y, 1, 1); }
        }
    });
    return cache.boxTargetDark;
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
