import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import CameraRig from "./CameraRig";
import Room from "./Room";
import StarfieldScene from "./StarfieldScene";
import { WAYPOINTS, PROP_INFO } from "./roomData";

export default function App() {
  const [activeScene, setActiveScene] = useState("room");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [waypointIndex, setWaypointIndex] = useState(0);
  const [activeInfo, setActiveInfo] = useState(null);
  const [starLocked, setStarLocked] = useState(null);

  useEffect(() => {
    const onCosmicClick = (e) => setActiveInfo(e.detail);
    window.addEventListener("cosmicClick", onCosmicClick);
    return () => window.removeEventListener("cosmicClick", onCosmicClick);
  }, []);

  const goTo = (i) => {
    setActiveInfo(null);
    setWaypointIndex(Math.max(0, Math.min(WAYPOINTS.length - 1, i)));
  };

  const beginTransition = (target) => {
    setActiveInfo(null);
    setIsTransitioning(true);
    setTimeout(() => setActiveScene(target), 450);
    setTimeout(() => setIsTransitioning(false), 900);
  };

  const handleTelescopeClick = () => {
    if (waypointIndex === WAYPOINTS.length - 1) beginTransition("starfield");
    else goTo(WAYPOINTS.length - 1);
  };

  const handleReturn = () => beginTransition("room");

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", position: "relative", touchAction: "none" }}>
      <Canvas camera={{ position: [0, 1.6, 8], fov: 58 }} shadows>
        <fog attach="fog" args={["#05060a", 14, 50]} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} color="#cfe0ff" castShadow />

        {activeScene === "room" && (
          <>
            <ambientLight intensity={0.45} />
            {/* Bounced-light stand-in: cool tone from the dome overhead,
                warm tone from the floor — the "dome catching ambient
                light" quality from the reference photos */}
            <hemisphereLight args={["#3a4a7a", "#2a1f16", 0.7]} />
            {/* General room fill, standing in for the warm
                equipment/console glow visible in real observatory
                interiors — without this, the center of the room has
                nothing lighting it except the one desk lamp */}
            <pointLight position={[0, 2.2, 0]} intensity={0.5} color="#ffb45e" distance={10} decay={2} />
            <Room onPropClick={(id) => setActiveInfo(PROP_INFO[id])} onTelescopeClick={handleTelescopeClick} />
            <CameraRig waypointIndex={waypointIndex} />
          </>
        )}

        {activeScene === "starfield" && (
          <StarfieldScene activeInfo={activeInfo} onLockChange={setStarLocked} />
        )}

        <EffectComposer>
          <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.25} intensity={0.9} mipmapBlur />
          <ChromaticAberration
            offset={[0.0003, 0.0003]}
            blendFunction={BlendFunction.NORMAL}
            radialModulation={false}
            modulationOffset={0.4}
          />
          <Vignette eskil={false} offset={0.25} darkness={0.45} />
        </EffectComposer>
      </Canvas>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "#050608",
          opacity: isTransitioning ? 1 : 0,
          transition: "opacity 0.45s ease",
        }}
      />

      {activeScene === "room" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {waypointIndex > 0 && (
            <button onClick={() => goTo(waypointIndex - 1)} style={navBtnStyle("left")}>
              ‹ Back
            </button>
          )}
          {waypointIndex < WAYPOINTS.length - 1 && (
            <button onClick={() => goTo(waypointIndex + 1)} style={navBtnStyle("right")}>
              Forward ›
            </button>
          )}
        </div>
      )}

      {activeScene === "starfield" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 80,
              height: 80,
              marginLeft: -40,
              marginTop: -40,
              borderRadius: "50%",
              border: `1px solid rgba(255,255,255,${starLocked ? 0.55 : 0.25})`,
              boxShadow: starLocked ? "0 0 16px rgba(255,255,255,.25)" : "none",
              transition: "border-color .3s ease, box-shadow .3s ease",
            }}
          />
          <button
            onClick={handleReturn}
            style={{ ...navBtnStyle("right"), bottom: "auto", top: "5%", pointerEvents: "auto" }}
          >
            Return to Observatory
          </button>
        </div>
      )}

      {activeInfo && (
        <div style={panelStyle}>
          <h2 style={{ margin: "0 0 10px", fontSize: "1.05rem" }}>{activeInfo.title}</h2>
          {activeInfo.body.map((line, i) => (
            <p key={i} style={{ fontSize: "0.88rem", lineHeight: "1.4rem", margin: "0 0 6px", opacity: 0.85 }}>
              {line}
            </p>
          ))}
          <button onClick={() => setActiveInfo(null)} style={closeBtnStyle}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function navBtnStyle(side) {
  return {
    position: "absolute",
    bottom: "8%",
    [side]: "8%",
    pointerEvents: "auto",
    padding: "10px 18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "white",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  };
}

const panelStyle = {
  position: "absolute",
  bottom: "10%",
  left: "50%",
  transform: "translateX(-50%)",
  width: 320,
  padding: "20px 22px",
  background: "rgba(20,20,40,.85)",
  backdropFilter: "blur(10px)",
  borderRadius: 12,
  boxShadow: "0 0 20px rgba(100,150,255,.35)",
  color: "white",
};

const closeBtnStyle = {
  marginTop: 10,
  padding: "8px 16px",
  background: "#4e9cff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  color: "white",
};