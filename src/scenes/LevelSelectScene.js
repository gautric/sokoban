import { BaseScene } from '../patterns/behavioral.js';
import { PixelButton } from '../ui/PixelButton.js';

/**
 * LevelSelectScene — TEMPLATE METHOD pattern.
 * Extends BaseScene lifecycle: init() → buildUI() → onActivate().
 */
export class LevelSelectScene extends BaseScene {
  constructor(sceneManager, levelManager) {
    super(sceneManager);
    this.levelManager = levelManager;
    this.el = document.getElementById('level-select-screen');
    this.grid = this.el.querySelector('.level-grid');
    this.nav = this.el.querySelector('.level-nav');
    this.prevBtn = document.getElementById('level-prev');
    this.nextBtn = document.getElementById('level-next');
    this.pageLabel = document.getElementById('level-page-label');
    this.backContainer = this.el.querySelector('.level-select-back');
    this.page = 0;
    this.perPage = 20;
  }

  // Template step: one-time init
  init() {
    this.prevBtn.addEventListener('click', () => { this.page--; this._renderGrid(); });
    this.nextBtn.addEventListener('click', () => { this.page++; this._renderGrid(); });
    this.backContainer.appendChild(PixelButton.create('back', () => this.sceneManager.switchTo('menu')));
  }

  buildUI() {}

  // Template step: each activation
  onActivate() {
    this._renderGrid();
    this.el.style.display = 'flex';
  }

  onDeactivate() { this.el.style.display = 'none'; }

  _renderGrid() {
    const levels = this.levelManager.getLevelList();
    const totalPages = Math.ceil(levels.length / this.perPage);
    const pageLevels = levels.slice(this.page * this.perPage, (this.page + 1) * this.perPage);

    this.grid.replaceChildren();

    for (const l of pageLevels) {
      const tile = document.createElement('div');
      tile.className = `level-tile ${l.unlocked ? 'unlocked' : 'locked'} ${l.solved ? 'solved' : ''}`;
      tile.setAttribute('data-testid', `level-tile-${l.id}`);

      const num = document.createElement('div');
      num.className = 'level-num';
      num.textContent = l.id + 1;
      tile.appendChild(num);

      const stars = document.createElement('div');
      stars.className = 'level-stars';
      stars.textContent = l.solved ? '★'.repeat(l.stars) + '☆'.repeat(3 - l.stars) : (l.unlocked ? '☆☆☆' : '🔒');
      tile.appendChild(stars);

      if (l.bestMoves) {
        const best = document.createElement('div');
        best.className = 'level-best';
        best.textContent = l.bestMoves;
        tile.appendChild(best);
      }

      if (l.unlocked) tile.addEventListener('click', () => this.sceneManager.switchTo('game', l.id));
      this.grid.appendChild(tile);
    }

    if (totalPages > 1) {
      this.nav.style.display = 'flex';
      this.prevBtn.style.display = this.page > 0 ? '' : 'none';
      this.nextBtn.style.display = this.page < totalPages - 1 ? '' : 'none';
      this.pageLabel.textContent = `${this.page + 1}/${totalPages}`;
    } else {
      this.nav.style.display = 'none';
    }
  }

  update() {}
  render() {}
}
