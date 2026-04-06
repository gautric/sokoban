import { t, onLangChange } from '../i18n.js';

export class PixelButton {
  static create(i18nKey, onClick, className = '') {
    const btn = document.createElement('button');
    btn.className = `pixel-btn ${className}`.trim();
    btn.textContent = t(i18nKey);
    btn.setAttribute('data-testid', `btn-${i18nKey}`);
    btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    onLangChange(() => { btn.textContent = t(i18nKey); });
    return btn;
  }
}
