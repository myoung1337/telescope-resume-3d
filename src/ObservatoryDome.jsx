import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makePlankTexture, makeSkyTexture, seeded } from "./textures";
import { onWall } from "./roomMath";
import { TELESCOPE_POSITION } from "./telescopeLayout";

const WALL_RADIUS = 7;
const WALL_HEIGHT = 3.4;
const SHELL_R = WALL_RADIUS - 0.04; // structure sits just inside the dome surface
const CATWALK_RADIUS = WALL_RADIUS - 0.4;
const CATWALK_Y = WALL_HEIGHT - 0.5;

// The slit: everything with |x| < SLIT_HALF, from the rim up and over
// the apex, ending SLIT_END_Z past it, is cut away.
const SLIT_HALF = 0.9;
const SLIT_END_Z = 0.6;
const SLIT_RP = Math.sqrt(SHELL_R * SHELL_R - SLIT_HALF * SLIT_HALF);
const SLIT_T_END = Math.acos(-SLIT_END_Z / SLIT_RP);

// With clipIntersection, a fragment is discarded only where ALL three
// planes' clipped sides overlap: x > -0.9, x < 0.9 and z < 0.6.
const SLIT_PLANES = [
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), -SLIT_HALF),
  new THREE.Plane(new THREE.Vector3(1, 0, 0), -SLIT_HALF),
  new THREE.Plane(new THREE.Vector3(0, 0, 1), -SLIT_END_Z),
];
const CLIP = { clippingPlanes: SLIT_PLANES, clipIntersection: true };

export default function ObservatoryDome({ onSkyClick }) {
  const gl = useThree((s) => s.gl);
  const [slitHovered, setSlitHovered] = useState(false);

  // Local clipping is off by default in Three.js.
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  return (
    <group>
      <WoodFloor />
      <Plinth />

      <mesh position={[0, WALL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[WALL_RADIUS, WALL_RADIUS, WALL_HEIGHT, 48, 1, true]} />
        <meshStandardMaterial color="#1c1f2c" roughness={0.9} side={THREE.BackSide} />
      </mesh>

      {/* The dome, with the slit cut out of it */}
      <mesh position={[0, WALL_HEIGHT, 0]}>
        <sphereGeometry args={[WALL_RADIUS, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#262a38"
          roughness={0.75}
          metalness={0.2}
          side={THREE.BackSide}
          {...CLIP}
        />
      </mesh>

      <DomeStructure />
      <SlitFrame hovered={slitHovered} />
      <SlitHitArea onClick={onSkyClick} onHover={setSlitHovered} />
      <Catwalk />
      <WallSconces />
      <HangingLamp />
      <NightSky />
      <Moonbeam />
    </group>
  );
}

function WoodFloor() {
  const map = useMemo(() => makePlankTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[WALL_RADIUS, 64]} />
      <meshStandardMaterial map={map} roughness={0.55} metalness={0.05} />
    </mesh>
  );
}

function Plinth() {
  const [x, , z] = TELESCOPE_POSITION;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.0, 0.16, 40]} />
        <meshStandardMaterial color="#2b2e38" roughness={0.75} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.165, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.93, 0.02, 8, 64]} />
        <meshStandardMaterial color="#a67c3a" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Ribs that follow the dome's surface (rim to apex), plus horizontal
