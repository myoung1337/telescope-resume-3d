import { eyepieceWorld, SKY_TARGET } from "./telescopeLayout";

// The last waypoint is computed from the telescope's real geometry, so
// the camera always ends up at the eyepiece, wherever it is.
const eyepiece = eyepieceWorld();

export const WAYPOINTS = [
  // Wide establishing shot from the door
  { id: "doorway", position: [0, 1.6, 6], lookAt: [0, 2.6, -1] },
  // Three-quarter side view, so the mount and tube read in profile
  { id: "center", position: [-3.0, 1.7, 3.2], lookAt: [0, 2.3, 0.2] },
  // Right at the eyepiece
  {
    id: "eyepiece",
    position: [eyepiece.x + 0.5, eyepiece.y + 0.45, eyepiece.z + 0.9],
    lookAt: [eyepiece.x, eyepiece.y, eyepiece.z],
  },
];

export { SKY_TARGET };

export const PROP_INFO = {
  window: {
    title: "Through the Slit",
    body: [
      "The shutter is open and the sky is clear. This is where the night starts.",
      "(Replace with a short personal intro line.)",
    ],
  },
  bookshelf: {
    title: "About Me",
    body: [
      "A shelf of what shaped the way I build things.",
      "(Replace with your real bio / background.)",
    ],
  },
  desk: {
    title: "Contact",
    body: ["your.email@example.com", "linkedin.com/in/yourname · github.com/yourname"],
  },
  globe: {
    title: "Where I'm Based",
    body: [
      "Vancouver, British Columbia, Canada",
      "Latitude 49° 15' N, Longitude 123° 6' W"
    ],
  },
};