import { PixelButton } from './PixelButton.js';

export class LevelCompleteUI {
  constructor(callbacks) {
    this.el = document.getElementById('level-complete');
    this.callbacks = callbacks;
    this.visible = false;
  }

  show(stars, moves, pushes, time) {
    const m = String(Math.floor(time / 60)).padStart(2, '0');
    const s = String(time % 60).padStart(2, '0');
    this.el.innerHTML = `
      <h2>LEVEL COMPLETE!</h2>
      <div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="stats">
        <div>Moves: ${moves}</div>
        <div>Pushes: ${pushes}</div>
        <div>Time: ${m}:${s}</div>
      </div>
      <div class="confetti-container" data-testid="confetti"></div>
    `;
    const btns = document.createElement('div');
    btns.className = 'complete-buttons';
    btns.appendChild(PixelButton.create('Next Level', () => { this.hide(); this.callbacks.onNext?.(); }));
    btns.appendChild(PixelButton.create('Replay', () => { this.hide(); this.callbacks.onReplay?.(); }));
    btns.appendChild(PixelButton.create('Level Select', () => { this.hide(); this.callbacks.onLevelSelect?.(); }));
    this.el.appendChild(btns);

    // Spawn confetti
    const container = this.el.querySelector('.confetti-container');
    for (let i = 0; i < 30; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = `${Math.random() * 100}%`;
      c.style.animationDelay = `${Math.random() * 2}s`;
      c.style.backgroundColor = ['#7B61FF', '#FF6B6B', '#4CAF50', '#FFD700', '#00BCD4'][i % 5];
      container.appendChild(c);
    }

    this.el.style.display = 'flex';
    this.visible = true;
  }

  hide() { this.el.style.display = 'none'; this.visible = false; }
  isVisible() { return this.visible; }
}
