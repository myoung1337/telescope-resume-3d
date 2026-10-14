import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Strut from "./Strut";
import { makeGlobeTexture } from "./textures";

const WOOD = "#3a2616";
const BRASS = "#b08a45";
const CENTER_Y = 1.2;
const GLOBE_R = 0.27;
const RING_R = 0.33;
const TILT = 0.41; // about 23.5 degrees

const HUB = [0, 0.62, 0];
const FEET = [90, 210, 330].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return [Math.cos(a) * 0.32, 0.02, Math.sin(a) * 0.32];
});
const COLUMN_HEIGHT = CENTER_Y - RING_R - HUB[1];

export default function CelestialGlobe() {
  const sphere = useRef();
  const map = useMemo(() => makeGlobeTexture(), []);

  useFrame((_, delta) => {
    if (sphere.current) sphere.current.rotation.y += delta * 0.08; // slow, steady turn
  });

  return (
    <group>
      {/* Three splayed legs meeting at a hub */}
      {FEET.map((foot, i) => (
        <Strut key={i} from={foot} to={HUB} radiusTop={0.012} radiusBottom={0.02} color={WOOD} />
      ))}
      <mesh position={HUB}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
      </mesh>

      {/* Column up to the bottom of the meridian ring */}
      <mesh position={[0, HUB[1] + COLUMN_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.016, 0.016, COLUMN_HEIGHT, 10]} />
        <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, CENTER_Y - RING_R, 0]}>
        <sphereGeometry args={[0.026, 10, 10]} />
        <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
      </mesh>

      {/* Meridian ring (a torus's default plane faces the front) */}
      <mesh position={[0, CENTER_Y, 0]}>
        <torusGeometry args={[RING_R, 0.012, 10, 64]} />
        <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Tilted axis: its rod ends land on the ring, since RING_R is the
          rod's half-length */}
      <group position={[0, CENTER_Y, 0]} rotation={[0, 0, TILT]}>
        <mesh>
          <cylinderGeometry args={[0.007, 0.007, RING_R * 2, 8]} />
          <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
        </mesh>
        {[-RING_R, RING_R].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
          </mesh>
        ))}
        <mesh ref={sphere} castShadow>
          <sphereGeometry args={[GLOBE_R, 48, 32]} />
          <meshStandardMaterial
            map={map}
            emissiveMap={map}
            emissive="#ffffff"
            emissiveIntensity={0.35}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}