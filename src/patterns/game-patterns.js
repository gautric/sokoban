/**
 * Game Programming Patterns (Robert Nystrom) — All 13 game-specific patterns.
 * The 6 "revisited" GoF patterns (Command, Flyweight, Observer, Prototype, Singleton, State)
 * are already in creational.js/structural.js/behavioral.js.
 *
 * SEQUENCING:     8.  Double Buffer    9.  Game Loop    10. Update Method
 * BEHAVIORAL:     11. Bytecode         12. Subclass Sandbox   13. Type Object
 * DECOUPLING:     14. Component        15. Event Queue        16. Service Locator
 * OPTIMIZATION:   17. Data Locality    18. Dirty Flag         19. Object Pool   20. Spatial Partition
 */

// ─── 8. DOUBLE BUFFER ──────────────────────────────────────────────────────
// Cause sequential operations to appear instantaneous by writing to a back
// buffer while reading from the front, then swapping.

export class DoubleBuffer {
  constructor(createFn) {
    this._buffers = [createFn(), createFn()];
    this._current = 0;
  }
  getCurrent() { return this._buffers[this._current]; }
  getNext()    { return this._buffers[1 - this._current]; }
  swap()       { this._current = 1 - this._current; }
}

// ─── 9. GAME LOOP ──────────────────────────────────────────────────────────
// Fixed update timestep with variable rendering. Decouples game time from
// wall-clock time and CPU speed.

export class GameLoop {
  constructor({ update, render, msPerUpdate = 16.667 }) {
    this._update = update;
    this._render = render;
    this._msPerUpdate = msPerUpdate;
    this._running = false;
    this._previous = 0;
    this._lag = 0;
  }

  start() {
    this._running = true;
    this._previous = performance.now();
    this._lag = 0;
    this._tick();
  }

  stop() { this._running = false; }

  _tick() {
    if (!this._running) return;
    const current = performance.now();
    const elapsed = current - this._previous;
    this._previous = current;
    this._lag += elapsed;

    // Fixed timestep updates — catch up to real time
    while (this._lag >= this._msPerUpdate) {
      this._update(this._msPerUpdate);
      this._lag -= this._msPerUpdate;
    }

    // Render with interpolation factor
    this._render(this._lag / this._msPerUpdate);
    requestAnimationFrame(() => this._tick());
  }
}

// ─── 10. UPDATE METHOD ─────────────────────────────────────────────────────
// Each entity implements update(dt). The world calls update on all entities
// each frame. Entities simulate one frame of behavior independently.

export class GameEntity {
  constructor(name = '') { this.name = name; this.active = true; }
  update(dt) {} // override per entity
}

export class EntityWorld {
  constructor() { this._entities = []; }
  add(entity) { this._entities.push(entity); }
  remove(entity) {
    const i = this._entities.indexOf(entity);
    if (i >= 0) this._entities.splice(i, 1);
  }
  update(dt) {
    for (let i = 0, len = this._entities.length; i < len; i++) {
      if (this._entities[i].active) this._entities[i].update(dt);
    }
  }
}

// ─── 11. BYTECODE ──────────────────────────────────────────────────────────
// Stack-based VM that executes data-driven behavior. Spells, AI scripts,
// or level triggers can be defined as bytecode arrays.

const OP = Object.freeze({
  LITERAL: 0x00, ADD: 0x01, SUB: 0x02, MUL: 0x03, DIV: 0x04,
  GET_HP: 0x10, SET_HP: 0x11, GET_X: 0x12, GET_Y: 0x13,
  PLAY_SFX: 0x20, SPAWN_FX: 0x21,
  JUMP: 0x30, JUMP_IF_ZERO: 0x31, HALT: 0xFF,
});
export { OP };

export class BytecodeVM {
  constructor(context = {}) {
    this._stack = [];
    this._ctx = context; // game API bindings
  }

