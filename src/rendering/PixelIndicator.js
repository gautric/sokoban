import { SliderIndicator } from './SliderIndicator.js';

export class PixelIndicator extends SliderIndicator {
  constructor() { super('pixel-indicator'); }

  init(container) {
    super.init(container);
    this.setPixelSize(4);
  }

  setPixelSize(size) {
    this.setValue(`pixel ${size}`, ((size - 1) / 15) * 100);
  }
}
