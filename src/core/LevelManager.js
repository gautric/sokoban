import { LevelParser } from './LevelParser.js';
import { OPTIMAL_MOVES } from '../config.js';
import { LevelIterator, ScoringContext, MoveBasedScoring } from '../patterns/behavioral.js';
import { LevelBuilder } from '../patterns/creational.js';

/**
 * LevelManager — ITERATOR + STRATEGY + BUILDER patterns.
 *
 * Iterator: LevelIterator provides sequential/filtered access to levels.
 * Strategy: ScoringContext with swappable star-rating algorithms.
 * Builder:  LevelBuilder available for programmatic level construction.
 */
export class LevelManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.levels = [];
    this.metadata = { collection: '', author: '' };

    // ── STRATEGY: scoring algorithm ──
    this.scoring = new ScoringContext(new MoveBasedScoring());

    // ── BUILDER: available for programmatic level creation ──
    this.builder = new LevelBuilder();
  }

  async loadPacks() {
    const [sok1, sok2] = await Promise.all([
      fetch('levels/microban.sok').then(r => r.text()),
      fetch('levels/microban2.sok').then(r => r.text()),
    ]);
    const pack1 = LevelParser.parseSOK(sok1);
    const pack2 = LevelParser.parseSOK(sok2);

    this.levels = [];
    const max = Math.max(pack1.levels.length, pack2.levels.length);
    for (let i = 0; i < max; i++) {
      if (i < pack1.levels.length) this.levels.push({ ...pack1.levels[i], pack: pack1.collection || 'Microban' });
      if (i < pack2.levels.length) this.levels.push({ ...pack2.levels[i], pack: pack2.collection || 'Microban II' });
    }

    this.levels.forEach((l, i) => { l.id = i; if (!l.title) l.title = `Level ${i + 1}`; });
    this.metadata = { collection: 'Kiro\'s Ghost Sokoban', author: 'David W. Skinner' };
  }

  getLevelList() {
    return this.levels.map(l => {
      const progress = this.stateManager.getLevelProgress(l.id);
      return {
        id: l.id, title: l.title, pack: l.pack,
        unlocked: this.isUnlocked(l.id),
        solved: progress?.solved || false,
        stars: progress?.stars || 0,
        bestMoves: progress?.bestMoves || null,
      };
    });
  }

  /** ITERATOR: get an iterator over all levels, optionally filtered */
  iterator(filterFn = null) {
    return new LevelIterator(this.getLevelList(), filterFn);
  }

  /** ITERATOR: iterate only unsolved levels */
  unsolvedIterator() {
    return this.iterator(l => !l.solved);
  }

  getLevel(id) { return this.levels[id] || null; }
  getLevelCount() { return this.levels.length; }
  nextLevel(currentId) { const n = currentId + 1; return n < this.levels.length ? n : null; }
  isUnlocked() { return true; }

  /** STRATEGY: calculate star rating using current scoring strategy */
  getStarRating(levelId, moves, pushes = 0, time = 0) {
    const optimal = OPTIMAL_MOVES[levelId] || moves;
    return this.scoring.calculate(levelId, moves, pushes, time, optimal);
  }

  saveCompletion(levelId, moves, pushes) {
    const stars = this.getStarRating(levelId, moves, pushes);
    this.stateManager.saveProgress(levelId, moves, pushes, stars);
    return stars;
  }
}
