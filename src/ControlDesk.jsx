import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Strut from "./Strut";

const WOOD = "#4a3320";
const DARK_WOOD = "#2f2014";
const BRASS = "#b08a45";
const IVORY = "#e6dcc0";

const DIAL_X = [-0.55, -0.275, 0, 0.275, 0.55];
const LAMP_X = [-0.5, -0.3, -0.1, 0.1, 0.3, 0.5];
const LAMP_ON = [true, true, false, true, false, true];

export default function ControlDesk() {
  const needles = useRef([]);

  useFrame(({ clock }) => {
    // Slow, small drifts so the gauges feel connected to something.
    needles.current.forEach((n, i) => {
      if (n) n.rotation.z = -0.5 + i * 0.25 + 0.22 * Math.sin(clock.elapsedTime * 0.35 + i * 1.7);
    });
  });

  return (
    <group>
      {/* Top */}
      <mesh position={[0, 0.825, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.84, 0.05, 0.8]} />
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </mesh>

      {/* Two pedestals with three drawers each */}
      {[-0.68, 0.68].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.42, 0.8, 0.7]} />
            <meshStandardMaterial color={DARK_WOOD} roughness={0.7} />
          </mesh>
          {[0.14, 0.4, 0.66].map((y) => (
            <group key={y}>
              <mesh position={[0, y, 0.355]}>
                <boxGeometry args={[0.37, 0.21, 0.02]} />
                <meshStandardMaterial color={WOOD} roughness={0.6} />
              </mesh>
              <mesh position={[0, y + 0.03, 0.375]}>
                <boxGeometry args={[0.1, 0.014, 0.014]} />
                <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.4, -0.33]}>
        <boxGeometry args={[0.9, 0.74, 0.02]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.8} />
      </mesh>

      {/* Instrument panel, leaning back from the rear edge of the desk */}
      <group position={[0, 0.85, -0.3]} rotation={[-0.28, 0, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[1.5, 0.4, 0.04]} />
          <meshStandardMaterial color="#1b1712" roughness={0.6} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.36, 0.021]}>
          <boxGeometry args={[0.4, 0.035, 0.004]} />
          <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
        </mesh>

        {DIAL_X.map((x, i) => (
          <group key={x} position={[x, 0.24, 0.021]}>
            <mesh position={[0, 0, 0.0005]}>
              <circleGeometry args={[0.058, 28]} />
              <meshStandardMaterial color={IVORY} emissive={IVORY} emissiveIntensity={0.15} roughness={0.8} />
            </mesh>
            <mesh>
              <torusGeometry args={[0.062, 0.007, 8, 28]} />
              <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.3} />
            </mesh>
            <group
              ref={(el) => {
                needles.current[i] = el;
              }}
              position={[0, 0, 0.004]}
            >
              <mesh position={[0, 0.026, 0]}>
                <boxGeometry args={[0.005, 0.052, 0.002]} />
                <meshStandardMaterial color="#1a120a" />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.007, 8, 8]} />
                <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.3} />
              </mesh>
            </group>
          </group>
        ))}

        {LAMP_X.map((x, i) => (
          <mesh key={x} position={[x, 0.09, 0.026]}>
            <sphereGeometry args={[0.014, 12, 12]} />
            {LAMP_ON[i] ? (
              <meshStandardMaterial color="#ff5a44" emissive="#ff2a18" emissiveIntensity={2.4} />
            ) : (
              <meshStandardMaterial color="#3a0d08" roughness={0.5} />
            )}
          </mesh>
        ))}
      </group>

      {/* Red desk lamp */}
      <mesh position={[-0.62, 0.8625, 0.05]}>
        <cylinderGeometry args={[0.07, 0.08, 0.025, 24]} />
        <meshStandardMaterial color="#2c2f38" metalness={0.4} roughness={0.5} />
      </mesh>
      <Strut from={[-0.62, 0.87, 0.05]} to={[-0.62, 1.2, 0.05]} radiusTop={0.007} radiusBottom={0.009} color={BRASS} metalness={0.5} roughness={0.35} />
      <Strut from={[-0.62, 1.2, 0.05]} to={[-0.5, 1.16, 0.21]} radiusTop={0.007} color={BRASS} metalness={0.5} roughness={0.35} />
      <mesh position={[-0.5, 1.12, 0.21]}>
        <cylinderGeometry args={[0.03, 0.095, 0.1, 24, 1, true]} />
        <meshStandardMaterial color="#2c2f38" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.5, 1.085, 0.21]}>
        <sphereGeometry args={[0.032, 14, 14]} />
        <meshStandardMaterial color="#ff5a44" emissive="#ff2a18" emissiveIntensity={2.4} />
      </mesh>
      <pointLight position={[-0.5, 1.03, 0.21]} intensity={3.5} color="#ff3a26" distance={5} decay={2} />

      {/* Logbook, loose sheet, pencil */}
      <group position={[0.2, 0.851, 0.15]} rotation={[0, 0.25, 0]}>
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[0.4, 0.01, 0.28]} />
          <meshStandardMaterial color="#2a1a14" roughness={0.8} />
        </mesh>
        <mesh position={[-0.094, 0.0145, 0]} rotation={[0, 0, 0.03]}>
          <boxGeometry args={[0.18, 0.012, 0.25]} />
          <meshStandardMaterial color={IVORY} roughness={0.9} />
        </mesh>
        <mesh position={[0.094, 0.0145, 0]} rotation={[0, 0, -0.03]}>
          <boxGeometry args={[0.18, 0.012, 0.25]} />
          <meshStandardMaterial color={IVORY} roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[0.62, 0.8525, 0.1]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.3, 0.003, 0.22]} />
        <meshStandardMaterial color={IVORY} roughness={0.9} />
      </mesh>
      <mesh position={[0.45, 0.86, 0.3]} rotation={[0, 0.5, Math.PI / 2]}>
        <cylinderGeometry args={[0.004, 0.004, 0.14, 8]} />
        <meshStandardMaterial color="#b8862b" roughness={0.6} />
      </mesh>
    </group>
  );
}