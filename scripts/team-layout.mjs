/**
 * Team canvas layout generator → src/blocks/team/team-layout.json
 * Run: npm run team:layout   (deterministic: same output every run)
 *
 * The Team page canvas repeats one big tile (PERIOD_W × PERIOD_H) in every direction.
 * - The 13 objects of the Figma frame "team" (10104:170) are pinned exactly where Figma
 *   has them, with Figma's labels, so the page opens on the Figma frame.
 * - The rest of the tile is filled with more objects spaced like Figma: the gap between
 *   neighbours (edge to edge, each object counted as its image + label) is measured on
 *   the Figma frame, and the free objects are pushed apart / pulled together until every
 *   object's nearest neighbours sit at that gap — no clumps, no holes, also across the
 *   tile's edges (the tile wraps).
 * - Object kinds are spread so the same object is never close to itself and every
 *   object appears about equally often.
 */
import { writeFileSync } from 'node:fs';

// Figma image box sizes (1×) — the exports in src/assets/team/objects are 2× these
const SIZE = {
  good_chaos_13: [356, 220],
  tiny_obsession_12: [296, 197],
  cat_mode_active: [215, 253],
  inner_calm_02: [313, 189],
  nuts_about_details_03: [277, 171],
  hello_robo: [349, 255],
  seriously_playful: [300, 200],
  bite_first_05: [378, 189],
  bright_ideas_01: [293, 229],
};
const KEYS = Object.keys(SIZE);
// Where each object actually is inside its image (1×, measured from the renders: pixels
// darker than the light shadow). The images have wide, uneven margins — the robot fills
// 51–157 of its 349 — so spacing by the image boxes left some objects crowded and others
// far apart. Spacing uses these instead (plus a bit for the shadow to the right).
const VISIBLE = {
  bite_first_05: [15, 27, 355, 183],
  bright_ideas_01: [26, 6, 224, 222],
  cat_mode_active: [16, 13, 179, 236],
  good_chaos_13: [36, 7, 282, 216],
  hello_robo: [51, 4, 157, 254],
  inner_calm_02: [8, 24, 247, 172],
  nuts_about_details_03: [15, 6, 181, 168],
  seriously_playful: [14, 17, 197, 194],
  tiny_obsession_12: [24, 10, 155, 178],
};
const SHADOW = 0.25; // the shadow adds about a quarter of the object's width to the right
// Each object's own label (as Figma names it on its main copy)
const LABELS = {
  hello_robo: 'hello_robo.OBJ',
  inner_calm_02: 'INNER_CALM_02.OBJ',
  bright_ideas_01: 'BRIGHT_IDEAS_01.OBJ',
  bite_first_05: 'WILD_IDEA_FINAL.OBJ',
  tiny_obsession_12: 'TINY_OBSESSION_12.OBJ',
  seriously_playful: 'SERIOUSLY_PLAYFUL.OBJ',
  good_chaos_13: 'GOOD_CHAOS_13.OBJ',
  nuts_about_details_03: 'NUTS_ABOUT_DETAILS_03.OBJ',
  cat_mode_active: 'CAT_MODE_ACTIVE.OBJ',
};

// The Figma frame: image top-left, label text, label frame left / top / width
const FIGMA = [
  ['good_chaos_13', -112, -78, 'BRIGHT_IDEAS_01.OBJ', -72, 155, 200],
  ['tiny_obsession_12', 654, -115, 'TINY_OBSESSION_12.OBJ', 636, 86, 220],
  ['cat_mode_active', 1452.6, -133, 'CAT_MODE_ACTIVE.OBJ', 1440, 118, 206],
  ['inner_calm_02', 274, 192, 'INNER_CALM_02.OBJ', 296, 391, 190],
  ['nuts_about_details_03', 1120, 156, 'NUTS_ABOUT_DETAILS_03.OBJ', 1083, 356, 258],
  ['hello_robo', 739, 336, 'hello_robo.OBJ', 764.5, 618, 167],
  ['good_chaos_13', 1539, 336, 'GOOD_CHAOS_13.OBJ', 1586, 580, 196],
  ['cat_mode_active', -90.4, 422, 'BITE_FIRST_05.OBJ', -87, 673, 174],
  ['seriously_playful', 1244, 589, 'SERIOUSLY_PLAYFUL.OBJ', 1219, 809, 226],
  ['bite_first_05', 277, 649, 'WILD_IDEA_FINAL.OBJ', 342.5, 857, 198],
  ['bright_ideas_01', 875, 871, null, 0, 0, 0],
  ['tiny_obsession_12', -50, 913, null, 0, 0, 0],
  ['inner_calm_02', 1492, 910, null, 0, 0, 0],
];

