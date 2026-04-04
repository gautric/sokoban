export class PixelButton {
  static create(text, onClick, className = '') {
    const btn = document.createElement('button');
    btn.className = `pixel-btn ${className}`.trim();
    btn.textContent = text;
    btn.setAttribute('data-testid', `btn-${text.toLowerCase().replace(/\s+/g, '-')}`);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }
}
