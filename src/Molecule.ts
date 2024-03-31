import * as THREE from 'three';
import gsap from 'gsap';

import { COLORS } from './constants';

export class Molecule {
  private pivotAtom: THREE.Mesh;

  private sphereGeometry: THREE.SphereGeometry;
  private sphereMaterial: THREE.MeshLambertMaterial;

  private player: number;
  private atomCount: number;
  private maxAtoms: number;

  constructor(player = 0, maxAtoms = 3) {
    this.player = player;
    this.atomCount = 1;
    this.maxAtoms = maxAtoms;
    this.sphereGeometry = new THREE.SphereGeometry(0.45, 20, 10);
    this.sphereMaterial = new THREE.MeshLambertMaterial({ color: COLORS[player], flatShading: true });

    this.pivotAtom = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);

    // this._addRotationMotion();
    // this._addVibrationMotion();
  }

  // try to use gsap instead of setInterval
  _addRotationMotion() {
    let delta1 = Math.random() * 0.02 + 0.02;
    let delta2 = Math.random() * 0.02 + 0.02;
    let delta3 = Math.random() * 0.02 + 0.02;

    if (Math.random() > 0.5) delta1 = -delta1;
    if (Math.random() > 0.5) delta2 = -delta2;
    if (Math.random() > 0.5) delta3 = -delta3;

    setInterval(() => {
      this.pivotAtom.rotateX(delta1);
      this.pivotAtom.rotateY(delta2);
      this.pivotAtom.rotateZ(delta3);
    }, 16);
  }

  _addVibrationMotion() {
    let delta = 0.03;

    gsap
      .timeline({ defaults: { duration: 0.2 }, repeat: Infinity })
      .fromTo(
        this.pivotAtom.position,
        { x: this.pivotAtom.position.x, y: this.pivotAtom.position.y, z: this.pivotAtom.position.z },
        { x: this.pivotAtom.position.x + delta, y: this.pivotAtom.position.y + delta, z: this.pivotAtom.position.z + delta },
      );
  }

  addAtom() {
    let head = this.pivotAtom;
    let count = this.atomCount;
    while (--count) {
      head = head.children[0] as THREE.Mesh;
    }

    let atom = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);

    if (this.atomCount === 1) atom.position.x = 0.495;
    if (this.atomCount === 2) atom.position.y = 0.495;

    head.add(atom);

    this.atomCount++;
  }

  getPivotAtom() {
    return this.pivotAtom;
  }

  getPlayer() {
    return this.player;
  }

  getAtomCount() {
    return this.atomCount;
  }

  getMaximumAtoms() {
    return this.maxAtoms;
  }

  shouldSplit() {
    return this.atomCount > this.maxAtoms;
  }
}

// export function vibrate(obj) {
//   let delta = 0.03;

//   let tl = gsap
//     .timeline({ defaults: { duration: 0.2 }, repeat: Infinity })
//     .fromTo(
//       obj.position,
//       { x: obj.position.x, y: obj.position.y, z: obj.position.z },
//       { x: obj.position.x + delta, y: obj.position.y + delta, z: obj.position.z + delta },
//     );
// }
