import { PixelButton } from '../ui/PixelButton.js';

export class MenuScene {
  constructor(sceneManager, levelManager) {
    this.sceneManager = sceneManager;
    this.levelManager = levelManager;
    this.el = document.getElementById('menu-screen');
    this.modal = document.getElementById('how-to-play');
    this._built = false;
  }

  _build() {
    if (this._built) return;
    const btns = this.el.querySelector('.menu-buttons');
    btns.appendChild(PixelButton.create('play', () => this.sceneManager.switchTo('game', 0)));
    btns.appendChild(PixelButton.create('level_select', () => this.sceneManager.switchTo('levelSelect')));
    btns.appendChild(PixelButton.create('how_to_play', () => {
      this.modal.style.display = this.modal.style.display === 'none' ? 'block' : 'none';
    }));
    this._built = true;
  }

  activate() {
    this._build();
    this.el.style.display = 'flex';
  }

  deactivate() {
    this.el.style.display = 'none';
    this.modal.style.display = 'none';
  }

  update() {}
  render() {}
}
