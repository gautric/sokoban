import * as THREE from 'three';
import { TILE_SIZE, BOARD_PADDING } from '../config.js';

/**
 * Minimap — OBSERVER + BRIDGE patterns.
 *
 * OBSERVER: Can subscribe to IsometricCamera events for auto-sync.
 * BRIDGE:   render() accepts any renderer (WebGL/WebGPU) — decoupled from impl.
 */
export class Minimap {
  constructor() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    this.camera.position.set(0, 100, 0);
    this.camera.lookAt(0, 0, 0);
    this.baseSize = 5;
    this.center = new THREE.Vector3();
    this._unsubscribers = [];
  }

  init(boardWidth, boardHeight) {
    this.baseSize = Math.max(boardWidth, boardHeight) / 2 + BOARD_PADDING * 0.5;
    this.center.set((boardWidth - 1) * TILE_SIZE / 2, 0, (boardHeight - 1) * TILE_SIZE / 2);
    this.camera.position.set(this.center.x, 100, this.center.z);
    this.camera.lookAt(this.center);
    this._updateFrustum(0);
  }

  /** OBSERVER: subscribe to IsometricCamera events for auto-sync */
  subscribeTo(isoCamera) {
    this._unsubscribers.forEach(fn => fn());
    this._unsubscribers = [
      isoCamera.events.on('camera:zoomed', ({ percent }) => this.setZoom(percent)),
      isoCamera.events.on('camera:rotated', () => this.setRotation(isoCamera.getRotationAngle())),
    ];
  }

  setZoom(zoomPercent) { this._updateFrustum(zoomPercent); }

  setRotation(angleDeg) {
    const rad = THREE.MathUtils.degToRad(angleDeg + 180);
    this.camera.position.set(this.center.x, 100, this.center.z);
    this.camera.up.set(Math.sin(rad), 0, Math.cos(rad));
    this.camera.lookAt(this.center);
  }

  _updateFrustum(zoomPercent) {
    const s = this.baseSize * (1 - zoomPercent / 100);
    this.camera.left = -s; this.camera.right = s;
    this.camera.top = s; this.camera.bottom = -s;
    this.camera.updateProjectionMatrix();
  }

  /** BRIDGE: render accepts any renderer implementation */
  render(renderer, scene) {
    const w = renderer.domElement.width, h = renderer.domElement.height;
    const size = 120, x = 10, y = 10;
    renderer.setViewport(x, y, size, size);
    renderer.setScissor(x, y, size, size);
    renderer.setScissorTest(true);
    renderer.render(scene, this.camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
  }

  dispose() { this._unsubscribers.forEach(fn => fn()); this._unsubscribers = []; }
}
