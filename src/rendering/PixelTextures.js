import * as THREE from 'three';
import { TextureCache } from '../patterns/structural.js';

/**
 * PixelTextures — FLYWEIGHT pattern.
 * Uses TextureCache to share texture instances across all meshes.
 * Each texture is created once and reused by every wall/floor/box.
 */

const flyweight = new TextureCache();
const S = 64;

function createTexture(drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  drawFn(canvas.getContext('2d'));
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

function noise(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

function noisePass(ctx, seed, threshold = 0.6, alpha = 0.15) {
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const n = noise(x, y, seed);
      if (n > threshold) { ctx.fillStyle = `rgba(0,0,0,${(n - threshold) * alpha})`; ctx.fillRect(x, y, 1, 1); }
    }
}

function drawTape(ctx, color = 'rgba(60,30,5,0.7)') {
  ctx.fillStyle = color;
  ctx.fillRect(0, S / 2 - 5, S, 10);
}

function drawLabel(ctx) {
  const lw = 34, lh = 22, lx = (S - lw) / 2, ly = (S - lh) / 2 + 8;
  ctx.fillStyle = '#fff';
  ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = '#bbb';
  for (let i = 0; i < 4; i++) ctx.fillRect(lx + 3, ly + 4 + i * 5, lw - 6, 2);
}

function solidWithNoise(base, seed, threshold = 0.6, alpha = 0.15) {
  return createTexture(ctx => { ctx.fillStyle = base; ctx.fillRect(0, 0, S, S); noisePass(ctx, seed, threshold, alpha); });
}

export class PixelTextures {
  static getWallTexture() {
    return flyweight.get('wall', () => {
      const tex = new THREE.TextureLoader().load('assets/wall.png');
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex;
    });
  }

  static getWallTopTexture() {
    return flyweight.get('wallTop', () => createTexture(ctx => {
      ctx.fillStyle = '#8B7B6F'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#7B6B5F'; ctx.fillRect(2, 2, S - 4, S - 4);
      noisePass(ctx, 13, 0.8, 0.08);
    }));
  }

  static getFloorTexture() {
    return flyweight.get('floor', () => createTexture(ctx => {
      ctx.fillStyle = '#C8BCA0'; ctx.fillRect(0, 0, S, S); noisePass(ctx, 7);
    }));
  }

  static getTargetTexture() {
    return flyweight.get('target', () => createTexture(ctx => {
      ctx.fillStyle = '#2E5E2E'; ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        if (noise(x, y, 11) > 0.65) { ctx.fillStyle = 'rgba(80,180,80,0.12)'; ctx.fillRect(x, y, 1, 1); }
      }
    }));
  }

  static getBoxTexture()       { return flyweight.get('box', () => solidWithNoise('#8B5E3C', 20)); }
  static getBoxTopTexture()    { return flyweight.get('boxTop', () => createTexture(ctx => { ctx.fillStyle = '#A0724A'; ctx.fillRect(0, 0, S, S); noisePass(ctx, 21, 0.6, 0.12); drawTape(ctx); })); }
  static getBoxDarkTexture()   { return flyweight.get('boxDark', () => solidWithNoise('#6B3A22', 22, 0.6, 0.18)); }
  static getBoxLabelTexture()  { return flyweight.get('boxLabel', () => createTexture(ctx => { ctx.fillStyle = '#8B5E3C'; ctx.fillRect(0, 0, S, S); noisePass(ctx, 20); drawLabel(ctx); })); }

  static getBoxOnTargetTexture()       { return flyweight.get('boxTarget', () => solidWithNoise('#4C944C', 23)); }
  static getBoxOnTargetTopTexture()    { return flyweight.get('boxTargetTop', () => createTexture(ctx => { ctx.fillStyle = '#5CA85C'; ctx.fillRect(0, 0, S, S); noisePass(ctx, 24, 0.6, 0.12); drawTape(ctx, 'rgba(15,50,15,0.7)'); })); }
  static getBoxOnTargetDarkTexture()   { return flyweight.get('boxTargetDark', () => solidWithNoise('#3A6E3A', 25, 0.6, 0.18)); }
  static getBoxOnTargetLabelTexture()  { return flyweight.get('boxTargetLabel', () => createTexture(ctx => { ctx.fillStyle = '#4C944C'; ctx.fillRect(0, 0, S, S); noisePass(ctx, 23); drawLabel(ctx); })); }

  /** Dispose all cached textures (Flyweight cleanup) */
  static dispose() { flyweight.dispose(); }
}
