import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const WOOD = "#3a2616";
const DARK_WOOD = "#2a1a0e";
const BRASS = "#b08a45";
const IVORY = "#e6dcc0";
const ALONG_Z = [Math.PI / 2, 0, 0];
const DIAL_Y = 1.69;

const TICKS = Array.from({ length: 12 }).map((_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return { x: Math.sin(a) * 0.16, y: DIAL_Y + Math.cos(a) * 0.16, rot: -a, long: i % 3 === 0 };
});

export default function PendulumClock() {
  const pendulum = useRef();
  const minuteHand = useRef();
  const hourHand = useRef();

  useFrame(({ clock }) => {
    // A seconds pendulum: one full swing back and forth every 2 seconds.
    if (pendulum.current) {
      pendulum.current.rotation.z = 0.09 * Math.sin(clock.elapsedTime * Math.PI);
    }
    // The dial shows the visitor's real local time.
    const now = new Date();
    const minutes = now.getMinutes() + now.getSeconds() / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    if (minuteHand.current) minuteHand.current.rotation.z = -(minutes / 60) * Math.PI * 2;
    if (hourHand.current) hourHand.current.rotation.z = -(hours / 12) * Math.PI * 2;
  });

  return (
    <group>
      {/* Plinth and base molding */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.56, 0.2, 0.34]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.38]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>

      {/* Trunk: two sides, a back panel, rails, and a glass front */}
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.84, 0]} castShadow>
          <boxGeometry args={[0.035, 1.2, 0.3]} />
          <meshStandardMaterial color={WOOD} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.84, -0.14]}>
        <boxGeometry args={[0.4, 1.2, 0.02]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.8} />
      </mesh>
      {[0.26, 1.42].map((y) => (
        <mesh key={y} position={[0, y, 0.155]}>
          <boxGeometry args={[0.4, 0.04, 0.03]} />
          <meshStandardMaterial color={WOOD} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.84, 0.15]}>
        <planeGeometry args={[0.37, 1.14]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.07} roughness={0.05} depthWrite={false} />
      </mesh>

      {/* Pendulum: pivots from just under the clock head */}
      <group ref={pendulum} position={[0, 1.4, 0]}>
        <mesh position={[0, -0.475, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.95, 8]} />
          <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.95, 0]} rotation={ALONG_Z}>
          <cylinderGeometry args={[0.075, 0.075, 0.02, 24]} />
          <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.3} emissive={BRASS} emissiveIntensity={0.15} />
        </mesh>
      </group>

      {/* Clock head with stepped cap and finial */}
      <mesh position={[0, DIAL_Y, 0]} castShadow>
        <boxGeometry args={[0.52, 0.5, 0.32]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.965, 0]}>
        <boxGeometry args={[0.56, 0.05, 0.36]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.01, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.26]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.06, 0]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Dial */}
      <mesh position={[0, DIAL_Y, 0.161]}>
        <circleGeometry args={[0.19, 40]} />
        <meshStandardMaterial color={IVORY} emissive={IVORY} emissiveIntensity={0.18} roughness={0.8} />
      </mesh>
      <mesh position={[0, DIAL_Y, 0.163]}>
        <torusGeometry args={[0.195, 0.012, 8, 40]} />
        <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.3} />
      </mesh>
      {TICKS.map((t, i) => (
        <mesh key={i} position={[t.x, t.y, 0.165]} rotation={[0, 0, t.rot]}>
          <boxGeometry args={[t.long ? 0.014 : 0.008, t.long ? 0.04 : 0.026, 0.004]} />
          <meshStandardMaterial color="#2a1c10" />
        </mesh>
      ))}
      <group ref={hourHand} position={[0, DIAL_Y, 0.167]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.016, 0.1, 0.004]} />
          <meshStandardMaterial color="#1a120a" />
        </mesh>
      </group>
      <group ref={minuteHand} position={[0, DIAL_Y, 0.171]}>
        <mesh position={[0, 0.075, 0]}>
          <boxGeometry args={[0.01, 0.15, 0.004]} />
          <meshStandardMaterial color="#1a120a" />
        </mesh>
      </group>
      <mesh position={[0, DIAL_Y, 0.174]}>
        <sphereGeometry args={[0.012, 10, 10]} />
        <meshStandardMaterial color={BRASS} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}