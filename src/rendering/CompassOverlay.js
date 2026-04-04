import * as THREE from 'three';

export class CompassOverlay {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 10);
    this.camera.position.set(0, 5, 0);
    this.camera.lookAt(0, 0, 0);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this._buildCompass();
  }

  _buildCompass() {
    const dirs = [
      { label: 'N', color: 0x7B61FF, pos: [0, 0, -1] },
      { label: 'S', color: 0xFFFFFF, pos: [0, 0, 1] },
      { label: 'E', color: 0xFFFFFF, pos: [1, 0, 0] },
      { label: 'W', color: 0xFFFFFF, pos: [-1, 0, 0] },
    ];

    for (const d of dirs) {
      // Line
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(d.pos[0] * 0.8, 0, d.pos[2] * 0.8),
      ]);
      const mat = new THREE.LineBasicMaterial({ color: d.color });
      this.group.add(new THREE.Line(geo, mat));

      // Label
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = d.color === 0x7B61FF ? '#7B61FF' : '#FFFFFF';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label, 16, 16);
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(d.pos[0] * 1.15, 0.01, d.pos[2] * 1.15);
      sprite.scale.set(0.4, 0.4, 1);
      // Rotate sprite to face top-down camera
      this.group.add(sprite);
    }

    // Center dot
    const dotGeo = new THREE.CircleGeometry(0.06, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.rotation.x = -Math.PI / 2;
    dot.position.y = 0.01;
    this.group.add(dot);
  }

  setRotation(angleDeg) {
    this.group.rotation.y = THREE.MathUtils.degToRad(angleDeg);
  }

  render(renderer) {
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const size = 100;
    const x = w - size - 10;
    const y = h - size - 40; // leave room for zoom indicator
    renderer.setViewport(x, y, size, size);
    renderer.setScissor(x, y, size, size);
    renderer.setScissorTest(true);
    renderer.render(this.scene, this.camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
  }
}
