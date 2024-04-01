import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Board, Cell } from './Board';
import { COLORS } from './constants';

type GridSizes = 's' | 'l';

class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private light: THREE.PointLight;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;

  private controls: OrbitControls;

  private width: number;
  private height: number;
  private locked = false;

  private board: Board;

  constructor(playersCount = 2, gridSize: GridSizes = 's') {
    if (playersCount < 2 || playersCount > COLORS.length) {
      throw new Error('Players count should be between 2 and 8');
    }

    if (gridSize !== 's' && gridSize !== 'l') {
      throw new Error('Invalid grid size');
    }

    let w = Math.floor(window.innerWidth / 90) * 90;
    let h = Math.floor(window.innerHeight / 90) * 90;

    let xCells = 6;
    let yCells = 10;

    if (gridSize === 'l') {
      xCells = 10;
      yCells = 18;
    }

    let sideLength = Math.min(w / xCells, h / yCells);
    this.width = sideLength * xCells;
    this.height = sideLength * yCells;

    this._initThreeScene();
    // this._addOrbitControls();
    this._addBoard(playersCount, xCells, yCells);
    this._addBoardMouseDownListener();
  }

  _initThreeScene() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height);
    this.camera.position.set(0, 0, 30);

    this.light = new THREE.PointLight(0xffffff, 1, 100, 0);
    this.light.position.set(0, 0, 50);
    this.scene.add(this.light);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
  }

  _addOrbitControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  _addResizeListener() {
    window.addEventListener('resize', () => {});
  }

  _addBoard(playersCount: number, xCells: number, yCells: number) {
    this.board = new Board(this.scene, playersCount, xCells, yCells);
  }

  _addBoardMouseDownListener() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.renderer.domElement.addEventListener('mousedown', this._onBoardMouseDownEventHandler.bind(this), false);
  }

  _onBoardMouseDownEventHandler(e: MouseEvent & { target: HTMLCanvasElement }) {
    if (e.target !== this.renderer.domElement) {
      return;
    }

    if (this.locked) {
      return;
    }

    let rect = e.target.getBoundingClientRect();
    let left = e.clientX - rect.left;
    let top = e.clientY - rect.top;

    this.pointer.x = (left / this.width) * 2 - 1;
    this.pointer.y = -(top / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    let [intersect, ...rest] = this.raycaster
      .intersectObjects(this.scene.children)
      .filter((e) => e.object.type === 'Mesh' && e.object.userData?.type === 'cube');

    if (!intersect || rest.length > 0) {
      return;
    }

    let row = intersect.object.userData.row;
    let col = intersect.object.userData.col;

    let isValid = this.board.validateMove(row, col);
    if (!isValid) return;

    this.locked = true;

    // TODO: Fix later, this ideally should return atom or atom count.
    let shouldSplit = this.board.addAtom(row, col);

    if (shouldSplit) {
      this.board.startReaction(row, col, {
        onComplete: this.nextTurn.bind(this),
      });
    } else {
      this.nextTurn();
    }
  }

  nextTurn() {
    this.board.changePlayer();
    this.locked = false;
  }

  _gameLoop() {
    requestAnimationFrame(this._gameLoop.bind(this));
    this.renderer.render(this.scene, this.camera);

    if (this.controls) this.controls.update();
  }

  start() {
    this._gameLoop();
  }
}

export { Game, GridSizes };