  execute(bytecode) {
    this._stack = [];
    let ip = 0;
    const maxOps = 10000;
    let ops = 0;
    while (ip < bytecode.length && ops++ < maxOps) {
      const op = bytecode[ip++];
      switch (op) {
        case OP.LITERAL:  this._stack.push(bytecode[ip++]); break;
        case OP.ADD:      { const b = this._stack.pop(), a = this._stack.pop(); this._stack.push(a + b); break; }
        case OP.SUB:      { const b = this._stack.pop(), a = this._stack.pop(); this._stack.push(a - b); break; }
        case OP.MUL:      { const b = this._stack.pop(), a = this._stack.pop(); this._stack.push(a * b); break; }
        case OP.DIV:      { const b = this._stack.pop(), a = this._stack.pop(); this._stack.push(b ? (a / b) | 0 : 0); break; }
        case OP.GET_HP:   this._stack.push(this._ctx.getHP?.(this._stack.pop()) ?? 0); break;
        case OP.SET_HP:   { const v = this._stack.pop(), w = this._stack.pop(); this._ctx.setHP?.(w, v); break; }
        case OP.GET_X:    this._stack.push(this._ctx.getX?.(this._stack.pop()) ?? 0); break;
        case OP.GET_Y:    this._stack.push(this._ctx.getY?.(this._stack.pop()) ?? 0); break;
        case OP.PLAY_SFX: this._ctx.playSFX?.(this._stack.pop()); break;
        case OP.SPAWN_FX: this._ctx.spawnFX?.(this._stack.pop()); break;
        case OP.JUMP:     ip = bytecode[ip]; break;
        case OP.JUMP_IF_ZERO: { const addr = bytecode[ip++]; if (this._stack.pop() === 0) ip = addr; break; }
        case OP.HALT:     return this._stack[this._stack.length - 1];
        default: break;
      }
    }
    return this._stack[this._stack.length - 1];
  }
}

// ─── 12. SUBCLASS SANDBOX ──────────────────────────────────────────────────
// Base class provides a set of protected operations. Subclasses implement
// behavior using only those operations — sandboxed from the rest of the engine.

export class SandboxEntity extends GameEntity {
  constructor(name, world) { super(name); this._world = world; }

  // Protected sandbox operations — subclasses use these, not raw engine APIs
  move(dx, dy)    { this._world.moveEntity?.(this, dx, dy); }
  playSound(id)   { this._world.playSound?.(id); }
  spawnEffect(id) { this._world.spawnEffect?.(id); }
  getHP()         { return this._world.getHP?.(this) ?? 0; }
  setHP(v)        { this._world.setHP?.(this, v); }
}

// ─── 13. TYPE OBJECT ───────────────────────────────────────────────────────
// Share behavior/data across entities via a "type" data object instead of
// subclassing. Enables data-driven entity definitions.

export class EntityType {
  constructor({ name, speed = 1, maxHP = 100, sprite = null }) {
    this.name = name;
    this.speed = speed;
    this.maxHP = maxHP;
    this.sprite = sprite;
  }
}

export class TypedEntity extends GameEntity {
  constructor(type) {
    super(type.name);
    this.type = type;
    this.hp = type.maxHP;
    this.x = 0;
    this.y = 0;
  }
  update(dt) {
    // Behavior driven by type data, not subclass
    this.x += this.type.speed * dt / 1000;
  }
}

// ─── 14. COMPONENT ─────────────────────────────────────────────────────────
// Entity is a thin container of components. Each component handles one domain
// (input, physics, rendering) independently.

export class GameComponent {
  constructor(name) { this.name = name; this.entity = null; }
  attach(entity) { this.entity = entity; }
  update(dt) {} // override
  receive(msg, data) {} // inter-component messaging
}

export class ComponentEntity extends GameEntity {
  constructor(name) {
    super(name);
    this._components = [];
  }
  addComponent(component) {
    component.attach(this);
    this._components.push(component);
    return this;
  }
  getComponent(name) { return this._components.find(c => c.name === name); }
  update(dt) {
    for (const c of this._components) c.update(dt);
  }
  send(msg, data) {
    for (const c of this._components) c.receive(msg, data);
  }
}

// ─── 15. EVENT QUEUE ───────────────────────────────────────────────────────
// Deferred event processing. Events are queued and processed later, decoupling
// sender from receiver in time. Unlike Observer which is synchronous.

export class EventQueue {
  constructor() { this._queue = []; this._handlers = new Map(); }

  on(event, handler) {
    if (!this._handlers.has(event)) this._handlers.set(event, []);
    this._handlers.get(event).push(handler);
  }

  post(event, data) { this._queue.push({ event, data }); }

  process(maxEvents = Infinity) {
    let count = 0;
    while (this._queue.length > 0 && count < maxEvents) {
      const { event, data } = this._queue.shift();
      const handlers = this._handlers.get(event);
      if (handlers) for (const h of handlers) h(data);
      count++;
    }
  }

  get pending() { return this._queue.length; }
  clear() { this._queue = []; }
}

// ─── 16. SERVICE LOCATOR ───────────────────────────────────────────────────
// Provide global access to a service without coupling to the concrete class.
// Like Singleton but swappable — can inject null/mock/real implementations.

export class ServiceLocator {
  static _services = new Map();

  static provide(name, service) { ServiceLocator._services.set(name, service); }
  static get(name) { return ServiceLocator._services.get(name) ?? null; }
  static has(name) { return ServiceLocator._services.has(name); }
  static reset() { ServiceLocator._services.clear(); }
}

