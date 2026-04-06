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
    const loadSVGTexture = (callback) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        callback(tex);
      };
      img.src = 'assets/ghostv2.svg';
    };

    // Ghost sprite
    loadSVGTexture((tex) => {
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      this.sprite = new THREE.Sprite(mat);
      this.sprite.scale.set(1, 1, 1);
      this.sprite.position.y = 0.6;
      this.sprite.position.x = this.gridX * TILE_SIZE;
      this.sprite.position.z = this.gridY * TILE_SIZE;
      this.scene.add(this.sprite);
    });

    // Shadow using SVG
    loadSVGTexture((tex) => {
      const shadowMat = new THREE.MeshBasicMaterial({
        map: tex, color: 0x000000, transparent: true, opacity: 0.3,
        depthWrite: false, alphaTest: 0.1,
      });
      const shadowGeo = new THREE.PlaneGeometry(0.6, 0.6);
      this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
      this.shadow.rotation.x = -Math.PI / 2;
      this.shadow.rotation.z = Math.PI / 4;
      this.shadow.scale.set(1, 0.6, 1);
      this.shadow.position.y = 0.003;
      this._shadowOff = { x: 0.2, z: 0.2 };
      this._updateShadowPos(this.gridX * TILE_SIZE, this.gridY * TILE_SIZE);
      this.scene.add(this.shadow);
    });
  }

  _updateShadowPos(wx, wz) {
    if (!this.shadow) return;
    this.shadow.position.x = wx + this._shadowOff.x;
    this.shadow.position.z = wz + this._shadowOff.z;
  }

  setPosition(x, y, animated = false) {
    const wx = x * TILE_SIZE;
    const wz = y * TILE_SIZE;
    if (animated && this.sprite) {
      this._animateToPosition(wx, wz);
    } else {
      if (this.sprite) { this.sprite.position.x = wx; this.sprite.position.z = wz; }
      this._updateShadowPos(wx, wz);
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
      this.shadow.position.x = this.sprite.position.x + this._shadowOff.x;
      this.shadow.position.z = this.sprite.position.z + this._shadowOff.z;
      if (t < 1) requestAnimationFrame(anim);
      else this._animating = false;
    };
    anim();
  }

  isAnimating() { return this._animating; }

  setCameraAngle(angleDeg) {
    if (this.shadow) {
      this.shadow.rotation.z = THREE.MathUtils.degToRad(angleDeg + 45);
    }
  }

  setDirection(dir) {
    if (!this.sprite) return;
    this.sprite.material.rotation = 0;
    if (dir === Direction.LEFT) this.sprite.scale.x = -1;
    else this.sprite.scale.x = 1;
  }

  setMoving(isMoving) { this.moving = isMoving; }

  startWinCelebration() {
    if (!this.sprite) return;
    this._celebrating = true;
    this._celebrateStart = performance.now();
    // Turn ghost violet
    this.sprite.material.color.set(0x7B61FF);
    // Add neon point light
    this._neonLight = new THREE.PointLight(0x7B61FF, 2, 5);
    this._neonLight.position.copy(this.sprite.position);
    this.scene.add(this._neonLight);
  }

  _stopCelebration() {
    this._celebrating = false;
    if (this.sprite) this.sprite.material.color.set(0xffffff);
    if (this._neonLight) { this.scene.remove(this._neonLight); this._neonLight = null; }
  }

  update(dt) {
    this.elapsed += dt;
    if (!this.sprite) return;

    // Bobbing
    const bob = Math.sin((this.elapsed / PLAYER_BOB_PERIOD) * Math.PI * 2) * PLAYER_BOB_AMPLITUDE;
    this.sprite.position.y = 0.6 + bob;

    // Win celebration: heartbeat neon for 5s
    if (this._celebrating) {
        const t = (performance.now() - this._celebrateStart) / 1000;
        const phase = (t % 0.8) / 0.8;
        let intensity;
        if (phase < 0.15) intensity = 1 + Math.sin(phase / 0.15 * Math.PI) * 3;
        else if (phase < 0.3) intensity = 1 + Math.sin((phase - 0.15) / 0.15 * Math.PI) * 2;
        else intensity = 0.5;
        this._neonLight.intensity = intensity;
        this._neonLight.position.copy(this.sprite.position);
        // Pulse sprite brightness
        const glow = 0.6 + intensity * 0.1;
        this.sprite.material.color.setRGB(glow * 0.48, glow * 0.38, glow);
    }

    // Particles
    const rate = this._celebrating ? PARTICLE_SPAWN_RATE_MOVING * 3 : (this.moving ? PARTICLE_SPAWN_RATE_MOVING : PARTICLE_SPAWN_RATE_IDLE);
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
    if (this._celebrating) this._stopCelebration();
    if (this.sprite) {
      this.scene.remove(this.sprite);
      if (this.sprite.material.map) this.sprite.material.map.dispose();
      this.sprite.material.dispose();
      this.sprite = null;
    }
    if (this.shadow) {
      this.scene.remove(this.shadow);
      if (this.shadow.material.map) this.shadow.material.map.dispose();
      this.shadow.material.dispose();
      this.shadow.geometry.dispose();
      this.shadow = null;
    }
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.particles = [];
  }
}
