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
import { EventBus, GameStateMachine, ScoringContext, MoveBasedScoring, CommandHistory, GameMediator, MementoCaretaker, LevelIterator, buildInputChain } from './patterns/behavioral.js';
// ── Game Programming Patterns (Nystrom) ──
// GameLoop (fixed timestep) is exported by game-patterns.js for reference; the
// loop below is a variable-dt requestAnimationFrame loop on purpose (lerps use dt).
import { LOG, Direction, MoveResult } from './config.js';
import { log, nameOf } from './log.js';
import { DoubleBuffer, EventQueue, ServiceLocator, ObjectPool, DirtyFlag, SpatialGrid, ParticleSOA, BytecodeVM } from './patterns/game-patterns.js';

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
  // ── 9. DECORATOR: LoggingAudioDecorator — in log mode (?log) it wraps the
  //    proxy and reports every audio call to the console. ──
  const audioManager = LOG
    ? new LoggingAudioDecorator(audioProxy, (action) => log('audio', action))
    : audioProxy;

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
  // SHOWCASE-ONLY instances: themeFactory, entityPrototypes, boardDirtyFlag,
  // particlePool, spatialGrid, inputBuffer, bytecodeVM (created and registered, not
  // read by the game) and particleSOA (ticked each frame, nothing rendered). They
  // exist to demonstrate the pattern. Wire one into gameplay before relying on it.
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
  registry.register('facade', facade);
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

  // ── Boot watchdog (index.html): signal that the game is running so the
  //    CDN-failure overlay is cleared / never shown. ──
  window.__bootOK?.();

  // ── LOG MODE (?log): print game events. Read-only — it changes nothing. ──
  if (LOG) {
    log('boot', `${levelManager.getLevelCount()} levels loaded`);
    sceneManager.onSceneChange(({ from, to, args }) => log('scene', `${from} -> ${to}`, ...args));
    gameScene.events.on('level:loaded', ({ levelId }) => log('level', 'loaded', levelId));
    gameScene.events.on('player:moved', ({ direction, result, pos }) => log('move', nameOf(Direction, direction), nameOf(MoveResult, result), `(${pos.x},${pos.y})`));
    for (const e of ['game:paused', 'game:resumed', 'game:won']) {
      gameScene.events.on(e, () => log('game', e.slice(5)));
    }
  }
}

init().catch((err) => {
  console.error(err);
  // Surface a visible failure state instead of a blank screen (e.g. the level
  // packs failed to load). The overlay + handler are defined in index.html.
  window.__bootFail?.();
});
