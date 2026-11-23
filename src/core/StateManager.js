import { MoveResult } from '../config.js';

const PROGRESS_KEY = 'kiro-sokoban-progress';
const AUDIO_KEY = 'kiro-sokoban-audio';
const SESSION_KEY = 'kiro-sokoban-session';

/**
 * StateManager — move/push counters for the current level, and persistence
 * (progress, audio settings, session) in localStorage.
 * Undo snapshots live in CommandHistory (see MoveCommand), not here.
 */
export class StateManager {
  constructor() {
    this.moves = 0;
    this.pushes = 0;
  }

  // ── Counters: driven by the MoveResult of each move / undone move ──
  recordMove(result) {
    if (result === MoveResult.BLOCKED) return;
    this.moves++;
    if (result === MoveResult.PUSHED) this.pushes++;
  }

  undoMove(result) {
    if (result === MoveResult.BLOCKED) return;
    this.moves = Math.max(0, this.moves - 1);
    if (result === MoveResult.PUSHED) this.pushes = Math.max(0, this.pushes - 1);
  }

  resetCounters() { this.moves = 0; this.pushes = 0; }
  getMoveCount() { return this.moves; }
  getPushCount() { return this.pushes; }

  // Progress persistence
  getProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { levels: {}, unlockedLevel: 1 }; }
    catch { return { levels: {}, unlockedLevel: 1 }; }
  }

  saveProgress(levelId, moves, pushes, stars) {
    const progress = this.getProgress();
    const existing = progress.levels[levelId] || {};
    progress.levels[levelId] = {
      solved: true,
      bestMoves: existing.bestMoves ? Math.min(existing.bestMoves, moves) : moves,
      bestPushes: existing.bestPushes ? Math.min(existing.bestPushes, pushes) : pushes,
      stars: existing.stars ? Math.max(existing.stars, stars) : stars,
    };
    progress.unlockedLevel = Math.max(progress.unlockedLevel, levelId + 2);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  getLevelProgress(levelId) { return this.getProgress().levels[levelId] || null; }
  getUnlockedLevel() { return this.getProgress().unlockedLevel; }

  // Audio settings
  getAudioSettings() {
    try { return JSON.parse(localStorage.getItem(AUDIO_KEY)) || { masterVolume: 0.5, musicVolume: 0.5, sfxVolume: 0.7, muted: false }; }
    catch { return { masterVolume: 0.5, musicVolume: 0.5, sfxVolume: 0.7, muted: false }; }
  }

  saveAudioSettings(settings) { localStorage.setItem(AUDIO_KEY, JSON.stringify(settings)); }

  // Session persistence
  saveSession(levelId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      levelId, moves: this.moves, pushes: this.pushes,
    }));
  }

  loadSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (s) { this.moves = s.moves || 0; this.pushes = s.pushes || 0; }
      return s;
    } catch { return null; }
  }

  clearSession() { localStorage.removeItem(SESSION_KEY); }
}
