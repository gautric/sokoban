import { SliderIndicator } from './SliderIndicator.js';
import { t, onLangChange } from '../i18n.js';

/**
 * ZoomIndicator — COMPOSITE (via SliderIndicator→SceneNode) + OBSERVER.
 * Can subscribe to IsometricCamera zoom events for auto-sync.
 */
export class ZoomIndicator extends SliderIndicator {
  constructor() { super('zoom-indicator'); this._pct = 0; this._unsub = null; }

  init(container) {
    super.init(container);
    this.setZoom(0);
    onLangChange(() => this.setZoom(this._pct));
  }

  /** OBSERVER: subscribe to camera zoom events */
  subscribeTo(isoCamera) {
    if (this._unsub) this._unsub();
    this._unsub = isoCamera.events.on('camera:zoomed', ({ percent }) => this.setZoom(percent));
  }

  setZoom(percent) {
    this._pct = percent;
    const pct = Math.abs(percent) / 45 * 50;
    this.setValue(`${t('zoom')} ${percent > 0 ? '+' : ''}${percent}%`, percent >= 0 ? pct : -pct, true);
  }
}
