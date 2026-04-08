import { SceneNode } from '../patterns/structural.js';

/**
 * SliderIndicator — COMPOSITE pattern.
 * Extends SceneNode so all indicators form a UI scene graph tree.
 * Parent SceneNode.update(dt) propagates to all indicator children.
 */
export class SliderIndicator extends SceneNode {
  constructor(id) {
    super(id);
    this.id = id;
    this.el = null;
    this.fill = null;
    this.label = null;
  }

  init(container) {
    this.el = document.createElement('div');
    this.el.id = this.id;
    this.el.className = 'slider-indicator';
    this.label = document.createElement('div');
    this.label.className = 'slider-label';
    const track = document.createElement('div');
    track.className = 'slider-track';
    this.fill = document.createElement('div');
    this.fill.className = 'slider-fill';
    track.appendChild(this.fill);
    this.el.appendChild(this.label);
    this.el.appendChild(track);
    container.appendChild(this.el);
  }

  setValue(text, fillPercent, fromCenter = false) {
    this.label.textContent = text;
    if (fromCenter) {
      const pct = Math.abs(fillPercent);
      this.fill.style.left = fillPercent >= 0 ? '50%' : 'auto';
      this.fill.style.right = fillPercent >= 0 ? 'auto' : '50%';
      this.fill.style.width = `${pct}%`;
    } else {
      this.fill.style.left = '0';
      this.fill.style.width = `${Math.max(0, Math.min(100, fillPercent))}%`;
    }
  }

  onUpdate() {} // Composite leaf — no-op
}
