import { Direction, ROTATION_MAP } from '../config.js';
import { buildInputChain } from '../patterns/behavioral.js';
import { TouchInputAdapter } from '../patterns/structural.js';

/**
 * InputHandler — CHAIN OF RESPONSIBILITY + ADAPTER patterns.
 *
 * Chain: keyboard events pass through UIInputHandler → GameInputHandler.
 *        UI handler eats events when menus are open.
 * Adapter: TouchInputAdapter maps swipe gestures to the same callback interface.
 */
export class InputHandler {
  constructor() {
    this.callbacks = {};
    this.rotationStep = 0;
    this.enabled = true;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._dragging = false;
    this._lastMouseX = 0;

    // ── CHAIN OF RESPONSIBILITY: built lazily in init() ──
    this._chain = null;

    // ── ADAPTER: touch input ──
    this._touchAdapter = null;
  }

  init(callbacks) {
    this.destroy();
    this.callbacks = callbacks;
    this.enabled = true;

    // ── CHAIN: UI handler eats Escape when menus open ──
    this._chain = buildInputChain(
      () => !this.enabled,
      (e) => this._processKey(e)
    );

    // ── ADAPTER: attach touch swipe support ──
    this._touchAdapter = new TouchInputAdapter(callbacks);
    this._touchAdapter.attach(document.body);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    if (this._touchAdapter) this._touchAdapter.detach(document.body);
  }

  setRotationStep(step) { this.rotationStep = ((step % 4) + 4) % 4; }
  _mapDirection(dir) { return ROTATION_MAP[this.rotationStep][dir]; }

  _onKeyDown(e) {
    // ── CHAIN: pass through chain first ──
    if (this._chain) this._chain.handle(e);
    else if (this.enabled) this._processKey(e);
  }

  _processKey(e) {
    if (!this.enabled) return;
    const cb = this.callbacks;
    switch (e.key) {
      case 'ArrowUp':    cb.onMove?.(this._mapDirection(Direction.UP)); break;
      case 'ArrowDown':  cb.onMove?.(this._mapDirection(Direction.DOWN)); break;
      case 'ArrowLeft':  cb.onMove?.(this._mapDirection(Direction.LEFT)); break;
      case 'ArrowRight': cb.onMove?.(this._mapDirection(Direction.RIGHT)); break;
      case 'z': case 'Z': cb.onUndo?.(); break;
      case 'r': case 'R': cb.onRestart?.(); break;
      case 'q': case 'Q': cb.onRotateLeft?.(); break;
      case 'e': case 'E': cb.onRotateRight?.(); break;
      case 'm': case 'M': cb.onToggleMute?.(); break;
      case 'Escape': cb.onPause?.(); break;
      case ' ': cb.onRotateRight?.(); break;
      case '+': case '=': cb.onZoomIn?.(); break;
      case '-': case '_': cb.onZoomOut?.(); break;
      case 'p': case 'P': cb.onTilt?.(); break;
      case '[': cb.onPixelDown?.(); break;
      case ']': cb.onPixelUp?.(); break;
      default: return;
    }
    e.preventDefault();
  }

  _onWheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    if (e.deltaY < 0) this.callbacks.onZoomIn?.();
    else if (e.deltaY > 0) this.callbacks.onZoomOut?.();
  }

  _onMouseDown(e) {
    if (e.button === 0) { this._dragging = true; this._lastMouseX = e.clientX; this._lastMouseY = e.clientY; }
  }

  _onMouseMove(e) {
    if (!this._dragging || !this.enabled) return;
    const dx = e.clientX - this._lastMouseX;
    const dy = e.clientY - this._lastMouseY;
    if (Math.abs(dx) > 60) {
      if (dx > 0) this.callbacks.onRotateRight?.(); else this.callbacks.onRotateLeft?.();
      this._lastMouseX = e.clientX;
    }
    if (Math.abs(dy) > 30) {
      if (dy > 0) this.callbacks.onTiltDown?.(); else this.callbacks.onTiltUp?.();
      this._lastMouseY = e.clientY;
    }
  }

  _onMouseUp() { this._dragging = false; }
}
