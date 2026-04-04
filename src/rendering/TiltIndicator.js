import { CAMERA_TILT } from '../config.js';

export class TiltIndicator {
  constructor() {
    this.el = null;
    this.fill = null;
    this.label = null;
  }

  init(container) {
    this.el = document.createElement('div');
    this.el.id = 'tilt-indicator';

    this.label = document.createElement('div');
    this.label.className = 'tilt-label';
    this.label.textContent = `${CAMERA_TILT}°`;

    const track = document.createElement('div');
    track.className = 'tilt-track';

    this.fill = document.createElement('div');
    this.fill.className = 'tilt-fill';

    track.appendChild(this.fill);
    this.el.appendChild(this.label);
    this.el.appendChild(track);
    container.appendChild(this.el);
    this.setTilt(CAMERA_TILT);
  }

  setTilt(deg) {
    this.label.textContent = `${Math.round(deg)}°`;
    const pct = (deg / 90) * 100;
    this.fill.style.width = `${pct}%`;
    this.fill.style.left = '0';
  }
}
