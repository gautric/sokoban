import * as THREE from 'three';

const cache = {};

function createTexture(size, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

export class PixelTextures {
  static getWallTexture() {
    if (cache.wall) return cache.wall;
    cache.wall = createTexture(16, (ctx, s) => {
      ctx.fillStyle = '#6B5B4F';
      ctx.fillRect(0, 0, s, s);
      // Brick pattern
      const colors = ['#7B6B5F', '#5B4B3F', '#8B7B6F'];
      for (let y = 0; y < s; y += 4) {
        const offset = (y % 8 === 0) ? 0 : 4;
        for (let x = 0; x < s; x += 8) {
          ctx.fillStyle = colors[(x + y) % 3];
          ctx.fillRect(x + offset, y, 7, 3);
        }
        // Mortar lines
        ctx.fillStyle = '#4A3A2E';
        ctx.fillRect(0, y + 3, s, 1);
      }
    });
    return cache.wall;
  }

  static getFloorTexture() {
    if (cache.floor) return cache.floor;
    cache.floor = createTexture(16, (ctx, s) => {
      ctx.fillStyle = '#C8BCA0';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#B8AC90';
      for (let y = 0; y < s; y += 8) {
        ctx.fillRect(0, y, s, 1);
      }
      for (let x = 0; x < s; x += 8) {
        ctx.fillRect(x, 0, 1, s);
      }
    });
    return cache.floor;
  }

  static getTargetTexture() {
    if (cache.target) return cache.target;
    cache.target = createTexture(16, (ctx, s) => {
      ctx.fillStyle = '#C8BCA0';
      ctx.fillRect(0, 0, s, s);
      // Diamond marker
      const c = s / 2;
      ctx.fillStyle = '#FF6B6B';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(c - i, c - (3 - i), i * 2 + 1, 1);
      }
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(c - (3 - i), c + i + 1, (3 - i) * 2 + 1, 1);
      }
      // Bright center
      px(ctx, c, c, '#FF9999');
    });
    return cache.target;
  }

  static getBoxTexture() {
    if (cache.box) return cache.box;
    cache.box = createTexture(16, (ctx, s) => {
      ctx.fillStyle = '#A0784C';
      ctx.fillRect(0, 0, s, s);
      // Border
      ctx.fillStyle = '#8B6840';
      ctx.fillRect(0, 0, s, 1); ctx.fillRect(0, s - 1, s, 1);
      ctx.fillRect(0, 0, 1, s); ctx.fillRect(s - 1, 0, 1, s);
      // Cross planks
      ctx.fillStyle = '#B8885C';
      for (let i = 0; i < s; i++) { px(ctx, i, i, '#B8885C'); px(ctx, s - 1 - i, i, '#B8885C'); }
      // Center
      ctx.fillStyle = '#C09060';
      ctx.fillRect(6, 6, 4, 4);
    });
    return cache.box;
  }

  static getBoxOnTargetTexture() {
    if (cache.boxTarget) return cache.boxTarget;
    cache.boxTarget = createTexture(16, (ctx, s) => {
      ctx.fillStyle = '#7CA060';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#6B8B50';
      ctx.fillRect(0, 0, s, 1); ctx.fillRect(0, s - 1, s, 1);
      ctx.fillRect(0, 0, 1, s); ctx.fillRect(s - 1, 0, 1, s);
      ctx.fillStyle = '#8CB870';
      for (let i = 0; i < s; i++) { px(ctx, i, i, '#8CB870'); px(ctx, s - 1 - i, i, '#8CB870'); }
      ctx.fillStyle = '#A0D080';
      ctx.fillRect(6, 6, 4, 4);
    });
    return cache.boxTarget;
  }

  static getWallTopTexture() {
    if (cache.wallTop) return cache.wallTop;
    cache.wallTop = createTexture(16, (ctx, s) => {
      ctx.fillStyle = '#8B7B6F';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#7B6B5F';
      ctx.fillRect(1, 1, s - 2, s - 2);
    });
    return cache.wallTop;
  }
}
