/**
 * BEHAVIORAL PATTERNS — Applied to Sokoban game with Three.js
 *
 * 13. Chain of Responsibility — InputChain: input handlers that pass unhandled events along
 * 14. Command                 — MoveCommand: encapsulate moves as objects for undo/redo
 * 15. Iterator                — LevelIterator: traverse levels without exposing internal array
 * 16. Mediator                — GameMediator: coordinates subsystems without direct coupling
 * 17. Memento                 — BoardMemento: capture/restore board state for undo
 * 18. Observer                — EventBus: pub/sub for game events (move, win, pause, etc.)
 * 19. State                   — GameStateMachine: playing/paused/won states with transitions
 * 20. Strategy                — ScoringStrategy: swap star-rating algorithms at runtime
 * 21. Template Method         — BaseScene: define scene lifecycle, subclasses fill in steps
 * 22. Visitor                 — TileVisitor: perform operations on board tiles polymorphically
 * 23. Interpreter             — see src/core/LevelParser.js (CHAR_MAP is the .sok grammar)
 */

import { MoveResult, TileType, EntityType } from '../config.js';

// ─── 13. CHAIN OF RESPONSIBILITY — InputChain ──────────────────────────────
// Each handler tries to process the input. If it can't, it passes to the next.
// E.g., UI handler eats Escape when pause menu is open; otherwise game handler gets it.

class InputChainHandler {
  constructor() { this.next = null; }
  setNext(handler) { this.next = handler; return handler; }
  handle(event) {
    if (this.next) return this.next.handle(event);
    return false;
  }
}

export class UIInputHandler extends InputChainHandler {
  constructor(isUIActive) { super(); this._isUIActive = isUIActive; }
  handle(event) {
    if (this._isUIActive() && event.key === 'Escape') {
      event._handled = true;
      return true;
    }
    return super.handle(event);
  }
}

export class GameInputHandler extends InputChainHandler {
  constructor(onGameKey) { super(); this._onGameKey = onGameKey; }
  handle(event) {
    if (event._handled) return true;
    this._onGameKey(event);
    return true;
  }
}

export function buildInputChain(uiCheck, gameKeyHandler) {
  const ui = new UIInputHandler(uiCheck);
  const game = new GameInputHandler(gameKeyHandler);
  ui.setNext(game);
  return ui;
}

// ─── 14. COMMAND — MoveCommand ─────────────────────────────────────────────
// Encapsulates a player move as an object. Enables undo/redo, replay, macros.

export class MoveCommand {
  constructor(board, direction) {
    this.board = board;
    this.direction = direction;
    this._prevState = null;
    this._result = null;
  }

  execute() {
    this._prevState = this.board.getState();
    this._result = this.board.tryMove(this.direction);
    return this._result;
  }

  undo() {
    if (this._prevState) this.board.setState(this._prevState);
  }

  getResult() { return this._result; }
}

export class CommandHistory {
  constructor() { this._history = []; this._pointer = -1; }

  execute(command) {
    const result = command.execute();
    if (result !== MoveResult.BLOCKED) {
      this._history.splice(this._pointer + 1);
      this._history.push(command);
      this._pointer++;
    }
    return result;
  }

  undo() {
    if (this._pointer < 0) return false;
    this._history[this._pointer].undo();
    this._pointer--;
    return true;
  }

  redo() {
    if (this._pointer >= this._history.length - 1) return false;
    this._pointer++;
    this._history[this._pointer].execute();
    return true;
  }

  clear() { this._history = []; this._pointer = -1; }
  get length() { return this._pointer + 1; }
}

// ─── 15. ITERATOR — LevelIterator ──────────────────────────────────────────
// Provides sequential access to levels without exposing the underlying array.
// Supports filtering (e.g., only unsolved levels).

export class LevelIterator {
  constructor(levels, filterFn = null) {
    this._levels = filterFn ? levels.filter(filterFn) : levels;
    this._index = 0;
  }

  hasNext() { return this._index < this._levels.length; }
  next() { return this.hasNext() ? this._levels[this._index++] : null; }
  current() { return this._levels[this._index] ?? null; }
  reset() { this._index = 0; }

  [Symbol.iterator]() {
    let i = 0;
    const levels = this._levels;
    return {
      next() {
        return i < levels.length ? { value: levels[i++], done: false } : { done: true };
      }
    };
  }
}

