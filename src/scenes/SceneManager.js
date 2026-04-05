export class SceneManager {
  constructor(scenes, audioManager) {
    this.scenes = scenes;
    this.audio = audioManager;
    this.current = null;
    this.currentName = null;
  }

  switchTo(name, ...args) {
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
  }

  update(dt) { this.current?.update?.(dt); }
  render(renderer) { this.current?.render?.(renderer); }
}
