import { PixelButton } from '../ui/PixelButton.js';

export class MenuScene {
  constructor(sceneManager, levelManager) {
    this.sceneManager = sceneManager;
    this.levelManager = levelManager;
    this.el = document.getElementById('menu-screen');
    this._built = false;
  }

  _build() {
    if (this._built) return;
    this.el.innerHTML = `
      <h1 class="game-title">Kiro's Ghost<br>Sokoban</h1>
      <div class="menu-ghost" data-testid="menu-ghost"><img src="assets/ghostv2.svg" alt="Kiro Ghost" class="menu-ghost-img"></div>
      <div class="menu-buttons"></div>
      <div class="how-to-play-modal" id="how-to-play" style="display:none">
        <h3>HOW TO PLAY</h3>
        <p>Push all boxes onto targets!</p>
        <p>Arrows: Move</p>
        <p>Q/E: Rotate camera</p>
        <p>Z: Undo | R: Restart</p>
        <p>M: Mute | Esc: Pause</p>
        <p>Mouse: Drag to rotate, Scroll to zoom</p>
      </div>
    `;
    const btns = this.el.querySelector('.menu-buttons');
    btns.appendChild(PixelButton.create('Play', () => this.sceneManager.switchTo('game', 0)));
    btns.appendChild(PixelButton.create('Level Select', () => this.sceneManager.switchTo('levelSelect')));
    btns.appendChild(PixelButton.create('How to Play', () => {
      const modal = document.getElementById('how-to-play');
      modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
    }));
    this._built = true;
  }

  activate() {
    this._build();
    this.el.style.display = 'flex';
  }

  deactivate() {
    this.el.style.display = 'none';
    const modal = document.getElementById('how-to-play');
    if (modal) modal.style.display = 'none';
  }

  update() {}
  render() {}
}
