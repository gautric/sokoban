import { SliderIndicator } from './SliderIndicator.js';

export class ZoomIndicator extends SliderIndicator {
  constructor() { super('zoom-indicator'); }

  init(container) {
    super.init(container);
    this.setZoom(0);
  }

  setZoom(percent) {
    const pct = Math.abs(percent) / 45 * 50;
    this.setValue(`zoom ${percent > 0 ? '+' : ''}${percent}%`, percent >= 0 ? pct : -pct, true);
  }
}
