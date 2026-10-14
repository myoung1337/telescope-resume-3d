import * as THREE from "three";

export function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

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

// Wooden floorboards: ~85 planks across the room, staggered end joints,
// slight color variation per board, faint grain.
export function makePlankTexture(seed = 11) {
  const rand = seeded(seed);
  return canvasTexture(2048, 2048, (ctx, w, h) => {
    ctx.fillStyle = "#1e130a"; // shows through as the gaps between boards
    ctx.fillRect(0, 0, w, h);
    const plankW = 24;
    for (let x = 0; x < w; x += plankW) {
      let y = -rand() * 600;
      while (y < h) {
        const len = 350 + rand() * 650;
        ctx.fillStyle = `hsl(${22 + rand() * 8}, ${35 + rand() * 12}%, ${14 + rand() * 9}%)`;
        ctx.fillRect(x + 1, y + 1, plankW - 2, len - 2);
        for (let g = 0; g < 5; g++) {
          const gx = x + 3 + rand() * (plankW - 6);
          ctx.strokeStyle = `rgba(0,0,0,${0.06 + rand() * 0.1})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx, y + 2);
          ctx.lineTo(gx + (rand() - 0.5) * 3, y + len - 2);
          ctx.stroke();
        }
        y += len;
      }
    }
  });
}

// Night-sky gradient seen through the slit: near-black at the zenith,
// deep blue toward the horizon.
export function makeSkyTexture() {
  return canvasTexture(8, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#02040c");
    g.addColorStop(0.55, "#07102a");
    g.addColorStop(1, "#14234a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

// Joins nearby stars into little constellation chains. Uses whatever
// strokeStyle / fillStyle the caller has already set.
function drawConstellations(ctx, stars, rand, { count, maxLink, lineWidth }) {
  const used = new Set();
  ctx.lineWidth = lineWidth;
  for (let c = 0; c < count; c++) {
    const start = Math.floor(rand() * stars.length);
    if (used.has(start)) continue;
    const chain = [start];
    used.add(start);
    const target = 4 + Math.floor(rand() * 3);
    while (chain.length < target) {
      const last = stars[chain[chain.length - 1]];
      let best = -1;
      let bestDist = maxLink;
      for (let j = 0; j < stars.length; j++) {
        if (used.has(j)) continue;
        const d = Math.hypot(stars[j].x - last.x, stars[j].y - last.y);
        if (d < bestDist) {
          bestDist = d;
          best = j;
        }
      }
      if (best < 0) break;
      chain.push(best);
      used.add(best);
    }
    if (chain.length < 3) continue;
    ctx.beginPath();
    chain.forEach((j, k) => {
      if (k === 0) ctx.moveTo(stars[j].x, stars[j].y);
      else ctx.lineTo(stars[j].x, stars[j].y);
    });
    ctx.stroke();
    chain.forEach((j) => {
      ctx.beginPath();
      ctx.arc(stars[j].x, stars[j].y, stars[j].r + 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// An aged-paper star chart: ink stars joined into constellations, with
// either a rectangular border + grid or a round planisphere dial.
export function makeStarChartTexture({ seed = 1, round = false, title = "", width = 512, height = 640 }) {
  const rand = seeded(seed);
  return canvasTexture(width, height, (ctx, w, h) => {
    ctx.fillStyle = "#d8c7a0";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(120, 80, 30, ${0.02 + rand() * 0.04})`;
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, 20 + rand() * 70, 0, Math.PI * 2);
      ctx.fill();
    }
    const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    edge.addColorStop(0, "rgba(60, 35, 10, 0)");
    edge.addColorStop(1, "rgba(60, 35, 10, 0.5)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);

    const ink = "#2a1c10";
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;

    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.4;
    const fontPx = Math.round(Math.min(w, h) * 0.06);
    const topClear = title ? 22 + fontPx * 2.4 : 34;

    if (round) {
      [1, 0.68, 0.36].forEach((k, i) => {
        ctx.lineWidth = i === 0 ? 2.5 : 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R * k, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.lineWidth = 1;
      for (let a = 0; a < 360; a += 5) {
        const rad = (a * Math.PI) / 180;
        const len = a % 30 === 0 ? 14 : 7;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
        ctx.lineTo(cx + Math.cos(rad) * (R + len), cy + Math.sin(rad) * (R + len));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();
    } else {
      ctx.lineWidth = 3;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.lineWidth = 1;
      ctx.strokeRect(22, 22, w - 44, h - 44);
      ctx.globalAlpha = 0.3;
      for (let x = 76; x < w - 22; x += 54) {
        ctx.beginPath();
        ctx.moveTo(x, 22);
        ctx.lineTo(x, h - 22);
        ctx.stroke();
      }
      for (let y = 76; y < h - 22; y += 54) {
        ctx.beginPath();
        ctx.moveTo(22, y);
        ctx.lineTo(w - 22, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    const stars = [];
    const target = round ? 170 : 150;
    while (stars.length < target) {
      const x = round ? cx + (rand() * 2 - 1) * R : 34 + rand() * (w - 68);
      const y = round ? cy + (rand() * 2 - 1) * R : topClear + rand() * (h - topClear - 34);
      if (round && Math.hypot(x - cx, y - cy) > R * 0.96) continue;
      stars.push({ x, y, r: 0.8 + rand() * rand() * 2.6 });
    }
    ctx.fillStyle = ink;
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(42, 28, 16, 0.75)";
    drawConstellations(ctx, stars, rand, { count: 9, maxLink: w * 0.2, lineWidth: 1.2 });

    if (title) {
      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `italic ${fontPx}px Georgia, "Times New Roman", serif`;
      ctx.fillText(title, w / 2, 22 + fontPx * 1.2);
    }
  });
}

// Equirectangular celestial globe: navy ground, brass graticule, the
// ecliptic, stars and constellation lines.
export function makeGlobeTexture() {
  const rand = seeded(5);
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#08122b");
    bg.addColorStop(0.5, "#122352");
    bg.addColorStop(1, "#08122b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(214, 176, 98, 0.32)";
    ctx.lineWidth = 1.2;
    for (let lon = 0; lon <= 360; lon += 15) {
      const x = (lon / 360) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(240, 200, 120, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const y = h / 2 - Math.sin((x / w) * Math.PI * 2) * ((23.5 / 180) * h);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const stars = [];
    for (let i = 0; i < 420; i++) {
      stars.push({ x: rand() * w, y: 12 + rand() * (h - 24), r: 0.8 + rand() * rand() * 2.4 });
    }
    ctx.fillStyle = "#f2e6c4";
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(242, 230, 196, 0.6)";
    drawConstellations(ctx, stars, rand, { count: 22, maxLink: 48, lineWidth: 1.4 });
  });
}