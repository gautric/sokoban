// ── AUDIO setup: PROXY (lazy AudioContext) + DECORATOR (log mode) ──
import { AudioManager } from '../audio/AudioManager.js';
import { LazyAudioProxy, LoggingAudioDecorator } from '../patterns/structural.js';
import { LOG } from '../config.js';
import { log } from '../log.js';

/** The game's audio: created on first use; in log mode every call is logged. */
export function createAudio(stateManager) {
  const proxy = new LazyAudioProxy(() => new AudioManager(stateManager));
  return LOG ? new LoggingAudioDecorator(proxy, (action) => log('audio', action)) : proxy;
}

/** Browsers block sound until the user acts: start audio on the first click or key. */
export function unlockAudioOnFirstInput(audio, sceneManager) {
  const unlock = () => {
    document.removeEventListener('click', unlock, true);
    document.removeEventListener('keydown', unlock, true);
    audio.init();
    sceneManager.playSceneMusic();
  };
  document.addEventListener('click', unlock, true);
  document.addEventListener('keydown', unlock, true);
}
