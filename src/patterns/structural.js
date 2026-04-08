/**
 * STRUCTURAL PATTERNS — Applied to Sokoban game with Three.js
 *
 * 6.  Adapter   — TouchInputAdapter: maps touch events to keyboard-style input
 * 7.  Bridge    — Renderer/RenderAPI: decouple rendering abstraction from impl
 * 8.  Composite — SceneGraph: uniform interface for single objects and groups
 * 9.  Decorator — LoggingAudio: wraps AudioManager with logging/analytics
 * 10. Facade    — GameFacade: single entry point to start/control the game
 * 11. Flyweight — TextureCache: share texture instances across many meshes
 * 12. Proxy     — LazyAudioProxy: defer AudioContext creation until first use
 */

import { Direction, ROTATION_MAP } from '../config.js';

// ─── 6. ADAPTER — TouchInputAdapter ────────────────────────────────────────
// Adapts touch/swipe gestures into the same callback interface as InputHandler.
// Game code doesn't know if input came from keyboard or touch.

export class TouchInputAdapter {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this._startX = 0;
    this._startY = 0;
    this._threshold = 30;
    this._onStart = this._onStart.bind(this);
    this._onEnd = this._onEnd.bind(this);
  }

  attach(element) {
    element.addEventListener('touchstart', this._onStart, { passive: true });
    element.addEventListener('touchend', this._onEnd, { passive: true });
  }

  detach(element) {
    element.removeEventListener('touchstart', this._onStart);
    element.removeEventListener('touchend', this._onEnd);
  }

  _onStart(e) {
    const t = e.touches[0];
    this._startX = t.clientX;
    this._startY = t.clientY;
  }

  _onEnd(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - this._startX;
    const dy = t.clientY - this._startY;
    if (Math.abs(dx) < this._threshold && Math.abs(dy) < this._threshold) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.callbacks.onMove?.(dx > 0 ? Direction.RIGHT : Direction.LEFT);
    } else {
      this.callbacks.onMove?.(dy > 0 ? Direction.DOWN : Direction.UP);
    }
  }
}

// ─── 7. BRIDGE — Renderer abstraction / implementation ─────────────────────
// Separates "what to render" (GameRenderer) from "how to render" (RenderAPI).
// Could swap WebGL for Canvas2D or WebGPU without changing game logic.

class RenderAPI {
  clear() {}
  renderScene(scene, camera) {} // eslint-disable-line no-unused-vars
  setSize(w, h) {} // eslint-disable-line no-unused-vars
}

export class ThreeJSRenderAPI extends RenderAPI {
  constructor(renderer) { super(); this.renderer = renderer; }
  clear() { this.renderer.clear(); }
  renderScene(scene, camera) { this.renderer.render(scene, camera); }
  setSize(w, h) { this.renderer.setSize(w, h); }
}

export class GameRenderer {
  constructor(renderAPI) { this.api = renderAPI; }
  setAPI(api) { this.api = api; }
  beginFrame() { this.api.clear(); }
  draw(scene, camera) { this.api.renderScene(scene, camera); }
  resize(w, h) { this.api.setSize(w, h); }
}

// ─── 8. COMPOSITE — SceneGraph ─────────────────────────────────────────────
// Treat individual game objects and groups uniformly.
// update(dt) propagates through the tree — standard game loop pattern.

export class SceneNode {
  constructor(name = '') {
    this.name = name;
    this.children = [];
    this.parent = null;
    this.active = true;
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
    return this;
  }

  remove(child) {
    const i = this.children.indexOf(child);
    if (i >= 0) { this.children.splice(i, 1); child.parent = null; }
  }

  update(dt) {
    if (!this.active) return;
    this.onUpdate(dt);
    for (const c of this.children) c.update(dt);
  }

  onUpdate(dt) {} // override in leaf nodes

  find(name) {
    if (this.name === name) return this;
    for (const c of this.children) {
      const found = c.find(name);
      if (found) return found;
    }
    return null;
  }
}

// ─── 9. DECORATOR — LoggingAudioDecorator ──────────────────────────────────
// Wraps AudioManager to add analytics/logging without modifying original class.
// Same interface — game code doesn't know it's decorated.

export class LoggingAudioDecorator {
  constructor(audioManager) {
    this._inner = audioManager;
    this.log = [];
  }

  init() { this._log('init'); this._inner.init(); }
  toggleMute() { this._log('toggleMute'); this._inner.toggleMute(); }
  isMuted() { return this._inner.isMuted(); }
  setMasterVolume(v) { this._log(`setMasterVolume(${v})`); this._inner.setMasterVolume(v); }

  get music() { return this._inner.music; }
  get sfx() { return this._inner.sfx; }
  get initialized() { return this._inner.initialized; }
  get ctx() { return this._inner.ctx; }

  _log(action) { this.log.push({ action, time: Date.now() }); }
  getLog() { return this.log; }
}

// ─── 10. FACADE — GameFacade ───────────────────────────────────────────────
// Single entry point that hides the complexity of initializing renderer,
// audio, levels, scenes, input, and the game loop.

export class GameFacade {
  constructor({ container, stateManager, audioManager, levelManager, inputHandler, sceneManager, renderer }) {
    this.container = container;
    this.state = stateManager;
    this.audio = audioManager;
    this.levels = levelManager;
    this.input = inputHandler;
    this.scenes = sceneManager;
    this.renderer = renderer;
    this._running = false;
    this._lastTime = 0;
  }

  async init() {
    await this.levels.loadPacks();
    this.scenes.switchTo('menu');
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._loop();
  }

  stop() { this._running = false; }

  _loop() {
    if (!this._running) return;
    const now = performance.now();
    const dt = now - this._lastTime;
    this._lastTime = now;
    this.scenes.update(dt);
    this.renderer.clear();
    this.scenes.render(this.renderer);
    requestAnimationFrame(() => this._loop());
  }
}

// ─── 11. FLYWEIGHT — TextureCache ──────────────────────────────────────────
// Shares texture objects across all meshes that use the same texture.
// Without this, each wall/floor/box would create its own texture — huge waste.

export class TextureCache {
  constructor() { this._cache = new Map(); }

  get(key, factory) {
    if (!this._cache.has(key)) {
      this._cache.set(key, factory());
    }
    return this._cache.get(key);
  }

  has(key) { return this._cache.has(key); }

  dispose() {
    for (const tex of this._cache.values()) {
      if (tex.dispose) tex.dispose();
    }
    this._cache.clear();
  }

  get size() { return this._cache.size; }
}

// ─── 12. PROXY — LazyAudioProxy ────────────────────────────────────────────
// Defers AudioContext creation until the user actually interacts.
// Browsers block autoplay — this proxy handles that transparently.

export class LazyAudioProxy {
  constructor(audioManagerFactory) {
    this._factory = audioManagerFactory;
    this._real = null;
    this._pending = [];
  }

  _ensure() {
    if (!this._real) {
      this._real = this._factory();
      this._real.init();
      for (const [method, args] of this._pending) this._real[method](...args);
      this._pending = [];
    }
    return this._real;
  }

  init() { this._ensure(); }
  toggleMute() { this._ensure().toggleMute(); }
  isMuted() { return this._real ? this._real.isMuted() : false; }
  setMasterVolume(v) {
    if (this._real) this._real.setMasterVolume(v);
    else this._pending.push(['setMasterVolume', [v]]);
  }

  get music() { return this._real?.music ?? null; }
  get sfx() { return this._real?.sfx ?? null; }
  get initialized() { return this._real?.initialized ?? false; }
}
