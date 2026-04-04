import { MusicEngine } from './MusicEngine.js';
import { SFXEngine } from './SFXEngine.js';

export class AudioManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.ctx = null;
    this.music = null;
    this.sfx = null;
    this.initialized = false;
    this.settings = stateManager.getAudioSettings();
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = this.ctx.createGain();
    master.connect(this.ctx.destination);
    master.gain.value = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain = master;

    const musicGain = this.ctx.createGain();
    musicGain.gain.value = this.settings.musicVolume;
    musicGain.connect(master);

    const sfxGain = this.ctx.createGain();
    sfxGain.gain.value = this.settings.sfxVolume;
    sfxGain.connect(master);

    this.music = new MusicEngine(this.ctx, musicGain);
    this.sfx = new SFXEngine(this.ctx, sfxGain);
    this.initialized = true;
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.masterVolume;
    }
    this.stateManager.saveAudioSettings(this.settings);
  }

  isMuted() { return this.settings.muted; }

  setMasterVolume(v) {
    this.settings.masterVolume = v;
    if (this.masterGain && !this.settings.muted) this.masterGain.gain.value = v;
    this.stateManager.saveAudioSettings(this.settings);
  }
}
