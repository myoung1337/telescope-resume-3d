import { useState } from "react";
import StarCameraRig from "./StarCameraRig";
import StarPoints from "./StarPoints";
import MilkyWay from "./MilkyWay";
import ConstellationNode3D from "./ConstellationNode3D";
import Planet3D from "./Planet3D";
import { CONSTELLATIONS_3D, PLANETS_3D } from "./skyData3D";

export default function StarfieldScene({ activeInfo, onLockChange }) {
  const [lockedId, setLockedId] = useState(null);

  const handleLock = (id) => {
    setLockedId(id);
    onLockChange?.(id);
  };

  return (
    <>
      <ambientLight intensity={0.3} />
      {/* The "sun" for the planets */}
      <directionalLight position={[-6, 4, 5]} intensity={3.2} color="#fff2dc" />
      <MilkyWay />
      <StarPoints />
      {CONSTELLATIONS_3D.map((c) => (
        <ConstellationNode3D key={c.id} data={c} focused={lockedId === c.id} />
      ))}
      {PLANETS_3D.map((p) => (
        <Planet3D key={p.id} data={p} />
      ))}
      <StarCameraRig setLockedId={handleLock} activeInfo={activeInfo} />
    </>
  );
}