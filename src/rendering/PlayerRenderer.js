import * as THREE from 'three';
import { TILE_SIZE, PLAYER_BOB_AMPLITUDE, PLAYER_BOB_PERIOD, PARTICLE_COLOR, PARTICLE_LIFETIME, PARTICLE_SPAWN_RATE_IDLE, PARTICLE_SPAWN_RATE_MOVING, MOVE_LERP_DURATION } from '../config.js';
import { Direction } from '../config.js';

export class PlayerRenderer {
  constructor(scene) {
    this.scene = scene;
    this.sprite = null;
    this.shadow = null;
    this.particles = [];
    this.elapsed = 0;
    this.moving = false;
    this.gridX = 0;
    this.gridY = 0;
    this._animating = false;
  }

  init() {
    // Ghost sprite
    const tex = new THREE.TextureLoader().load('assets/ghosty.png');
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    this.sprite = new THREE.Sprite(mat);
    this.sprite.scale.set(0.8, 0.8, 1);
    this.sprite.position.y = 0.6;
    this.scene.add(this.sprite);

    // Shadow blob
    const shadowGeo = new THREE.PlaneGeometry(0.5, 0.5);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.005;
    this.scene.add(this.shadow);
  }

  setPosition(x, y, animated = false) {
    const wx = x * TILE_SIZE;
    const wz = y * TILE_SIZE;
    if (animated && this.sprite) {
      this._animateToPosition(wx, wz);
    } else {
      if (this.sprite) { this.sprite.position.x = wx; this.sprite.position.z = wz; }
      if (this.shadow) { this.shadow.position.x = wx; this.shadow.position.z = wz; }
    }
    this.gridX = x;
    this.gridY = y;
  }

  _animateToPosition(tx, tz) {
    this._animating = true;
    const sx = this.sprite.position.x, sz = this.sprite.position.z;
    const start = performance.now();
    const anim = () => {
      const t = Math.min((performance.now() - start) / MOVE_LERP_DURATION, 1);
      const e = t * (2 - t);
      this.sprite.position.x = sx + (tx - sx) * e;
      this.sprite.position.z = sz + (tz - sz) * e;
      this.shadow.position.x = this.sprite.position.x;
      this.shadow.position.z = this.sprite.position.z;
      if (t < 1) requestAnimationFrame(anim);
      else this._animating = false;
    };
    anim();
  }

  isAnimating() { return this._animating; }

  setDirection(dir) {
    if (!this.sprite) return;
    this.sprite.material.rotation = 0;
    if (dir === Direction.LEFT) this.sprite.scale.x = -0.8;
    else this.sprite.scale.x = 0.8;
  }

  setMoving(isMoving) { this.moving = isMoving; }

  update(dt) {
    this.elapsed += dt;
    if (!this.sprite) return;

    // Bobbing
    const bob = Math.sin((this.elapsed / PLAYER_BOB_PERIOD) * Math.PI * 2) * PLAYER_BOB_AMPLITUDE;
    this.sprite.position.y = 0.6 + bob;

    // Particles
    const rate = this.moving ? PARTICLE_SPAWN_RATE_MOVING : PARTICLE_SPAWN_RATE_IDLE;
    for (let i = 0; i < rate; i++) {
      this._spawnParticle();
    }
    this._updateParticles(dt);
  }

  _spawnParticle() {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.2 + Math.random() * 0.15;
    const p = {
      mesh: this._createParticleMesh(),
      x: this.sprite.position.x + Math.cos(angle) * r,
      y: this.sprite.position.y + (Math.random() - 0.5) * 0.3,
      z: this.sprite.position.z + Math.sin(angle) * r,
      vx: Math.cos(angle) * 0.3,
      vy: 0.2 + Math.random() * 0.2,
      vz: Math.sin(angle) * 0.3,
      life: PARTICLE_LIFETIME,
      maxLife: PARTICLE_LIFETIME,
    };
    p.mesh.position.set(p.x, p.y, p.z);
    this.scene.add(p.mesh);
    this.particles.push(p);
  }

  _createParticleMesh() {
    const geo = new THREE.PlaneGeometry(0.04, 0.04);
    const brightness = 0.8 + Math.random() * 0.2;
    const mat = new THREE.MeshBasicMaterial({
      color: PARTICLE_COLOR,
      transparent: true,
      opacity: brightness,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      const t = 1 - p.life / p.maxLife;
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.z += p.vz * dt / 1000;
      p.mesh.position.set(p.x, p.y, p.z);
      p.mesh.material.opacity = (1 - t) * 0.8;
      const scale = 1 - t * 0.5;
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  dispose() {
    if (this.sprite) { this.scene.remove(this.sprite); this.sprite.material.dispose(); }
    if (this.shadow) { this.scene.remove(this.shadow); this.shadow.geometry.dispose(); this.shadow.material.dispose(); }
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.particles = [];
  }
}
