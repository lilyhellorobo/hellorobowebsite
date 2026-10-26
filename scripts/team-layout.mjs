/**
 * Team canvas layout generator → src/blocks/team/team-layout.json
 * Run: npm run team:layout   (deterministic: same output every run)
 *
 * The Team page canvas repeats one big tile (PERIOD_W × PERIOD_H) in every direction.
 * The tile is built from the Figma frame "team" (10104:170) — the composition that looks
 * right — so every part of the canvas has Figma's arrangement and spacing:
 * - The Figma frame wasn't drawn to repeat (objects run off its edges), so its repeat size
 *   is the smallest at which the seams are as roomy as Figma's own tightest pair.
 * - 3 × 3 copies of it, staggered A B C / B C A / C A B. The first copy is the Figma frame
 *   itself (with Figma's labels; the page opens on it); in the others the objects in the
 *   Figma spots are swapped around (simulated annealing) so the same object is as far
 *   from itself as possible, every object appears about equally often, and no gap gets
 *   tighter than Figma's.
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
// Where each object's body is inside its image (1×), without its shadow: measured from
// the renders' sharp edges (shadows are soft, so they don't count). The images have wide,
// uneven margins — the robot fills 50–150 of its 349 — so spacing and labels use these.
const VISIBLE = {
  bite_first_05: [14, 26, 295, 184],
  bright_ideas_01: [25, 5, 224, 222],
  cat_mode_active: [15, 12, 157, 236],
  good_chaos_13: [36, 6, 222, 217],
  hello_robo: [50, 2, 150, 254],
  inner_calm_02: [8, 23, 222, 172],
  nuts_about_details_03: [14, 6, 160, 169],
  seriously_playful: [17, 16, 158, 194],
  tiny_obsession_12: [22, 9, 152, 179],
};
// Where each label is centred (1×): the object's visual middle, checked by eye — the box
// middle for most, the body for the cat and the squirrel (not the tail), the star for the
// keychain (not the ring), the standing hand for the breakdancer
const LABEL_CX = {
  bite_first_05: 155,
  bright_ideas_01: 127,
  cat_mode_active: 82,
  good_chaos_13: 128,
  hello_robo: 100,
  inner_calm_02: 115,
  nuts_about_details_03: 89,
  seriously_playful: 88,
  tiny_obsession_12: 92,
};
// How far each object's shadow reaches to the right (1×, measured from the renders: the
// rightmost pixel that isn't white). It varies a lot — the robot's shadow runs 330 of its
// 349, nearly twice the robot's width — so a fixed allowance left the robot's shadow
// almost touching its neighbour.
const SHADOW_RIGHT = {
  bite_first_05: 372,
  bright_ideas_01: 278,
  cat_mode_active: 213,
  good_chaos_13: 342,
  hello_robo: 330,
  inner_calm_02: 300,
  nuts_about_details_03: 210,
  seriously_playful: 279,
  tiny_obsession_12: 286,
};
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

let PERIOD_W = 0; // set below: the tile size
let PERIOD_H = 0;
const LABEL_H = 17; // 14px text
const LABEL_GAP = 40; // label text top below the object's body (a little more than Figma's 24)
const LABEL_CHAR = 8.4; // 14px uppercase label: width per character

// ── tiny seeded random (deterministic output)
let seed = 20261026;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// An object's footprint relative to its image centre: the visible object (+ shadow) and
// its label, centred under the object's visual middle (Figma objects keep Figma's text).
const labelOf = (p) => {
  const [, , , y1] = VISIBLE[p.key];
  const text = p.pinned && p.label ? p.label : LABELS[p.key];
  return { cx: LABEL_CX[p.key], top: y1 + LABEL_GAP, w: text.length * LABEL_CHAR };
};
const box = (p) => {
  const [w, h] = SIZE[p.key];
  const [x0, y0, x1, y1] = VISIBLE[p.key];
  const l = labelOf(p);
  const left = Math.min(x0, l.cx - l.w / 2);
  const right = Math.max(x1, SHADOW_RIGHT[p.key], l.cx + l.w / 2);
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

// ── The Figma frame is the tile. It wasn't drawn to repeat (objects run off its edges), so
// find the smallest repeat size at which the seams are as roomy as Figma's own tightest
// pair. Then three versions of it sit side by side — same Figma positions, different
// objects in them — so the canvas never shows the same arrangement twice in a row.
const figmaObjects = FIGMA.map(([key, x, y, label]) => {
  const [w, h] = SIZE[key];
  return { key, x: x + w / 2, y: y + h / 2, pinned: true, label };
});
const pairGaps = (pts) => pts.map((a) => Math.min(...pts.filter((b) => b !== a).map((b) => gapOf(a, b))));
PERIOD_W = 100000;
PERIOD_H = 100000;
const FIGMA_MIN = Math.min(...pairGaps(figmaObjects));
console.log('Figma tightest gap', Math.round(FIGMA_MIN));

let size = null;
for (let H = 1117; H <= 1700 && !size; H += 10)
  for (let W = 1728; W <= 2400; W += 10) {
    PERIOD_W = W;
    PERIOD_H = H;
    if (Math.min(...pairGaps(figmaObjects)) >= FIGMA_MIN - 0.5) {
      size = { W, H };
      break;
    }
  }
if (!size) throw new Error('no repeat size found');
console.log('tile', size.W, '×', size.H);

// Versions B and C: the objects swapped around (a permutation of the 9 kinds), chosen at
// random among many for: no gap tighter than Figma's, the same object as far from itself
// as possible across all three versions, and nothing landing on its own spot in the
// neighbouring version
const VERSIONS = 3;
PERIOD_W = size.W * VERSIONS;
PERIOD_H = size.H * VERSIONS;
const dist = (a, b) => Math.hypot(wrapD(a.x - b.x, PERIOD_W), wrapD(a.y - b.y, PERIOD_H));
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// Rows staggered like a Latin square (A B C / B C A / C A B), so a version never sits
// right above itself either
const build = (maps) =>
  Array.from({ length: VERSIONS * VERSIONS }, (_, cell) => {
    const col = cell % VERSIONS;
    const row = Math.floor(cell / VERSIONS);
    const v = (col + row) % VERSIONS;
    return figmaObjects.map((o) => ({
      ...o,
      key: maps[v][o.key],
      x: o.x + col * size.W,
      y: o.y + row * size.H,
      pinned: cell === 0,
      label: cell === 0 ? o.label : null,
    }));
  }).flat();
// Score: the closest same-object pair (higher is better), with gaps tighter than Figma's
// tightest pair heavily penalised; then the sum of near same-object pairs breaks ties
const score = (pts) => {
  let tightPen = 0;
  let tight = Infinity;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      if (Math.abs(wrapD(pts[i].x - pts[j].x, PERIOD_W)) > 700 || Math.abs(wrapD(pts[i].y - pts[j].y, PERIOD_H)) > 600) continue;
      const g = gapOf(pts[i], pts[j]);
      tight = Math.min(tight, g);
      if (g < FIGMA_MIN - 10) tightPen += FIGMA_MIN - 10 - g;
    }
  let same = Infinity;
  let near = 0;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      if (pts[i].key === pts[j].key) {
        const d = dist(pts[i], pts[j]);
        same = Math.min(same, d);
        if (d < 1300) near += (1300 - d) ** 2;
      }
  // every object about equally often
  const counts = {};
  for (const p of pts) counts[p.key] = (counts[p.key] || 0) + 1;
  const even = pts.length / KEYS.length;
  const countPen = KEYS.reduce((t, k) => t + Math.max(0, Math.abs((counts[k] || 0) - even) - 1) ** 2, 0);
  return { tight, same, value: -near / 1e3 - tightPen * 50 - countPen * 40 };
};
// Start: every non-Figma copy gets the 9 kinds shuffled over its 13 spots, then swap the
// kinds of two objects (outside the Figma tile) whenever that improves the score
const identity = Object.fromEntries(KEYS.map((k) => [k, k]));
const maps = [identity];
for (let v = 1; v < VERSIONS; v++) {
  const perm = shuffle(KEYS);
  maps.push(Object.fromEntries(KEYS.map((k, i) => [k, perm[i]])));
}
const pts = build(maps);
const free = pts.filter((p) => !p.pinned);
// (simulated annealing: early on a slightly worse swap is sometimes kept, to get out of
// dead ends; the best arrangement seen is what's kept)
let sc = score(pts);
let bestKeys = pts.map((p) => p.key);
let bestSc = sc;
const ITER = 40000;
for (let it = 0; it < ITER; it++) {
  // either swap two objects' kinds or give one object another kind
  const a = free[Math.floor(rand() * free.length)];
  const b = rand() < 0.5 ? free[Math.floor(rand() * free.length)] : null;
  const before = [a.key, b && b.key];
  if (b) {
    if (a === b || a.key === b.key) continue;
    [a.key, b.key] = [b.key, a.key];
  } else {
    const k = KEYS[Math.floor(rand() * KEYS.length)];
    if (k === a.key) continue;
    a.key = k;
  }
  const next = score(pts);
  const temp = 400 * (1 - it / ITER);
  if (next.value >= sc.value || rand() < Math.exp((next.value - sc.value) / Math.max(temp, 1e-3))) {
    sc = next;
    if (sc.value > bestSc.value) {
      bestSc = sc;
      bestKeys = pts.map((p) => p.key);
    }
  } else {
    a.key = before[0];
    if (b) b.key = before[1];
  }
}
pts.forEach((p, i) => (p.key = bestKeys[i]));
sc = bestSc;
console.log('tightest gap', Math.round(sc.tight), '(Figma', Math.round(FIGMA_MIN) + ')', '· same object closest', Math.round(sc.same));
console.log('objects', pts.length, 'in', PERIOD_W, '×', PERIOD_H);
console.log('counts', JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, pts.filter((p) => p.key === k).length]))));

// ── Output: image top-left, label centre / text top relative to the image box
const out = pts.map((p) => {
  const [w, h] = SIZE[p.key];
  return {
    key: p.key,
    label: p.pinned && p.label ? p.label : LABELS[p.key],
    x: Math.round(p.x - w / 2),
    y: Math.round(p.y - h / 2),
    labelX: Math.round(labelOf(p).cx),
    labelY: Math.round(labelOf(p).top),
  };
});
writeFileSync(
  new URL('../src/blocks/team/team-layout.json', import.meta.url),
  JSON.stringify({ periodW: PERIOD_W, periodH: PERIOD_H, items: out }, null, 1) + '\n',
);
