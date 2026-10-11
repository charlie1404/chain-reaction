import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { Board } from './Board';
import { Player } from './Player';
import { COLORS, audd } from './constants';

type GridSizes = 's' | 'l';

interface PlayerInfoOption {
  id: string;
  colorIndex?: number;
}

interface GameOptions {
  playersInfo?: PlayerInfoOption[];
  onTurnChange?: (playerIndex: number) => void;
  onGameOver?: (winnerIndex: number) => void;
  isPlayerConnected?: (playerIndex: number) => boolean;
  isMyTurn?: () => boolean;
  onNotMyTurn?: () => void;
}

class Game {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private light!: THREE.PointLight;
  private raycaster!: THREE.Raycaster;
  private pointer!: THREE.Vector2;

  private board!: Board;
  private controls!: OrbitControls;

  private width: number;
  private height: number;
  private locked = false;
  private animId: number | null = null;
  private mouseHandler: ((e: MouseEvent) => void) | null = null;
  private options?: GameOptions;

  constructor(playersCount = 2, gridSize: GridSizes = 's', canvas: HTMLCanvasElement | null, options?: GameOptions) {
    if (playersCount < 2 || playersCount > COLORS.length) {
      throw new Error('Players count should be between 2 and 8');
    }

    if (gridSize !== 's' && gridSize !== 'l') {
      throw new Error('Invalid grid size');
    }

    this.options = options;

    let xCells = 6;
    let yCells = 10;

    if (gridSize === 'l') {
      xCells = 10;
      yCells = 18;
    }

    // Account for header and side HUD
    const availWidth = Math.min(window.innerWidth, 1200);
    const availHeight = window.innerHeight - 110;

    this.width = availWidth / xCells;
    this.height = availHeight / yCells;

    if (this.width < this.height) {
      this.width = availWidth;
      this.height = (availWidth / xCells) * yCells;
    } else {
      this.width = (availHeight / yCells) * xCells;
      this.height = availHeight;
    }

    this._initThreeScene(gridSize, canvas);
    this._addBoard(playersCount, xCells, yCells);
    this._addBoardMouseDownListener();
  }

  _initThreeScene(gridSize: GridSizes, canvas: HTMLCanvasElement | null) {
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

    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas || undefined });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  _gameLoop() {
    this.animId = requestAnimationFrame(this._gameLoop.bind(this));
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
      .map((_, i) => {
        const info = this.options?.playersInfo?.[i];
        return new Player(info?.id || '', i, info?.colorIndex);
      });

    this.board = new Board(this.scene, players, xCells, yCells);
  }

  _nextTurn() {
    this.board.setNextPlayer();

    // Rule 3: If next player is disconnected prior to turn, skip their turn to next connected player
    if (this.options?.isPlayerConnected) {
      let attempts = 0;
      let current = this.board.getCurrentPlayer();
      let playerIdx = current ? current.getIndex() : -1;

      while (
        attempts < this.board.getPlayers().length &&
        playerIdx !== -1 &&
        !this.options.isPlayerConnected(playerIdx)
      ) {
        this.board.setNextPlayer();
        current = this.board.getCurrentPlayer();
        playerIdx = current ? current.getIndex() : -1;
        attempts++;
      }
    }

    this.locked = false;

    if (this.options?.onTurnChange) {
      const current = this.board.getCurrentPlayer();
      if (current) {
        this.options.onTurnChange(current.getIndex());
      }
    }
  }

  skipTurn() {
    if (!this.locked) {
      this._nextTurn();
    }
  }

  _addBoardMouseDownListener() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.mouseHandler = this._onBoardMouseDownEventHandler.bind(this);
    this.renderer.domElement.addEventListener('mousedown', this.mouseHandler, false);
  }

  _onReactionStepStart() {
    audd.play().catch(() => {});
  }

  _onReactionStepComplete() {
    let alivePlayers = this.board.getAlivePlayers();
    if (alivePlayers.size === 1) {
      gsap.globalTimeline.clear();
      if (this.options?.onGameOver) {
        const winner = Array.from(alivePlayers)[0];
        const winnerIdx = winner ? winner.getIndex() : 0;
        this.options.onGameOver(winnerIdx);
      }
    }
  }

  _onReactionComplete() {
    let alivePlayers = this.board.getAlivePlayers();
    if (alivePlayers.size === 1) {
      return;
    }

    let players = this.board.getPlayers();
    if (alivePlayers.size !== players.length) {
      this.board.setPlayers(players.filter((p) => alivePlayers.has(p)));
    }

    this._nextTurn();
  }

  _onBoardMouseDownEventHandler(e: MouseEvent) {
    if (this.locked || e.target !== this.renderer.domElement) {
      return;
    }

    let rect = this.renderer.domElement.getBoundingClientRect();
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

    if (this.options?.isMyTurn && !this.options.isMyTurn()) {
      if (this.options?.onNotMyTurn) {
        this.options.onNotMyTurn();
      }
      return;
    }

    let { row, col } = intersect.object.userData;

    let isValid = this.board.validateMove(row, col);
    if (!isValid) return;

    this.locked = true;

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
    if (this.options?.isPlayerConnected) {
      let attempts = 0;
      let current = this.board.getCurrentPlayer();
      let playerIdx = current ? current.getIndex() : -1;

      while (
        attempts < this.board.getPlayers().length &&
        playerIdx !== -1 &&
        !this.options.isPlayerConnected(playerIdx)
      ) {
        this.board.setNextPlayer();
        current = this.board.getCurrentPlayer();
        playerIdx = current ? current.getIndex() : -1;
        attempts++;
      }

      if (this.options?.onTurnChange && current && attempts > 0) {
        this.options.onTurnChange(current.getIndex());
      }
    }

    this._gameLoop();
  }

  destroy() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.mouseHandler && this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('mousedown', this.mouseHandler);
      this.mouseHandler = null;
    }
    try {
      this.renderer?.dispose();
    } catch {
      /* ignore */
    }
  }
}

export { Game };
export type { GridSizes, GameOptions, PlayerInfoOption };
