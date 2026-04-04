import * as THREE from 'three';
import { Board } from '../core/Board.js';
import { MoveResult, TILE_SIZE } from '../config.js';
import { IsometricCamera } from '../rendering/IsometricCamera.js';
import { BoardRenderer } from '../rendering/BoardRenderer.js';
import { PlayerRenderer } from '../rendering/PlayerRenderer.js';
import { CompassOverlay } from '../rendering/CompassOverlay.js';
import { ZoomIndicator } from '../rendering/ZoomIndicator.js';
import { Minimap } from '../rendering/Minimap.js';
import { HUD } from '../ui/HUD.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { LevelCompleteUI } from '../ui/LevelCompleteUI.js';

export class GameScene {
  constructor(sceneManager, levelManager, stateManager, inputHandler, audioManager) {
    this.sceneManager = sceneManager;
    this.levelManager = levelManager;
    this.stateManager = stateManager;
    this.inputHandler = inputHandler;
    this.audioManager = audioManager;

    this.scene = new THREE.Scene();
    this.board = new Board();
    this.isoCamera = new IsometricCamera();
    this.boardRenderer = new BoardRenderer(this.scene);
    this.playerRenderer = new PlayerRenderer(this.scene);
    this.compass = new CompassOverlay();
    this.zoomIndicator = new ZoomIndicator();
    this.minimap = new Minimap();
    this.hud = new HUD(() => this.audioManager.toggleMute());
    this.levelComplete = null;
    this.pauseMenu = null;
    this.currentLevelId = 0;
    this.active = false;
    this.firstMove = false;

    // Lighting
    const ambient = new THREE.AmbientLight(0xFFE8CC, 0.7);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    dir.position.set(5, 10, 5);
    this.scene.add(dir);
    this.scene.background = new THREE.Color(0x1a1a2e);
  }

  activate(levelId = 0) {
    this.currentLevelId = levelId;
    this.active = true;
    this.firstMove = false;

    // Init UI
    this.zoomIndicator.init(document.getElementById('ui-overlay'));
    this.compass.init(document.getElementById('ui-overlay'));
    this.pauseMenu = new PauseMenu({
      onResume: () => { this.inputHandler.enabled = true; this.hud.resumeTimer(); },
      onRestart: () => this._restartLevel(),
      onLevelSelect: () => this.sceneManager.switchTo('levelSelect'),
      onMainMenu: () => this.sceneManager.switchTo('menu'),
    });
    this.levelComplete = new LevelCompleteUI({
      onNext: () => {
        const next = this.levelManager.nextLevel(this.currentLevelId);
        if (next !== null) this.activate(next);
        else this.sceneManager.switchTo('levelSelect');
      },
      onReplay: () => this.activate(this.currentLevelId),
      onLevelSelect: () => this.sceneManager.switchTo('levelSelect'),
    });

    this._loadLevel(levelId);

    this.inputHandler.init({
      onMove: (dir) => this._handleMove(dir),
      onUndo: () => this._handleUndo(),
      onRestart: () => this._restartLevel(),
      onRotateLeft: () => this._rotateCamera(-1),
      onRotateRight: () => this._rotateCamera(1),
      onZoomIn: () => { this.isoCamera.zoomIn(); this.zoomIndicator.setZoom(this.isoCamera.getZoomPercent()); this.minimap.setZoom(this.isoCamera.getZoomPercent()); },
      onZoomOut: () => { this.isoCamera.zoomOut(); this.zoomIndicator.setZoom(this.isoCamera.getZoomPercent()); this.minimap.setZoom(this.isoCamera.getZoomPercent()); },
      onToggleMute: () => this.audioManager.toggleMute(),
      onPause: () => this._togglePause(),
    });

    this.hud.show();
  }

  deactivate() {
    this.active = false;
    this.inputHandler.destroy();
    this.hud.hide();
    this.boardRenderer.dispose();
    this.playerRenderer.dispose();
    if (this.pauseMenu) this.pauseMenu.hide();
    if (this.levelComplete) this.levelComplete.hide();
    const zi = document.getElementById('zoom-indicator');
    if (zi) zi.remove();
    const cp = document.getElementById('compass');
    if (cp) cp.remove();
  }

  _loadLevel(levelId) {
    const level = this.levelManager.getLevel(levelId);
    if (!level) return;
    this.board.loadLevel(level);
    this.stateManager.clearUndo();

    this.boardRenderer.dispose();
    this.boardRenderer = new BoardRenderer(this.scene);
    this.boardRenderer.buildBoard(this.board);

    this.playerRenderer.dispose();
    this.playerRenderer = new PlayerRenderer(this.scene);
    this.playerRenderer.init();
    this.playerRenderer.setPosition(this.board.playerPos.x, this.board.playerPos.y);

    this.isoCamera.init(this.board.width, this.board.height);
    this.isoCamera.zoomPercent = 0;
    this.minimap.init(this.board.width, this.board.height);
    this.inputHandler.setRotationStep(this.isoCamera.getRotationStep());
    this.zoomIndicator.setZoom(0);

    this.hud.reset(level.title);
    this.firstMove = false;
  }

