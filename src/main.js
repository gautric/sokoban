import * as THREE from 'three';
import { StateManager } from './core/StateManager.js';
import { LevelManager } from './core/LevelManager.js';
import { InputHandler } from './core/InputHandler.js';
import { AudioManager } from './audio/AudioManager.js';
import { SceneManager } from './scenes/SceneManager.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';

async function init() {
  // Renderer
  const container = document.getElementById('game-container');
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1); // Pixel art — no subpixel rendering
  renderer.autoClear = false;
  container.insertBefore(renderer.domElement, container.firstChild);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Singletons
  const stateManager = new StateManager();
  const audioManager = new AudioManager(stateManager);
  const levelManager = new LevelManager(stateManager);
  const inputHandler = new InputHandler();

  // Load levels
  await levelManager.loadPacks();

  // Scenes (created after sceneManager so they can reference it)
  const sceneManager = new SceneManager({}, audioManager);
  const menuScene = new MenuScene(sceneManager, levelManager);
  const levelSelectScene = new LevelSelectScene(sceneManager, levelManager);
  const gameScene = new GameScene(sceneManager, levelManager, stateManager, inputHandler, audioManager);
  sceneManager.scenes = { menu: menuScene, levelSelect: levelSelectScene, game: gameScene };

  // Init audio on first user interaction
  const initAudio = () => {
    audioManager.init();
    if (sceneManager.currentName === 'menu' || sceneManager.currentName === 'levelSelect') {
      audioManager.music?.playMenu();
    }
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
  };
  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);

  // Start
  sceneManager.switchTo('menu');

  // Game loop
  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;

    sceneManager.update(dt);
    renderer.clear();
    sceneManager.render(renderer);

    requestAnimationFrame(loop);
  }
  loop();
}

init().catch(console.error);
