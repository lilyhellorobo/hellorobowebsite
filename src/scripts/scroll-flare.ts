/**
 * Edge flare — after the reference recording: a picture near the top or the bottom of the
 * screen bends outward there, as if it wrapped round the screen edge. The rows of the
 * picture inside the edge band (EDGE of the screen height) are stretched sideways, more the
 * closer they are to the edge, so its corners flare out in a curve; the rest stays as it is.
 *
 * Drawn on a canvas laid over the picture while it's in a band (the picture itself is hidden
 * meanwhile): the part outside the bands in one piece, the band one thin row at a time, each
 * row stretched with the browser's smoothing — so edges and lines stay clean (an SVG
 * displacement filter did this before, but it moves whole pixels and looked stepped).
 * Used by scroll-squash.ts for the pictures of the content blocks only.
 */

/** share of the screen height the bend takes, at the top and at the bottom */
const EDGE = 0.15;
/** how far the corners flare out, as a share of the picture's width (px cap) */
const AMOUNT = 0.012;
const MAX_PX = 10;

type Flare = { img: HTMLImageElement; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; key: string; on: boolean };
const flares = new WeakMap<HTMLElement, Flare | null>();

const pictureOf = (el: HTMLElement) => (el instanceof HTMLImageElement ? el : el.querySelector('img'));

function make(el: HTMLElement): Flare | null {
  const img = pictureOf(el);
  const host = img?.parentElement;
  if (!img || !host) return null;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const canvas = document.createElement('canvas');
  canvas.className = 'flare-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;pointer-events:none;display:none';
  img.after(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return { img, canvas, ctx, key: '', on: false };
}

/** the part of the image that object-fit shows in the box (cover, or the whole image) */
function source(img: HTMLImageElement, w: number, h: number) {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const cs = getComputedStyle(img);
  if (cs.objectFit !== 'cover') return { sx: 0, sy: 0, sw: nw, sh: nh };
  const k = Math.max(w / nw, h / nh);
  const sw = w / k;
  const sh = h / k;
  const [px, py] = cs.objectPosition.split(' ').map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5));
  return { sx: (nw - sw) * px, sy: (nh - sh) * (py ?? 0.5), sw, sh };
}

function hide(f: Flare) {
  f.canvas.style.display = 'none';
  f.img.style.visibility = '';
  f.on = false;
  f.key = '';
}

/** bends `el` by where it is on screen (call on scroll for the pictures on screen) */
export function flare(el: HTMLElement) {
  let f = flares.get(el);
  if (f === undefined) flares.set(el, (f = make(el)));
  if (!f) return;
  const { img, canvas, ctx } = f;
  const r = img.getBoundingClientRect();
  const vh = innerHeight;
  const band = vh * EDGE;
  const inBand = r.width > 0 && r.bottom > 0 && r.top < vh && (r.top < band || r.bottom > vh - band);
  // still fading / rising in (image-reveal.ts): show the picture itself for that
  const revealing = [el, img].some((n) => n.getAnimations().some((an) => an.playState === 'running' || an.playState === 'paused'));
  if (!inBand || revealing || !img.complete || !img.naturalWidth) {
    if (f.on) hide(f);
    return;
  }
  // in the picture's own (unscaled) pixels
  const w = img.offsetWidth;
  const h = img.offsetHeight;
  const k = h / (r.height || h);
  const out = Math.min(MAX_PX, w * AMOUNT);
  const pad = Math.ceil(out) + 1;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const key = `${Math.round(r.top * 2)}|${w}|${h}|${vh}|${dpr}`;
  if (key === f.key) return;
  f.key = key;

  if (!f.on) {
    canvas.style.display = 'block';
    img.style.visibility = 'hidden';
    f.on = true;
  }
  canvas.style.left = `${img.offsetLeft - pad}px`;
  canvas.style.top = `${img.offsetTop}px`;
  canvas.style.width = `${w + pad * 2}px`;
  canvas.style.height = `${h}px`;
  const cw = Math.round((w + pad * 2) * dpr);
  const ch = Math.round(h * dpr);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  } else ctx.clearRect(0, 0, cw, ch);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const s = source(img, w, h);
  // how much a row (picture px from its top) bends: 0 in the middle, 1 at the screen edge
  const bend = (y: number) => {
    const sy = r.top + y / k;
    const t = sy < band ? (band - sy) / band : sy > vh - band ? (sy - (vh - band)) / band : 0;
    const c = Math.min(1, Math.max(0, t));
    return c * c;
  };
  const row = (y0: number, y1: number, b: number) => {
    const dw = w + 2 * out * b;
    ctx.drawImage(
      img,
      s.sx, s.sy + (y0 / h) * s.sh, s.sw, ((y1 - y0) / h) * s.sh,
      (pad + (w - dw) / 2) * dpr, y0 * dpr, dw * dpr, (y1 - y0) * dpr,
    );
  };
  // one device pixel high rows where it bends, one piece where it doesn't
  const step = 1 / dpr;
  let y = 0;
  while (y < h) {
    if (bend(y + step / 2) === 0) {
      let end = y + step;
      while (end < h && bend(end + step / 2) === 0) end += step;
      row(y, Math.min(h, end), 0);
      y = end;
    } else {
      row(y, Math.min(h, y + step), bend(y + step / 2));
      y += step;
    }
  }
}

/** keeps the canvas in step with the squash when the picture itself is what squashes */
export function flareScale(el: HTMLElement) {
  const f = flares.get(el);
  if (f && f.img === el) f.canvas.style.scale = el.style.scale;
}

export function unflare(el: HTMLElement) {
  const f = flares.get(el);
  if (f?.on) hide(f);
}