// rings and the beam where wall meets dome. All cut by the slit.
function DomeStructure() {
  const ribs = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => {
        const phi = ((i + 0.5) / 12) * Math.PI * 2;
        const pts = [];
        for (let k = 0; k <= 24; k++) {
          const theta = (Math.PI / 2) * (1 - k / 24); // rim -> apex
          pts.push(
            new THREE.Vector3(
              SHELL_R * Math.sin(theta) * Math.cos(phi),
              WALL_HEIGHT + SHELL_R * Math.cos(theta),
              SHELL_R * Math.sin(theta) * Math.sin(phi)
            )
          );
        }
        return new THREE.CatmullRomCurve3(pts);
      }),
    []
  );

  return (
    <group>
      {ribs.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 48, 0.045, 6, false]} />
          <meshStandardMaterial color="#454a5a" metalness={0.5} roughness={0.4} {...CLIP} />
        </mesh>
      ))}

      {[75, 55, 35].map((deg) => {
        const th = (deg * Math.PI) / 180;
        return (
          <mesh
            key={deg}
            position={[0, WALL_HEIGHT + SHELL_R * Math.cos(th), 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[SHELL_R * Math.sin(th), 0.035, 6, 96]} />
            <meshStandardMaterial color="#454a5a" metalness={0.5} roughness={0.4} {...CLIP} />
          </mesh>
        );
      })}

      {/* Ring beam between wall and dome */}
      <mesh position={[0, WALL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[WALL_RADIUS - 0.03, 0.09, 8, 96]} />
        <meshStandardMaterial color="#3a3f4d" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Metal rails along both edges of the slit and a cross-bar at its end.
function SlitFrame({ hovered }) {
  const rails = useMemo(
    () =>
      [-1, 1].map((side) => {
        const pts = [];
        for (let k = 0; k <= 40; k++) {
          const t = (k / 40) * SLIT_T_END;
          pts.push(
            new THREE.Vector3(
              side * SLIT_HALF,
              WALL_HEIGHT + SLIT_RP * Math.sin(t),
              -SLIT_RP * Math.cos(t)
            )
          );
        }
        return new THREE.CatmullRomCurve3(pts);
      }),
    []
  );
  const endY = WALL_HEIGHT + SLIT_RP * Math.sin(SLIT_T_END);
  const mat = {
    color: "#5a6074",
    metalness: 0.65,
    roughness: 0.35,
    emissive: hovered ? "#4a6bd0" : "#000000",
    emissiveIntensity: hovered ? 0.9 : 0,
  };

  return (
    <group>
      {rails.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 64, 0.05, 8, false]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
      <mesh position={[0, endY, SLIT_END_Z]}>
        <boxGeometry args={[SLIT_HALF * 2 + 0.1, 0.1, 0.1]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

// Invisible strip spanning the opening, so the slit can be hovered and
// clicked like any other prop.
function SlitHitArea({ onClick, onHover }) {
  const geometry = useMemo(() => {
    const N = 30;
    const positions = [];
    const indices = [];
    for (let k = 0; k <= N; k++) {
      const t = (k / N) * SLIT_T_END;
      const y = WALL_HEIGHT + SLIT_RP * Math.sin(t);
      const z = -SLIT_RP * Math.cos(t);
      positions.push(-SLIT_HALF, y, z, SLIT_HALF, y, z);
      if (k < N) {
        const a = k * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    return g;
  }, []);

  return (
    <mesh
      geometry={geometry}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={() => onHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// What you actually see through the slit: a big gradient sky sphere,
// stars, and a moon. fog={false} keeps scene fog from graying them out.
function NightSky() {
  const gradient = useMemo(() => makeSkyTexture(), []);
  const starPositions = useMemo(() => {
    const rand = seeded(77);
    const count = 900;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = rand() * Math.PI * 2;
      const cosT = rand() * 0.98 + 0.02; // upper hemisphere only
      const sinT = Math.sqrt(1 - cosT * cosT);
      arr[i * 3] = 55 * sinT * Math.cos(phi);
      arr[i * 3 + 1] = 55 * cosT;
      arr[i * 3 + 2] = 55 * sinT * Math.sin(phi);
    }
    return arr;
  }, []);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[60, 32, 24]} />
        <meshBasicMaterial map={gradient} side={THREE.BackSide} fog={false} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starPositions.length / 3}
            array={starPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.4} color="#dfe8ff" sizeAttenuation fog={false} transparent opacity={0.95} />
      </points>
      <mesh position={[0.8, 26, -45]}>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshBasicMaterial color="#f6f2e0" fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Cool light falling through the slit onto the telescope and floor.
function Moonbeam() {
  const light = useRef();
  const target = useMemo(() => {
    const t = new THREE.Object3D();
    t.position.set(0, 1.2, 0.3);
    return t;
  }, []);

  useLayoutEffect(() => {
    if (light.current) light.current.target = target;
  }, [target]);

  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={light}
        position={[0.2, 9.4, -2.5]}
        angle={0.3}
        penumbra={1}
        intensity={180}
        distance={18}
        decay={2}
        color="#a8c0ff"
      />
    </>
  );
}

function Catwalk() {
  const posts = 16;
  return (
    <group>
      <mesh position={[0, CATWALK_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[CATWALK_RADIUS - 0.5, CATWALK_RADIUS, 48]} />
        <meshStandardMaterial color="#3a2a1c" roughness={0.75} />
      </mesh>
      {Array.from({ length: posts }).map((_, i) => {
        const angle = (i / posts) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * CATWALK_RADIUS, CATWALK_Y + 0.45, Math.sin(angle) * CATWALK_RADIUS]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.9, 6]} />
            <meshStandardMaterial color="#2c2f38" metalness={0.5} roughness={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, CATWALK_Y + 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[CATWALK_RADIUS - 0.03, CATWALK_RADIUS, 48]} />
        <meshStandardMaterial color="#2c2f38" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Red observing lamps: observers use dim red light so their eyes stay
// dark-adapted. onWall() makes each one face into the room.
function WallSconces() {
  return (
    <>
      {[-135, -45, 45, 135].map((deg) => {
        const { position, rotationY } = onWall(deg, WALL_RADIUS - 0.08);
        return (
          <group key={deg} position={[position[0], 2.0, position[2]]} rotation={[0, rotationY, 0]}>
            <mesh>
              <boxGeometry args={[0.16, 0.22, 0.08]} />
              <meshStandardMaterial color="#2c2f38" metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.1]}>
              <sphereGeometry args={[0.07, 14, 14]} />
              <meshStandardMaterial color="#ff4a3a" emissive="#ff2a18" emissiveIntensity={2.2} />
            </mesh>
            <pointLight position={[0, 0, 0.35]} intensity={3.5} color="#ff3a26" distance={7} decay={2} />
          </group>
        );
      })}
    </>
  );
}

function HangingLamp() {
  const x = -1.5;
  const z = 2;
  const lampY = 2.55;
  // The cord runs up to where the dome actually is at this spot.
  const topY = WALL_HEIGHT + Math.sqrt(WALL_RADIUS * WALL_RADIUS - x * x - z * z) - 0.1;
  const cordBottom = lampY + 0.2;
  const cordLength = topY - cordBottom;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, cordBottom + cordLength / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, cordLength, 6]} />
        <meshStandardMaterial color="#1c1e24" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, lampY + 0.1, 0]}>
        <coneGeometry args={[0.25, 0.2, 20, 1, true]} />
        <meshStandardMaterial color="#2c2f38" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, lampY - 0.02, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#ff5a44" emissive="#ff2a18" emissiveIntensity={2.4} />
      </mesh>
      <pointLight position={[0, lampY - 0.1, 0]} intensity={6} color="#ff3a26" distance={9} decay={2} />
    </group>
  );
}