import * as THREE from 'three';
import { TILE_SIZE, WALL_HEIGHT, BOX_SIZE } from '../config.js';
import { PixelTextures } from './PixelTextures.js';

export class TileFactory {
  static createWall() {
    const geo = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
    const sideMat = new THREE.MeshLambertMaterial({ map: PixelTextures.getWallTexture() });
    const topMat = new THREE.MeshLambertMaterial({ map: PixelTextures.getWallTopTexture() });
    const mesh = new THREE.Mesh(geo, [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
    mesh.position.y = WALL_HEIGHT / 2;
    return mesh;
  }

  static createFloor() {
    const geo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const mat = new THREE.MeshLambertMaterial({ map: PixelTextures.getFloorTexture() });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.001;
    return mesh;
  }

  static createTarget() {
    const geo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const mat = new THREE.MeshLambertMaterial({ map: PixelTextures.getTargetTexture(), emissive: 0x113311, emissiveIntensity: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.002;
    mesh.userData.baseMat = mat;
    return mesh;
  }

  static createBox(onTarget = false) {
    const geo = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
    const side = onTarget ? PixelTextures.getBoxOnTargetTexture() : PixelTextures.getBoxTexture();
    const top = onTarget ? PixelTextures.getBoxOnTargetTopTexture() : PixelTextures.getBoxTopTexture();
    const dark = onTarget ? PixelTextures.getBoxOnTargetDarkTexture() : PixelTextures.getBoxDarkTexture();
    const matSide = new THREE.MeshLambertMaterial({ map: side });
    const matTop = new THREE.MeshLambertMaterial({ map: top });
    const matDark = new THREE.MeshLambertMaterial({ map: dark });
    const label = onTarget ? PixelTextures.getBoxOnTargetLabelTexture() : PixelTextures.getBoxLabelTexture();
    const matLabel = new THREE.MeshLambertMaterial({ map: label });
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    const mesh = new THREE.Mesh(geo, [matDark, matSide, matTop, matTop, matLabel, matDark]);
    mesh.position.y = BOX_SIZE / 2;
    return mesh;
  }
}
