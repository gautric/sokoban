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
    this.playSceneMusic();

    // ── OBSERVER: notify listeners of scene change ──
    this.events.emit('scene:changed', { from: prev, to: name, args });
  }

  /** Play the track that fits the current scene (no-op until audio is unlocked). */
  playSceneMusic() {
    const music = this.audio?.music;
    if (!music) return;
    music.stop();
    if (this.currentName === 'menu' || this.currentName === 'levelSelect') music.playMenu();
    else if (this.currentName === 'game') music.playGameplay();
  }

  /** Every scene gets the new size, so a hidden scene is ready when shown. */
  resize(w, h) {
    for (const scene of Object.values(this.scenes)) scene.resize?.(w, h);
  }

  /** Subscribe to scene transition events */
  onSceneChange(callback) { return this.events.on('scene:changed', callback); }

  update(dt) { this.current?.update?.(dt); }
  render(renderer) { this.current?.render?.(renderer); }
}
