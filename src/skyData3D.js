export function sphericalToVec3(yaw, pitch, distance) {
  const x = distance * Math.cos(pitch) * Math.sin(yaw);
  const y = distance * Math.sin(pitch);
  const z = -distance * Math.cos(pitch) * Math.cos(yaw);
  return [x, y, z];
}

export const CONSTELLATIONS_3D = [
  {
    id: "frontend",
    label: "Frontend Skills",
    yaw: -0.6,
    pitch: 0.15,
    distance: 12,
    summary: ["A quick tour of what I reach for on the client side."],
    entries: [
      { title: "React & TypeScript", body: ["Placeholder — describe your React/TS experience here."] },
      { title: "Design systems", body: ["Placeholder — describe design-system work here."] },
      { title: "Accessibility", body: ["Placeholder — describe accessibility work here."] },
    ],
  },
  {
    id: "backend",
    label: "Backend Skills",
    yaw: 0.5,
    pitch: 0.3,
    distance: 12,
    summary: ["Server-side and infrastructure work."],
    entries: [
      { title: "Node & APIs", body: ["Placeholder — describe API/backend work here."] },
      { title: "Databases", body: ["Placeholder — describe database experience here."] },
      { title: "Infrastructure", body: ["Placeholder — describe infra/devops work here."] },
    ],
  },
  {
    id: "work",
    label: "Work Experience",
    yaw: 0.9,
    pitch: -0.2,
    distance: 12,
    summary: ["Where I've worked."],
    entries: [
      { title: "Role, Company A", body: ["Placeholder — dates, role, key contributions."] },
      { title: "Role, Company B", body: ["Placeholder — dates, role, key contributions."] },
    ],
  },
  {
    id: "about",
    label: "About Me",
    yaw: -0.9,
    pitch: -0.25,
    distance: 12,
    summary: ["A little context on who's behind this."],
    entries: [
      { title: "Bio", body: ["Placeholder — a couple sentences about you."] },
      { title: "Contact", body: ["your.email@example.com"] },
    ],
  },
];

// kind picks the planet's look and size in Planet3D.jsx.
export const PLANETS_3D = [
  {
    id: "alpha",
    kind: "jupiter",
    label: "Project Alpha",
    yaw: 0.22,
    pitch: -0.02,
    distance: 9,
    body: ["Placeholder — what this project is, your role, the stack."],
  },
  {
    id: "beta",
    kind: "saturn",
    label: "Project Beta",
    yaw: -0.28,
    pitch: 0.12,
    distance: 9,
    body: ["Placeholder — what this project is, your role, the stack."],
  },
  {
    id: "gamma",
    kind: "neptune",
    label: "Project Gamma",
    yaw: -0.02,
    pitch: -0.27,
    distance: 9,
    body: ["Placeholder — what this project is, your role, the stack."],
  },
];