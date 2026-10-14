import * as THREE from "three";
import { seeded } from "./textures";
import { sphericalToVec3 } from "./skyData3D";

// How bright the mist is overall. Lower = fainter.
const STRENGTH = 0.5;

// The Milky Way is a great circle through these two points in the sky,
// and its bright core sits at CORE_POINT. Yaw/pitch are in radians,
// the same units the constellations use in skyData3D.js.
const BAND_POINT = { yaw: 0, pitch: 0.3 };
const CORE_POINT = { yaw: 1.2, pitch: 0.65 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const smoothstep = (a, b, x) => ease(clamp((x - a) / (b - a), 0, 1));

// 3D value noise. It's sampled by direction on the sphere, so there is
// no seam where the texture wraps and no pinching at the poles.
function hash3(x, y, z) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function noise3(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fx = ease(x - xi);
  const fy = ease(y - yi);
  const fz = ease(z - zi);
  const c000 = hash3(xi, yi, zi);
  const c100 = hash3(xi + 1, yi, zi);
  const c010 = hash3(xi, yi + 1, zi);
  const c110 = hash3(xi + 1, yi + 1, zi);
  const c001 = hash3(xi, yi, zi + 1);
  const c101 = hash3(xi + 1, yi, zi + 1);
  const c011 = hash3(xi, yi + 1, zi + 1);
  const c111 = hash3(xi + 1, yi + 1, zi + 1);
  const x00 = c000 + (c100 - c000) * fx;
  const x10 = c010 + (c110 - c010) * fx;
  const x01 = c001 + (c101 - c001) * fx;
  const x11 = c011 + (c111 - c011) * fx;
  const y0 = x00 + (x10 - x00) * fy;
  const y1 = x01 + (x11 - x01) * fy;
  return y0 + (y1 - y0) * fz;
}

function fbm3(x, y, z, octaves) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += noise3(x * f + i * 19.19, y * f + i * 7.7, z * f + i * 31.3) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

// The band's plane (its normal n) and the direction of its core (c).
function galaxyBasis() {
  const p = new THREE.Vector3(...sphericalToVec3(BAND_POINT.yaw, BAND_POINT.pitch, 1));
  const c = new THREE.Vector3(...sphericalToVec3(CORE_POINT.yaw, CORE_POINT.pitch, 1));
  const n = new THREE.Vector3().crossVectors(p, c).normalize();
  return { nx: n.x, ny: n.y, nz: n.z, cx: c.x, cy: c.y, cz: c.z };
}

// How much milky-way light there is in a given direction. Both the mist
// texture and the star points use this, so the stars cling to the same
// bright clouds and avoid the same dark dust. Results go into `out`, and
// it returns false when the direction is too far from the band to bother.
function sampleBand(dx, dy, dz, B, out) {
  const sinb = dx * B.nx + dy * B.ny + dz * B.nz;
  if (Math.abs(sinb) > 0.52) return false;

  const bandAngle = Math.asin(sinb);
  const cosC = clamp(dx * B.cx + dy * B.cy + dz * B.cz, -1, 1);
  const angC = Math.acos(cosC);
  const bulge = Math.exp(-(angC * angC) / (0.55 * 0.55));

  // The band meanders instead of running dead straight
  const warp = (fbm3(dx * 2.1 + 31, dy * 2.1 + 7, dz * 2.1 + 13, 2) - 0.5) * 0.22;
  const bw = bandAngle + warp;

  // A thin bright band inside a wide faint halo; it swells near the core
  const width = 0.09 * (1 + 0.9 * bulge);
  const core = Math.exp(-(bw * bw) / (width * width));
  const halo = 0.28 * Math.exp(-(bw * bw) / (0.3 * 0.3));

  // Clumpy star clouds and fine grain
  const clumps = fbm3(dx * 5.5 + 90, dy * 5.5 + 45, dz * 5.5 + 12, 3);
  const density = 0.45 + 1.1 * smoothstep(0.3, 0.72, clumps);
  const grain = fbm3(dx * 18 + 3, dy * 18 + 55, dz * 18 + 80, 2);
  let light = (core * density + halo) * (0.7 + 0.6 * grain) * (0.55 + 0.9 * bulge);

  // Dark dust: a thin rift down the middle plus patches along the band
  const dust = fbm3(dx * 7.5 + 200, dy * 7.5 + 120, dz * 7.5 + 60, 3);
  const laneShift = (fbm3(dx * 3 + 310, dy * 3 + 11, dz * 3 + 93, 1) - 0.5) * 0.07;
  const laneOff = bw - laneShift - 0.01;
  const lane = Math.exp(-(laneOff * laneOff) / (0.03 * 0.03));
  const patches = smoothstep(0.5, 0.72, dust);
  const absorb = Math.min(
    1,
    patches * (0.35 + 0.65 * lane) * 1.1 + lane * 0.35 * smoothstep(0.35, 0.6, dust)
  );
  light *= 1 - 0.82 * absorb;

  // Faint rosy emission clouds along the core of the band
  const neb =
    smoothstep(0.6, 0.78, fbm3(dx * 4 + 500, dy * 4 + 250, dz * 4 + 330, 2)) * core * (1 - absorb);

  out.soft = 1 - Math.exp(-1.3 * light); // soft-clipped so the core never blows out
  out.bulge = bulge;
  out.neb = neb;
  return true;
}

function paintMilkyWay(ctx, w, h) {
  const B = galaxyBasis();
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const s = { soft: 0, bulge: 0, neb: 0 };
  const k = STRENGTH * 255;

  const cosPhi = new Float32Array(w);
  const sinPhi = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const phi = ((x + 0.5) / w) * Math.PI * 2;
    cosPhi[x] = Math.cos(phi);
    sinPhi[x] = Math.sin(phi);
  }

  for (let y = 0; y < h; y++) {
    const theta = ((y + 0.5) / h) * Math.PI;
    const sinT = Math.sin(theta);
    const dy = Math.cos(theta);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      data[i + 3] = 255;
      // This is the direction Three.js's SphereGeometry puts at this
      // texel, so the band lands where the stars expect it.
      const dx = -cosPhi[x] * sinT;
      const dz = sinPhi[x] * sinT;
      if (!sampleBand(dx, dy, dz, B, s)) continue;

      // Cool blue-white in the arms, warm gold toward the core
      const warm = Math.min(1, s.bulge * 1.3 + 0.1);
      const r = lerp(0.5, 1.0, warm);
      const g = lerp(0.62, 0.82, warm);
      const b = lerp(0.95, 0.58, warm);
      data[i] = Math.min(255, (r * s.soft + s.neb * 0.5) * k);
      data[i + 1] = Math.min(255, (g * s.soft + s.neb * 0.1) * k);
      data[i + 2] = Math.min(255, (b * s.soft + s.neb * 0.22) * k);
    }
  }
  ctx.putImageData(img, 0, 0);
}

