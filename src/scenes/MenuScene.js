import { BaseScene } from '../patterns/behavioral.js';
import { PixelButton } from '../ui/PixelButton.js';

/**
 * MenuScene — TEMPLATE METHOD pattern.
 * Extends BaseScene which defines the lifecycle skeleton:
 *   activate() → init() → buildUI() → onActivate()
 *   deactivate() → onDeactivate() → teardownUI()
 */
export class MenuScene extends BaseScene {
  constructor(sceneManager, levelManager) {
    super(sceneManager);
    this.levelManager = levelManager;
    this.el = document.getElementById('menu-screen');
    this.modal = document.getElementById('how-to-play');
  }

  // Template step: one-time initialization
  init() {
    const btns = this.el.querySelector('.menu-buttons');
    btns.appendChild(PixelButton.create('play', () => this.sceneManager.switchTo('game', 0)));
    btns.appendChild(PixelButton.create('level_select', () => this.sceneManager.switchTo('levelSelect')));
    btns.appendChild(PixelButton.create('how_to_play', () => {
      this.modal.style.display = this.modal.style.display === 'none' ? 'block' : 'none';
    }));
  }

  // Template step: show UI
  buildUI() {}

  // Template step: called each activation
  onActivate() { this.el.style.display = 'flex'; }

  // Template step: cleanup
  onDeactivate() {
    this.el.style.display = 'none';
    this.modal.style.display = 'none';
  }

  update() {}
  render() {}
}
