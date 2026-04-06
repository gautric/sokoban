import { PixelButton } from './PixelButton.js';

export class LevelCompleteUI {
  constructor(callbacks) {
    this.el = document.getElementById('level-complete');
    this.starsEl = document.getElementById('complete-stars');
    this.movesEl = document.getElementById('complete-moves');
    this.pushesEl = document.getElementById('complete-pushes');
    this.timeEl = document.getElementById('complete-time');
    this.confetti = this.el.querySelector('.confetti-container');
    this.btns = this.el.querySelector('.complete-buttons');
    this.callbacks = callbacks;
    this.visible = false;
    this._built = false;
  }

  _buildOnce() {
    if (this._built) return;
    this.btns.appendChild(PixelButton.create('Next Level', () => { this.hide(); this.callbacks.onNext?.(); }));
    this.btns.appendChild(PixelButton.create('Replay', () => { this.hide(); this.callbacks.onReplay?.(); }));
    this.btns.appendChild(PixelButton.create('Level Select', () => { this.hide(); this.callbacks.onLevelSelect?.(); }));
    this._built = true;
  }

  show(stars, moves, pushes, time) {
    this._buildOnce();
    const m = String(Math.floor(time / 60)).padStart(2, '0');
    const s = String(time % 60).padStart(2, '0');

    this.starsEl.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    this.movesEl.textContent = moves;
    this.pushesEl.textContent = pushes;
    this.timeEl.textContent = `${m}:${s}`;

    // Spawn confetti
    this.confetti.replaceChildren();
    const colors = ['#7B61FF', '#FF6B6B', '#4CAF50', '#FFD700', '#00BCD4'];
    for (let i = 0; i < 30; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = `${Math.random() * 100}%`;
      c.style.animationDelay = `${Math.random() * 2}s`;
      c.style.backgroundColor = colors[i % 5];
      this.confetti.appendChild(c);
    }

    this.el.style.display = 'flex';
    this.visible = true;
  }

  hide() { this.el.style.display = 'none'; this.visible = false; }
  isVisible() { return this.visible; }
}
