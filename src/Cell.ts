import * as THREE from 'three';

import { COLORS } from './constants';

type UserData = {
  type: string;
  row: number;
  col: number;
};

type Cube = THREE.Mesh & { userData: UserData };

class Cell {
  private cube: Cube;
  private atoms: THREE.Mesh[];
  private player: number;
  private maxCapacity: number;

  private sphereGeometry: THREE.SphereGeometry;
  private sphereMaterial: THREE.MeshLambertMaterial;

  constructor(cube: THREE.Mesh) {
    this.cube = cube as Cube;
    this.atoms = [];
    this.player = -1;

    this.sphereGeometry = new THREE.SphereGeometry(0.45, 20, 10);
    this.sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x000000, flatShading: true });
  }

  _addCreatedAtom(atom: THREE.Mesh) {
    let topElement = this.atoms[this.atoms.length - 1];
    if (!topElement) {
      topElement = this.cube;
    }

    if (this.atoms.length === 1) atom.position.x = 0.495;
    if (this.atoms.length === 2) atom.position.y = 0.495;

    this.atoms.push(atom);
    topElement.add(atom);
  }

  _resetAtomPosition(atom: THREE.Mesh) {
    atom.position.x = 0;
    atom.position.y = 0;
  }

  addAtomToCube(atom: THREE.Mesh) {
    this.cube.add(atom);
  }

  getPlayer() {
    return this.player;
  }

  setPlayer(player: number) {
    if (player !== -1 && this.player !== player) {
      this.sphereMaterial.color.set(COLORS[player]);
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

  addAtom(player: number) {
    let atom = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this._addCreatedAtom(atom);
    this.setPlayer(player);
  }

  popTopAtom() {
    let atom = this.atoms.pop() as THREE.Mesh;
    if (this.atoms.length === 0) {
      this.setPlayer(-1);
    }

    this._resetAtomPosition(atom);

    return atom;
  }

  addExternalAtom(player: number, atom: THREE.Mesh) {
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
