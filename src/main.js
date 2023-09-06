import './index.css';

import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameState, GridElement } from './game';
import { createMolecule, vibrate } from './Molecule';

let controls;

/**@type {THREE.Scene} */
let scene;
/**@type {THREE.PerspectiveCamera} */
let camera;
/**@type {THREE.WebGLRenderer} */
let renderer;
/**@type {THREE.PointLight} */
let light;

let GRID_SIZE_X = 6;
let GRID_SIZE_Y = 10;
let GRID_SPACING = 2;
let Z_OFFSET = 0.75;
let GRID_SPACING_HALF = GRID_SPACING / 2;

let WIDTH = GRID_SIZE_X * 100;
let HEIGHT = GRID_SIZE_Y * 100;

let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();

GRID_SIZE_X = Math.floor(GRID_SIZE_X / 2) * 2;
GRID_SIZE_Y = Math.floor(GRID_SIZE_Y / 2) * 2;

let MaxX = GRID_SIZE_X * GRID_SPACING_HALF;
let MaxY = GRID_SIZE_Y * GRID_SPACING_HALF;
let MinX = -MaxX;
let MinY = -MaxY;

function initScene() {
  scene = new THREE.Scene();
  window.scene = scene;

  camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT);
  camera.position.set(0, 0, 30);

  light = new THREE.PointLight(0xffffff, 1, 100, 0);
  light.position.set(0, 0, 50);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableZoom = false;

  window.addEventListener('resize', () => {});
}

function initGrid() {
  let boxGeometry = new THREE.BoxGeometry(GRID_SPACING, GRID_SPACING, Z_OFFSET);
  let edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

  let boxMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
  let edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

  for (let i = 0; i < GRID_SIZE_X; i++) {
    for (let j = 0; j < GRID_SIZE_Y; j++) {
      let x = MinX + GRID_SPACING * i;
      let y = MaxY - GRID_SPACING * j;

      let cube = new THREE.Mesh(boxGeometry, boxMaterial);
      let line = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      cube.position.set(x + GRID_SPACING_HALF, y - GRID_SPACING_HALF, 0);
      line.position.set(x + GRID_SPACING_HALF, y - GRID_SPACING_HALF, 0);
      scene.add(cube);
      scene.add(line);

      cube.userData = { row: j, col: i };
    }
  }

  let molecule = createMolecule({
    atomCount: 3,
    atomSize: GRID_SPACING * 0.23,
  });
  // let molecule = new Molecule({  });
  vibrate(molecule);
  scene.children.filter((e) => 'row' in e.userData)[34].add(molecule);
}

function onMouseDown(e) {
  let rect = e.target.getBoundingClientRect();
  let left = e.clientX - rect.left;
  let top = e.clientY - rect.top;

  pointer.x = (left / WIDTH) * 2 - 1;
  pointer.y = -(top / HEIGHT) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  let [intersect, ...rest] = raycaster
    .intersectObjects(scene.children)
    .filter((e) => e.object.type === 'Mesh' && e.object.userData);

  if (!intersect || rest.length > 0) {
    return;
  }

  let testCount = (Math.ceil(Math.random() * 10) % 3) + 1;

  let balls = getRotatingSphere(testCount);
  if (Math.random() > 0.5) {
    addVibrationMotion(balls);
  }
  intersect.object.add(balls);
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  renderer.render(scene, camera);

  controls.update();
}

function main() {
  initScene();
  initGrid();
  // initSampleSphere();
  // initGameState();
  gameLoop();

  // renderer.domElement.addEventListener('mousedown', onMouseDown, false);

  // let x = new GameState();
  // let y = new GridElement();
}

main();
