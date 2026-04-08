import { MusicEngine } from './MusicEngine.js';
import { SFXEngine } from './SFXEngine.js';
import { EventBus } from '../patterns/behavioral.js';

/**
 * AudioManager — OBSERVER pattern integration.
 * Emits audio events via EventBus. Already wrapped by:
 *   PROXY (LazyAudioProxy) — defers AudioContext until user interaction
 *   DECORATOR (LoggingAudioDecorator) — adds analytics logging
 * Both applied in main.js.
 */
export class AudioManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.ctx = null;
    this.music = null;
    this.sfx = null;
    this.initialized = false;
    this.settings = stateManager.getAudioSettings();
    this.events = new EventBus();
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
    this.events.emit('audio:initialized');
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted;
    if (this.masterGain) this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.masterVolume;
    this.stateManager.saveAudioSettings(this.settings);
    this.events.emit('audio:muteToggled', { muted: this.settings.muted });
  }

  isMuted() { return this.settings.muted; }

  setMasterVolume(v) {
    this.settings.masterVolume = v;
    if (this.masterGain && !this.settings.muted) this.masterGain.gain.value = v;
    this.stateManager.saveAudioSettings(this.settings);
  }
}
