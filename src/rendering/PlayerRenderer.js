import * as THREE from 'three';
import { TILE_SIZE, PLAYER_BOB_AMPLITUDE, PLAYER_BOB_PERIOD, PARTICLE_COLOR, PARTICLE_LIFETIME, PARTICLE_SPAWN_RATE_IDLE, PARTICLE_SPAWN_RATE_MOVING, MOVE_LERP_DURATION, ROTATION_MAP, Direction } from '../config.js';
import { EventBus } from '../patterns/behavioral.js';

/**
 * PlayerRenderer — STATE + OBSERVER + FLYWEIGHT patterns.
 *
 * STATE:    PlayerState classes (Idle/Moving/Celebrating) encapsulate per-state behavior.
 * OBSERVER: EventBus emits player events (moved, celebrated, etc.).
 * FLYWEIGHT: Shared particle geometry and material template — cloned per particle.
 */

// ── STATE: player animation states ──
class PlayerState {
  constructor(renderer) { this.r = renderer; }
  enter() {}
  exit() {}
  update(dt) {}
}

class IdleState extends PlayerState {
  update(dt) {
    this.r._spawnParticles(PARTICLE_SPAWN_RATE_IDLE);
  }
}

class MovingState extends PlayerState {
  update(dt) {
    this.r._spawnParticles(PARTICLE_SPAWN_RATE_MOVING);
  }
}

class CelebratingState extends PlayerState {
  enter() {
    this.r._celebrateStart = performance.now();
    if (this.r.sprite) this.r.sprite.material.color.set(0x7B61FF);
    if (this.r._neonLight) this.r._neonLight.intensity = 2;
  }
  exit() {
    if (this.r.sprite) this.r.sprite.material.color.set(0xffffff);
    this.r._celebSpin = 0;
    if (this.r._neonLight) this.r._neonLight.intensity = 0;
  }
  update(dt) {
    const t = (performance.now() - this.r._celebrateStart) / 1000;
    const phase = (t % 0.8) / 0.8;
    let intensity;
    if (phase < 0.15) intensity = 1 + Math.sin(phase / 0.15 * Math.PI) * 3;
    else if (phase < 0.3) intensity = 1 + Math.sin((phase - 0.15) / 0.15 * Math.PI) * 2;
    else intensity = 0.5;
    this.r._neonLight.intensity = intensity;
    this.r._neonLight.position.copy(this.r.sprite.position);
    const flash = Math.min(intensity / 4, 1);
    this.r.sprite.material.color.setRGB(0.48 + 0.52 * flash, 0.38 + 0.62 * flash, 1);
    this.r._celebSpin = Math.min(t / 1.5, 1) * Math.PI * 2 * 3;
    this.r._spawnParticles(PARTICLE_SPAWN_RATE_MOVING * 3.3);
  }
}

// ── FLYWEIGHT: shared particle geometry + material template ──
let _sharedParticleGeo = null;
function getSharedParticleGeo() {
  if (!_sharedParticleGeo) _sharedParticleGeo = new THREE.PlaneGeometry(0.04, 0.04);
  return _sharedParticleGeo;
}

export class PlayerRenderer {
  constructor(scene) {
    this.scene = scene;
    this.sprite = null;
    this.particles = [];
    this.elapsed = 0;
    this.gridX = 0;
    this.gridY = 0;
    this._animating = false;
    this._camera = null;
    this._mouseX = 0;
    this._mouseY = 0;
    this._tiltX = 0;
    this._tiltZ = 0;
    this._celebSpin = 0;
    this._celebrateStart = 0;
    this._celebrating = false;
    this.moving = false;

    this._onMouseMove = (e) => {
      this._mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this._mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', this._onMouseMove);
    this._neonLight = new THREE.PointLight(0x7B61FF, 0, 5);
    this.scene.add(this._neonLight);

    // ── OBSERVER ──
    this.events = new EventBus();

    // ── STATE: animation states ──
    this._states = {
      idle: new IdleState(this),
      moving: new MovingState(this),
      celebrating: new CelebratingState(this),
    };
    this._currentState = this._states.idle;
  }

  _transitionTo(name) {
    this._currentState.exit();
    this._currentState = this._states[name];
    this._currentState.enter();
    this.events.emit('player:stateChanged', name);
  }

  init() {
    const loadSVG = (cb, outline = false) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        if (outline) {
          const off = 7;
          for (let dx = -off; dx <= off; dx++)
            for (let dy = -off; dy <= off; dy++)
              if (dx * dx + dy * dy <= off * off) ctx.drawImage(img, dx, dy, 256, 256);
          ctx.globalCompositeOperation = 'source-in';
          ctx.fillStyle = '#6F57E6';
          ctx.fillRect(0, 0, 256, 256);
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.drawImage(img, 0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        cb(tex);
      };
      img.src = 'assets/ghostv2.svg';
    };

    loadSVG((tex) => {
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
      this.sprite = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), mat);
      this.sprite.position.set(this.gridX * TILE_SIZE, 0.6, this.gridY * TILE_SIZE);
      this.scene.add(this.sprite);
    }, true);

