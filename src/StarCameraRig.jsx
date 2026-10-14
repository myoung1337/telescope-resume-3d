import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CONSTELLATIONS_3D, PLANETS_3D, sphericalToVec3 } from "./skyData3D";

const LOOK_DAMP = 0.045;
const FOV_DAMP = 0.06;
const MAX_YAW = 1.1;
const MAX_PITCH = 0.6;
const CAPTURE_ANGLE = 0.3;
const LOCK_PIXELS = 40;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const ALL_TARGETS = [...CONSTELLATIONS_3D, ...PLANETS_3D];

export default function StarCameraRig({ setLockedId, activeInfo }) {
  const { camera, gl } = useThree();
  const pointer = useRef({ x: 0, y: 0, active: false });
  const currentYaw = useRef(0);
  const currentPitch = useRef(0);
  const currentFov = useRef(60);
  const lockedRef = useRef(null);

  useEffect(() => {
    camera.position.set(0, 0, 0);
    camera.rotation.order = "YXZ";
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    let touchId = null;
    let lastTouchX = 0;
    let lastTouchY = 0;

    const onPointerMove = (e) => {
      if (e.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      pointer.current.active = true;
    };
    const onPointerLeave = (e) => {
      if (e.pointerType === "touch") return;
      pointer.current.active = false;
    };

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

  useFrame(({ size }) => {
    let targetYaw = pointer.current.active ? pointer.current.x * MAX_YAW : 0;
    let targetPitch = pointer.current.active ? -pointer.current.y * MAX_PITCH : 0;

    let nearest = null;
    let nearestAngle = Infinity;
    ALL_TARGETS.forEach((t) => {
      const d = Math.hypot(targetYaw - t.yaw, targetPitch - t.pitch);
      if (d < nearestAngle) {
        nearestAngle = d;
        nearest = t;
      }
    });
    if (nearest && nearestAngle < CAPTURE_ANGLE) {
      const pull = 1 - nearestAngle / CAPTURE_ANGLE;
      targetYaw += (nearest.yaw - targetYaw) * pull * 0.4;
      targetPitch += (nearest.pitch - targetPitch) * pull * 0.4;
    }

    currentYaw.current += (targetYaw - currentYaw.current) * LOOK_DAMP;
    currentPitch.current += (targetPitch - currentPitch.current) * LOOK_DAMP;

    camera.rotation.y = -currentYaw.current;
    camera.rotation.x = currentPitch.current;
    camera.updateMatrixWorld();

    let nearestId = null;
    let nearestDist = Infinity;
    ALL_TARGETS.forEach((t) => {
      const worldPos = new THREE.Vector3(...sphericalToVec3(t.yaw, t.pitch, t.distance));
      const projected = worldPos.clone().project(camera);
      if (projected.z > 1) return;
      const sx = (projected.x * 0.5 + 0.5) * size.width;
      const sy = (-projected.y * 0.5 + 0.5) * size.height;
      const d = Math.hypot(sx - size.width / 2, sy - size.height / 2);
      if (d < nearestDist) {
        nearestDist = d;
        nearestId = t.id;
      }
    });

    const isLocked = Boolean(nearestId && nearestDist < LOCK_PIXELS);
    const newLockedId = isLocked ? nearestId : null;
    if (newLockedId !== lockedRef.current) {
      lockedRef.current = newLockedId;
      setLockedId(newLockedId);
    }

    const targetFov = activeInfo ? 42 : isLocked ? 50 : 60;
    currentFov.current += (targetFov - currentFov.current) * FOV_DAMP;
    camera.fov = currentFov.current;
    camera.updateProjectionMatrix();
  });

  return null;
}