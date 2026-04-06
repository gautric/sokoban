import { t, onLangChange } from '../i18n.js';

export class HUD {
  constructor(onMusicToggle) {
    this.el = document.getElementById('hud');
    this.levelEl = document.getElementById('hud-level');
    this.movesEl = document.getElementById('hud-moves');
    this.pushesEl = document.getElementById('hud-pushes');
    this.timerEl = document.getElementById('hud-timer');
    this.musicBtn = document.getElementById('hud-music');
    this._musicOn = true;
    this.musicBtn.textContent = t('on');
    this.musicBtn.addEventListener('click', () => {
      onMusicToggle?.();
      this._musicOn = !this._musicOn;
      this.musicBtn.textContent = t(this._musicOn ? 'on' : 'off');
    });
    onLangChange(() => { this.musicBtn.textContent = t(this._musicOn ? 'on' : 'off'); });
    this.startTime = 0;
    this.running = false;
    this.elapsed = 0;
  }

  show() { this.el.style.display = 'flex'; }
  hide() { this.el.style.display = 'none'; }

  reset(levelName) {
    this.levelEl.textContent = levelName;
    this.movesEl.textContent = '0';
    this.pushesEl.textContent = '0';
    this.timerEl.textContent = '00:00';
    this.startTime = 0;
    this.elapsed = 0;
    this.running = false;
  }

  startTimer() {
    this.startTime = performance.now();
    this.running = true;
  }

  pauseTimer() { if (this.running) { this.elapsed += performance.now() - this.startTime; this.running = false; } }
  resumeTimer() { if (!this.running) { this.startTime = performance.now(); this.running = true; } }

  update(moves, pushes) {
    this.movesEl.textContent = moves;
    this.pushesEl.textContent = pushes;
    if (this.running) {
      const total = this.elapsed + (performance.now() - this.startTime);
      const secs = Math.floor(total / 1000);
      const m = String(Math.floor(secs / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      this.timerEl.textContent = `${m}:${s}`;
    }
  }

  getElapsedSeconds() {
    const total = this.elapsed + (this.running ? performance.now() - this.startTime : 0);
    return Math.floor(total / 1000);
  }
}