  _handleMove(direction) {
    if (this.boardRenderer.isAnimating() || this.playerRenderer.isAnimating()) return;
    if (this.pauseMenu?.isVisible() || this.levelComplete?.isVisible()) return;

    this.stateManager.pushUndo(this.board.getState());
    const result = this.board.tryMove(direction);

    if (result === MoveResult.BLOCKED) {
      this.stateManager.popUndo();
      return;
    }

    if (!this.firstMove) { this.hud.startTimer(); this.firstMove = true; }

    this.stateManager.incrementMoves();
    this.playerRenderer.setDirection(direction);
    this.playerRenderer.setMoving(true);
    this.playerRenderer.setPosition(this.board.playerPos.x, this.board.playerPos.y, true);

    if (result === MoveResult.PUSHED) {
      this.stateManager.incrementPushes();
      this.audioManager.sfx?.playPush();
      // Check if box landed on target
      const dv = { 0:{x:0,y:-1}, 1:{x:0,y:1}, 2:{x:-1,y:0}, 3:{x:1,y:0} }[direction];
      const bx = this.board.playerPos.x + dv.x;
      const by = this.board.playerPos.y + dv.y;
      if (this.board.getTile(bx, by) === 3) { // TARGET
        setTimeout(() => this.audioManager.sfx?.playBoxOnTarget(), 100);
      }
    } else {
      this.audioManager.sfx?.playMove();
    }

    // Update board visuals after animation
    setTimeout(() => {
      this.boardRenderer.updateBoard(this.board);
      this.playerRenderer.setMoving(false);
      if (this.board.isComplete()) this._onWin();
    }, 160);
  }

  _handleUndo() {
    if (this.pauseMenu?.isVisible() || this.levelComplete?.isVisible()) return;
    const state = this.stateManager.popUndo();
    if (!state) return;
    this.board.setState(state);
    this.stateManager.moves = Math.max(0, this.stateManager.moves - 1);
    this.boardRenderer.updateBoard(this.board);
    this.playerRenderer.setPosition(this.board.playerPos.x, this.board.playerPos.y);
    this.audioManager.sfx?.playUndo();
  }

  _restartLevel() {
    this._loadLevel(this.currentLevelId);
  }

  _rotateCamera(dir) {
    if (dir < 0) this.isoCamera.rotateLeft();
    else this.isoCamera.rotateRight();
    this.inputHandler.setRotationStep(this.isoCamera.getRotationStep());
  }

  _togglePause() {
    if (this.levelComplete?.isVisible()) return;
    if (this.pauseMenu.isVisible()) {
      this.pauseMenu.hide();
      this.inputHandler.enabled = true;
      this.hud.resumeTimer();
    } else {
      this.pauseMenu.show();
      this.inputHandler.enabled = false;
      this.hud.pauseTimer();
    }
  }

  _onWin() {
    this.hud.pauseTimer();
    const moves = this.stateManager.getMoveCount();
    const pushes = this.stateManager.getPushCount();
    const time = this.hud.getElapsedSeconds();
    const stars = this.levelManager.saveCompletion(this.currentLevelId, moves, pushes);
    this.audioManager.music?.playLevelComplete();
    this.levelComplete.show(stars, moves, pushes, time);
    this.stateManager.clearSession();
  }

  update(dt) {
    if (!this.active) return;
    this.isoCamera.update(dt);
    this.playerRenderer.update(dt);
    this.playerRenderer.setCameraAngle(this.isoCamera.getRotationAngle());
    this.boardRenderer.updateOcclusion(this.board.playerPos, this.isoCamera.getCamera());
    this.boardRenderer.updateOcclusionTween(dt);
    this.boardRenderer.updateTargetPulse(performance.now() / 1000);
    this.compass.setRotation(this.isoCamera.getRotationAngle());
    this.minimap.setRotation(this.isoCamera.getRotationAngle());
    this.hud.update(this.stateManager.getMoveCount(), this.stateManager.getPushCount());
  }

  render(renderer) {
    if (!this.active) return;
    renderer.setViewport(0, 0, renderer.domElement.width, renderer.domElement.height);
    renderer.render(this.scene, this.isoCamera.getCamera());
    this.minimap.render(renderer, this.scene);
  }
}
