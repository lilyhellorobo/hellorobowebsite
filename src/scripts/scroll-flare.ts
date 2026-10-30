/**
 * Edge flare — after the reference recording: a picture near the top or the bottom of the
 * screen bends outward there, as if it wrapped round the screen edge. The rows of the
 * picture inside the edge band (EDGE of the screen height) are stretched sideways, more the
 * closer they are to the edge, so its corners flare out in a curve; the rest stays as it is.
 *
 * Done with an SVG filter per picture (CSS can't bend): a displacement map made of a
 * left-to-right ramp (how far each column moves, outward from the middle) times a top /
 * bottom ramp placed where the screen edges cross the picture (how much each row moves).
 * The ramps are moved as the page scrolls; pictures outside the bands carry no filter.
 * Used by scroll-squash.ts for the pictures of the content blocks only (it is heavy).
 */

const NS = 'http://www.w3.org/2000/svg';
/** share of the screen height the bend takes, at the top and at the bottom */
const EDGE = 0.15;
/** how far the corners flare out, as a share of the picture's width (px cap) */
const AMOUNT = 0.012;
const MAX_PX = 10;

const svgUrl = (body: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="${NS}" width="16" height="16" viewBox="0 0 16 16" preserveAspectRatio="none">${body}</svg>`)}`;
const grey = (v: number) => {
  const c = Math.round(v * 255);
  return `rgb(${c},${c},${c})`;
};
/** 0 → 1 easing in (quadratic), top to bottom; `flip` for 1 → 0 */
const ramp = (flip: boolean) => {
  const stops = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => `<stop offset="${t}" stop-color="${grey(flip ? (1 - t) ** 2 : t * t)}"/>`)
    .join('');
  return svgUrl(`<linearGradient id="g" x2="0" y2="1">${stops}</linearGradient><rect width="16" height="16" fill="url(#g)"/>`);
};
// sideways: red 1 on the left to 0 on the right (green 0.5: no up / down move)
const ACROSS = svgUrl(
  `<linearGradient id="g"><stop offset="0" stop-color="rgb(255,128,0)"/><stop offset="1" stop-color="rgb(0,128,0)"/></linearGradient><rect width="16" height="16" fill="url(#g)"/>`,
);
const TOP = ramp(true);
const BOTTOM = ramp(false);

let defs: SVGDefsElement | null = null;
let count = 0;
type Flare = { filter: SVGFilterElement; across: SVGFEImageElement; top: SVGFEImageElement; bottom: SVGFEImageElement; map: SVGFEDisplacementMapElement; on: boolean };
const flares = new WeakMap<HTMLElement, Flare>();

const node = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent?.append(el);
  return el;
};
const set = (el: Element, attrs: Record<string, number>) => {
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v.toFixed(1));
};

function make(): Flare {
  if (!defs) {
    const svg = node('svg', { width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute;width:0;height:0' });
    defs = node('defs', {}, svg);
    document.body.append(svg);
  }
  const filter = node('filter', { id: `flare-${++count}`, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' }, defs);
  const image = (href: string, result: string) => node('feImage', { href, preserveAspectRatio: 'none', result }, filter);
  const across = image(ACROSS, 'across');
  node('feFlood', { 'flood-color': '#000', result: 'none' }, filter);
  const top = image(TOP, 'top');
  const bottom = image(BOTTOM, 'bottom');
  const rows = node('feMerge', { result: 'rows' }, filter);
  for (const n of ['none', 'top', 'bottom']) node('feMergeNode', { in: n }, rows);
  // 0.5 (no move) + (across − 0.5) × rows
  node('feComposite', { in: 'across', in2: 'rows', operator: 'arithmetic', k1: 1, k2: 0, k3: -0.5, k4: 0.5, result: 'map' }, filter);
  const map = node('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G' }, filter);
  return { filter, across, top, bottom, map, on: false };
}

/** bends `el` by where it is on screen (call on scroll for the pictures on screen) */
export function flare(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const vh = innerHeight;
  const band = vh * EDGE;
  const inBand = r.width > 0 && r.bottom > 0 && r.top < vh && (r.top < band || r.bottom > vh - band);
  let f = flares.get(el);
  if (!inBand) {
    if (f?.on) {
      el.style.filter = '';
      f.on = false;
    }
    return;
  }
  if (!f) flares.set(el, (f = make()));
  // in the element's own (unscaled) pixels
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const k = h / (r.height || h);
  const out = Math.min(MAX_PX, w * AMOUNT);
  const pad = out + 2;
  set(f.filter, { x: -pad, y: 0, width: w + pad * 2, height: h });
  set(f.across, { x: -pad, y: 0, width: w + pad * 2, height: h });
  set(f.top, { x: -pad, y: -r.top * k, width: w + pad * 2, height: band * k });
  set(f.bottom, { x: -pad, y: (vh - band - r.top) * k, width: w + pad * 2, height: band * k });
  // the edge columns move `out` px at full bend
  f.map.setAttribute('scale', (2 * out * (w + pad * 2) / w).toFixed(1));
  if (!f.on) {
    el.style.filter = `url(#${f.filter.id})`;
    f.on = true;
  }
}

export function unflare(el: HTMLElement) {
  const f = flares.get(el);
  if (f?.on) {
    el.style.filter = '';
    f.on = false;
  }
}
