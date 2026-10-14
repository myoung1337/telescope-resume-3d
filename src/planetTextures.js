import * as THREE from "three";
import { seeded } from "./textures";

function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

const ease = (t) => t * t * (3 - 2 * t);
const smoothstep = (a, b, x) => ease(Math.min(1, Math.max(0, (x - a) / (b - a))));

// Value noise on a 256x256 lattice that wraps horizontally every
// `period` cells, so a texture painted from it has no seam where its
// left and right edges meet around the sphere.
function makeNoise(seed) {
  const rand = seeded(seed);
  const grid = new Float32Array(256 * 256);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();
  return (x, y, period) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const sx = ease(x - xi);
    const sy = ease(y - yi);
    const x0 = ((xi % period) + period) % period;
    const x1 = (x0 + 1) % period;
    const y0 = yi & 255;
    const y1 = (yi + 1) & 255;
    const a = grid[(y0 << 8) | x0];
    const b = grid[(y0 << 8) | x1];
    const c = grid[(y1 << 8) | x0];
    const d = grid[(y1 << 8) | x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

// u wraps around the planet (0..1); v runs pole to pole (0..1). baseX
// must be a whole number or the wrap breaks.
function fbm(noise, u, v, baseX, baseY, octaves) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const fx = baseX * (1 << i);
    sum += noise(u * fx, v * baseY * (1 << i), fx) * amp;
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

// A color ramp from north pole (0) to south pole (1), eased between stops.
function makeRamp(stops) {
  const parsed = stops.map(([p, hex]) => {
    const n = parseInt(hex.slice(1), 16);
    return [p, (n >> 16) & 255, (n >> 8) & 255, n & 255];
  });
  const last = parsed.length - 1;
  return (t, out) => {
    if (t <= parsed[0][0]) {
      out[0] = parsed[0][1];
      out[1] = parsed[0][2];
      out[2] = parsed[0][3];
      return;
    }
    if (t >= parsed[last][0]) {
      out[0] = parsed[last][1];
      out[1] = parsed[last][2];
      out[2] = parsed[last][3];
      return;
    }
    let i = 1;
    while (t > parsed[i][0]) i++;
    const a = parsed[i - 1];
    const b = parsed[i];
    const k = smoothstep(a[0], b[0], t);
    out[0] = a[1] + (b[1] - a[1]) * k;
    out[1] = a[2] + (b[2] - a[2]) * k;
    out[2] = a[3] + (b[3] - a[3]) * k;
  };
}

// Latitude bands whose edges are bent by slow noise, then streaked
// along the band direction with finer noise.
function paintBands(ctx, w, h, { seed, stops, warp, streak, streakX, streakY }) {
  const noise = makeNoise(seed);
  const ramp = makeRamp(stops);
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const rgb = [0, 0, 0];
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const du = (fbm(noise, u, v, 3, 8, 2) - 0.5) * warp * 3;
      const dv = (fbm(noise, u + 0.31, v + 0.17, 3, 8, 2) - 0.5) * warp;
      const vv = v + dv;
      ramp(vv, rgb);
      const shade = 1 + (fbm(noise, u + du, vv, streakX, streakY, 3) - 0.5) * streak * 2;
      const i = (y * w + x) * 4;
      data[i] = rgb[0] * shade;
      data[i + 1] = rgb[1] * shade;
      data[i + 2] = rgb[2] * shade;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// A soft-edged oval, for storms and spots.
function blob(ctx, cx, cy, a, b, stops) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, b / a);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, a);
  stops.forEach(([p, color]) => g.addColorStop(p, color));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, a, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const JUPITER = [
  [0.0, "#8f806c"],
  [0.1, "#a89479"],
  [0.18, "#8a6a52"],
  [0.25, "#d0b992"],
  [0.3, "#9a6a47"],
  [0.34, "#dcc7a2"],
  [0.37, "#a56f4a"],
  [0.41, "#e3cfa9"],
  [0.44, "#6f4833"],
  [0.47, "#b98a60"],
  [0.5, "#f0e2c4"],
  [0.53, "#cfa97f"],
  [0.565, "#7a4d37"],
  [0.6, "#b47a52"],
  [0.64, "#ead8b5"],
  [0.68, "#a5714b"],
  [0.72, "#dfc9a4"],
  [0.77, "#9a6a47"],
  [0.83, "#d3bd97"],
  [0.9, "#8a6a52"],
  [0.96, "#a08c76"],
  [1.0, "#8a7b69"],
];

const SATURN = [
  [0.0, "#8f8470"],
  [0.12, "#b5a27a"],
  [0.22, "#d6c496"],
  [0.3, "#c4ae80"],
  [0.38, "#e6d6a8"],
  [0.46, "#d3bf90"],
  [0.5, "#efe2b6"],
  [0.56, "#d8c690"],
  [0.64, "#e4d3a2"],
  [0.72, "#c9b588"],
  [0.82, "#d9c897"],
  [0.92, "#b4a27c"],
  [1.0, "#968a72"],
];

const NEPTUNE = [
  [0.0, "#2a4fb8"],
  [0.2, "#3361d2"],
  [0.34, "#2c58c8"],
  [0.46, "#3a6be0"],
  [0.58, "#2d58c6"],
  [0.72, "#3563d4"],
  [0.88, "#2a50ba"],
  [1.0, "#27499f"],
];

function paintJupiter(ctx, w, h) {
  paintBands(ctx, w, h, { seed: 90210, stops: JUPITER, warp: 0.09, streak: 0.15, streakX: 8, streakY: 36 });
  const s = w / 1024;

  // Great Red Spot: a pale collar first, then the red core
  blob(ctx, 0.62 * w, 0.615 * h, 86 * s, 44 * s, [
    [0, "rgba(222,196,160,0.55)"],
    [0.7, "rgba(222,196,160,0.45)"],
    [1, "rgba(222,196,160,0)"],
  ]);
  blob(ctx, 0.62 * w, 0.615 * h, 62 * s, 31 * s, [
    [0, "rgba(160,62,40,0.95)"],
    [0.55, "rgba(184,86,56,0.9)"],
    [0.85, "rgba(200,110,76,0.55)"],
    [1, "rgba(200,110,76,0)"],
  ]);

  // Small white ovals in the southern tropical zone
  [[0.15, 0.665, 15, 9], [0.2, 0.665, 11, 7], [0.9, 0.675, 13, 8]].forEach(([u, v, a, b]) =>
    blob(ctx, u * w, v * h, a * s, b * s, [
      [0, "rgba(246,240,228,0.9)"],
      [0.6, "rgba(240,232,216,0.7)"],
      [1, "rgba(240,232,216,0)"],
    ])
  );

  // Dark barges on the north equatorial belt
  [[0.42, 0.435, 30, 6], [0.47, 0.445, 22, 5], [0.05, 0.44, 26, 5]].forEach(([u, v, a, b]) =>
    blob(ctx, u * w, v * h, a * s, b * s, [
      [0, "rgba(66,38,26,0.6)"],
      [1, "rgba(66,38,26,0)"],
    ])
  );
}

function paintSaturn(ctx, w, h) {
  paintBands(ctx, w, h, { seed: 31415, stops: SATURN, warp: 0.04, streak: 0.07, streakX: 8, streakY: 30 });
}

function paintNeptune(ctx, w, h) {
  paintBands(ctx, w, h, { seed: 27182, stops: NEPTUNE, warp: 0.03, streak: 0.09, streakX: 6, streakY: 24 });
  const s = w / 1024;
  const rand = seeded(424242);

  // Great Dark Spot
  blob(ctx, 0.3 * w, 0.42 * h, 74 * s, 40 * s, [
    [0, "rgba(10,20,84,0.92)"],
    [0.6, "rgba(16,30,104,0.75)"],
    [1, "rgba(20,38,120,0)"],
  ]);

  // Bright cirrus streaks, clustered around the spot and scattered elsewhere
  for (let i = 0; i < 26; i++) {
    const nearSpot = i < 16;
    const x = nearSpot ? (0.3 + (rand() - 0.5) * 0.26) * w : rand() * w;
    const y = nearSpot ? (0.42 + (rand() - 0.35) * 0.2) * h : (0.25 + rand() * 0.4) * h;
    ctx.fillStyle = `rgba(232,240,255,${0.2 + rand() * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(x, y, (20 + rand() * 50) * s, (1.5 + rand() * 3.5) * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// One horizontal strip: left edge is the inner edge of the rings, right
// edge the outer. The ring geometry's UVs are remapped to match.
// Regions as fractions of the strip: C ring, B ring, Cassini Division, A ring.
function paintSaturnRings(ctx, w, h) {
  const rand = seeded(1357911);
  const raw = Array.from({ length: w }, () => rand());
  const img = ctx.createImageData(w, h);
  const soft = 0.012;
  const band = (t, a, b) => smoothstep(a - soft, a + soft, t) * (1 - smoothstep(b - soft, b + soft, t));

  for (let x = 0; x < w; x++) {
    const t = x / (w - 1);
    const wC = band(t, 0.0, 0.28) * 0.3;
    const wB = band(t, 0.28, 0.69) * 0.95;
    const wG = band(t, 0.69, 0.77) * 0.07;
    const wA = band(t, 0.77, 1.0) * 0.75;
    const encke = band(t, 0.934, 0.946);

    const prev = raw[Math.max(0, x - 1)];
    const next = raw[Math.min(w - 1, x + 1)];
    const n = raw[x] * 0.5 + prev * 0.25 + next * 0.25;
    const ringlet = 0.78 + 0.44 * n;

    const alpha = Math.min(1, (wC + wB + wG + wA) * (1 - encke * 0.92) * ringlet);
    const sum = wC + wB + wG + wA || 1;
    const bright = 0.9 + 0.2 * n;
    const r = ((148 * wC + 238 * wB + 184 * wG + 216 * wA) / sum) * bright;
    const g = ((136 * wC + 224 * wB + 172 * wG + 202 * wA) / sum) * bright;
    const b = ((116 * wC + 192 * wB + 150 * wG + 170 * wA) / sum) * bright;

    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = alpha * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Soft round halo, used as an atmosphere glow behind each planet.
function paintGlow(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(0.4, "rgba(255,255,255,0.5)");
  g.addColorStop(0.55, "rgba(255,255,255,0.16)");
  g.addColorStop(0.75, "rgba(255,255,255,0.04)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Textures are built once and reused, so going back and forth between
// the room and the starfield doesn't repaint them.
const cache = new Map();
function cached(key, build) {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
}

export const jupiterTexture = () => cached("jupiter", () => canvasTexture(1024, 512, paintJupiter));
export const saturnTexture = () => cached("saturn", () => canvasTexture(1024, 512, paintSaturn));
export const neptuneTexture = () => cached("neptune", () => canvasTexture(1024, 512, paintNeptune));
export const saturnRingTexture = () => cached("saturnRings", () => canvasTexture(1024, 4, paintSaturnRings));
export const glowTexture = () => cached("glow", () => canvasTexture(128, 128, paintGlow));