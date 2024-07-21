import * as THREE from 'three';
import gsap from 'gsap';

import { Player } from './Player';

type UserData = {
  type: string;
  row: number;
  col: number;
};

type Cube = THREE.Mesh & { userData: UserData };

class Cell {
  private cube: Cube;
  private atoms: THREE.Mesh[];
  private player: Player | null;
  private maxCapacity: number;

  private sphereGeometry: THREE.SphereGeometry;
  private sphereMaterial: THREE.MeshLambertMaterial;

  private timeline: gsap.core.Timeline;

  constructor(cube: THREE.Mesh) {
    this.cube = cube as Cube;
    this.atoms = [];
    this.player = null;

    this.sphereGeometry = new THREE.SphereGeometry(0.45, 20, 10);
    this.sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x000000, flatShading: true });
  }

  _addCreatedAtom(atom: THREE.Mesh) {
    let topElement = this.cube as THREE.Mesh;
    if (this.atoms.length > 0) {
      topElement = this.atoms[this.atoms.length - 1];
    }

    if (this.atoms.length === 1) atom.position.x = 0.495;
    if (this.atoms.length === 2) atom.position.y = 0.495;

    this.atoms.push(atom);
    topElement.add(atom);

    if (this.atoms.length === 1) {
      this._addRotationTween(this.atoms[0]);
    }
  }

  _addRotationTween(atom: THREE.Mesh) {
    let delta1 = Math.random() * 0.02 + 0.01;
    let delta2 = Math.random() * 0.02 + 0.01;
    let delta3 = Math.random() * 0.02 + 0.01;

    if (Math.random() > 0.5) delta1 = -delta1;
    if (Math.random() > 0.5) delta2 = -delta2;
    if (Math.random() > 0.5) delta3 = -delta3;

    this.timeline = gsap
      .timeline({
        defaults: {
          duration: 1, // does no matter
          onUpdate: () => {
            atom.rotateX(delta1).rotateY(delta2).rotateZ(delta3);
          },
        },
        repeat: -1,
      })
      .to({ x: 0 }, { x: 1.5 });
  }

  _addRotationWithVibrationTween(atom: THREE.Mesh) {
    let [delta1, delta2, delta3] = [0, 0, 0];
    delta1 = delta1 + 0.02;
    delta2 = delta2 + 0.02;
    delta3 = delta3 + 0.02;

    // let delta = 0.04;
    this.timeline = gsap
      .timeline({
        defaults: {
          duration: 0.08,
          onUpdate: () => {
            atom.rotateX(delta1).rotateY(delta2).rotateZ(delta3);
          },
        },
        repeat: -1,
      })
      .to({ x: 0 }, { x: 1.5 });
    // .fromTo(
    //   atom.position,
    //   { x: atom.position.x, y: atom.position.y, z: atom.position.z },
    //   { x: atom.position.x + delta, y: atom.position.y + delta, z: atom.position.z + delta },
    // );
  }

  _resetAtomPosition(atom: THREE.Mesh) {
    atom.position.x = 0;
    atom.position.y = 0;

    atom.rotation.x = 0;
    atom.rotation.y = 0;
    atom.rotation.z = 0;
  }

  addAtomToCube(atom: THREE.Mesh) {
    this.cube.add(atom);
  }

  getPlayer() {
    return this.player;
  }

  setPlayer(player: Player | null) {
    if (player !== null && this.player !== player) {
      this.sphereMaterial.color.set(player.getColor());
    }

    this.player = player;
  }

  getMaxCapacity() {
    return this.maxCapacity;
  }

  setMaxCapacity(maxCapacity: number) {
    this.maxCapacity = maxCapacity;
  }

  getAtomsCount() {
    return this.atoms.length;
  }

  addAtom(player: Player) {
    let atom = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this._addCreatedAtom(atom);
    this.setPlayer(player);
  }

  popTopAtom() {
    let atom = this.atoms.pop() as THREE.Mesh;
    if (this.atoms.length === 0) {
      this.timeline.kill();
      this.setPlayer(null);
    }

    this._resetAtomPosition(atom);

    return atom;
  }

  addExternalAtom(player: Player, atom: THREE.Mesh) {
    atom.material = this.sphereMaterial;
    this.setPlayer(player);
    this._addCreatedAtom(atom);
  }

  shouldMoleculeInCellBeExploded() {
    return this.atoms.length > this.maxCapacity;
  }

  getPosition() {
    return [this.cube.userData.row, this.cube.userData.col];
  }
}

export { Cell };
