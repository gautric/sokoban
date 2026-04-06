import { PixelButton } from './PixelButton.js';

export class PauseMenu {
  constructor(callbacks) {
    this.el = document.getElementById('pause-menu');
    this.visible = false;
    const btns = this.el.querySelector('.pause-buttons');
    btns.appendChild(PixelButton.create('Resume', () => { this.hide(); callbacks.onResume?.(); }));
    btns.appendChild(PixelButton.create('Restart', () => { this.hide(); callbacks.onRestart?.(); }));
    btns.appendChild(PixelButton.create('Level Select', () => { this.hide(); callbacks.onLevelSelect?.(); }));
    btns.appendChild(PixelButton.create('Main Menu', () => { this.hide(); callbacks.onMainMenu?.(); }));
  }

  show() { this.el.style.display = 'flex'; this.visible = true; }
  hide() { this.el.style.display = 'none'; this.visible = false; }
  isVisible() { return this.visible; }
}
