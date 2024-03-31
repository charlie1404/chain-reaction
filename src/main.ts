import './index.css';

import * as THREE from 'three';

import { Game } from './Game';

function main() {
  let game = new Game(1);

  game.start();
}

main();

// let molecule = createMolecule({
//   atomCount: 3,
//   atomSize: GRID_SPACING * 0.23,
// });
// // let molecule = new Molecule({  });
// vibrate(molecule);
// scene.children.filter((e) => 'row' in e.userData)[34].add(molecule);

// let testCount = (Math.ceil(Math.random() * 10) % 3) + 1;

// let balls = getRotatingSphere(testCount);
// if (Math.random() > 0.5) {
//   addVibrationMotion(balls);
// }
// intersect.object.add(balls);

// let x = new GameState();
// let y = new GridElement();
