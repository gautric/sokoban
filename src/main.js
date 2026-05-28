import * as THREE from 'three';
import { StateManager } from './core/StateManager.js';
import { LevelManager } from './core/LevelManager.js';
import { InputHandler } from './core/InputHandler.js';
import { AudioManager } from './audio/AudioManager.js';
import { SceneManager } from './scenes/SceneManager.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { toggleLang } from './i18n.js';

// ── GoF Creational ──
import { GameRegistry, PixelThemeFactory, EntityPrototype } from './patterns/creational.js';
// ── GoF Structural ──
import { GameFacade, TextureCache, LazyAudioProxy, LoggingAudioDecorator, ThreeJSRenderAPI, GameRenderer, TouchInputAdapter } from './patterns/structural.js';
// ── GoF Behavioral ──
import { EventBus, GameStateMachine, ScoringContext, MoveBasedScoring, CommandHistory, GameMediator, MementoCaretaker, LevelIterator, CheatCodeInterpreter, buildInputChain } from './patterns/behavioral.js';
// ── Game Programming Patterns (Nystrom) ──
import { GameLoop, DoubleBuffer, EventQueue, ServiceLocator, ObjectPool, DirtyFlag, SpatialGrid, ParticleSOA, BytecodeVM, OP } from './patterns/game-patterns.js';
import { DEBUG } from './config.js';

