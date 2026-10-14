import * as THREE from "three";

// Rotation (about Y) that makes an object's local +Z face the room's
// center when it stands at world position (x, z).
export function faceCenter(x, z) {
  return Math.atan2(-x, -z);
}

// Position + facing for something mounted on the wall at a given
// angle (degrees; -90 is the back wall) and radius.
export function onWall(angleDeg, radius) {
  const a = (angleDeg * Math.PI) / 180;
  const x = Math.cos(a) * radius;
  const z = Math.sin(a) * radius;
  return { position: [x, 0, z], rotationY: faceCenter(x, z) };
}

// Position, rotation and length for a cylinder that joins two exact
// points. The cylinder's +Y (top) end lands on `to`.
export function strutBetween(from, to) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(end, start);
  return {
    position: new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5),
    quaternion: new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    ),
    length: dir.length(),
  };
}