    loadSVG((tex) => {
      this.shadowCaster = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, colorWrite: false })
      );
      this.shadowCaster.castShadow = true;
      this.scene.add(this.shadowCaster);
    });
  }

  setPosition(x, y, animated = false) {
    const wx = x * TILE_SIZE, wz = y * TILE_SIZE;
    if (animated && this.sprite) {
      this._animating = true;
      const sx = this.sprite.position.x, sz = this.sprite.position.z;
      const start = performance.now();
      const anim = () => {
        const t = Math.min((performance.now() - start) / MOVE_LERP_DURATION, 1);
        const e = t * (2 - t);
        this.sprite.position.x = sx + (wx - sx) * e;
        this.sprite.position.z = sz + (wz - sz) * e;
        if (t < 1) requestAnimationFrame(anim); else this._animating = false;
      };
      anim();
    } else if (this.sprite) {
      this.sprite.position.x = wx;
      this.sprite.position.z = wz;
    }
    this.gridX = x;
    this.gridY = y;
  }

  isAnimating() { return this._animating; }
  setCameraAngle(angleDeg, camera) { this._camera = camera; }
  setRotationStep(step) { this._rotationStep = step; }

  setDirection(boardDir) {
    if (!this.sprite) return;
    const step = this._rotationStep || 0;
    const map = ROTATION_MAP[step];
    let screenDir = boardDir;
    for (let i = 0; i < 4; i++) { if (map[i] === boardDir) { screenDir = i; break; } }
    this.sprite.scale.x = (screenDir === Direction.LEFT || screenDir === Direction.DOWN) ? -1 : 1;
  }

  setMoving(isMoving) {
    this.moving = isMoving;
    if (!this._celebrating) this._transitionTo(isMoving ? 'moving' : 'idle');
  }

  startWinCelebration() {
    if (!this.sprite) return;
    this._celebrating = true;
    this._transitionTo('celebrating');
  }

  _stopCelebration() {
    this._celebrating = false;
    this._transitionTo('idle');
  }

  // ── FLYWEIGHT: create particle using shared geometry ──
  _createParticleMesh() {
    return new THREE.Mesh(
      getSharedParticleGeo(),
      new THREE.MeshBasicMaterial({
        color: PARTICLE_COLOR, transparent: true,
        opacity: 0.8 + Math.random() * 0.2,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      })
    );
  }

  _spawnParticles(rate) {
    if (!this.sprite) return;
    for (let i = 0; i < rate; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.2 + Math.random() * 0.15;
      const spd = this._celebrating ? 1.1 : 1;
      const life = this._celebrating ? PARTICLE_LIFETIME * 1.25 : PARTICLE_LIFETIME;
      const p = {
        mesh: this._createParticleMesh(),
        x: this.sprite.position.x + Math.cos(angle) * r,
        y: this.sprite.position.y + (Math.random() - 0.5) * 0.3,
        z: this.sprite.position.z + Math.sin(angle) * r,
        vx: Math.cos(angle) * 0.3 * spd, vy: (0.2 + Math.random() * 0.2) * spd,
        vz: Math.sin(angle) * 0.3 * spd, life, maxLife: life,
      };
      p.mesh.position.set(p.x, p.y, p.z);
      this.scene.add(p.mesh);
      this.particles.push(p);
    }
  }

  update(dt) {
    this.elapsed += dt;
    if (!this.sprite) return;

    const bob = Math.sin((this.elapsed / PLAYER_BOB_PERIOD) * Math.PI * 2) * PLAYER_BOB_AMPLITUDE;
    this.sprite.position.y = 0.6 + bob;

    if (this._camera) {
      this.sprite.lookAt(this._camera.position);
      if (this._celebSpin) this.sprite.rotateY(this._celebSpin);
      this._tiltX += (this._mouseY * 0.4 - this._tiltX) * 0.08;
      this._tiltZ += (this._mouseX * -0.3 - this._tiltZ) * 0.08;
      this.sprite.rotateX(this._tiltX);
      this.sprite.rotateZ(this._tiltZ);
    }

    if (this.shadowCaster) {
      this.shadowCaster.position.copy(this.sprite.position);
      this.shadowCaster.lookAt(this.shadowCaster.position.x, this.shadowCaster.position.y, this.shadowCaster.position.z - 1);
    }

    // ── STATE: delegate to current state ──
    this._currentState.update(dt);

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      const t = 1 - p.life / p.maxLife;
      p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; p.z += p.vz * dt / 1000;
      p.mesh.position.set(p.x, p.y, p.z);
      p.mesh.material.opacity = (1 - t) * 0.8;
      const s = 1 - t * 0.5;
      p.mesh.scale.set(s, s, s);
    }
  }

  dispose() {
    window.removeEventListener('mousemove', this._onMouseMove);
    if (this._celebrating) this._stopCelebration();
    if (this._neonLight) { this.scene.remove(this._neonLight); this._neonLight = null; }
    if (this.sprite) {
      this.scene.remove(this.sprite);
      if (this.sprite.material.map) this.sprite.material.map.dispose();
      this.sprite.material.dispose();
      this.sprite.geometry.dispose();
      this.sprite = null;
    }
    if (this.shadowCaster) {
      this.scene.remove(this.shadowCaster);
      this.shadowCaster.geometry.dispose();
      this.shadowCaster.material.dispose();
      this.shadowCaster = null;
    }
    for (const p of this.particles) { this.scene.remove(p.mesh); p.mesh.material.dispose(); }
    this.particles = [];
  }
}