// ─── 16. MEDIATOR — GameMediator ───────────────────────────────────────────
// Coordinates communication between Board, Renderer, Audio, HUD, and State.
// Subsystems notify the mediator; it decides who else needs to know.

export class GameMediator {
  constructor() { this._colleagues = new Map(); }

  register(name, colleague) { this._colleagues.set(name, colleague); }
  get(name) { return this._colleagues.get(name); }

  notify(sender, event, data) {
    switch (event) {
      case 'moved':
        this.get('audio')?.sfx?.playMove();
        this.get('hud')?.update(data.moves, data.pushes);
        break;
      case 'pushed':
        this.get('audio')?.sfx?.playPush();
        this.get('hud')?.update(data.moves, data.pushes);
        break;
      case 'undone':
        this.get('audio')?.sfx?.playUndo();
        this.get('hud')?.update(data.moves, data.pushes);
        break;
      case 'won':
        this.get('audio')?.music?.playLevelComplete();
        break;
      case 'paused':
        this.get('hud')?.pauseTimer();
        break;
      case 'resumed':
        this.get('hud')?.resumeTimer();
        break;
    }
  }
}

// ─── 17. MEMENTO — BoardMemento ────────────────────────────────────────────
// Captures board state as an opaque token. The Board (originator) creates it;
// the StateManager (caretaker) stores it. Neither exposes internals.

export class BoardMemento {
  constructor(entities, playerPos) {
    this._entities = entities.map(r => [...r]);
    this._playerPos = { ...playerPos };
    this._timestamp = Date.now();
    Object.freeze(this);
  }

  // Only the Board (originator) should call these
  getEntities() { return this._entities.map(r => [...r]); }
  getPlayerPos() { return { ...this._playerPos }; }
  get timestamp() { return this._timestamp; }
}

export class MementoCaretaker {
  constructor() { this._stack = []; }
  save(memento) { this._stack.push(memento); }
  restore() { return this._stack.pop() ?? null; }
  clear() { this._stack = []; }
  get length() { return this._stack.length; }
}

// ─── 18. OBSERVER — EventBus ───────────────────────────────────────────────
// Decoupled pub/sub for game events. Any subsystem can listen without
// knowing who publishes. Core pattern for game architecture.

export class EventBus {
  constructor() { this._listeners = new Map(); }

  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const list = this._listeners.get(event);
    if (list) {
      const i = list.indexOf(callback);
      if (i >= 0) list.splice(i, 1);
    }
  }

  emit(event, data) {
    const list = this._listeners.get(event);
    if (list) for (const cb of list) cb(data);
  }

  clear() { this._listeners.clear(); }
}

// ─── 19. STATE — GameStateMachine ──────────────────────────────────────────
// Game transitions between Playing, Paused, Won states.
// Each state defines allowed transitions and behavior.

class GameState {
  constructor(machine) { this.machine = machine; }
  enter() {}
  exit() {}
  handleInput(input) {}
  update(dt) {}
}

export class PlayingState extends GameState {
  enter() { this.machine.emit('state:playing'); }
  handleInput(input) {
    if (input === 'pause') this.machine.transitionTo('paused');
    else if (input === 'win') this.machine.transitionTo('won');
  }
  update(dt) { this.machine.emit('state:update', dt); }
}

export class PausedState extends GameState {
  enter() { this.machine.emit('state:paused'); }
  handleInput(input) {
    if (input === 'resume') this.machine.transitionTo('playing');
  }
}

export class WonState extends GameState {
  enter() { this.machine.emit('state:won'); }
  handleInput(input) {
    if (input === 'next' || input === 'restart') this.machine.transitionTo('playing');
  }
}

export class GameStateMachine {
  constructor() {
    this._states = {
      playing: new PlayingState(this),
      paused: new PausedState(this),
      won: new WonState(this),
    };
    this._current = null;
    this._bus = new EventBus();
  }

  transitionTo(name) {
    if (this._current) this._current.exit();
    this._current = this._states[name];
    this._current.enter();
  }

  handleInput(input) { this._current?.handleInput(input); }
  update(dt) { this._current?.update(dt); }
  on(event, cb) { return this._bus.on(event, cb); }
  emit(event, data) { this._bus.emit(event, data); }
  get currentState() { return this._current; }
}

