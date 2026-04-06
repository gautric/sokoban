import { SliderIndicator } from './SliderIndicator.js';
import { CAMERA_TILT } from '../config.js';
import { t, onLangChange } from '../i18n.js';

export class TiltIndicator extends SliderIndicator {
  constructor() { super('tilt-indicator'); this._deg = CAMERA_TILT; }

  init(container) {
    super.init(container);
    this.setTilt(this._deg);
    onLangChange(() => this.setTilt(this._deg));
  }

  setTilt(deg) {
    this._deg = deg;
    this.setValue(`${t('tilt')} ${Math.round(deg)}°`, (deg / 90) * 100);
  }
}