const PERIOD_W = 3600;
const PERIOD_H = 2400;
const LABEL_H = 17; // 14px text
const LABEL_GAP = 24; // label text top below the object, Figma's typical gap
const LABEL_CHAR = 8.4; // 14px uppercase label: width per character
const SAME_MIN = 1000; // the same object never closer than this (centre to centre)

// ── tiny seeded random
let seed = 20261026;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// An object's footprint relative to its image centre: the visible object (+ shadow) and
// its label. Figma objects keep Figma's label; the others get one centred under the object.
const labelOf = (p) => {
  const [w, h] = SIZE[p.key];
  if (p.pinned && p.label) return { cx: p.lx + p.lw / 2 - (p.fx - w / 2), top: p.ly + 7 - (p.fy - h / 2), w: p.lw - 34 };
  const [x0, , x1, y1] = VISIBLE[p.key];
  const text = p.pinned ? '' : LABELS[p.key];
  return { cx: (x0 + x1) / 2, top: y1 + LABEL_GAP, w: (text || LABELS[p.key]).length * LABEL_CHAR };
};
const box = (p) => {
  const [w, h] = SIZE[p.key];
  const [x0, y0, x1, y1] = VISIBLE[p.key];
  const l = labelOf(p);
  const left = Math.min(x0, l.cx - l.w / 2);
  const right = Math.max(Math.min(w, x1 + (x1 - x0) * SHADOW), l.cx + l.w / 2);
  return { l: left - w / 2, r: right - w / 2, t: y0 - h / 2, b: Math.max(y1, l.top + LABEL_H) - h / 2 };
};
const wrapD = (d, p) => {
  d = ((d % p) + p) % p;
  return d > p / 2 ? d - p : d;
};
// Edge-to-edge gap between two footprints (0 if they overlap), on the torus
const gapOf = (a, b) => {
  const dx = wrapD(b.x - a.x, PERIOD_W);
  const dy = wrapD(b.y - a.y, PERIOD_H);
  const A = box(a);
  const B = box(b);
  const gx = Math.max(dx + B.l - A.r, A.l - (dx + B.r));
  const gy = Math.max(dy + B.t - A.b, A.t - (dy + B.b));
  return Math.hypot(Math.max(0, gx), Math.max(0, gy)) - (gx < 0 && gy < 0 ? Math.min(-gx, -gy) : 0);
};

// ── The Figma frame, spread out: SPREAD > 1 moves its objects apart around the frame's
// centre (sizes unchanged), so everything gets a little more room while keeping Figma's
// arrangement and proportions. Then measure the spacing: each object's nearest gap.
const SPREAD = 1.2;
const CENTRE = { x: 1728 / 2, y: 1117 / 2 };
const pinned = FIGMA.map(([key, x, y, label, lx, ly, lw]) => {
  const [w, h] = SIZE[key];
  const fx = x + w / 2; // Figma image centre
  const fy = y + h / 2;
  return { key, x: CENTRE.x + (fx - CENTRE.x) * SPREAD, y: CENTRE.y + (fy - CENTRE.y) * SPREAD, fx, fy, pinned: true, label, lx, ly, lw };
});
const figmaGaps = pinned.map((a) => Math.min(...pinned.filter((b) => b !== a).map((b) => gapOf(a, b))));
const sorted = [...figmaGaps].sort((a, b) => a - b);
const GAP = sorted[Math.floor(sorted.length / 2)]; // median nearest gap
console.log('Figma nearest gaps', sorted.map(Math.round).join(' '), '→ target gap', Math.round(GAP));

