import * as THREE from 'three';
import gsap from 'gsap';

import { COLORS } from './constants';
import { Molecule } from './Molecule';
import { Cell } from './Cell';

let BOX_SIDE = 2;
let BOX_DEPTH = 0.75;

type Hooks = {
  onStart?: () => void;
  onStep?: () => void;
  onComplete?: () => void;
};

let defaultHooks: Hooks = {
  onStart: () => {},
  onStep: () => {},
  onComplete: () => {},
};

class Board {
  private playersCount: number;
  private currentPlayer: number;

  private scene: THREE.Scene;

  private xCells: number;
  private yCells: number;

  private edgesMaterial: THREE.LineBasicMaterial;
  private boxMaterial: THREE.MeshStandardMaterial;

  private grid: Cell[][];

  constructor(scene: THREE.Scene, playersCount: number, xCells: number, yCells: number) {
    this.playersCount = playersCount;
    this.currentPlayer = 0;

    this.scene = scene;
    this.xCells = xCells;
    this.yCells = yCells;

    this.boxMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    this.edgesMaterial = new THREE.LineBasicMaterial({ color: COLORS[0] });

    this.grid = new Array(xCells).fill(null).map(() => new Array(yCells).fill(null));

    this._initGrid();
  }

  _initGrid() {
    let boxGeometry = new THREE.BoxGeometry(BOX_SIDE, BOX_SIDE, BOX_DEPTH);
    let edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

    let BOX_SIDE_HALF = BOX_SIDE / 2;

    for (let i = 0; i < this.xCells; i++) {
      for (let j = 0; j < this.yCells; j++) {
        let cube = new THREE.Mesh(boxGeometry, this.boxMaterial);
        let line = new THREE.LineSegments(edgesGeometry, this.edgesMaterial);

        let x = -this.xCells + BOX_SIDE * i;
        let y = this.yCells - BOX_SIDE * j;

        cube.position.set(x + BOX_SIDE_HALF, y - BOX_SIDE_HALF, 0);
        line.position.set(x + BOX_SIDE_HALF, y - BOX_SIDE_HALF, 0);

        this.scene.add(cube);
        this.scene.add(line);

        cube.userData = { type: 'cube', row: i, col: j };

        let maxAtoms = 3;
        if (i === 0 || i === this.xCells - 1) maxAtoms--;
        if (j === 0 || j === this.yCells - 1) maxAtoms--;

        let cell = new Cell(cube);
        cell.setMaxCapacity(maxAtoms);

        this.grid[i][j] = cell;
      }
    }
  }

  _changePlayer() {
    this.currentPlayer = (this.currentPlayer + 1) % this.playersCount;
    this.changeBoardColor(COLORS[this.currentPlayer]);
  }

  _handleSplitOnComplete(atom: THREE.Mesh, row: number, col: number) {
    atom.removeFromParent();

    let cell = this.grid[row][col];
    cell.addExternalAtom(this.currentPlayer, atom);

    // if (cell.shouldMoleculeInCellBeExploded()) {
    //   this.startReaction(row, col);
    // } else {
    //   this._changePlayer();
    // }
  }

  // pass to _splitCells after validation that cell needs spliting
  _splitCells(cells: Cell[]) {
    let timelineDefaults = { duration: 0.5 };

    for (const cell of cells) {
      let [row, col] = cell.getPosition();

      // left movement
      if (row - 1 >= 0) {
        let leftAtom = cell.popTopAtom();

        gsap
          .timeline({
            defaults: timelineDefaults,
            onCompleteParams: [leftAtom, row - 1, col],
            onComplete: this._handleSplitOnComplete.bind(this),
          })
          .to(leftAtom.position, { x: leftAtom.position.x - 2 });
      }

      // right movement
      if (row + 1 < this.xCells) {
        let rightAtom = cell.popTopAtom();

        gsap
          .timeline({
            defaults: timelineDefaults,
            onCompleteParams: [rightAtom, row + 1, col],
            onComplete: this._handleSplitOnComplete.bind(this),
          })
          .to(rightAtom.position, { x: rightAtom.position.x + 2 });
      }

      // top movement
      if (col - 1 >= 0) {
        let topAtom = cell.popTopAtom();

        gsap
          .timeline({
            defaults: timelineDefaults,
            onCompleteParams: [topAtom, row, col - 1],
            onComplete: this._handleSplitOnComplete.bind(this),
          })
          .to(topAtom.position, { y: topAtom.position.y - 2 });
      }

      // bottom movement
      if (col + 1 < this.yCells) {
        let bottomAtom = cell.popTopAtom();

        gsap
          .timeline({
            defaults: timelineDefaults,
            onCompleteParams: [bottomAtom, row, col + 1],
            onComplete: this._handleSplitOnComplete.bind(this),
          })
          .to(bottomAtom.position, { y: bottomAtom.position.y + 2 });
      }
    }
  }

  changeBoardColor(color = COLORS[0]) {
    this.edgesMaterial.color.set(color);
  }

  validateMove(row: number, col: number) {
    let cellPlayer = this.grid[row][col].getPlayer();

    return cellPlayer === -1 || cellPlayer === this.currentPlayer;
  }

  addAtom(row: number, col: number) {
    let cell = this.grid[row][col];

    cell.addAtom(this.currentPlayer);

    return cell.shouldMoleculeInCellBeExploded();
  }

  startReaction(row: number, col: number, hooks: Hooks = defaultHooks) {
    if (hooks.onStart) hooks.onStart();

    this._splitCells([this.grid[row][col]]);

    if (hooks.onComplete) hooks.onComplete();
  }
}

export { Board, Cell };
