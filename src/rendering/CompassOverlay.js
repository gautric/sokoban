import { CAMERA_TILT } from '../config.js';
import { SceneNode } from '../patterns/structural.js';
import { EventBus } from '../patterns/behavioral.js';

/**
 * CompassOverlay — COMPOSITE + OBSERVER patterns.
 *
 * COMPOSITE: Extends SceneNode so it can be part of a UI scene graph tree.
 * OBSERVER:  Can subscribe to camera rotation events for auto-sync.
 */
export class CompassOverlay extends SceneNode {
  constructor() {
    super('compass');
    this.el = null;
    this.arrow = null;
    this.labels = {};
    this.angle = 0;
    this.events = new EventBus();
    this._unsub = null;
  }

  init(container) {
    this.el = document.createElement('div');
    this.el.id = 'compass';
    const ring = document.createElement('div');
    ring.className = 'compass-ring';
    ['N','E','S','W'].forEach(d => {
      const lbl = document.createElement('span');
      lbl.className = `compass-label compass-${d}`;
      lbl.textContent = d;
      ring.appendChild(lbl);
      this.labels[d] = lbl;
    });
    this.arrow = document.createElement('div');
    this.arrow.className = 'compass-arrow';
    ring.appendChild(this.arrow);
    this.el.appendChild(ring);
    container.appendChild(this.el);
  }

  /** OBSERVER: subscribe to IsometricCamera rotation events */
  subscribeTo(isoCamera) {
    if (this._unsub) this._unsub();
    this._unsub = isoCamera.events.on('camera:rotated', () => this.setRotation(isoCamera.getRotationAngle()));
  }

  setRotation(angleDeg) {
    this.angle = angleDeg;
    if (this.el) this.el.querySelector('.compass-ring').style.transform = `rotateX(${CAMERA_TILT}deg) rotate(${angleDeg + 45}deg)`;
    this.events.emit('compass:rotated', angleDeg);
  }

  /** COMPOSITE: update propagates to children */
  onUpdate() {}
  render() {}
}
