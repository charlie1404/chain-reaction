import * as THREE from 'three';
import gsap from 'gsap';

import { COLORS } from './constants';
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

  // pass to _splitCells after validation that cell needs spliting
  _splitCells(cells: Cell[], cb?: (arg0: [number, number][]) => void) {
    let updatedCells: [number, number][] = [];
    let atomMovements = new Map();

    let timeline = gsap.timeline({
      defaults: { duration: 0.25 },
      onComplete: () => {
        for (let [atom, [row, col]] of atomMovements) {
          atom.removeFromParent();
          this.grid[row][col].addExternalAtom(this.currentPlayer, atom);
        }

        let dedupe = new Set();
        updatedCells = updatedCells.filter((cell) => {
          let key = cell.join(',');
          if (dedupe.has(key)) return false;
          dedupe.add(key);
          return true;
        });

        if (cb) cb(updatedCells);
      },
    });

    for (const cell of cells) {
      let [row, col] = cell.getPosition();
      let atom: THREE.Mesh;

      // left movement
      if (row - 1 >= 0) {
        updatedCells.push([row - 1, col]);

        atom = cell.popTopAtom();
        atomMovements.set(atom, [row - 1, col]);
        this.grid[row - 1][col].addAtomToCube(atom);

        timeline.fromTo(atom.position, { x: atom.position.x + 2 }, { x: 0 }, 0);
      }

      // right movement
      if (row + 1 < this.xCells) {
        updatedCells.push([row + 1, col]);

        atom = cell.popTopAtom();
        atomMovements.set(atom, [row + 1, col]);
        this.grid[row + 1][col].addAtomToCube(atom);

        timeline.fromTo(atom.position, { x: atom.position.x - 2 }, { x: 0 }, 0);
      }

      // top movement
      if (col - 1 >= 0) {
        updatedCells.push([row, col - 1]);

        let atom = cell.popTopAtom();
        atomMovements.set(atom, [row, col - 1]);
        this.grid[row][col - 1].addAtomToCube(atom);

        timeline.fromTo(atom.position, { y: atom.position.y - 2 }, { y: 0 }, 0);
      }

      // bottom movement
      if (col + 1 < this.yCells) {
        updatedCells.push([row, col + 1]);

        atom = cell.popTopAtom();
        atomMovements.set(atom, [row, col + 1]);
        this.grid[row][col + 1].addAtomToCube(atom);

        timeline.fromTo(atom.position, { y: atom.position.y + 2 }, { y: 0 }, 0);
      }
    }
  }

  changePlayer() {
    this.currentPlayer = (this.currentPlayer + 1) % this.playersCount;
    this.edgesMaterial.color.set(COLORS[this.currentPlayer]);
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

  _handleSplitCellsCallback(updatedCells: [number, number][], hooks = defaultHooks) {
    if (hooks.onStep) hooks.onStep();

    let nextSplitableCells: Cell[] = [];
    for (const [row, col] of updatedCells) {
      if (this.grid[row][col].shouldMoleculeInCellBeExploded()) {
        nextSplitableCells.push(this.grid[row][col]);
      }
    }

    if (nextSplitableCells.length > 0) {
      this._splitCells(nextSplitableCells, (updatedCells) => {
        this._handleSplitCellsCallback(updatedCells, hooks);
      });
    } else {
      if (hooks.onComplete) hooks.onComplete();
    }
  }

  startReaction(row: number, col: number, hooks: Hooks = defaultHooks) {
    if (hooks.onStart) hooks.onStart();

    this._splitCells([this.grid[row][col]], (updatedCells) => {
      this._handleSplitCellsCallback(updatedCells, hooks);
    });
  }
}

export { Board, Cell };
