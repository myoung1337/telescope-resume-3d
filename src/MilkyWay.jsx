import { useMemo } from "react";
import * as THREE from "three";
import { milkyWayTexture, milkyWayStars } from "./galaxyTexture";

const STAR_RADIUS = 90;
const MIST_RADIUS = 100;

export default function MilkyWay() {
  const map = useMemo(() => milkyWayTexture(), []);
  const stars = useMemo(() => milkyWayStars(STAR_RADIUS), []);

  // renderOrder keeps both drawn first, behind everything else. The
  // raycast overrides make sure they never catch the pointer. fog={false}
  // is required: the scene fog ends at 50 units, which would otherwise
  // turn this black.
  return (
    <group>
      <mesh renderOrder={-10} raycast={() => null}>
        <sphereGeometry args={[MIST_RADIUS, 64, 32]} />
        <meshBasicMaterial
          map={map}
          side={THREE.BackSide}
          fog={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <points renderOrder={-9} raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={stars.count} array={stars.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={stars.count} array={stars.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.25}
          vertexColors
          sizeAttenuation
          fog={false}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
    </group>
  );
}