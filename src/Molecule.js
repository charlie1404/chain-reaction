import * as THREE from 'three';
import gsap from 'gsap';

let radiiGap = 0.65;

let sphereColorMaterialMap = new Map();

export function createMolecule({ color = 0x00ff00, atomCount = 1, atomSize = 1 } = {}) {
  let sphereGeometry = new THREE.SphereGeometry(atomSize, 20, 10);
  let sphereMaterial = getColorMaterial(color);

  let pivotAtom = new THREE.Mesh(sphereGeometry, sphereMaterial);
  let atom1;
  let atom2;

  if (atomCount >= 2) {
    atom1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
    atom1.position.y = -2 * atomSize * radiiGap;
    pivotAtom.add(atom1);
  }

  if (atomCount >= 3) {
    atom2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
    atom2.position.x = -atom1.position.y;
    atom1.add(atom2);
  }

  let delta1 = Math.random() * 0.02 + 0.02;
  let delta2 = Math.random() * 0.02 + 0.02;
  let delta3 = Math.random() * 0.02 + 0.02;

  if (Math.random() > 0.5) delta1 = -delta1;
  if (Math.random() > 0.5) delta2 = -delta2;
  if (Math.random() > 0.5) delta3 = -delta3;

  setInterval(() => {
    pivotAtom.rotateX(delta1);
    pivotAtom.rotateY(delta2);
    pivotAtom.rotateZ(-delta3);
  }, 16);

  return pivotAtom;
}

function getColorMaterial(color = 0x00ff00) {
  if (sphereColorMaterialMap.has(color)) {
    return sphereColorMaterialMap.get(color);
  }

  let sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x00ee00, flatShading: true });
  sphereColorMaterialMap.set(sphereMaterial);
  return sphereMaterial;
}

export function vibrate(obj) {
  let delta = 0.04;

  let tl = gsap
    .timeline({ defaults: { duration: 0.2 }, repeat: Infinity })
    .fromTo(
      obj.position,
      { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      { x: obj.position.x + delta, y: obj.position.y + delta, z: obj.position.z + delta },
    );
}
