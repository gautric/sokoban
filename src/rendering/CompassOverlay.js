export class CompassOverlay {
  constructor() {
    this.el = null;
    this.arrow = null;
    this.labels = {};
    this.angle = 0;
  }

  init(container) {
    this.el = document.createElement('div');
    this.el.id = 'compass';

    const ring = document.createElement('div');
    ring.className = 'compass-ring';

    ['N','E','S','W'].forEach(d => {
      const lbl = document.createElement('span');
      lbl.className = `compass-label compass-${d}`;
      lbl.textContent = d;
      ring.appendChild(lbl);
      this.labels[d] = lbl;
    });

    this.arrow = document.createElement('div');
    this.arrow.className = 'compass-arrow';
    ring.appendChild(this.arrow);

    this.el.appendChild(ring);
    container.appendChild(this.el);
  }

  setRotation(angleDeg) {
    this.angle = angleDeg;
    if (this.el) {
      // Isometric camera has a 45° base offset; compass must match
      this.el.querySelector('.compass-ring').style.transform = `rotateX(55deg) rotate(${-(angleDeg + 45)}deg)`;
    }
  }

  render() {} // no-op, HTML-based now
}
