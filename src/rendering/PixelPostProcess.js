// ── PIXEL POST-PROCESS: EffectComposer with a RenderPixelatedPass. Built on the
//    first render (it needs the WebGLRenderer). ──
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PIXEL_SIZE_DEFAULT, PIXEL_SIZE_MIN, PIXEL_SIZE_MAX, PIXEL_SIZE_STEP } from '../config.js';

export class PixelPostProcess {
  constructor() {
    this.pixelSize = PIXEL_SIZE_DEFAULT;
    this._composer = null;
    this._pass = null;
  }

  /** Change pixel size by `delta` steps, clamped. Returns the new size. */
  step(delta) {
    this.pixelSize = Math.max(PIXEL_SIZE_MIN, Math.min(PIXEL_SIZE_MAX, this.pixelSize + delta * PIXEL_SIZE_STEP));
    this._pass?.setPixelSize(this.pixelSize);
    return this.pixelSize;
  }

  render(renderer, scene, camera) {
    if (!this._composer) {
      this._composer = new EffectComposer(renderer);
      this._pass = new RenderPixelatedPass(this.pixelSize, scene, camera);
      this._pass.normalEdgeStrength = 0;
      this._pass.depthEdgeStrength = 0;
      this._composer.addPass(this._pass);
      this._composer.addPass(new OutputPass());
    }
    this._pass.camera = camera;
    renderer.setViewport(0, 0, renderer.domElement.width, renderer.domElement.height);
    this._composer.render();
  }

  setSize(w, h) { this._composer?.setSize(w, h); }

  /** Drop the composer; the next render builds a new one. */
  reset() {
    this._composer?.dispose?.();
    this._composer = null;
    this._pass = null;
  }
}
