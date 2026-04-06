import { SliderIndicator } from './SliderIndicator.js';
import { t, onLangChange } from '../i18n.js';

export class ZoomIndicator extends SliderIndicator {
  constructor() { super('zoom-indicator'); this._pct = 0; }

  init(container) {
    super.init(container);
    this.setZoom(0);
    onLangChange(() => this.setZoom(this._pct));
  }

  setZoom(percent) {
    this._pct = percent;
    const pct = Math.abs(percent) / 45 * 50;
    this.setValue(`${t('zoom')} ${percent > 0 ? '+' : ''}${percent}%`, percent >= 0 ? pct : -pct, true);
  }
}
