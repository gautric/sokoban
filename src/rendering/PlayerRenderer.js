import * as THREE from 'three';
import { DEBUG, TILE_SIZE, PLAYER_BOB_AMPLITUDE, PLAYER_BOB_PERIOD, PARTICLE_COLOR, PARTICLE_LIFETIME, PARTICLE_SPAWN_RATE_IDLE, PARTICLE_SPAWN_RATE_MOVING, MOVE_LERP_DURATION, ROTATION_MAP } from '../config.js';
import { Direction } from '../config.js';

export class PlayerRenderer {
  constructor(scene) {
    this.scene = scene;
    this.sprite = null;
    this.particles = [];
    this.elapsed = 0;
    this.moving = false;
    this.gridX = 0;
    this.gridY = 0;
    this._animating = false;
    this._camera = null;
    this._mouseX = 0;
    this._mouseY = 0;
    this._tiltX = 0;
    this._tiltZ = 0;
    this._onMouseMove = (e) => {
      this._mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this._mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', this._onMouseMove);
    this._neonLight = new THREE.PointLight(0x7B61FF, 0, 5);
    this.scene.add(this._neonLight);
  }

  init() {
    const loadSVGTexture = (callback, outline = false) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        if (outline) {
          const off = 7;
          ctx.globalCompositeOperation = 'source-over';
          for (let dx = -off; dx <= off; dx++)
            for (let dy = -off; dy <= off; dy++)
              if (dx * dx + dy * dy <= off * off)
                ctx.drawImage(img, dx, dy, 256, 256);
          ctx.globalCompositeOperation = 'source-in';
          ctx.fillStyle = '#6F57E6';
          ctx.fillRect(0, 0, 256, 256);
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.drawImage(img, 0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        callback(tex);
      };
      img.src = 'assets/ghostv2.svg';
    };

    // Ghost mesh (plane, billboarded manually for 3D rotation)
    loadSVGTexture((tex) => {
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
      const geo = new THREE.PlaneGeometry(1.05, 1.05);
      this.sprite = new THREE.Mesh(geo, mat);
      this.sprite.position.y = 0.6;
      this.sprite.position.x = this.gridX * TILE_SIZE;
      this.sprite.position.z = this.gridY * TILE_SIZE;
      this.scene.add(this.sprite);

      // Debug axes + labels (activate with ?debug in URL)
      if (DEBUG) {
        this._axes = new THREE.AxesHelper(0.8);
        this.sprite.add(this._axes);

        const makeLabel = (text, color, pos) => {
          const canvas = document.createElement('canvas');
          canvas.width = 64; canvas.height = 32;
          const ctx = canvas.getContext('2d');
          ctx.font = 'bold 24px monospace';
          ctx.fillStyle = color;
          ctx.fillText(text, 4, 24);
          const tex = new THREE.CanvasTexture(canvas);
          const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
          const s = new THREE.Sprite(mat);
          s.scale.set(0.4, 0.2, 1);
          s.position.copy(pos);
          return s;
        };
        this.sprite.add(makeLabel('X', '#ff0000', new THREE.Vector3(0.95, 0, 0)));
        this.sprite.add(makeLabel('Y', '#00ff00', new THREE.Vector3(0, 0.95, 0)));
        this.sprite.add(makeLabel('Z', '#0088ff', new THREE.Vector3(0, 0, 0.95)));
      }
    }, true);

    // Shadow caster (plain, no outline)
    loadSVGTexture((tex) => {
      const shadowMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, colorWrite: false });
      const shadowGeo = new THREE.PlaneGeometry(1, 1);
      this.shadowCaster = new THREE.Mesh(shadowGeo, shadowMat);
      this.shadowCaster.castShadow = true;
      this.scene.add(this.shadowCaster);
    });
  }

  setPosition(x, y, animated = false) {
    const wx = x * TILE_SIZE;
    const wz = y * TILE_SIZE;
    if (animated && this.sprite) {
      this._animateToPosition(wx, wz);
    } else {
      if (this.sprite) { this.sprite.position.x = wx; this.sprite.position.z = wz; }
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
      if (t < 1) requestAnimationFrame(anim);
      else this._animating = false;
    };
    anim();
  }

  isAnimating() { return this._animating; }

  setCameraAngle(angleDeg, camera) {
    this._camera = camera;
  }

  setDirection(boardDir) {
    if (!this.sprite) return;
    // Find which screen direction maps to this board direction
    const step = this._rotationStep || 0;
    const map = ROTATION_MAP[step];
    let screenDir = boardDir;
    for (let i = 0; i < 4; i++) { if (map[i] === boardDir) { screenDir = i; break; } }
    if (screenDir === Direction.LEFT || screenDir === Direction.DOWN) this.sprite.scale.x = -1;
    else this.sprite.scale.x = 1;
  }

  setRotationStep(step) { this._rotationStep = step; }

  setMoving(isMoving) { this.moving = isMoving; }

  startWinCelebration() {
    if (!this.sprite) return;
    this._celebrating = true;
    this._celebrateStart = performance.now();
    // Turn ghost violet
    this.sprite.material.color.set(0x7B61FF);
    this._neonLight.intensity = 2;
    this._neonLight.position.copy(this.sprite.position);
  }

  _stopCelebration() {
    this._celebrating = false;
    if (this.sprite) this.sprite.material.color.set(0xffffff);
    this._celebSpin = 0;
    if (this._neonLight) this._neonLight.intensity = 0;
  }

  update(dt) {
    this.elapsed += dt;
    if (!this.sprite) return;

    // Bobbing
    const bob = Math.sin((this.elapsed / PLAYER_BOB_PERIOD) * Math.PI * 2) * PLAYER_BOB_AMPLITUDE;
    this.sprite.position.y = 0.6 + bob;

    // Billboard toward camera + celebration spin
    if (this._camera) {
      this.sprite.lookAt(this._camera.position);
      if (this._celebSpin) this.sprite.rotateY(this._celebSpin);
      // Smooth 3D tilt toward mouse
      this._tiltX += (this._mouseY * 0.4 - this._tiltX) * 0.08;
      this._tiltZ += (this._mouseX * -0.3 - this._tiltZ) * 0.08;
      this.sprite.rotateX(this._tiltX);
      this.sprite.rotateZ(this._tiltZ);
    }

    // Sync shadow caster
    if (this.shadowCaster) {
      this.shadowCaster.position.copy(this.sprite.position);
      this.shadowCaster.lookAt(this.shadowCaster.position.x, this.shadowCaster.position.y, this.shadowCaster.position.z - 1);
    }

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
        // Pulse sprite brightness — flash white at peak, violet otherwise
        const flash = Math.min(intensity / 4, 1);
        this.sprite.material.color.setRGB(0.48 + 0.52 * flash, 0.38 + 0.62 * flash, 1);
        // Spin 3 times in 1.5s around Y axis
        const spin = Math.min(t / 1.5, 1) * Math.PI * 2 * 3;
        this._celebSpin = spin;
    }

    // Particles
    const rate = this._celebrating ? PARTICLE_SPAWN_RATE_MOVING * 3.3 : (this.moving ? PARTICLE_SPAWN_RATE_MOVING : PARTICLE_SPAWN_RATE_IDLE);
    for (let i = 0; i < rate; i++) {
      this._spawnParticle();
    }
    this._updateParticles(dt);
  }

  _spawnParticle() {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.2 + Math.random() * 0.15;
    const spd = this._celebrating ? 1.1 : 1;
    const life = this._celebrating ? PARTICLE_LIFETIME * 1.25 : PARTICLE_LIFETIME;
    const p = {
      mesh: this._createParticleMesh(),
      x: this.sprite.position.x + Math.cos(angle) * r,
      y: this.sprite.position.y + (Math.random() - 0.5) * 0.3,
      z: this.sprite.position.z + Math.sin(angle) * r,
      vx: Math.cos(angle) * 0.3 * spd,
      vy: (0.2 + Math.random() * 0.2) * spd,
      vz: Math.sin(angle) * 0.3 * spd,
      life: life,
      maxLife: life,
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
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.particles = [];
  }
}
