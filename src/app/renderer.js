// ── RENDERER setup: the WebGLRenderer behind the BRIDGE (GameRenderer → ThreeJSRenderAPI) ──
import * as THREE from 'three';
import { ThreeJSRenderAPI, GameRenderer } from '../patterns/structural.js';

/** Create the WebGL canvas in `container` and return its Bridge abstraction. */
export function createRenderer(container) {
  const webgl = new THREE.WebGLRenderer({ antialias: false });
  webgl.shadowMap.enabled = true;
  webgl.setSize(window.innerWidth, window.innerHeight);
  webgl.setPixelRatio(1);
  webgl.autoClear = false;     // scenes clear through GameRenderer.beginFrame()
  container.insertBefore(webgl.domElement, container.firstChild);
  return new GameRenderer(new ThreeJSRenderAPI(webgl));
}
