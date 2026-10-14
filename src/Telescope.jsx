import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TELESCOPE_POSITION, PIVOT_LOCAL, aimQuaternion } from "./telescopeLayout";

// Inside the aimed group everything is built in one frame:
//   +Z = the direction the tube points, +Y = up, +X = the declination axis.
// Cylinders stand along Y by default, so anything meant to lie along Z
// or X gets one of these rotations.
const ALONG_Z = [Math.PI / 2, 0, 0];
const ALONG_X = [0, 0, Math.PI / 2];
const PIER_TOP = [0, 1.3, 0];

function strutBetween(from, to) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  return { position: midpoint, quaternion, length };
}

export default function Telescope({ onClick }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const tubeColor = hovered ? "#eef2fa" : "#cbd3dc";

  const polarStrut = useMemo(() => strutBetween(PIER_TOP, PIVOT_LOCAL), []);
  const aim = useMemo(() => aimQuaternion(), []);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = hovered ? 1.04 : 1;
    groupRef.current.scale.lerp({ x: t, y: t, z: t }, 0.1);
  });

  return (
    <group
      ref={groupRef}
      position={TELESCOPE_POSITION}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        // stopPropagation keeps this click from also reaching the
        // slit behind the tube
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Pier (the plinth under it is built in the dome file) */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.36, 1.3, 20]} />
        <meshStandardMaterial color="#2c2f38" metalness={0.4} roughness={0.55} />
      </mesh>
      <mesh position={PIER_TOP}>
        <sphereGeometry args={[0.17, 20, 20]} />
        <meshStandardMaterial color="#20232e" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Diagonal polar axis */}
      <group position={polarStrut.position} quaternion={polarStrut.quaternion}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.13, polarStrut.length, 16]} />
          <meshStandardMaterial color="#20232e" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* Pivot housing */}
      <mesh position={PIVOT_LOCAL}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color="#1c1e24" metalness={0.55} roughness={0.35} />
      </mesh>

      {/* One rigid assembly, aimed at the slit */}
      <group position={PIVOT_LOCAL} quaternion={aim}>
        {/* Declination axis along X, counterweights at the -X end */}
        <mesh position={[-0.4, 0, 0]} rotation={ALONG_X}>
          <cylinderGeometry args={[0.05, 0.05, 1.3, 14]} />
          <meshStandardMaterial color="#1c1e24" metalness={0.55} roughness={0.35} />
        </mesh>
        {[-0.85, -1.03].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={ALONG_X} castShadow>
            <cylinderGeometry args={[0.17, 0.17, 0.14, 24]} />
            <meshStandardMaterial color="#2c2f38" metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[0.28, 0, 0]} rotation={ALONG_X}>
          <cylinderGeometry args={[0.075, 0.075, 0.1, 16]} />
          <meshStandardMaterial color="#2c2f38" metalness={0.6} roughness={0.35} />
        </mesh>

        {/* Saddle plate joining the housing to the tube */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.2, 0.12, 0.7]} />
          <meshStandardMaterial color="#20232e" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Tube assembly, lifted above the axis */}
        <group position={[0, 0.32, 0]}>
          {/* Main tube, wider at the objective (front) end */}
          <mesh position={[0, 0, 0.8]} rotation={ALONG_Z} castShadow>
            <cylinderGeometry args={[0.15, 0.13, 3.4, 28]} />
            <meshPhysicalMaterial
              color={tubeColor}
              metalness={0.65}
              roughness={0.25}
              clearcoat={1}
              clearcoatRoughness={0.15}
              emissive={hovered ? "#3a5aa8" : "#000000"}
              emissiveIntensity={hovered ? 0.25 : 0}
            />
          </mesh>

          {/* Dew shield + objective lens */}
          <mesh position={[0, 0, 2.5]} rotation={ALONG_Z}>
            <cylinderGeometry args={[0.18, 0.18, 0.45, 28, 1, true]} />
            <meshStandardMaterial color="#2c2f38" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 2.45]}>
            <circleGeometry args={[0.145, 28]} />
            <meshPhysicalMaterial color="#1a2440" roughness={0.05} clearcoat={1} />
          </mesh>

          {/* Cradle rings (a torus's default axis is Z, so no rotation) */}
          {[-0.3, 0.35, 1.7].map((z, i) => (
            <mesh key={i} position={[0, 0, z]}>
              <torusGeometry args={[0.157, 0.02, 10, 28]} />
              <meshStandardMaterial color="#1c1e24" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}

          {/* Finder scope riding on top */}
          <mesh position={[0, 0.26, 0.4]} rotation={ALONG_Z}>
            <cylinderGeometry args={[0.03, 0.03, 0.7, 12]} />
            <meshStandardMaterial color="#1c1e24" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.26, 0.76]}>
            <circleGeometry args={[0.025, 12]} />
            <meshPhysicalMaterial color="#1a2440" roughness={0.1} clearcoat={1} />
          </mesh>
          {[0.1, 0.7].map((z, i) => (
            <mesh key={i} position={[0, 0.2, z]}>
              <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
              <meshStandardMaterial color="#1c1e24" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}

          {/* Rear: cell, focuser, diagonal, eyepiece pointing up toward
              the observer. Its top, at local (0, 0.56, -1.27) in the
              aimed frame, is EYEPIECE_LOCAL in telescopeLayout.js. */}
          <mesh position={[0, 0, -0.98]} rotation={ALONG_Z}>
            <cylinderGeometry args={[0.09, 0.11, 0.16, 20]} />
            <meshStandardMaterial color="#111318" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, -1.14]} rotation={ALONG_Z}>
            <cylinderGeometry args={[0.055, 0.055, 0.2, 16]} />
            <meshStandardMaterial color="#1c1e24" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, -1.27]}>
            <boxGeometry args={[0.09, 0.09, 0.09]} />
            <meshStandardMaterial color="#111318" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.13, -1.27]}>
            <cylinderGeometry args={[0.03, 0.03, 0.22, 14]} />
            <meshStandardMaterial color="#0a0f18" roughness={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
}