import * as THREE from 'three';
import gsap from 'gsap';

import { Player } from './Player';
import { Cell } from './Cell';

let BOX_SIDE = 2;
let BOX_DEPTH = 0.75;

type Hooks = {
  onStepStart?: () => void;
  onStepComplete?: () => void;
  onComplete?: () => void;
};

let defaultHooks: Hooks = {
  onStepStart: () => {},
  onStepComplete: () => {},
  onComplete: () => {},
};

class Board {
  private players: Player[];
  private currentPlayer: Player;

  private scene: THREE.Scene;

  private xCells: number;
  private yCells: number;

  private edgesMaterial: THREE.LineBasicMaterial;
  private boxMaterial: THREE.MeshStandardMaterial;

  private grid: Cell[][];

  constructor(scene: THREE.Scene, players: Player[], xCells: number, yCells: number) {
    this.players = players;
    this.currentPlayer = players[0];

    this.scene = scene;
    this.xCells = xCells;
    this.yCells = yCells;

    this.boxMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    this.edgesMaterial = new THREE.LineBasicMaterial({ color: this.currentPlayer.getColor() });

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

  _handleSplitCellsCallback(updatedCells: [number, number][], hooks = defaultHooks) {
    if (hooks.onStepComplete) hooks.onStepComplete();

    let nextSplitableCells: Cell[] = [];
    for (const [row, col] of updatedCells) {
      if (this.grid[row][col].shouldMoleculeInCellBeExploded()) {
        nextSplitableCells.push(this.grid[row][col]);
      }
    }

    if (nextSplitableCells.length > 0) {
      this._splitCells(nextSplitableCells, hooks, (updatedCells) => {
        this._handleSplitCellsCallback(updatedCells, hooks);
      });
    } else {
      if (hooks.onComplete) hooks.onComplete();
    }
  }

  // pass to _splitCells after validation that cell needs spliting
  _splitCells(cells: Cell[], hooks = defaultHooks, cb?: (arg0: [number, number][]) => void) {
    if (hooks.onStepStart) hooks.onStepStart();

    let updatedCells: [number, number][] = [];
    let atomMovements = new Map();

    let timeline = gsap.timeline({
      defaults: { duration: 0.3 },
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

  getPlayers() {
    return this.players;
  }

  setPlayers(players: Player[]) {
    this.players = players;
  }

  changePlayer() {
    let idx = this.players.findIndex((player) => player === this.currentPlayer);
    this.currentPlayer = this.players[(idx + 1) % this.players.length];
    this.edgesMaterial.color.set(this.currentPlayer.getColor());
  }

  getAlivePlayers() {
    let players: Set<Player> = new Set();
    for (let i = 0; i < this.xCells; i++) {
      for (let j = 0; j < this.yCells; j++) {
        let player = this.grid[i][j].getPlayer();
        if (player) {
          players.add(player);
        }
      }
    }

    return players;
  }

  validateMove(row: number, col: number) {
    let cellPlayer = this.grid[row][col].getPlayer();

    return cellPlayer === null || cellPlayer === this.currentPlayer;
  }

  addAtom(row: number, col: number) {
    let cell = this.grid[row][col];

    cell.addAtom(this.currentPlayer);

    return cell.shouldMoleculeInCellBeExploded();
  }

  startReaction(row: number, col: number, hooks: Hooks = defaultHooks) {
    this._splitCells([this.grid[row][col]], hooks, (updatedCells) => {
      this._handleSplitCellsCallback(updatedCells, hooks);
    });
  }
}

export { Board };
