/**
 * Barrel export — ALL design patterns for the Sokoban game.
 *
 * GoF CREATIONAL (5):  Singleton, Factory Method, Abstract Factory, Builder, Prototype
 * GoF STRUCTURAL (7):  Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy
 * GoF BEHAVIORAL (11): Chain of Responsibility, Command, Iterator, Mediator, Memento,
 *                      Observer, State, Strategy, Template Method, Visitor, Interpreter
 *
 * GAME PROGRAMMING PATTERNS (Robert Nystrom):
 * Sequencing (3):      Double Buffer, Game Loop, Update Method
 * Behavioral (3):      Bytecode, Subclass Sandbox, Type Object
 * Decoupling (3):      Component, Event Queue, Service Locator
 * Optimization (4):    Data Locality, Dirty Flag, Object Pool, Spatial Partition
 */

// ── GoF Creational ──
export { GameRegistry, WallMeshCreator, FloorMeshCreator, BoxMeshCreator, PixelThemeFactory, ThemeFactory, LevelBuilder, EntityPrototype } from './creational.js';

// ── GoF Structural ──
export { TouchInputAdapter, ThreeJSRenderAPI, GameRenderer, SceneNode, LoggingAudioDecorator, GameFacade, TextureCache, LazyAudioProxy } from './structural.js';

// ── GoF Behavioral ──
export { UIInputHandler, GameInputHandler, buildInputChain, MoveCommand, CommandHistory, LevelIterator, GameMediator, BoardMemento, MementoCaretaker, EventBus, PlayingState, PausedState, WonState, GameStateMachine, MoveBasedScoring, TimeBasedScoring, CombinedScoring, ScoringContext, BaseScene, TileVisitor, BoardStatsVisitor, BoardExportVisitor, acceptBoard, CheatCodeInterpreter } from './behavioral.js';

// ── Game Programming Patterns ──
export { DoubleBuffer, GameLoop, GameEntity, EntityWorld, OP, BytecodeVM, SandboxEntity, EntityType, TypedEntity, GameComponent, ComponentEntity, EventQueue, ServiceLocator, ParticleSOA, DirtyFlag, ObjectPool, SpatialGrid } from './game-patterns.js';
