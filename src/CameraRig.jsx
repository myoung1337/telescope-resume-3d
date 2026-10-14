import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WAYPOINTS } from "./roomData";

const CAM_DAMP = 0.06;
const LOOK_DAMP = 0.08;
const PARALLAX_RANGE = 0.4;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function CameraRig({ waypointIndex }) {
  const { camera, gl } = useThree();
  const waypointRef = useRef(waypointIndex);
  const currentPos = useRef(new THREE.Vector3(...WAYPOINTS[0].position));
  const currentLook = useRef(new THREE.Vector3(...WAYPOINTS[0].lookAt));
  const lookOffset = useRef(new THREE.Vector3());
  const pointer = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    waypointRef.current = waypointIndex;
  }, [waypointIndex]);

  useEffect(() => {
    const el = gl.domElement;
    let touchId = null;
    let lastTouchX = 0;
    let lastTouchY = 0;

    // Desktop: absolute cursor position IS the look direction.
    const onPointerMove = (e) => {
      if (e.pointerType === "touch") return; // touch is handled separately below
      const rect = el.getBoundingClientRect();
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      pointer.current.active = true;
    };
    const onPointerLeave = (e) => {
      if (e.pointerType === "touch") return;
      pointer.current.active = false;
    };

    // Touch: incremental drag delta, added to wherever you already
    // were. No "reset on lift" — matches how mobile orbit/look
    // controls conventionally behave.
    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (!t) return;
      touchId = t.identifier;
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
      pointer.current.active = true;
    };
    const onTouchMove = (e) => {
      const t = [...e.touches].find((tt) => tt.identifier === touchId) || e.touches[0];
      if (!t) return;
      const rect = el.getBoundingClientRect();
      const dx = (t.clientX - lastTouchX) / rect.width;
      const dy = (t.clientY - lastTouchY) / rect.height;
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
      pointer.current.x = clamp(pointer.current.x + dx * 3, -1, 1);
      pointer.current.y = clamp(pointer.current.y + dy * 3, -1, 1);
    };

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [gl]);

  useFrame(() => {
    const wp = WAYPOINTS[waypointRef.current];
    const targetPos = new THREE.Vector3(...wp.position);
    const targetLook = new THREE.Vector3(...wp.lookAt);

    const targetOffset = pointer.current.active
      ? new THREE.Vector3(pointer.current.x * PARALLAX_RANGE, pointer.current.y * PARALLAX_RANGE * 0.5, 0)
      : new THREE.Vector3();

    currentPos.current.lerp(targetPos, CAM_DAMP);
    currentLook.current.lerp(targetLook, CAM_DAMP);
    lookOffset.current.lerp(targetOffset, LOOK_DAMP);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLook.current.clone().add(lookOffset.current));
  });

  return null;
}