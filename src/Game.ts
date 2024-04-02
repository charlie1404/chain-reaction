import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { Board } from './Board';
import { Player } from './Player';
import { COLORS, audd } from './constants';

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

    let xCells = 6;
    let yCells = 10;

    if (gridSize === 'l') {
      xCells = 10;
      yCells = 18;
    }

    this.width = window.innerWidth / xCells;
    this.height = window.innerHeight / yCells;

    if (this.width < this.height) {
      this.width = window.innerWidth;
      this.height = (window.innerWidth / xCells) * yCells;
    } else {
      this.width = (window.innerHeight / yCells) * xCells;
      this.height = window.innerHeight;
    }

    this._initThreeScene(gridSize);
    // this._addOrbitControls();
    this._addBoard(playersCount, xCells, yCells);
    this._addBoardMouseDownListener();
  }

  _initThreeScene(gridSize: GridSizes) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height);

    if (gridSize === 's') {
      this.camera.position.set(0, 0, 30);
    } else {
      this.camera.position.set(0, 0, 50);
    }

    this.light = new THREE.PointLight(0xffffff, 1, 100, 0);
    this.light.position.set(0, 0, 50);
    this.scene.add(this.light);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
  }

  _gameLoop() {
    requestAnimationFrame(this._gameLoop.bind(this));
    this.renderer.render(this.scene, this.camera);

    if (this.controls) this.controls.update();
  }

  _addOrbitControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  _addResizeListener() {
    window.addEventListener('resize', () => {});
  }

  _addBoard(playersCount: number, xCells: number, yCells: number) {
    let players = Array(playersCount)
      .fill(null)
      .map((_, i) => new Player('', i));

    this.board = new Board(this.scene, players, xCells, yCells);
  }

  _nextTurn() {
    this.board.setNextPlayer();
    this.locked = false;
  }

  _addBoardMouseDownListener() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.renderer.domElement.addEventListener('mousedown', this._onBoardMouseDownEventHandler.bind(this), false);
  }

  _onReactionStepStart() {
    audd.play();
  }

  _onReactionStepComplete() {
    let alivePlayers = this.board.getAlivePlayers();
    if (alivePlayers.size === 1) {
      // add logic to check if game should end
      gsap.globalTimeline.clear();
      alert('Game Over');
      throw new Error('Game Over'); // TODO: Fix later
    }
  }

  _onReactionComplete() {
    let alivePlayers = this.board.getAlivePlayers();
    if (alivePlayers.size === 1) {
      // end game
      return;
    }

    let players = this.board.getPlayers();
    if (alivePlayers.size !== players.length) {
      this.board.setPlayers(players.filter((p) => alivePlayers.has(p)));
    }

    this._nextTurn();
  }

  _onBoardMouseDownEventHandler(e: MouseEvent & { target: HTMLCanvasElement }) {
    if (this.locked || e.target !== this.renderer.domElement) {
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

    let { row, col } = intersect.object.userData;

    let isValid = this.board.validateMove(row, col);
    if (!isValid) return;

    this.locked = true;

    // TODO: Fix later, this ideally should return atom or atom count.
    let shouldSplit = this.board.addAtom(row, col);

    if (shouldSplit) {
      this.board.startReaction(row, col, {
        onStepStart: this._onReactionStepStart.bind(this),
        onStepComplete: this._onReactionStepComplete.bind(this),
        onComplete: this._onReactionComplete.bind(this),
      });
    } else {
      this._nextTurn();
    }
  }
  start() {
    this._gameLoop();
  }
}

export { Game, GridSizes };
