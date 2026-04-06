import { SliderIndicator } from './SliderIndicator.js';
import { CAMERA_TILT } from '../config.js';

export class TiltIndicator extends SliderIndicator {
  constructor() { super('tilt-indicator'); }

  init(container) {
    super.init(container);
    this.setTilt(CAMERA_TILT);
  }

  setTilt(deg) {
    this.setValue(`tilt ${Math.round(deg)}°`, (deg / 90) * 100);
  }
}
