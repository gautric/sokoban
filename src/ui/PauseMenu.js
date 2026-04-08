import { PixelButton } from './PixelButton.js';
import { EventBus } from '../patterns/behavioral.js';

/**
 * PauseMenu — OBSERVER + COMMAND patterns.
 *
 * OBSERVER: Emits menu events via EventBus.
 * COMMAND:  Each button action is a command object (execute/undo capable).
 */

// ── COMMAND: menu action commands ──
class MenuCommand {
  constructor(action) { this._action = action; }
  execute() { this._action(); }
}

export class PauseMenu {
  constructor(callbacks) {
    this.el = document.getElementById('pause-menu');
    this.visible = false;
    this.events = new EventBus();

    // ── COMMAND: wrap each callback as a command ──
    this._commands = {
      resume: new MenuCommand(() => { this.hide(); callbacks.onResume?.(); }),
      restart: new MenuCommand(() => { this.hide(); callbacks.onRestart?.(); }),
      levelSelect: new MenuCommand(() => { this.hide(); callbacks.onLevelSelect?.(); }),
      mainMenu: new MenuCommand(() => { this.hide(); callbacks.onMainMenu?.(); }),
    };

    const btns = this.el.querySelector('.pause-buttons');
    btns.appendChild(PixelButton.create('resume', () => this.executeCommand('resume')));
    btns.appendChild(PixelButton.create('restart', () => this.executeCommand('restart')));
    btns.appendChild(PixelButton.create('level_select', () => this.executeCommand('levelSelect')));
    btns.appendChild(PixelButton.create('main_menu', () => this.executeCommand('mainMenu')));
  }

  executeCommand(name) {
    this._commands[name]?.execute();
    this.events.emit('pause:action', name);
  }

  show() { this.el.style.display = 'flex'; this.visible = true; this.events.emit('pause:shown'); }
  hide() { this.el.style.display = 'none'; this.visible = false; this.events.emit('pause:hidden'); }
  isVisible() { return this.visible; }
}
