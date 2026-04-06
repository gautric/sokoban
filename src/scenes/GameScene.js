import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Board } from '../core/Board.js';
import { MoveResult, TILE_SIZE, PIXEL_SIZE_DEFAULT, PIXEL_SIZE_MIN, PIXEL_SIZE_MAX, PIXEL_SIZE_STEP } from '../config.js';
import { IsometricCamera } from '../rendering/IsometricCamera.js';
import { BoardRenderer } from '../rendering/BoardRenderer.js';
import { PlayerRenderer } from '../rendering/PlayerRenderer.js';
import { CompassOverlay } from '../rendering/CompassOverlay.js';
import { ZoomIndicator } from '../rendering/ZoomIndicator.js';
import { PixelIndicator } from '../rendering/PixelIndicator.js';
import { TiltIndicator } from '../rendering/TiltIndicator.js';
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
    this.pixelIndicator = new PixelIndicator();
    this.tiltIndicator = new TiltIndicator();
    this.minimap = new Minimap();
    this.hud = new HUD(() => this.audioManager.toggleMute());
    this.levelComplete = null;
    this.pauseMenu = null;
    this.currentLevelId = 0;
    this.active = false;
    this.firstMove = false;
    this.composer = null;
    this.pixelPass = null;
    this.pixelSize = PIXEL_SIZE_DEFAULT;

    // Lighting
    const ambient = new THREE.AmbientLight(0xFFE8CC, 0.5);
    this.scene.add(ambient);
    this.dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.dirLight.shadow.camera.near = 0.1;
    this.dirLight.shadow.camera.far = 50;
    this.dirLight.shadow.camera.left = -15;
    this.dirLight.shadow.camera.right = 15;
    this.dirLight.shadow.camera.top = 15;
    this.dirLight.shadow.camera.bottom = -15;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
    this.scene.background = new THREE.Color(0x1a1a2e);
  }

  activate(levelId = 0) {
    this.currentLevelId = levelId;
    this.active = true;
    this.firstMove = false;

    // Init UI
    const stack = document.createElement('div');
    stack.id = 'indicators-stack';
    document.getElementById('ui-overlay').appendChild(stack);
    this.tiltIndicator.init(stack);
    this.zoomIndicator.init(stack);
    this.pixelIndicator.init(stack);
    this.compass.init(stack);
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
    this.audioManager.music?.stop();
    this.audioManager.music?.playGameplay();

    this.inputHandler.init({
      onMove: (dir) => this._handleMove(dir),
      onUndo: () => this._handleUndo(),
      onRestart: () => this._restartLevel(),
      onRotateLeft: () => this._rotateCamera(-1),
      onRotateRight: () => this._rotateCamera(1),
      onZoomIn: () => { this.isoCamera.zoomIn(); this.zoomIndicator.setZoom(this.isoCamera.getZoomPercent()); this.minimap.setZoom(this.isoCamera.getZoomPercent()); },
      onZoomOut: () => { this.isoCamera.zoomOut(); this.zoomIndicator.setZoom(this.isoCamera.getZoomPercent()); this.minimap.setZoom(this.isoCamera.getZoomPercent()); },
      onTilt: () => { this.isoCamera.tiltStep(); this.tiltIndicator.setTilt(this.isoCamera.getTiltDeg()); },
      onTiltUp: () => { this.isoCamera.tiltUp(); this.tiltIndicator.setTilt(this.isoCamera.getTiltDeg()); },
      onTiltDown: () => { this.isoCamera.tiltDown(); this.tiltIndicator.setTilt(this.isoCamera.getTiltDeg()); },
      onToggleMute: () => this.audioManager.toggleMute(),
      onPause: () => this._togglePause(),
      onPixelUp: () => { this.setPixelSize(1); this.pixelIndicator.setPixelSize(this.pixelSize); },
      onPixelDown: () => { this.setPixelSize(-1); this.pixelIndicator.setPixelSize(this.pixelSize); },
    });

    this.hud.show();
  }

  deactivate() {
    this.active = false;
    if (this._winTimer) { clearTimeout(this._winTimer); this._winTimer = null; }
    if (this._winKeyHandler) { window.removeEventListener('keydown', this._winKeyHandler); this._winKeyHandler = null; }
    this._winData = null;
    this.inputHandler.destroy();
    this.hud.hide();
    this.boardRenderer.dispose();
    this.playerRenderer.dispose();
    this.composer = null;
    this.pixelPass = null;
    if (this.pauseMenu) this.pauseMenu.hide();
    if (this.levelComplete) this.levelComplete.hide();
    const stack = document.getElementById('indicators-stack');
    if (stack) stack.remove();
  }

  _loadLevel(levelId) {
    // Clean up previous level
    if (this._winTimer) { clearTimeout(this._winTimer); this._winTimer = null; }
    if (this._winKeyHandler) { window.removeEventListener('keydown', this._winKeyHandler); this._winKeyHandler = null; }
    this._winData = null;

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

    if (this.playerRenderer._celebrating) this.playerRenderer._stopCelebration();

    if (!this.firstMove) { this.hud.startTimer(); this.firstMove = true; }

    this.stateManager.incrementMoves();
    this.playerRenderer.setDirection(direction);
    this.playerRenderer.setMoving(true);
    this.playerRenderer.setPosition(this.board.playerPos.x, this.board.playerPos.y, true);

    if (result === MoveResult.PUSHED) {
      this.stateManager.incrementPushes();
      this.audioManager.sfx?.playPush();
      const dv = { 0:{x:0,y:-1}, 1:{x:0,y:1}, 2:{x:-1,y:0}, 3:{x:1,y:0} }[direction];
      const bx = this.board.playerPos.x + dv.x;
      const by = this.board.playerPos.y + dv.y;
      // Animate box from player's new pos to box's new pos
      this.boardRenderer.animateBoxPush(this.board.playerPos.x, this.board.playerPos.y, bx, by, this.board);
      if (this.board.getTile(bx, by) === 3) { // TARGET
        setTimeout(() => this.audioManager.sfx?.playBoxOnTarget(), 100);
      }
    } else {
      this.audioManager.sfx?.playMove();
    }

    // Update board visuals after animation
    setTimeout(() => {
      if (result !== MoveResult.PUSHED) this.boardRenderer.updateBoard(this.board);
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
    this.board.boxesLocked = true;
    this.hud.pauseTimer();
    this.playerRenderer.startWinCelebration();
    this._winData = {
      moves: this.stateManager.getMoveCount(),
      pushes: this.stateManager.getPushCount(),
      time: this.hud.getElapsedSeconds(),
      stars: this.levelManager.saveCompletion(this.currentLevelId, this.stateManager.getMoveCount(), this.stateManager.getPushCount()),
    };
    this.audioManager.music?.playLevelComplete();
    this.stateManager.clearSession();

    const showComplete = () => {
      if (!this._winData) return;
      const { stars, moves, pushes, time } = this._winData;
      this._winData = null;
      this.levelComplete.show(stars, moves, pushes, time);
      clearTimeout(this._winTimer);
      window.removeEventListener('keydown', this._winKeyHandler);
    };

    this._winKeyHandler = (e) => { if (e.key === ' ') showComplete(); };
    window.addEventListener('keydown', this._winKeyHandler);
    this._winTimer = setTimeout(showComplete, 5000);
  }

  update(dt) {
    if (!this.active) return;
    this.isoCamera.update(dt);
    // Light follows camera, 90° to the left
    const angle = THREE.MathUtils.degToRad(this.isoCamera.getRotationAngle() + 45 - 90);
    const center = this.isoCamera.center;
    this.dirLight.position.set(center.x + Math.sin(angle) * 10, 10, center.z + Math.cos(angle) * 10);
    this.dirLight.target.position.copy(center);
    this.playerRenderer.update(dt);
    this.playerRenderer.setCameraAngle(this.isoCamera.getRotationAngle());
    this.boardRenderer.updateOcclusion(this.board.playerPos, this.isoCamera.getCamera());
    this.boardRenderer.updateOcclusionTween(dt);
    this.boardRenderer.updateTargetPulse(performance.now() / 1000);
    this.compass.setRotation(this.isoCamera.getRotationAngle());
    this.minimap.setRotation(this.isoCamera.getRotationAngle());
    this.hud.update(this.stateManager.getMoveCount(), this.stateManager.getPushCount());
  }

  _initComposer(renderer) {
    this.composer = new EffectComposer(renderer);
    this.pixelPass = new RenderPixelatedPass(this.pixelSize, this.scene, this.isoCamera.getCamera());
    this.pixelPass.normalEdgeStrength = 0;
    this.pixelPass.depthEdgeStrength = 0;
    this.composer.addPass(this.pixelPass);
    this.composer.addPass(new OutputPass());
  }

  setPixelSize(delta) {
    this.pixelSize = Math.max(PIXEL_SIZE_MIN, Math.min(PIXEL_SIZE_MAX, this.pixelSize + delta * PIXEL_SIZE_STEP));
    if (this.pixelPass) this.pixelPass.setPixelSize(this.pixelSize);
  }

  render(renderer) {
    if (!this.active) return;
    if (!this.composer) this._initComposer(renderer);
    this.pixelPass.camera = this.isoCamera.getCamera();
    renderer.setViewport(0, 0, renderer.domElement.width, renderer.domElement.height);
    this.composer.render();
    this.minimap.render(renderer, this.scene);
  }
}