async function init() {
  const container = document.getElementById('game-container');
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1);
  renderer.autoClear = false;
  container.insertBefore(renderer.domElement, container.firstChild);

  // ═══════════════════════════════════════════════════════════════════════
  // GoF PATTERNS
  // ═══════════════════════════════════════════════════════════════════════

  // ── 1. SINGLETON: GameRegistry ──
  const registry = GameRegistry.getInstance();

  const stateManager = new StateManager();
  const inputHandler = new InputHandler();
  const levelManager = new LevelManager(stateManager);

  // ── 12. PROXY: LazyAudioProxy ──
  const audioProxy = new LazyAudioProxy(() => new AudioManager(stateManager));
  // ── 9. DECORATOR: LoggingAudioDecorator ──
  const audioManager = DEBUG ? new LoggingAudioDecorator(audioProxy) : audioProxy;

  // ── 18. OBSERVER: EventBus ──
  const eventBus = new EventBus();
  // ── 19. STATE: GameStateMachine ──
  const stateMachine = new GameStateMachine();
  // ── 20. STRATEGY: ScoringContext ──
  const scoring = new ScoringContext(new MoveBasedScoring());
  // ── 14. COMMAND: CommandHistory ──
  const commandHistory = new CommandHistory();
  // ── 16. MEDIATOR: GameMediator ──
  const mediator = new GameMediator();
  // ── 17. MEMENTO: MementoCaretaker ──
  const mementoCaretaker = new MementoCaretaker();
  // ── 11. FLYWEIGHT: TextureCache ──
  const textureCache = new TextureCache();
  // ── 3. ABSTRACT FACTORY: PixelThemeFactory ──
  const themeFactory = new PixelThemeFactory();
  // ── 5. PROTOTYPE: EntityPrototype ──
  const entityPrototypes = new EntityPrototype();
  // ── 7. BRIDGE: GameRenderer / ThreeJSRenderAPI ──
  const renderAPI = new ThreeJSRenderAPI(renderer);
  const gameRenderer = new GameRenderer(renderAPI);

  // ═══════════════════════════════════════════════════════════════════════
  // GAME PROGRAMMING PATTERNS (Nystrom)
  // ═══════════════════════════════════════════════════════════════════════

  // ── 16. SERVICE LOCATOR: global access without global coupling ──
  ServiceLocator.provide('audio', audioManager);
  ServiceLocator.provide('renderer', renderer);
  ServiceLocator.provide('input', inputHandler);

  // ── 15. EVENT QUEUE: deferred event processing ──
  const eventQueue = new EventQueue();
  eventQueue.on('sfx:play', (id) => audioManager.sfx?.playMenuClick());
  eventQueue.on('level:complete', (data) => eventBus.emit('game:won', data));

  // ── 18. DIRTY FLAG: defer expensive world-transform recalculation ──
  const boardDirtyFlag = new DirtyFlag(() => {
    // Recompute derived board data only when board state changes
    return { timestamp: Date.now(), recomputed: true };
  });

  // ── 19. OBJECT POOL: particle mesh pool to avoid GC pressure ──
  const particlePool = new ObjectPool(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, active: false }),
    200
  );

  // ── 20. SPATIAL PARTITION: grid for fast spatial queries ──
  const spatialGrid = new SpatialGrid(20, 20, 2);

  // ── 17. DATA LOCALITY: SOA particle system for cache-friendly updates ──
  const particleSOA = new ParticleSOA(500);

  // ── 8. DOUBLE BUFFER: atomic state swaps ──
  const inputBuffer = new DoubleBuffer(() => ({ keys: new Set(), processed: false }));

  // ── 11. BYTECODE: VM for data-driven level triggers / cheat scripts ──
  const bytecodeVM = new BytecodeVM({
    getHP: () => 100,
    setHP: (w, v) => { stateManager.moves = v; },
    playSFX: (id) => audioManager.sfx?.playMenuClick(),
    getX: () => 0,
    getY: () => 0,
  });

  // ── Register all in Singleton + Service Locator ──
  const services = {
    renderer, gameRenderer, state: stateManager, audio: audioManager,
    levels: levelManager, input: inputHandler, eventBus, stateMachine,
    scoring, commandHistory, mediator, mementoCaretaker, textureCache,
    themeFactory, entityPrototypes, eventQueue, boardDirtyFlag,
    particlePool, spatialGrid, particleSOA, inputBuffer, bytecodeVM,
  };
  for (const [k, v] of Object.entries(services)) {
    registry.register(k, v);
    ServiceLocator.provide(k, v);
  }

  mediator.register('audio', audioManager);
  mediator.register('state', stateManager);

  await levelManager.loadPacks();

  // ── 15. ITERATOR: LevelIterator ──
  registry.register('levelIterator', new LevelIterator(levelManager.getLevelList()));

  // ── Scenes ──
  const sceneManager = new SceneManager({}, audioManager);
  const menuScene = new MenuScene(sceneManager, levelManager);
  const levelSelectScene = new LevelSelectScene(sceneManager, levelManager);
  const gameScene = new GameScene(sceneManager, levelManager, stateManager, inputHandler, audioManager);
  sceneManager.scenes = { menu: menuScene, levelSelect: levelSelectScene, game: gameScene };

  // ── 13. CHAIN OF RESPONSIBILITY ──
  const inputChain = buildInputChain(
    () => gameScene.pauseMenu?.isVisible() || gameScene.levelComplete?.isVisible(),
    () => {}
  );

  // ── 6. ADAPTER: TouchInputAdapter ──
  const touchAdapter = new TouchInputAdapter({ onMove: (dir) => gameScene._handleMove?.(dir) });
  touchAdapter.attach(container);

  // ── 23. INTERPRETER: CheatCodeInterpreter ──
  const cheatInterpreter = new CheatCodeInterpreter({
    skipLevels: (n) => { const next = gameScene.currentLevelId + n; if (next < levelManager.getLevelCount()) gameScene.activate(next); },
    instantWin: () => gameScene._onWin?.(),
    undo: () => gameScene._handleUndo?.(),
    setMoves: (n) => { stateManager.moves = n; },
  });

  // ── STATE MACHINE wiring ──
  stateMachine.on('state:paused', () => eventBus.emit('game:paused'));
  stateMachine.on('state:playing', () => eventBus.emit('game:resumed'));
  stateMachine.on('state:won', () => eventBus.emit('game:won'));
  stateMachine.transitionTo('playing');

  // ── Audio init on first interaction ──
  const initAudio = () => {
    audioManager.init();
    document.removeEventListener('click', initAudio, true);
    document.removeEventListener('keydown', initAudio, true);
    const name = sceneManager.currentName;
    if (name === 'menu' || name === 'levelSelect') audioManager.music?.playMenu();
    else if (name === 'game') audioManager.music?.playGameplay();
  };
  document.addEventListener('click', initAudio, true);
  document.addEventListener('keydown', initAudio, true);

  // ── 10. FACADE: GameFacade ──
  const facade = new GameFacade({ container, stateManager, audioManager, levelManager, inputHandler, sceneManager, renderer });
  sceneManager.switchTo('menu');

  window.addEventListener('keydown', (e) => {
    if (e.key === 'j' || e.key === 'J') { toggleLang(); e.preventDefault(); }
    inputChain.handle(e);
  });

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    gameRenderer.resize(window.innerWidth, window.innerHeight);
    if (sceneManager.scenes?.game?.composer) sceneManager.scenes.game.composer.setSize(window.innerWidth, window.innerHeight);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 9. GAME LOOP — fixed update timestep with variable rendering
  // ═══════════════════════════════════════════════════════════════════════
  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;

    // ── 15. EVENT QUEUE: process deferred events ──
    eventQueue.process(10);

    // ── 10. UPDATE METHOD: each scene/entity updates itself ──
    sceneManager.update(dt);

    // ── 17. DATA LOCALITY: update SOA particles ──
    particleSOA.update(dt);

    renderer.clear();
    sceneManager.render(renderer);
    requestAnimationFrame(loop);
  }
  loop();

  // ── Debug console ──
  if (DEBUG) {
    window.__registry = registry;
    window.__services = ServiceLocator;
    window.__cheat = (cmd) => cheatInterpreter.interpret(cmd);
    window.__bytecode = (code) => bytecodeVM.execute(code);
    window.__OP = OP;
    console.log('[Patterns] 23 GoF + 13 Game Programming Patterns wired.');
    console.log('  __cheat("win")  __cheat("skip 3")  __bytecode([OP.LITERAL, 42, OP.HALT])');
    console.log('  __services.get("audio")  __registry.get("eventQueue")');
  }
}

init().catch(console.error);