// ── Relax: every pair closer than the target gap is pushed apart; an object whose
// nearest gap is too big is pulled a little toward its neighbour (fills holes)
const dist = (a, b) => Math.hypot(wrapD(a.x - b.x, PERIOD_W), wrapD(a.y - b.y, PERIOD_H));
function relax(pts, iterations) {
  for (let it = 0; it < iterations; it++) {
    const step = 0.5 * (1 - it / iterations) + 0.05;
    const move = pts.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < pts.length; i++) {
      let nearest = Infinity;
      let toward = null;
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;
        const g = gapOf(pts[i], pts[j]);
        const dx = wrapD(pts[i].x - pts[j].x, PERIOD_W);
        const dy = wrapD(pts[i].y - pts[j].y, PERIOD_H);
        const d = Math.hypot(dx, dy) || 1;
        if (g < GAP) {
          const f = (GAP - g) * step;
          move[i].x += (dx / d) * f;
          move[i].y += (dy / d) * f;
        }
        if (g < nearest) {
          nearest = g;
          toward = { x: -dx / d, y: -dy / d };
        }
      }
      if (nearest > GAP * 1.15 && toward) {
        const f = (nearest - GAP) * step * 0.5;
        move[i].x += toward.x * f;
        move[i].y += toward.y * f;
      }
    }
    pts.forEach((p, i) => {
      if (p.pinned) return;
      p.x = (((p.x + move[i].x) % PERIOD_W) + PERIOD_W) % PERIOD_W;
      p.y = (((p.y + move[i].y) % PERIOD_H) + PERIOD_H) % PERIOD_H;
    });
  }
}
const sameMin = (pts) =>
  Math.min(...pts.flatMap((a, i) => pts.slice(i + 1).filter((b) => b.key === a.key).map((b) => dist(a, b))));
const nearestGaps = (pts) => pts.map((a) => Math.min(...pts.filter((b) => b !== a).map((b) => gapOf(a, b)))).sort((a, b) => a - b);
// Biggest hole: the largest empty space (distance from a point to the nearest object
// footprint), sampled on a grid
const footDist = (px, py, p) => {
  const b = box(p);
  const rx = wrapD(px - p.x, PERIOD_W);
  const ry = wrapD(py - p.y, PERIOD_H);
  const dx = Math.max(b.l - rx, rx - b.r);
  const dy = Math.max(b.t - ry, ry - b.b);
  return Math.hypot(Math.max(0, dx), Math.max(0, dy));
};
const biggestHole = (pts, x0 = 0, y0 = 0, w = PERIOD_W, h = PERIOD_H) => {
  let worst = 0;
  for (let y = y0; y < y0 + h; y += 20) for (let x = x0; x < x0 + w; x += 20) worst = Math.max(worst, Math.min(...pts.map((p) => footDist(x, y, p))));
  return worst;
};

