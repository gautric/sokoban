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
    cache.wall = createTexture(ctx => {
      // Stone brick wall
      const brickH = 8, brickW = 16;
      for (let by = 0; by < S; by += brickH) {
        const offset = ((by / brickH) % 2) * (brickW / 2);
        for (let bx = -brickW; bx < S + brickW; bx += brickW) {
          const x0 = bx + offset, y0 = by;
          // Random brick tint
          const n = noise(bx, by, 1);
          const base = 70 + n * 30 | 0;
          ctx.fillStyle = `rgb(${base+10},${base},${base-10})`;
          ctx.fillRect(x0, y0, brickW - 1, brickH - 1);
          // Brick shading: lighter top, darker bottom
          ctx.fillStyle = `rgba(255,255,255,0.08)`;
          ctx.fillRect(x0, y0, brickW - 1, 2);
          ctx.fillStyle = `rgba(0,0,0,0.1)`;
          ctx.fillRect(x0, y0 + brickH - 3, brickW - 1, 2);
          // Per-pixel noise
          for (let py = y0; py < y0 + brickH - 1 && py < S; py++) {
            for (let px = x0; px < x0 + brickW - 1 && px < S; px++) {
              if (px < 0) continue;
              if (noise(px, py, 3) > 0.85) {
                ctx.fillStyle = `rgba(0,0,0,0.12)`;
                ctx.fillRect(px, py, 1, 1);
              }
            }
          }
        }
        // Mortar
        ctx.fillStyle = '#3E3028';
        ctx.fillRect(0, by + brickH - 1, S, 1);
      }
    });
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
      // Wood planks
      ctx.fillStyle = '#A07848';
      ctx.fillRect(0, 0, S, S);
      // Grain lines
      for (let y = 0; y < S; y++) {
        const wave = Math.sin(y * 0.3) * 2;
        const brightness = 140 + Math.sin(y * 0.15) * 20 | 0;
        ctx.fillStyle = `rgb(${brightness},${brightness - 40},${brightness - 80})`;
        ctx.fillRect(0, y, S, 1);
        // Fine grain detail
        for (let x = 0; x < S; x++) {
          const n = noise(x + wave, y, 5);
          if (n > 0.5) {
            const v = (n - 0.5) * 0.25;
            ctx.fillStyle = `rgba(60,30,0,${v})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      // Plank dividers
      ctx.fillStyle = '#6B4820';
      ctx.fillRect(0, S / 2 - 1, S, 2);
      // Knots
      const drawKnot = (cx, cy, r) => {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx*dx + dy*dy <= r*r) {
              const d = Math.sqrt(dx*dx+dy*dy)/r;
              ctx.fillStyle = `rgba(80,40,10,${0.5 - d*0.3})`;
              ctx.fillRect(cx+dx, cy+dy, 1, 1);
            }
          }
        }
      };
      drawKnot(20, 16, 4);
      drawKnot(45, 44, 3);
      // Border frame
      ctx.fillStyle = '#7B5830';
      ctx.fillRect(0,0,S,2); ctx.fillRect(0,S-2,S,2);
      ctx.fillRect(0,0,2,S); ctx.fillRect(S-2,0,2,S);
    });
    return cache.box;
  }

  static getBoxOnTargetTexture() {
    if (cache.boxTarget) return cache.boxTarget;
    cache.boxTarget = createTexture(ctx => {
      // Green-tinted wood
      ctx.fillStyle = '#6B9050';
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++) {
        const brightness = 100 + Math.sin(y * 0.15) * 20 | 0;
        ctx.fillStyle = `rgb(${brightness - 20},${brightness + 30},${brightness - 30})`;
        ctx.fillRect(0, y, S, 1);
        for (let x = 0; x < S; x++) {
          const n = noise(x + Math.sin(y*0.3)*2, y, 5);
          if (n > 0.5) {
            ctx.fillStyle = `rgba(0,40,0,${(n-0.5)*0.25})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.fillStyle = '#4A6830';
      ctx.fillRect(0, S/2-1, S, 2);
      // Border
      ctx.fillStyle = '#3E5828';
      ctx.fillRect(0,0,S,2); ctx.fillRect(0,S-2,S,2);
      ctx.fillRect(0,0,2,S); ctx.fillRect(S-2,0,2,S);
    });
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
