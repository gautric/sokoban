// ── ENTRY POINT: build the game, hook global keys and resize, start the loop. ──
// The subsystems are wired in app/createGame.js (composition root); the loop
// lives in GameFacade (src/patterns/structural.js).
import { createGame } from './app/createGame.js';
import { attachLogMode } from './app/logMode.js';
import { toggleLang } from './i18n.js';
import { LOG } from './config.js';

async function main() {
  const { facade, sceneManager, gameScene, levelManager } = createGame(document.getElementById('game-container'));

  // J switches language on every screen, so it lives here, not in a scene.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'j' || e.key === 'J') { toggleLang(); e.preventDefault(); }
  });
  window.addEventListener('resize', () => facade.resize(window.innerWidth, window.innerHeight));

  await facade.init();
  facade.start();

  // Boot watchdog (index.html): the game runs, so no CDN-failure overlay.
  window.__bootOK?.();

  if (LOG) attachLogMode({ sceneManager, gameEvents: gameScene.events, levelCount: levelManager.getLevelCount() });
}

main().catch((err) => {
  console.error(err);
  // Show the failure overlay from index.html instead of a blank screen.
  window.__bootFail?.();
});