// ── Generate a tile with N objects: free ones start on a jittered grid away from the
// Figma objects, then relax, get their kinds (spread out), relax again
function generate(N) {
  seed = 20261026 + N;
  const pts = pinned.map((p) => ({ ...p }));
  const cols = Math.round(Math.sqrt((N * PERIOD_W) / PERIOD_H));
  const rows = Math.ceil(N / cols);
  const cand = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cand.push({ x: ((c + 0.5 + (r % 2) * 0.5) * PERIOD_W) / cols + (rand() - 0.5) * 60, y: ((r + 0.5) * PERIOD_H) / rows + (rand() - 0.5) * 60 });
  const farFromPinned = (p) => Math.min(...pinned.map((q) => dist(p, q)));
  cand.sort((a, b) => farFromPinned(b) - farFromPinned(a));
  const free = cand.slice(0, N - pinned.length).map((p) => ({ ...p, key: KEYS[Math.floor(rand() * KEYS.length)], pinned: false }));
  pts.push(...free);
  relax(pts, 600);

  // Kinds: balanced counts first (round robin over a shuffle), then swap kinds between
  // free objects while it pushes the closest same-object pair further apart
  const order = free.map((_, i) => i).sort(() => rand() - 0.5);
  const counts = Object.fromEntries(KEYS.map((k) => [k, pinned.filter((p) => p.key === k).length]));
  order.forEach((i) => {
    const k = KEYS.reduce((m, k) => (counts[k] < counts[m] ? k : m), KEYS[0]);
    free[i].key = k;
    counts[k]++;
  });
  const pairScore = () => {
    // sum of penalties for same-object pairs closer than SAME_MIN (bigger when closer)
    let pen = 0;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        if (pts[i].key === pts[j].key) {
          const d = dist(pts[i], pts[j]);
          if (d < SAME_MIN * 1.3) pen += (SAME_MIN * 1.3 - d) ** 2;
        }
    return pen;
  };
  let score = pairScore();
  for (let it = 0; it < 6000; it++) {
    const a = free[Math.floor(rand() * free.length)];
    const b = free[Math.floor(rand() * free.length)];
    if (a === b || a.key === b.key) continue;
    [a.key, b.key] = [b.key, a.key];
    const s = pairScore();
    if (s <= score) score = s;
    else [a.key, b.key] = [b.key, a.key];
  }
  relax(pts, 900);
  return { pts, nn: nearestGaps(pts), same: sameMin(pts) };
}

// ── The object count whose relaxed spacing matches Figma best: median nearest gap =
// Figma's, nothing much closer than Figma's closest pair, no bigger gaps than Figma's
const FIGMA_HOLE = biggestHole(pinned, CENTRE.x - 764 * SPREAD, CENTRE.y - 458 * SPREAD, 1528 * SPREAD, 917 * SPREAD);
let best = null;
for (let N = 32; N <= 52; N += 1) {
  const r = generate(N);
  const median = r.nn[r.nn.length >> 1];
  r.hole = biggestHole(r.pts);
  const score =
    Math.abs(median - GAP) +
    Math.max(0, sorted[0] - 10 - r.nn[0]) * 2 +
    Math.max(0, r.nn.at(-1) - sorted.at(-1)) +
    Math.max(0, r.hole - FIGMA_HOLE) +
    Math.max(0, SAME_MIN - r.same) / 4;
  console.log(`N ${N}: gaps ${Math.round(r.nn[0])} / ${Math.round(median)} / ${Math.round(r.nn.at(-1))}, hole ${Math.round(r.hole)}, same ${Math.round(r.same)}`);
  if (!best || score < best.score) best = { ...r, N, score };
}
const { pts } = best;

// ── Report
const s2 = best.nn;
console.log('objects in tile', best.N);
console.log('tile nearest gaps: min', Math.round(s2[0]), 'median', Math.round(s2[s2.length >> 1]), 'max', Math.round(s2.at(-1)));
console.log('figma nearest gaps: min', Math.round(sorted[0]), 'max', Math.round(sorted.at(-1)));
console.log('same object closest', Math.round(best.same));
console.log('biggest hole: tile', Math.round(best.hole), '· Figma frame', Math.round(FIGMA_HOLE));
console.log('counts', JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, pts.filter((p) => p.key === k).length]))));

// ── Output: image top-left, label centre / text top relative to the image box
const out = pts.map((p) => {
  const [w, h] = SIZE[p.key];
  const x = Math.round(p.x - w / 2);
  const y = Math.round(p.y - h / 2);
  const hasFigmaLabel = p.pinned && p.label;
  return {
    key: p.key,
    label: hasFigmaLabel ? p.label : LABELS[p.key],
    x,
    y,
    labelX: Math.round(labelOf(p).cx),
    labelY: Math.round(labelOf(p).top),
  };
});
writeFileSync(
  new URL('../src/blocks/team/team-layout.json', import.meta.url),
  JSON.stringify({ periodW: PERIOD_W, periodH: PERIOD_H, items: out }, null, 1) + '\n',
);
