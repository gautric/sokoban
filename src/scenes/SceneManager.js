import { EventBus } from '../patterns/behavioral.js';

/**
 * SceneManager — OBSERVER pattern.
 * Emits scene transition events via EventBus so any subsystem
 * can react to scene changes without direct coupling.
 */
export class SceneManager {
  constructor(scenes, audioManager) {
    this.scenes = scenes;
    this.audio = audioManager;
    this.current = null;
    this.currentName = null;
    this.events = new EventBus();
  }

  switchTo(name, ...args) {
    const prev = this.currentName;
    if (this.current) this.current.deactivate();
    this.current = this.scenes[name];
    this.currentName = name;
    if (this.current) this.current.activate(...args);

    // Audio coordination
    if (this.audio?.music) {
      this.audio.music.stop();
      if (name === 'menu' || name === 'levelSelect') this.audio.music.playMenu();
      else if (name === 'game') this.audio.music.playGameplay();
    }

    // ── OBSERVER: notify listeners of scene change ──
    this.events.emit('scene:changed', { from: prev, to: name, args });
  }

  /** Subscribe to scene transition events */
  onSceneChange(callback) { return this.events.on('scene:changed', callback); }

  update(dt) { this.current?.update?.(dt); }
  render(renderer) { this.current?.render?.(renderer); }
}
