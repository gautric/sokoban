import { SliderIndicator } from './SliderIndicator.js';
import { CAMERA_TILT } from '../config.js';
import { t, onLangChange } from '../i18n.js';

/**
 * TiltIndicator — COMPOSITE (via SliderIndicator→SceneNode) + OBSERVER.
 * Can subscribe to IsometricCamera tilt events for auto-sync.
 */
export class TiltIndicator extends SliderIndicator {
  constructor() { super('tilt-indicator'); this._deg = CAMERA_TILT; this._unsub = null; }

  init(container) {
    super.init(container);
    this.setTilt(this._deg);
    onLangChange(() => this.setTilt(this._deg));
  }

  /** OBSERVER: subscribe to camera tilt events */
  subscribeTo(isoCamera) {
    if (this._unsub) this._unsub();
    this._unsub = isoCamera.events.on('camera:tilted', ({ deg }) => this.setTilt(deg));
  }

  setTilt(deg) {
    this._deg = deg;
    this.setValue(`${t('tilt')} ${Math.round(deg)}°`, (deg / 90) * 100);
  }
}
