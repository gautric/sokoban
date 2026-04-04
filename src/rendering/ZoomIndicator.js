export class ZoomIndicator {
  constructor() {
    this.el = null;
    this.fill = null;
    this.label = null;
  }

  init(container) {
    this.el = document.createElement('div');
    this.el.id = 'zoom-indicator';

    this.label = document.createElement('div');
    this.label.className = 'zoom-label';
    this.label.textContent = '0%';

    const track = document.createElement('div');
    track.className = 'zoom-track';

    this.fill = document.createElement('div');
    this.fill.className = 'zoom-fill';

    track.appendChild(this.fill);
    this.el.appendChild(this.label);
    this.el.appendChild(track);
    container.appendChild(this.el);
  }

  setZoom(percent) {
    this.label.textContent = `${percent > 0 ? '+' : ''}${percent}%`;
    // Fill from center: positive = right, negative = left
    const pct = Math.abs(percent) / 45 * 50;
    if (percent >= 0) {
      this.fill.style.left = '50%';
      this.fill.style.right = 'auto';
      this.fill.style.width = `${pct}%`;
    } else {
      this.fill.style.right = '50%';
      this.fill.style.left = 'auto';
      this.fill.style.width = `${pct}%`;
    }
  }
}