// ─── 17. DATA LOCALITY ────────────────────────────────────────────────────
// Store hot data contiguously in typed arrays for cache-friendly iteration.
// SOA (Structure of Arrays) instead of AOS (Array of Structures).

export class ParticleSOA {
  constructor(maxCount) {
    this.max = maxCount;
    this.count = 0;
    // SOA layout — each property in its own contiguous array
    this.x    = new Float32Array(maxCount);
    this.y    = new Float32Array(maxCount);
    this.vx   = new Float32Array(maxCount);
    this.vy   = new Float32Array(maxCount);
    this.life = new Float32Array(maxCount);
  }

  spawn(x, y, vx, vy, life) {
    if (this.count >= this.max) return -1;
    const i = this.count++;
    this.x[i] = x; this.y[i] = y;
    this.vx[i] = vx; this.vy[i] = vy;
    this.life[i] = life;
    return i;
  }

  update(dt) {
    const s = dt / 1000;
    for (let i = 0; i < this.count; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this._swap(i, --this.count); i--; continue; }
      this.x[i] += this.vx[i] * s;
      this.y[i] += this.vy[i] * s;
    }
  }

  _swap(a, b) {
    for (const k of ['x','y','vx','vy','life']) {
      const tmp = this[k][a]; this[k][a] = this[k][b]; this[k][b] = tmp;
    }
  }
}

// ─── 18. DIRTY FLAG ────────────────────────────────────────────────────────
// Avoid expensive recalculation by tracking when derived data is out of date.
// Only recompute when the flag is set and the result is needed.

export class DirtyFlag {
  constructor(computeFn) {
    this._compute = computeFn;
    this._dirty = true;
    this._cached = null;
  }
  invalidate() { this._dirty = true; }
  get() {
    if (this._dirty) { this._cached = this._compute(); this._dirty = false; }
    return this._cached;
  }
  get isDirty() { return this._dirty; }
}

// ─── 19. OBJECT POOL ──────────────────────────────────────────────────────
// Pre-allocate a fixed pool of objects. Reuse them instead of alloc/free.
// Eliminates GC pressure and memory fragmentation.

export class ObjectPool {
  constructor(factory, size) {
    this._pool = Array.from({ length: size }, () => factory());
    this._inUse = new Uint8Array(size);
    this._size = size;
  }

  acquire() {
    for (let i = 0; i < this._size; i++) {
      if (!this._inUse[i]) { this._inUse[i] = 1; return this._pool[i]; }
    }
    return null; // pool exhausted
  }

  release(obj) {
    const i = this._pool.indexOf(obj);
    if (i >= 0) this._inUse[i] = 0;
  }

  get activeCount() {
    let c = 0;
    for (let i = 0; i < this._size; i++) if (this._inUse[i]) c++;
    return c;
  }
}

// ─── 20. SPATIAL PARTITION ─────────────────────────────────────────────────
// Fixed grid that organizes objects by position for fast spatial queries.
// O(1) insert/remove, O(cells) range query instead of O(n²).

export class SpatialGrid {
  constructor(width, height, cellSize) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this._cells = Array.from({ length: this.cols * this.rows }, () => []);
  }

  _key(x, y) {
    const cx = Math.min(Math.max((x / this.cellSize) | 0, 0), this.cols - 1);
    const cy = Math.min(Math.max((y / this.cellSize) | 0, 0), this.rows - 1);
    return cy * this.cols + cx;
  }

  add(obj, x, y) {
    obj._gridKey = this._key(x, y);
    this._cells[obj._gridKey].push(obj);
  }

  move(obj, oldX, oldY, newX, newY) {
    const oldKey = this._key(oldX, oldY);
    const newKey = this._key(newX, newY);
    if (oldKey === newKey) return;
    const cell = this._cells[oldKey];
    const i = cell.indexOf(obj);
    if (i >= 0) cell.splice(i, 1);
    this._cells[newKey].push(obj);
    obj._gridKey = newKey;
  }

  remove(obj) {
    if (obj._gridKey == null) return;
    const cell = this._cells[obj._gridKey];
    const i = cell.indexOf(obj);
    if (i >= 0) cell.splice(i, 1);
  }

  queryNear(x, y, radius = 1) {
    const results = [];
    const minCx = Math.max(((x - radius) / this.cellSize) | 0, 0);
    const maxCx = Math.min(((x + radius) / this.cellSize) | 0, this.cols - 1);
    const minCy = Math.max(((y - radius) / this.cellSize) | 0, 0);
    const maxCy = Math.min(((y + radius) / this.cellSize) | 0, this.rows - 1);
    for (let cy = minCy; cy <= maxCy; cy++)
      for (let cx = minCx; cx <= maxCx; cx++)
        results.push(...this._cells[cy * this.cols + cx]);
    return results;
  }
}
