import * as THREE from 'three';
import { Board } from '../core/Board.js';
import { MoveResult, TileType, DIR_VECTORS, OPTIMAL_MOVES, MOVE_SETTLE_DURATION, WIN_SCREEN_DELAY } from '../config.js';
import { IsometricCamera } from '../rendering/IsometricCamera.js';
import { SceneLighting } from '../rendering/SceneLighting.js';
import { PixelPostProcess } from '../rendering/PixelPostProcess.js';
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

// ── GoF Patterns ──
import { MoveCommand, CommandHistory, EventBus, GameStateMachine, GameMediator, ScoringContext, MoveBasedScoring } from '../patterns/behavioral.js';

/**
 * GameScene — integrates 5 behavioral patterns:
 *
 * COMMAND:   MoveCommand encapsulates each move; CommandHistory enables undo/redo.
 * STATE:     GameStateMachine manages playing/paused/won transitions.
 * MEDIATOR:  GameMediator coordinates Board↔Audio↔HUD without direct coupling.
 * OBSERVER:  EventBus for decoupled game events (move, win, pause).
 * STRATEGY:  ScoringContext with swappable star-rating algorithms.
 */
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
    this.boardRenderer = null;
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
    this.postProcess = new PixelPostProcess();

    // ── COMMAND: history for undo/redo ──
    this.commandHistory = new CommandHistory();

    // ── OBSERVER: game event bus ──
    this.events = new EventBus();

    // ── STATE: game state machine ──
    this.stateMachine = new GameStateMachine();
    this._wireStateMachine();

    // ── MEDIATOR: coordinates subsystems ──
    this.mediator = new GameMediator();
    this.mediator.register('audio', audioManager);
    this.mediator.register('state', stateManager);
    this.mediator.register('hud', this.hud);

    // ── STRATEGY: scoring algorithm ──
    this.scoring = new ScoringContext(new MoveBasedScoring());

    this.lighting = new SceneLighting();
    this.lighting.addTo(this.scene);
    this.scene.background = new THREE.Color(0x1a1a2e);
  }

  _wireStateMachine() {
    this.stateMachine.on('state:paused', () => {
      this.inputHandler.enabled = false;
      this.mediator.notify(this, 'paused');
      this.events.emit('game:paused');
    });
    this.stateMachine.on('state:playing', () => {
      this.inputHandler.enabled = true;
      this.events.emit('game:resumed');
    });
    this.stateMachine.on('state:won', () => {
      this.events.emit('game:won');
    });
  }

  activate(levelId = 0) {
    this.currentLevelId = levelId;
    this.active = true;
    this.firstMove = false;

    if (!this._uiBuilt) {
      const stack = document.createElement('div');
      stack.id = 'indicators-stack';
      document.getElementById('ui-overlay').appendChild(stack);
      this.tiltIndicator.init(stack);
      this.zoomIndicator.init(stack);
      this.pixelIndicator.init(stack);
      this.compass.init(stack);
      this.pauseMenu = new PauseMenu({
        onResume: () => this._resume(),
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
      this._uiBuilt = true;
    }

    this._loadLevel(levelId);
    this.audioManager.music?.stop();
    this.audioManager.music?.playGameplay();
    this.stateMachine.transitionTo('playing');

    this.inputHandler.init({
      onMove: (dir) => this._handleMove(dir),
      onUndo: () => this._handleUndo(),
      onRestart: () => this._restartLevel(),
      onRotateLeft: () => this._rotateCamera(-1),
      onRotateRight: () => this._rotateCamera(1),
      onZoomIn: () => this._zoom(() => this.isoCamera.zoomIn()),
      onZoomOut: () => this._zoom(() => this.isoCamera.zoomOut()),
      onTilt: () => this._tilt(() => this.isoCamera.tiltStep()),
      onTiltUp: () => this._tilt(() => this.isoCamera.tiltUp()),
      onTiltDown: () => this._tilt(() => this.isoCamera.tiltDown()),
      onToggleMute: () => this.audioManager.toggleMute(),
      onPause: () => this._togglePause(),
      onPixelUp: () => this._pixel(1),
      onPixelDown: () => this._pixel(-1),
    });

    this.hud.show();
  }

  deactivate() {
    this.active = false;
    this._cancelWinScreen();
    this.inputHandler.destroy();
    this.hud.hide();
    if (this.boardRenderer) this.boardRenderer.dispose();
    this.playerRenderer.dispose();
    this.postProcess.reset();
    if (this.pauseMenu) this.pauseMenu.hide();
    if (this.levelComplete) this.levelComplete.hide();
    const stack = document.getElementById('indicators-stack');
    if (stack) stack.remove();
  }

  /** Stop a pending "level complete" screen (timer + Space key). */
  _cancelWinScreen() {
    clearTimeout(this._winTimer);
    this._winTimer = null;
    if (this._winKeyHandler) window.removeEventListener('keydown', this._winKeyHandler);
    this._winKeyHandler = null;
    this._winData = null;
  }

  _loadLevel(levelId) {
    this._cancelWinScreen();

    const level = this.levelManager.getLevel(levelId);
    if (!level) return;
    this.board.loadLevel(level);
    this.stateManager.resetCounters();
    this.commandHistory.clear();

    // Purge scene
    if (this.boardRenderer) this.boardRenderer.dispose();
    this.playerRenderer.dispose();
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const obj = this.scene.children[i];
      obj.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
        }
      });
      this.scene.remove(obj);
    }
    this.lighting.addTo(this.scene);

    this.boardRenderer = new BoardRenderer(this.scene, this.events);
    this.boardRenderer.buildBoard(this.board);

    this.playerRenderer = new PlayerRenderer(this.scene);
    this.playerRenderer.init();
    this.playerRenderer.setPosition(this.board.playerPos.x, this.board.playerPos.y);

    this.isoCamera.init(this.board.width, this.board.height);
    this.isoCamera.zoomPercent = 0;
    this.minimap.init(this.board.width, this.board.height);
    this.inputHandler.setRotationStep(this.isoCamera.getRotationStep());
    this.playerRenderer.setRotationStep(this.isoCamera.getRotationStep());
    this.zoomIndicator.setZoom(0);

    this.hud.reset(level.title);
    this.firstMove = false;
    this.events.emit('level:loaded', { levelId });
  }

  _handleMove(direction) {
    if (this.boardRenderer?.isAnimating() || this.playerRenderer.isAnimating()) return;
    if (this.pauseMenu?.isVisible() || this.levelComplete?.isVisible()) return;

    // ── COMMAND: create and execute a MoveCommand ──
    const cmd = new MoveCommand(this.board, direction);
    const result = this.commandHistory.execute(cmd);

    if (result === MoveResult.BLOCKED) return;

    this.playerRenderer.stopCelebration();
    if (!this.firstMove) { this.hud.startTimer(); this.firstMove = true; }

    this.stateManager.recordMove(result);
    this.playerRenderer.setDirection(direction);
    this.playerRenderer.setMoving(true);
    this.playerRenderer.setPosition(this.board.playerPos.x, this.board.playerPos.y, true);

    if (result === MoveResult.PUSHED) {
      // ── MEDIATOR: notify audio via mediator ──
      this.mediator.notify(this, 'pushed', { moves: this.stateManager.getMoveCount(), pushes: this.stateManager.getPushCount() });
      const dv = DIR_VECTORS[direction];
      const bx = this.board.playerPos.x + dv.x, by = this.board.playerPos.y + dv.y;
      this.boardRenderer.animateBoxPush(this.board.playerPos.x, this.board.playerPos.y, bx, by, this.board);
      if (this.board.getTile(bx, by) === TileType.TARGET) setTimeout(() => this.audioManager.sfx?.playBoxOnTarget(), 100);
    } else {
      this.mediator.notify(this, 'moved', { moves: this.stateManager.getMoveCount(), pushes: this.stateManager.getPushCount() });
    }

    // ── OBSERVER: emit move event ──
    this.events.emit('player:moved', { direction, result, pos: this.board.playerPos });

    setTimeout(() => {
      if (result !== MoveResult.PUSHED) this.boardRenderer.updateBoard(this.board);
      this.playerRenderer.setMoving(false);
      if (this.board.isComplete()) this._onWin();
    }, MOVE_SETTLE_DURATION);
  }

  _handleUndo() {
    if (this.pauseMenu?.isVisible() || this.levelComplete?.isVisible()) return;

    // ── COMMAND: undo via CommandHistory (the command restores its memento) ──
    const undone = this.commandHistory.undo();
    if (!undone) return;
    this.stateManager.undoMove(undone.getResult());
    this.boardRenderer.updateBoard(this.board);
    this.playerRenderer.setPosition(this.board.playerPos.x, this.board.playerPos.y);
    this.mediator.notify(this, 'undone', { moves: this.stateManager.getMoveCount(), pushes: this.stateManager.getPushCount() });
  }

  _restartLevel() { this._loadLevel(this.currentLevelId); }

  _rotateCamera(dir) {
    if (dir < 0) this.isoCamera.rotateLeft();
    else this.isoCamera.rotateRight();
    this.inputHandler.setRotationStep(this.isoCamera.getRotationStep());
    this.playerRenderer.setRotationStep(this.isoCamera.getRotationStep());
  }

  // Camera / pixel controls: change the value, then show it on its indicator.
  _zoom(change) {
    change();
    const zoom = this.isoCamera.getZoomPercent();
    this.zoomIndicator.setZoom(zoom);
    this.minimap.setZoom(zoom);
  }

  _tilt(change) {
    change();
    this.tiltIndicator.setTilt(this.isoCamera.getTiltDeg());
  }

  _pixel(delta) {
    this.pixelIndicator.setPixelSize(this.postProcess.step(delta));
  }

  _resume() {
    this.stateMachine.handleInput('resume');
    this.mediator.notify(this, 'resumed');
  }

  _togglePause() {
    if (this.levelComplete?.isVisible()) return;
    if (this.pauseMenu.isVisible()) {
      this.pauseMenu.hide();
      this._resume();
    } else {
      this.pauseMenu.show();
      this.stateMachine.handleInput('pause');
    }
  }

  _onWin() {
    this.board.boxesLocked = true;
    this.hud.pauseTimer();
    this.playerRenderer.startWinCelebration();

    // ── STRATEGY: calculate stars using swappable scoring ──
    const optimal = OPTIMAL_MOVES[this.currentLevelId] || this.stateManager.getMoveCount();
    const stars = this.scoring.calculate(
      this.currentLevelId, this.stateManager.getMoveCount(),
      this.stateManager.getPushCount(), this.hud.getElapsedSeconds(), optimal
    );

    this.stateManager.saveProgress(this.currentLevelId, this.stateManager.getMoveCount(), this.stateManager.getPushCount(), stars);

    this._winData = {
      moves: this.stateManager.getMoveCount(),
      pushes: this.stateManager.getPushCount(),
      time: this.hud.getElapsedSeconds(),
      stars,
    };

    // ── STATE: transition to won ──
    this.stateMachine.handleInput('win');
    this.mediator.notify(this, 'won', this._winData);
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
    this._winTimer = setTimeout(showComplete, WIN_SCREEN_DELAY);
  }

  update(dt) {
    if (!this.active) return;
    this.isoCamera.update(dt);
    this.lighting.follow(this.isoCamera.getRotationAngle(), this.isoCamera.center);
    this.playerRenderer.update(dt);
    this.playerRenderer.setCameraAngle(this.isoCamera.getRotationAngle(), this.isoCamera.getCamera());
    if (this.boardRenderer) {
      this.boardRenderer.updateOcclusion(this.board.playerPos, this.isoCamera.getCamera());
      this.boardRenderer.updateOcclusionTween(dt);
      this.boardRenderer.updateTargetPulse(performance.now() / 1000);
    }
    this.compass.setRotation(this.isoCamera.getRotationAngle());
    this.minimap.setRotation(this.isoCamera.getRotationAngle());
    this.hud.update(this.stateManager.getMoveCount(), this.stateManager.getPushCount());
  }

  resize(w, h) { this.postProcess.setSize(w, h); }

  render(renderer) {
    if (!this.active) return;
    this.postProcess.render(renderer, this.scene, this.isoCamera.getCamera());
    this.minimap.render(renderer, this.scene);
  }
}
