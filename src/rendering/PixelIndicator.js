import { SliderIndicator } from './SliderIndicator.js';
import { PIXEL_SIZE_DEFAULT, PIXEL_SIZE_MIN, PIXEL_SIZE_MAX } from '../config.js';
import { t, onLangChange } from '../i18n.js';

export class PixelIndicator extends SliderIndicator {
  constructor() { super('pixel-indicator'); this._size = PIXEL_SIZE_DEFAULT; }

  init(container) {
    super.init(container);
    this.setPixelSize(this._size);
    onLangChange(() => this.setPixelSize(this._size));
  }

  setPixelSize(size) {
    this._size = size;
    this.setValue(`${t('pixel')} ${size}`, ((size - PIXEL_SIZE_MIN) / (PIXEL_SIZE_MAX - PIXEL_SIZE_MIN)) * 100);
  }
}
