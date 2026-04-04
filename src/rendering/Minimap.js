import * as THREE from 'three';
import { TILE_SIZE, BOARD_PADDING } from '../config.js';

export class Minimap {
  constructor() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    this.camera.position.set(0, 100, 0);
    this.camera.lookAt(0, 0, 0);
    this.baseSize = 5;
    this.center = new THREE.Vector3();
  }

  init(boardWidth, boardHeight) {
    this.baseSize = Math.max(boardWidth, boardHeight) / 2 + BOARD_PADDING * 0.5;
    this.center.set((boardWidth - 1) * TILE_SIZE / 2, 0, (boardHeight - 1) * TILE_SIZE / 2);
    this.camera.position.set(this.center.x, 100, this.center.z);
    this.camera.lookAt(this.center);
    this._updateFrustum(0);
  }

  setZoom(zoomPercent) {
    this._updateFrustum(zoomPercent);
  }

  setRotation(angleDeg) {
    const rad = THREE.MathUtils.degToRad(angleDeg + 180);
    this.camera.position.set(this.center.x, 100, this.center.z);
    this.camera.up.set(Math.sin(rad), 0, Math.cos(rad));
    this.camera.lookAt(this.center);
  }

  _updateFrustum(zoomPercent) {
    const s = this.baseSize * (1 - zoomPercent / 100);
    this.camera.left = -s;
    this.camera.right = s;
    this.camera.top = s;
    this.camera.bottom = -s;
    this.camera.updateProjectionMatrix();
  }

  render(renderer, scene) {
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const size = 120;
    const x = 10;
    const y = 10;
    renderer.setViewport(x, y, size, size);
    renderer.setScissor(x, y, size, size);
    renderer.setScissorTest(true);
    renderer.render(scene, this.camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
  }
}
