const PROGRESS_KEY = 'kiro-sokoban-progress';
const AUDIO_KEY = 'kiro-sokoban-audio';
const SESSION_KEY = 'kiro-sokoban-session';

export class StateManager {
  constructor() {
    this.undoStack = [];
    this.moves = 0;
    this.pushes = 0;
  }

  pushUndo(state) {
    this.undoStack.push(JSON.parse(JSON.stringify(state)));
  }

  popUndo() {
    return this.undoStack.length > 0 ? this.undoStack.pop() : null;
  }

  clearUndo() {
    this.undoStack = [];
    this.moves = 0;
    this.pushes = 0;
  }

  incrementMoves() { this.moves++; }
  incrementPushes() { this.pushes++; }
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

  getLevelProgress(levelId) {
    return this.getProgress().levels[levelId] || null;
  }

  getUnlockedLevel() {
    return this.getProgress().unlockedLevel;
  }

  // Audio settings
  getAudioSettings() {
    try { return JSON.parse(localStorage.getItem(AUDIO_KEY)) || { masterVolume: 0.5, musicVolume: 0.5, sfxVolume: 0.7, muted: false }; }
    catch { return { masterVolume: 0.5, musicVolume: 0.5, sfxVolume: 0.7, muted: false }; }
  }

  saveAudioSettings(settings) {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(settings));
  }

  // Session persistence
  saveSession(levelId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      levelId, undoStack: this.undoStack, moves: this.moves, pushes: this.pushes,
    }));
  }

  loadSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (s) { this.undoStack = s.undoStack || []; this.moves = s.moves || 0; this.pushes = s.pushes || 0; }
      return s;
    } catch { return null; }
  }

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }
}
