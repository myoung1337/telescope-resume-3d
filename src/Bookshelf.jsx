import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

export default function Bookshelf({ position, onClick }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const bookColors = ["#6b2b2b", "#233a5c", "#2f4a35", "#5c4a23", "#4a2f5c"];

  useFrame(() => {
    if (!groupRef.current) return;
    const t = hovered ? 1.04 : 1;
    groupRef.current.scale.lerp({ x: t, y: t, z: t }, 0.1);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.2, 0.4]} />
        <meshStandardMaterial
          color="#3a2a1c"
          roughness={0.8}
          emissive={hovered ? "#2a3a5c" : "#000000"}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>
      {[0.6, 0.1, -0.4].map((y, ri) => (
        <group key={ri} position={[0, y, 0.22]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} position={[-0.55 + i * 0.14, 0, 0]} castShadow>
              <boxGeometry args={[0.1, 0.4, 0.15]} />
              <meshStandardMaterial color={bookColors[i % bookColors.length]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}