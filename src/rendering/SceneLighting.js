// ── SCENE LIGHTING: ambient + one shadow-casting sun that follows the camera ──
import * as THREE from 'three';

const AMBIENT_COLOR = 0xFFE8CC;
const SUN_DISTANCE = 10;

export class SceneLighting {
  constructor() {
    this.ambient = new THREE.AmbientLight(AMBIENT_COLOR, 0.5);
    this.sun = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, { near: 0.1, far: 50, left: -15, right: 15, top: 15, bottom: -15 });
  }

  /** (Re)add the lights after the scene was purged. */
  addTo(scene) {
    scene.add(this.ambient, this.sun, this.sun.target);
  }

  /** Keep the sun behind the camera so shadows fall away from the viewer. */
  follow(cameraAngleDeg, center) {
    const a = THREE.MathUtils.degToRad(cameraAngleDeg + 45 - 90);
    this.sun.position.set(center.x + Math.sin(a) * SUN_DISTANCE, SUN_DISTANCE, center.z + Math.cos(a) * SUN_DISTANCE);
    this.sun.target.position.copy(center);
  }
}
