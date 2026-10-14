import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { sphericalToVec3 } from "./skyData3D";

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function ConstellationNode3D({ data, focused }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const lit = focused || hovered;
  const center = useMemo(() => sphericalToVec3(data.yaw, data.pitch, data.distance), [data]);

  const nodes = useMemo(() => {
    const rand = seeded(data.label.length * 97 + 7);
    const count = data.entries.length + 2;
    return Array.from({ length: count }).map(() => [
      (rand() - 0.5) * 2.2,
      (rand() - 0.5) * 1.8,
      (rand() - 0.5) * 0.6,
    ]);
  }, [data]);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = lit ? 1.15 : 1;
    groupRef.current.scale.lerp({ x: t, y: t, z: t }, 0.12);
  });

  return (
    <group ref={groupRef} position={center}>
      {/* invisible-but-raycastable hit area for the whole constellation */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("cosmicClick", { detail: { title: data.label, body: data.summary } })
          )
        }
      >
        <sphereGeometry args={[1.6, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {nodes.slice(1).map((n, i) => (
        <Line
          key={i}
          points={[nodes[i], n]}
          color={lit ? "#ffffff" : "#8a94a6"}
          transparent
          opacity={lit ? 0.55 : 0.28}
          lineWidth={1}
        />
      ))}

      {nodes.map((n, i) => (
        <mesh key={i} position={n}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lit ? "#ffffff" : "#7d9bff"}
            emissiveIntensity={lit ? 1.2 : 0.4}
          />
        </mesh>
      ))}

      {data.entries.map((entry, i) => {
        const n = nodes[nodes.length - 1 - i] || nodes[0];
        return <ResumeStar key={entry.title} position={n} entry={entry} />;
      })}
    </group>
  );
}

function ResumeStar({ position, entry }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!ref.current) return;
    const breathe = hovered ? 1.6 : 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.15;
    ref.current.scale.setScalar(breathe);
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(
          new CustomEvent("cosmicClick", { detail: { title: entry.title, body: entry.body } })
        );
      }}
    >
      <sphereGeometry args={[0.07, 10, 10]} />
      <meshStandardMaterial color="#dce8ff" emissive="#dce8ff" emissiveIntensity={hovered ? 1.4 : 0.7} />
    </mesh>
  );
}