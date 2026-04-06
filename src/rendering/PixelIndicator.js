import { SliderIndicator } from './SliderIndicator.js';
import { PIXEL_SIZE_DEFAULT, PIXEL_SIZE_MIN, PIXEL_SIZE_MAX } from '../config.js';

export class PixelIndicator extends SliderIndicator {
  constructor() { super('pixel-indicator'); }

  init(container) {
    super.init(container);
    this.setPixelSize(PIXEL_SIZE_DEFAULT);
  }

  setPixelSize(size) {
    this.setValue(`pixel ${size}`, ((size - PIXEL_SIZE_MIN) / (PIXEL_SIZE_MAX - PIXEL_SIZE_MIN)) * 100);
  }
}
