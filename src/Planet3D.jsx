import { useRef, useState, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sphericalToVec3 } from "./skyData3D";
import {
  jupiterTexture,
  saturnTexture,
  neptuneTexture,
  saturnRingTexture,
  glowTexture,
} from "./planetTextures";

// Radii keep the real proportions: Jupiter 1.0, Saturn 0.83, Neptune 0.35.
// `tilt` is [toward the viewer, 0, roll]; it leans each planet's axis
// (and Saturn's rings with it). `spin` is radians per second.
const KINDS = {
  jupiter: {
    radius: 0.8,
    texture: jupiterTexture,
    spin: 0.12,
    tilt: [0.12, 0, 0.05],
    glow: "#ffcf9a",
    glowOpacity: 0.3,
  },
  saturn: {
    radius: 0.66,
    texture: saturnTexture,
    spin: 0.1,
    tilt: [0.45, 0, -0.42],
    glow: "#ffe8b0",
    glowOpacity: 0.24,
    rings: { inner: 1.24, outer: 2.27 }, // in planet radii
  },
  neptune: {
    radius: 0.28,
    texture: neptuneTexture,
    spin: 0.07,
    tilt: [0.1, 0, 0.3],
    glow: "#5b8cff",
    glowOpacity: 0.5,
  },
};

export default function Planet3D({ data }) {
  const kind = KINDS[data.kind];
  const facing = useRef();
  const body = useRef();
  const [hovered, setHovered] = useState(false);

  const position = useMemo(() => sphericalToVec3(data.yaw, data.pitch, data.distance), [data]);
  const map = useMemo(() => kind.texture(), [kind]);
  const glowMap = useMemo(() => glowTexture(), []);
  const ringMap = useMemo(() => (kind.rings ? saturnRingTexture() : null), [kind]);

  // RingGeometry's default UVs are planar. Remap them so the texture
  // runs from the inner edge to the outer edge of the ring.
  const ringGeometry = useMemo(() => {
    if (!kind.rings) return null;
    const inner = kind.radius * kind.rings.inner;
    const outer = kind.radius * kind.rings.outer;
    const g = new THREE.RingGeometry(inner, outer, 128, 1);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 0.5);
    }
    return g;
  }, [kind]);

  // Turn the whole planet to face the viewer at the origin, so the
  // tilt below always means "toward the camera".
  useLayoutEffect(() => {
    facing.current?.lookAt(0, 0, 0);
  }, [position]);

  useFrame((_, delta) => {
    if (body.current) body.current.rotation.y += delta * kind.spin;
    if (facing.current) {
      const t = hovered ? 1.12 : 1;
      facing.current.scale.lerp({ x: t, y: t, z: t }, 0.12);
    }
  });

  return (
    <group
      ref={facing}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(
          new CustomEvent("cosmicClick", { detail: { title: data.label, body: data.body } })
        );
      }}
    >
      {/* Atmosphere glow. The raycast override keeps it from catching
          the pointer, so only the planet itself counts as hoverable. */}
      <sprite scale={[kind.radius * 4.8, kind.radius * 4.8, 1]} raycast={() => null}>
        <spriteMaterial
          map={glowMap}
          color={kind.glow}
          transparent
          opacity={hovered ? kind.glowOpacity * 1.6 : kind.glowOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </sprite>

      <group rotation={kind.tilt}>
        <mesh ref={body}>
          <sphereGeometry args={[kind.radius, 64, 48]} />
          <meshStandardMaterial
            map={map}
            emissiveMap={map}
            emissive="#ffffff"
            emissiveIntensity={hovered ? 0.3 : 0}
            roughness={1}
            metalness={0}
            fog={false}
          />
        </mesh>

        {ringGeometry && (
          <mesh geometry={ringGeometry} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial
              map={ringMap}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
              roughness={1}
              metalness={0}
              fog={false}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}