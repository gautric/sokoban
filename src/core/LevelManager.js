import { LevelParser } from './LevelParser.js';
import { OPTIMAL_MOVES } from '../config.js';

export class LevelManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.levels = [];
    this.metadata = { collection: '', author: '' };
  }

  async loadPacks() {
    const [sok1, sok2] = await Promise.all([
      fetch('levels/microban.sok').then(r => r.text()),
      fetch('levels/microban2.sok').then(r => r.text()),
    ]);
    const pack1 = LevelParser.parseSOK(sok1);
    const pack2 = LevelParser.parseSOK(sok2);

    // Interleave levels from both packs
    this.levels = [];
    const max = Math.max(pack1.levels.length, pack2.levels.length);
    for (let i = 0; i < max; i++) {
      if (i < pack1.levels.length) this.levels.push({ ...pack1.levels[i], pack: pack1.collection || 'Microban' });
      if (i < pack2.levels.length) this.levels.push({ ...pack2.levels[i], pack: pack2.collection || 'Microban II' });
    }

    // Assign sequential IDs and default titles
    this.levels.forEach((l, i) => {
      l.id = i;
      if (!l.title) l.title = `Level ${i + 1}`;
    });

    this.metadata = { collection: 'Kiro\'s Ghost Sokoban', author: 'David W. Skinner' };
  }

  getLevelList() {
    return this.levels.map(l => {
      const progress = this.stateManager.getLevelProgress(l.id);
      return {
        id: l.id,
        title: l.title,
        pack: l.pack,
        unlocked: this.isUnlocked(l.id),
        solved: progress?.solved || false,
        stars: progress?.stars || 0,
        bestMoves: progress?.bestMoves || null,
      };
    });
  }

  getLevel(id) {
    return this.levels[id] || null;
  }

  getLevelCount() {
    return this.levels.length;
  }

  nextLevel(currentId) {
    const next = currentId + 1;
    return next < this.levels.length ? next : null;
  }

  isUnlocked(levelId) {
    if (levelId === 0) return true;
    return levelId < this.stateManager.getUnlockedLevel();
  }

  getStarRating(levelId, moves) {
    const optimal = OPTIMAL_MOVES[levelId] || moves;
    if (moves <= optimal) return 3;
    if (moves <= optimal * 1.5) return 2;
    return 1;
  }

  saveCompletion(levelId, moves, pushes) {
    const stars = this.getStarRating(levelId, moves);
    this.stateManager.saveProgress(levelId, moves, pushes, stars);
    return stars;
  }
}
