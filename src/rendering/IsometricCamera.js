import * as THREE from 'three';
import { BOARD_PADDING, CAMERA_ROTATION_DURATION, CAMERA_TILT, TILT_MIN, TILT_MAX, TILT_STEP, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../config.js';

export class IsometricCamera {
  constructor() {
    this.camera = null;
    this.rotationStep = 0; // 0-3
    this.targetRotation = 0;
    this.currentRotation = 0;
    this.zoomPercent = 0;
    this.tiltDeg = CAMERA_TILT;
    this.tiltDirection = 1;
    this.baseSize = 5;
    this.center = new THREE.Vector3();
    this._tweenStart = 0;
    this._tweenFrom = 0;
    this._tweening = false;
  }

  init(boardWidth, boardHeight) {
    this.baseSize = Math.max(boardWidth, boardHeight) / 2 + BOARD_PADDING;
    this.center.set(boardWidth / 2 - 0.5, 0, boardHeight / 2 - 0.5);
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this._updateCameraPosition();
    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    if (!this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  _effectiveSize() {
    return this.baseSize * (1 - this.zoomPercent / 100);
  }

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
  }

  rotateRight() {
    this.rotationStep = (this.rotationStep + 1) % 4;
    this._startTween(this.currentRotation, this.rotationStep * 90);
  }

  _startTween(from, to) {
    // Handle wrapping (e.g., 270→0 should go 270→360)
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
  }

  zoomOut() {
    this.zoomPercent = Math.max(ZOOM_MIN, this.zoomPercent - ZOOM_STEP);
    this._updateCameraPosition();
  }

  getRotationStep() { return this.rotationStep; }
  getZoomPercent() { return this.zoomPercent; }
  getTiltDeg() { return this.tiltDeg; }
  getCamera() { return this.camera; }

  tiltStep() {
    this.tiltDeg += TILT_STEP * this.tiltDirection;
    if (this.tiltDeg >= TILT_MAX) { this.tiltDeg = TILT_MAX; this.tiltDirection = -1; }
    if (this.tiltDeg <= TILT_MIN) { this.tiltDeg = TILT_MIN; this.tiltDirection = 1; }
    this._updateCameraPosition();
  }

  tiltUp() {
    this.tiltDeg = Math.min(TILT_MAX, this.tiltDeg + TILT_STEP);
    this._updateCameraPosition();
  }

  tiltDown() {
    this.tiltDeg = Math.max(TILT_MIN, this.tiltDeg - TILT_STEP);
    this._updateCameraPosition();
  }

  update(dt) {
    if (!this._tweening) return;
    const elapsed = performance.now() - this._tweenStart;
    const t = Math.min(elapsed / CAMERA_ROTATION_DURATION, 1);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    this.currentRotation = this._tweenFrom + (this._tweenTo - this._tweenFrom) * ease;
    if (t >= 1) {
      this.currentRotation = ((this.rotationStep * 90) % 360 + 360) % 360;
      this._tweening = false;
    }
    this._updateCameraPosition();
  }

  getRotationAngle() { return this.currentRotation; }
}
