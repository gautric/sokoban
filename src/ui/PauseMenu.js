import { PixelButton } from './PixelButton.js';

export class PauseMenu {
  constructor(callbacks) {
    this.el = document.getElementById('pause-menu');
    this.visible = false;
    this.el.innerHTML = '<h2>PAUSED</h2>';
    const btns = document.createElement('div');
    btns.className = 'pause-buttons';
    btns.appendChild(PixelButton.create('Resume', () => { this.hide(); callbacks.onResume?.(); }));
    btns.appendChild(PixelButton.create('Restart', () => { this.hide(); callbacks.onRestart?.(); }));
    btns.appendChild(PixelButton.create('Level Select', () => { this.hide(); callbacks.onLevelSelect?.(); }));
    btns.appendChild(PixelButton.create('Main Menu', () => { this.hide(); callbacks.onMainMenu?.(); }));
    this.el.appendChild(btns);
  }

  show() { this.el.style.display = 'flex'; this.visible = true; }
  hide() { this.el.style.display = 'none'; this.visible = false; }
  isVisible() { return this.visible; }
}
