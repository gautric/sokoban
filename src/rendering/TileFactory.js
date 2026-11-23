import * as THREE from 'three';
import { TILE_SIZE } from '../config.js';
import { PixelTextures } from './PixelTextures.js';
import { EntityPrototype, WallMeshCreator, FloorMeshCreator, BoxMeshCreator } from '../patterns/creational.js';

/**
 * TileFactory — FACTORY METHOD + PROTOTYPE patterns.
 *
 * Factory Method: delegates mesh creation to WallMeshCreator/FloorMeshCreator/BoxMeshCreator.
 * Prototype: builds one prototype mesh per type, then clones for each tile instance.
 */

const prototypes = new EntityPrototype();
const wallCreator = new WallMeshCreator();
const floorCreator = new FloorMeshCreator();
const boxCreator = new BoxMeshCreator();

function ensurePrototypes() {
  if (prototypes.has('wall')) return;
  prototypes.register('wall', wallCreator.create());
  prototypes.register('floor', floorCreator.create());
  prototypes.register('target', _createTargetProto());
  prototypes.register('box', boxCreator.create('box', { onTarget: false }));
  prototypes.register('boxOnTarget', boxCreator.create('box', { onTarget: true }));
}

function _createTargetProto() {
  const geo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
  const mat = new THREE.MeshLambertMaterial({ map: PixelTextures.getTargetTexture(), emissive: 0x113311, emissiveIntensity: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  mesh.receiveShadow = true;
  mesh.userData.baseMat = mat;
  return mesh;
}

export class TileFactory {
  /** PROTOTYPE: clone pre-built wall mesh */
  static createWall() {
    ensurePrototypes();
    return prototypes.clone('wall');
  }

  /** PROTOTYPE: clone pre-built floor mesh */
  static createFloor() {
    ensurePrototypes();
    return prototypes.clone('floor');
  }

  /** PROTOTYPE: clone pre-built target mesh, preserve baseMat ref */
  static createTarget() {
    ensurePrototypes();
    const mesh = prototypes.clone('target');
    mesh.userData.baseMat = mesh.material;
    return mesh;
  }

  /** PROTOTYPE: clone pre-built box mesh */
  static createBox(onTarget = false) {
    ensurePrototypes();
    return prototypes.clone(onTarget ? 'boxOnTarget' : 'box');
  }
}
