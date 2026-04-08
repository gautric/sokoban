import * as THREE from 'three';
import { BOARD_PADDING, CAMERA_ROTATION_DURATION, CAMERA_TILT, TILT_MIN, TILT_MAX, TILT_STEP, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../config.js';
import { EventBus } from '../patterns/behavioral.js';

/**
 * IsometricCamera — OBSERVER + STRATEGY patterns.
 *
 * OBSERVER:  Emits camera events (rotated, zoomed, tilted) via EventBus.
 * STRATEGY:  Easing function is swappable at runtime.
 */

// ── STRATEGY: easing functions ──
const EasingStrategies = {
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutCubic: t => 1 - Math.pow(1 - t, 3),
  linear: t => t,
};

export class IsometricCamera {
  constructor(easingName = 'easeInOutQuad') {
    this.camera = null;
    this.rotationStep = 0;
    this.currentRotation = 0;
    this.zoomPercent = 0;
    this.tiltDeg = CAMERA_TILT;
    this.tiltDirection = 1;
    this.baseSize = 5;
    this.center = new THREE.Vector3();
    this._tweenStart = 0;
    this._tweenFrom = 0;
    this._tweening = false;

    // ── STRATEGY: swappable easing ──
    this._easing = EasingStrategies[easingName] || EasingStrategies.easeInOutQuad;

    // ── OBSERVER: camera events ──
    this.events = new EventBus();
  }

  /** STRATEGY: change easing at runtime */
  setEasing(name) { this._easing = EasingStrategies[name] || EasingStrategies.easeInOutQuad; }

  init(boardWidth, boardHeight) {
    this.baseSize = Math.max(boardWidth, boardHeight) / 2 + BOARD_PADDING;
    this.center.set(boardWidth / 2 - 0.5, 0, boardHeight / 2 - 0.5);
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this._updateCameraPosition();
    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    if (!this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  _effectiveSize() { return this.baseSize * (1 - this.zoomPercent / 100); }

  _updateCameraPosition() {
    if (!this.camera) return;
    const angle = THREE.MathUtils.degToRad(this.currentRotation + 45);
    const tilt = THREE.MathUtils.degToRad(this.tiltDeg);
    const dist = this._effectiveSize() * 2.4;
    this.camera.position.set(
      this.center.x + Math.sin(angle) * Math.cos(tilt) * dist,
      this.center.y + Math.sin(tilt) * dist,
      this.center.z + Math.cos(angle) * Math.cos(tilt) * dist
    );
    this.camera.lookAt(this.center);
    this.camera.updateProjectionMatrix();
  }

  rotateLeft() {
    this.rotationStep = ((this.rotationStep - 1) + 4) % 4;
    this._startTween(this.currentRotation, this.rotationStep * 90);
    this.events.emit('camera:rotated', { step: this.rotationStep, direction: -1 });
  }

  rotateRight() {
    this.rotationStep = (this.rotationStep + 1) % 4;
    this._startTween(this.currentRotation, this.rotationStep * 90);
    this.events.emit('camera:rotated', { step: this.rotationStep, direction: 1 });
  }

  _startTween(from, to) {
    let diff = to - from;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    this._tweenFrom = from;
    this._tweenTo = from + diff;
    this._tweenStart = performance.now();
    this._tweening = true;
  }

  zoomIn() {
    this.zoomPercent = Math.min(ZOOM_MAX, this.zoomPercent + ZOOM_STEP);
    this._updateCameraPosition();
    this.events.emit('camera:zoomed', { percent: this.zoomPercent });
  }

  zoomOut() {
    this.zoomPercent = Math.max(ZOOM_MIN, this.zoomPercent - ZOOM_STEP);
    this._updateCameraPosition();
    this.events.emit('camera:zoomed', { percent: this.zoomPercent });
  }

  tiltStep() {
    this.tiltDeg += TILT_STEP * this.tiltDirection;
    if (this.tiltDeg >= TILT_MAX) { this.tiltDeg = TILT_MAX; this.tiltDirection = -1; }
    if (this.tiltDeg <= TILT_MIN) { this.tiltDeg = TILT_MIN; this.tiltDirection = 1; }
    this._updateCameraPosition();
    this.events.emit('camera:tilted', { deg: this.tiltDeg });
  }

  tiltUp() {
    this.tiltDeg = Math.min(TILT_MAX, this.tiltDeg + TILT_STEP);
    this._updateCameraPosition();
    this.events.emit('camera:tilted', { deg: this.tiltDeg });
  }

  tiltDown() {
    this.tiltDeg = Math.max(TILT_MIN, this.tiltDeg - TILT_STEP);
    this._updateCameraPosition();
    this.events.emit('camera:tilted', { deg: this.tiltDeg });
  }

  update(dt) {
    if (!this._tweening) return;
    const elapsed = performance.now() - this._tweenStart;
    const t = Math.min(elapsed / CAMERA_ROTATION_DURATION, 1);
    // ── STRATEGY: use current easing function ──
    const ease = this._easing(t);
    this.currentRotation = this._tweenFrom + (this._tweenTo - this._tweenFrom) * ease;
    if (t >= 1) {
      this.currentRotation = ((this.rotationStep * 90) % 360 + 360) % 360;
      this._tweening = false;
    }
    this._updateCameraPosition();
  }

  getRotationStep() { return this.rotationStep; }
  getZoomPercent() { return this.zoomPercent; }
  getTiltDeg() { return this.tiltDeg; }
  getCamera() { return this.camera; }
  getRotationAngle() { return this.currentRotation; }
}
