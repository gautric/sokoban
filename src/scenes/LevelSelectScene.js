import { PixelButton } from '../ui/PixelButton.js';

export class LevelSelectScene {
  constructor(sceneManager, levelManager) {
    this.sceneManager = sceneManager;
    this.levelManager = levelManager;
    this.el = document.getElementById('level-select-screen');
    this.page = 0;
    this.perPage = 20;
  }

  activate() {
    this._render();
    this.el.style.display = 'flex';
  }

  deactivate() { this.el.style.display = 'none'; }

  _render() {
    const levels = this.levelManager.getLevelList();
    const totalPages = Math.ceil(levels.length / this.perPage);
    const start = this.page * this.perPage;
    const pageLevels = levels.slice(start, start + this.perPage);

    this.el.innerHTML = '<h2>SELECT LEVEL</h2>';

    const grid = document.createElement('div');
    grid.className = 'level-grid';

    for (const l of pageLevels) {
      const tile = document.createElement('div');
      tile.className = `level-tile ${l.unlocked ? 'unlocked' : 'locked'} ${l.solved ? 'solved' : ''}`;
      tile.setAttribute('data-testid', `level-tile-${l.id}`);
      tile.innerHTML = `
        <div class="level-num">${l.id + 1}</div>
        <div class="level-stars">${l.solved ? '★'.repeat(l.stars) + '☆'.repeat(3 - l.stars) : (l.unlocked ? '☆☆☆' : '🔒')}</div>
        ${l.bestMoves ? `<div class="level-best">${l.bestMoves}</div>` : ''}
      `;
      if (l.unlocked) {
        tile.addEventListener('click', () => this.sceneManager.switchTo('game', l.id));
      }
      grid.appendChild(tile);
    }
    this.el.appendChild(grid);

    // Pagination
    if (totalPages > 1) {
      const nav = document.createElement('div');
      nav.className = 'level-nav';
      if (this.page > 0) nav.appendChild(PixelButton.create('< Prev', () => { this.page--; this._render(); }));
      const pageLabel = document.createElement('span');
      pageLabel.className = 'page-label';
      pageLabel.textContent = `${this.page + 1}/${totalPages}`;
      nav.appendChild(pageLabel);
      if (this.page < totalPages - 1) nav.appendChild(PixelButton.create('Next >', () => { this.page++; this._render(); }));
      this.el.appendChild(nav);
    }

    // Back button
    this.el.appendChild(PixelButton.create('Back', () => this.sceneManager.switchTo('menu')));
  }

  update() {}
  render() {}
}
