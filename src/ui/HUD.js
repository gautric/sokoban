import { t, onLangChange } from '../i18n.js';
import { EventBus } from '../patterns/behavioral.js';

/**
 * HUD — OBSERVER + MEDIATOR patterns.
 *
 * OBSERVER:  Subscribes to game events via EventBus for auto-updates.
 * MEDIATOR:  Acts as a colleague — receives notifications from GameMediator.
 */
export class HUD {
  constructor(onMusicToggle) {
    this.el = document.getElementById('hud');
    this.controlsEl = document.getElementById('controls-list');
    this.levelEl = document.getElementById('hud-level');
    this.movesEl = document.getElementById('hud-moves');
    this.pushesEl = document.getElementById('hud-pushes');
    this.timerEl = document.getElementById('hud-timer');
    this.musicBtn = document.getElementById('hud-music');
    this._musicOn = true;
    this.startTime = 0;
    this.running = false;
    this.elapsed = 0;

    // ── OBSERVER: local event bus ──
    this.events = new EventBus();
    this._subscriptions = [];

    this.musicBtn.textContent = t('on');
    this.musicBtn.addEventListener('click', () => {
      onMusicToggle?.();
      this._musicOn = !this._musicOn;
      this.musicBtn.textContent = t(this._musicOn ? 'on' : 'off');
      this.events.emit('hud:muteToggled', this._musicOn);
    });
    onLangChange(() => { this.musicBtn.textContent = t(this._musicOn ? 'on' : 'off'); });
  }

  /** OBSERVER: subscribe to a GameScene EventBus for auto-updates */
  subscribeTo(gameEventBus) {
    this._subscriptions.forEach(fn => fn());
    this._subscriptions = [
      gameEventBus.on('game:paused', () => this.pauseTimer()),
      gameEventBus.on('game:resumed', () => this.resumeTimer()),
    ];
  }

  show() { this.el.style.display = 'flex'; this.controlsEl.style.display = 'flex'; }
  hide() { this.el.style.display = 'none'; this.controlsEl.style.display = 'none'; }

  reset(levelName) {
    this.levelEl.textContent = levelName;
    this.movesEl.textContent = '0';
    this.pushesEl.textContent = '0';
    this.timerEl.textContent = '00:00';
    this.startTime = 0;
    this.elapsed = 0;
    this.running = false;
  }

  startTimer() { this.startTime = performance.now(); this.running = true; }
  pauseTimer() { if (this.running) { this.elapsed += performance.now() - this.startTime; this.running = false; } }
  resumeTimer() { if (!this.running) { this.startTime = performance.now(); this.running = true; } }

  update(moves, pushes) {
    this.movesEl.textContent = moves;
    this.pushesEl.textContent = pushes;
    if (this.running) {
      const total = this.elapsed + (performance.now() - this.startTime);
      const secs = Math.floor(total / 1000);
      this.timerEl.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    }
  }

  getElapsedSeconds() {
    return Math.floor((this.elapsed + (this.running ? performance.now() - this.startTime : 0)) / 1000);
  }
}
