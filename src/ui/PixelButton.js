import { t, onLangChange } from '../i18n.js';

/**
 * PixelButton — FACTORY METHOD pattern.
 *
 * Static create() is the factory method — encapsulates DOM element creation.
 * Subclasses or alternative factories can override to produce different button styles.
 */
export class PixelButton {
  /** Factory Method: creates a localized, styled button element */
  static create(i18nKey, onClick, className = '') {
    const btn = document.createElement('button');
    btn.className = `pixel-btn ${className}`.trim();
    btn.textContent = t(i18nKey);
    btn.setAttribute('data-testid', `btn-${i18nKey}`);
    btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    onLangChange(() => { btn.textContent = t(i18nKey); });
    return btn;
  }

  /** Factory Method variant: icon button */
  static createIcon(icon, onClick, className = '') {
    const btn = document.createElement('button');
    btn.className = `pixel-btn pixel-btn-icon ${className}`.trim();
    btn.textContent = icon;
    btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return btn;
  }
}