let cachedTexture = null;

// Built once and reused, like the planet textures.
export function milkyWayTexture() {
  if (!cachedTexture) {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 384;
    paintMilkyWay(canvas.getContext("2d"), canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    cachedTexture = texture;
  }
  return cachedTexture;
}

// Thousands of tiny stars thrown onto the sky, kept wherever the mist
// is bright. This is what makes it read as a galaxy instead of a smear.
export function milkyWayStars(radius, count = 6000) {
  const rand = seeded(8675309);
  const B = galaxyBasis();
  const s = { soft: 0, bulge: 0, neb: 0 };
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  let made = 0;

  for (let tries = 0; made < count && tries < count * 600; tries++) {
    const z = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    const dx = r * Math.cos(a);
    const dy = z;
    const dz = r * Math.sin(a);

    if (!sampleBand(dx, dy, dz, B, s)) continue;
    if (rand() > Math.min(1, s.soft * 1.4)) continue;

    positions[made * 3] = dx * radius;
    positions[made * 3 + 1] = dy * radius;
    positions[made * 3 + 2] = dz * radius;

    const warm = Math.min(1, rand() * 0.4 + s.bulge * 0.7);
    const bright = 0.45 + rand() * rand() * 0.55;
    colors[made * 3] = lerp(0.78, 1.0, warm) * bright;
    colors[made * 3 + 1] = lerp(0.86, 0.88, warm) * bright;
    colors[made * 3 + 2] = lerp(1.0, 0.72, warm) * bright;
    made++;
  }

  return {
    positions: positions.slice(0, made * 3),
    colors: colors.slice(0, made * 3),
    count: made,
  };
}