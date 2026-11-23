// ── COMPOSITION ROOT: build every subsystem once and wire them together.
//    The only place that knows the concrete classes; returns the FACADE. ──
import { StateManager } from '../core/StateManager.js';
import { LevelManager } from '../core/LevelManager.js';
import { InputHandler } from '../input/InputHandler.js';
import { SceneManager } from '../scenes/SceneManager.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { LevelSelectScene } from '../scenes/LevelSelectScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { GameFacade } from '../patterns/structural.js';
import { createRenderer } from './renderer.js';
import { createAudio, unlockAudioOnFirstInput } from './audio.js';

export function createGame(container) {
  const renderer = createRenderer(container);
  const stateManager = new StateManager();
  const levelManager = new LevelManager(stateManager);
  const inputHandler = new InputHandler();
  const audio = createAudio(stateManager);

  const sceneManager = new SceneManager({}, audio);
  const gameScene = new GameScene(sceneManager, levelManager, stateManager, inputHandler, audio);
  sceneManager.scenes = {
    menu: new MenuScene(sceneManager, levelManager),
    levelSelect: new LevelSelectScene(sceneManager, levelManager),
    game: gameScene,
  };
  unlockAudioOnFirstInput(audio, sceneManager);

  const facade = new GameFacade({ levels: levelManager, scenes: sceneManager, renderer });
  return { facade, sceneManager, gameScene, levelManager };
}
