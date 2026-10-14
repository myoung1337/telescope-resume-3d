import { strutBetween } from "./roomMath";

// A cylinder joining two exact points. radiusTop is the end at `to`.
export default function Strut({
  from,
  to,
  radiusTop = 0.02,
  radiusBottom = radiusTop,
  color = "#3a2616",
  metalness = 0.2,
  roughness = 0.7,
}) {
  const { position, quaternion, length } = strutBetween(from, to);
  return (
    <group position={position} quaternion={quaternion}>
      <mesh castShadow>
        <cylinderGeometry args={[radiusTop, radiusBottom, length, 12]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </group>
  );
}