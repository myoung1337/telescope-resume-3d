import { useMemo } from "react";
import { makeStarChartTexture } from "./textures";

const PX_PER_UNIT = 600;

// A framed chart. Its origin is the chart's center, and it faces +Z,
// with the frame's back at z = 0 so it sits flush on a wall.
export default function StarChart({ width, height, seed, title = "", round = false }) {
  const map = useMemo(
    () =>
      makeStarChartTexture({
        seed,
        round,
        title,
        width: Math.round(width * PX_PER_UNIT),
        height: Math.round(height * PX_PER_UNIT),
      }),
    [seed, round, title, width, height]
  );

  const paper = (
    <meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.22} roughness={0.9} />
  );

  if (round) {
    const r = width / 2;
    return (
      <group>
        <mesh position={[0, 0, 0.012]}>
          <circleGeometry args={[r + 0.04, 48]} />
          <meshStandardMaterial color="#1c120a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <circleGeometry args={[r, 64]} />
          {paper}
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <torusGeometry args={[r + 0.03, 0.03, 10, 64]} />
          <meshStandardMaterial color="#3a2616" roughness={0.6} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[width + 0.12, height + 0.12, 0.05]} />
        <meshStandardMaterial color="#2a1a0e" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[width, height]} />
        {paper}
      </mesh>
    </group>
  );
}