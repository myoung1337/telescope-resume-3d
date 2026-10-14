import ObservatoryDome from "./ObservatoryDome";
import Telescope from "./Telescope";
import Bookshelf from "./Bookshelf";
import ControlDesk from "./ControlDesk";
import MapCabinet from "./MapCabinet";
import PendulumClock from "./PendulumClock";
import CelestialGlobe from "./CelestialGlobe";
import StarChart from "./StarChart";
import Hoverable from "./Hoverable";
import { onWall } from "./roomMath";

// Places children on the dome wall at a compass angle (-90 is the back
// wall, where the slit is). Children are built facing +Z, and onWall
// turns that to face the room's center.
function OnWall({ angle, radius, children }) {
  const { position, rotationY } = onWall(angle, radius);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {children}
    </group>
  );
}

const CHARTS = [
  { angle: -80, y: 1.9, width: 0.8, height: 1.05, seed: 3, title: "THE NORTHERN HEAVENS" },
  { angle: -68, y: 1.9, width: 0.95, height: 0.95, seed: 8, round: true },
  { angle: -32, y: 1.95, width: 1.2, height: 0.8, seed: 21, title: "THE SOUTHERN SKY" },
];

export default function Room({ onPropClick, onTelescopeClick }) {
  return (
    <group>
      <ObservatoryDome onSkyClick={() => onPropClick("window")} />
      <Telescope onClick={onTelescopeClick} />

      {/* Left side */}
      <OnWall angle={-165} radius={6.7}>
        <Bookshelf position={[0, 1.1, 0]} onClick={() => onPropClick("bookshelf")} />
      </OnWall>
      <OnWall angle={-140} radius={6.47}>
        <MapCabinet />
      </OnWall>
      <OnWall angle={-112} radius={6.7}>
        <PendulumClock />
      </OnWall>

      {/* Right side */}
      {CHARTS.map((c) => (
        <OnWall key={c.seed} angle={c.angle} radius={6.95}>
          <group position={[0, c.y, 0]}>
            <StarChart width={c.width} height={c.height} seed={c.seed} title={c.title} round={c.round} />
          </group>
        </OnWall>
      ))}
      <OnWall angle={-32} radius={6.5}>
        <Hoverable onClick={() => onPropClick("desk")} hoverScale={1.02}>
          <ControlDesk />
        </Hoverable>
      </OnWall>
      <OnWall angle={-8} radius={6.2}>
        <Hoverable onClick={() => onPropClick("globe")} hoverScale={1.04}>
          <CelestialGlobe />
        </Hoverable>
      </OnWall>
    </group>
  );
}