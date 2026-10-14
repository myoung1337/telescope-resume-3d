import * as THREE from "three";

// Single source of truth for where the telescope sits and where it
// points. Telescope.jsx, the camera waypoints and the dome all read
// from here, so they can't drift out of sync again.

export const TELESCOPE_POSITION = [0, 0, 0]; // pier at the dome's center
export const PIVOT_LOCAL = [0, 2.15, 0.55]; // declination pivot, relative to the pier

// Must match ObservatoryDome.jsx: hemisphere, radius 7, on a 3.4-high wall.
const DOME_RADIUS = 7;
const DOME_BASE_Y = 3.4;

// The telescope aims at the middle of the slit, halfway up the dome.
const AIM_ANGLE = Math.PI / 4;
export const SKY_TARGET = [
  0,
  DOME_BASE_Y + DOME_RADIUS * Math.cos(AIM_ANGLE),
  -DOME_RADIUS * Math.sin(AIM_ANGLE),
];

export function pivotWorld() {
  return new THREE.Vector3(
    TELESCOPE_POSITION[0] + PIVOT_LOCAL[0],
    TELESCOPE_POSITION[1] + PIVOT_LOCAL[1],
    TELESCOPE_POSITION[2] + PIVOT_LOCAL[2]
  );
}

// Rotation that points the assembly's local +Z at the sky target while
// keeping local +Y roughly world-up.
export function aimQuaternion() {
  const eye = new THREE.Vector3(...SKY_TARGET);
  const m = new THREE.Matrix4().lookAt(eye, pivotWorld(), new THREE.Vector3(0, 1, 0));
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

// Top of the eyepiece, in the aimed assembly's local frame.
export const EYEPIECE_LOCAL = [0, 0.56, -1.27];

export function eyepieceWorld() {
  return new THREE.Vector3(...EYEPIECE_LOCAL)
    .applyQuaternion(aimQuaternion())
    .add(pivotWorld());
}