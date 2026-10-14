const WOOD = "#4a3220";
const FRONT = "#5a3d26";
const BRASS = "#b08a45";
const IVORY = "#e6dcc0";
const ROW_Y = [0.15, 0.37, 0.59, 0.81];
const COL_X = [-0.4, 0.4];
const DRAWERS = COL_X.flatMap((x) => ROW_Y.map((y) => ({ x, y })));

export default function MapCabinet() {
  return (
    <group>
      {/* Feet */}
      {[
        [-0.7, -0.32],
        [0.7, -0.32],
        [-0.7, 0.32],
        [0.7, 0.32],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.02, z]}>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
      ))}

      {/* Carcass and top */}
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.88, 0.8]} />
        <meshStandardMaterial color={WOOD} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.945, 0]} castShadow>
        <boxGeometry args={[1.68, 0.05, 0.86]} />
        <meshStandardMaterial color={FRONT} roughness={0.5} />
      </mesh>

      {/* Eight shallow drawers, each with a label card and a brass pull */}
      {DRAWERS.map(({ x, y }) => (
        <group key={`${x}-${y}`} position={[x, y, 0.41]}>
          <mesh>
            <boxGeometry args={[0.76, 0.2, 0.02]} />
            <meshStandardMaterial color={FRONT} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.045, 0.012]}>
            <boxGeometry args={[0.14, 0.05, 0.006]} />
            <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.045, 0.016]}>
            <boxGeometry args={[0.1, 0.03, 0.003]} />
            <meshStandardMaterial color={IVORY} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.04, 0.03]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.007, 0.007, 0.12, 8]} />
            <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
          </mesh>
          {[-0.05, 0.05].map((dx) => (
            <mesh key={dx} position={[dx, -0.04, 0.018]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.024, 6]} />
              <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Two rolled charts on top */}
      <mesh position={[-0.35, 1.005, 0.1]} rotation={[0, 0.35, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.55, 14]} />
        <meshStandardMaterial color="#d6c6a0" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 1.005, -0.12]} rotation={[0, -0.2, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.45, 14]} />
        <meshStandardMaterial color="#cdbd96" roughness={0.9} />
      </mesh>
    </group>
  );
}