// ─── 20. STRATEGY — ScoringStrategy ────────────────────────────────────────
// Swap star-rating algorithms at runtime. Default uses move count;
// could switch to time-based or combined scoring.

class ScoringStrategy {
  calculate(levelId, moves, pushes, time, optimal) { return 1; }
}

export class MoveBasedScoring extends ScoringStrategy {
  calculate(levelId, moves, pushes, time, optimal) {
    if (moves <= optimal) return 3;
    if (moves <= optimal * 1.5) return 2;
    return 1;
  }
}

export class TimeBasedScoring extends ScoringStrategy {
  calculate(levelId, moves, pushes, time) {
    if (time <= 30) return 3;
    if (time <= 60) return 2;
    return 1;
  }
}

export class CombinedScoring extends ScoringStrategy {
  calculate(levelId, moves, pushes, time, optimal) {
    const moveScore = moves <= optimal ? 3 : moves <= optimal * 1.5 ? 2 : 1;
    const timeScore = time <= 30 ? 3 : time <= 60 ? 2 : 1;
    return Math.round((moveScore + timeScore) / 2);
  }
}

export class ScoringContext {
  constructor(strategy = new MoveBasedScoring()) { this._strategy = strategy; }
  setStrategy(strategy) { this._strategy = strategy; }
  calculate(levelId, moves, pushes, time, optimal) {
    return this._strategy.calculate(levelId, moves, pushes, time, optimal);
  }
}

// ─── 21. TEMPLATE METHOD — BaseScene ───────────────────────────────────────
// Defines the skeleton of scene lifecycle. Subclasses override specific steps.
// activate() calls init → buildUI → onActivate in fixed order.

export class BaseScene {
  constructor(sceneManager) { this.sceneManager = sceneManager; this._initialized = false; }

  activate(...args) {
    if (!this._initialized) { this.init(); this._initialized = true; }
    this.buildUI();
    this.onActivate(...args);
  }

  deactivate() { this.onDeactivate(); this.teardownUI(); }

  // Template steps — override in subclasses
  init() {}
  buildUI() {}
  onActivate() {}
  onDeactivate() {}
  teardownUI() {}
  update(dt) {}
  render(renderer) {}
}

// ─── 22. VISITOR — TileVisitor ─────────────────────────────────────────────
// Perform operations on board tiles without modifying tile classes.
// E.g., count boxes on targets, find deadlocks, export to string.

export class TileVisitor {
  visitWall(x, y) {}
  visitFloor(x, y) {}
  visitTarget(x, y) {}
  visitBox(x, y, onTarget) {}
  visitPlayer(x, y, onTarget) {}
}

export class BoardStatsVisitor extends TileVisitor {
  constructor() { super(); this.walls = 0; this.floors = 0; this.targets = 0; this.boxes = 0; this.boxesOnTarget = 0; }
  visitWall() { this.walls++; }
  visitFloor() { this.floors++; }
  visitTarget() { this.targets++; }
  visitBox(x, y, onTarget) { this.boxes++; if (onTarget) this.boxesOnTarget++; }
}

export class BoardExportVisitor extends TileVisitor {
  constructor(width, height) {
    super();
    this._grid = Array.from({ length: height }, () => new Array(width).fill(' '));
  }
  visitWall(x, y) { this._grid[y][x] = '#'; }
  visitFloor(x, y) { this._grid[y][x] = ' '; }
  visitTarget(x, y) { this._grid[y][x] = '.'; }
  visitBox(x, y, onTarget) { this._grid[y][x] = onTarget ? '*' : '$'; }
  visitPlayer(x, y, onTarget) { this._grid[y][x] = onTarget ? '+' : '@'; }
  toString() { return this._grid.map(r => r.join('')).join('\n'); }
}

export function acceptBoard(board, visitor) {
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const tile = board.tiles[y][x];
      const entity = board.entities[y][x];
      const onTarget = tile === TileType.TARGET;
      if (tile === TileType.WALL) visitor.visitWall(x, y);
      else if (onTarget) visitor.visitTarget(x, y);
      else if (tile === TileType.FLOOR) visitor.visitFloor(x, y);
      if (entity === EntityType.BOX) visitor.visitBox(x, y, onTarget);
      if (entity === EntityType.PLAYER) visitor.visitPlayer(x, y, onTarget);
    }
  }
}
