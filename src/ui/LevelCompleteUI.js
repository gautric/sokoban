import { PixelButton } from './PixelButton.js';
import { EventBus } from '../patterns/behavioral.js';

/**
 * LevelCompleteUI — OBSERVER + COMMAND patterns.
 *
 * OBSERVER: Emits completion events via EventBus.
 * COMMAND:  Button actions wrapped as command objects.
 */
class UICommand {
  constructor(action) { this._action = action; }
  execute() { this._action(); }
}

export class LevelCompleteUI {
  constructor(callbacks) {
    this.el = document.getElementById('level-complete');
    this.starsEl = document.getElementById('complete-stars');
    this.movesEl = document.getElementById('complete-moves');
    this.pushesEl = document.getElementById('complete-pushes');
    this.timeEl = document.getElementById('complete-time');
    this.btns = this.el.querySelector('.complete-buttons');
    this.callbacks = callbacks;
    this.visible = false;
    this._built = false;
    this.events = new EventBus();

    this._commands = {
      next: new UICommand(() => { this.hide(); callbacks.onNext?.(); }),
      replay: new UICommand(() => { this.hide(); callbacks.onReplay?.(); }),
      levelSelect: new UICommand(() => { this.hide(); callbacks.onLevelSelect?.(); }),
    };
  }

  _buildOnce() {
    if (this._built) return;
    this.btns.appendChild(PixelButton.create('next_level', () => this._exec('next')));
    this.btns.appendChild(PixelButton.create('replay', () => this._exec('replay')));
    this.btns.appendChild(PixelButton.create('level_select', () => this._exec('levelSelect')));
    this._built = true;
  }

  _exec(name) {
    this._commands[name]?.execute();
    this.events.emit('complete:action', name);
  }

  show(stars, moves, pushes, time) {
    this._buildOnce();
    this.starsEl.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    this.movesEl.textContent = moves;
    this.pushesEl.textContent = pushes;
    this.timeEl.textContent = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
    this.el.style.display = 'flex';
    this.visible = true;
    this.events.emit('complete:shown', { stars, moves, pushes, time });
  }

  hide() { this.el.style.display = 'none'; this.visible = false; }
  isVisible() { return this.visible; }
}
