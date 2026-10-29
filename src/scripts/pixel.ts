/**
 * Pixel helpers shared by the hover effect (button-hover.ts) and the menu reveal: draw
 * something at a fraction of its resolution, leave some blocks out, scale it back up
 * without smoothing — the chunky "pixel" look.
 */

/** Draws `draw` (into a w×h context) at 1/size resolution, drops some blocks, scales up */
export function pixelFrame(
  canvas: HTMLCanvasElement,
  size: number,
  holes: number,
  draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const dpr = canvas.width / canvas.clientWidth || 1;
  const w = Math.max(1, Math.round(canvas.width / dpr / size));
  const h = Math.max(1, Math.round(canvas.height / dpr / size));
  const small = document.createElement('canvas');
  small.width = w;
  small.height = h;
  const s = small.getContext('2d')!;
  draw(s, w, h);
  const img = s.getImageData(0, 0, w, h);
  for (let p = 3; p < img.data.length; p += 4) img.data[p] = img.data[p] > 60 && Math.random() > holes ? 255 : 0;
  s.putImageData(img, 0, 0);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
}

export function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.className = 'hover-fx__pixels';
  canvas.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.ceil(w * dpr);
  canvas.height = Math.ceil(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  return canvas;
}

/** pixel size (relative to the art) and share of blocks left out, frame by frame */
export const ICON_STEPS: [number, number][] = [
  [6, 0.45],
  [4, 0.3],
  [3, 0.2],
  [2, 0.1],
];

/** An <svg> or <img> as a drawable image (currentColor resolved), or null */
export function drawable(el: SVGSVGElement | HTMLImageElement): Promise<CanvasImageSource | null> {
  if (el instanceof HTMLImageElement) return el.decode().then(() => el, () => null);
  const box = el.getBoundingClientRect();
  const svg = el.cloneNode(true) as SVGSVGElement;
  svg.setAttribute('width', String(box.width));
  svg.setAttribute('height', String(box.height));
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML.replaceAll('currentColor', getComputedStyle(el).color))}`;
  return img.decode().then(() => img, () => null);
}

/**
 * Pixelates `el` (an icon or picture) into view: it is hidden, a canvas on top of it goes
 * through the pixel steps, then the real thing comes back. `host` is the positioned box the
 * canvas sits in. Returns a function that stops it early.
 */
export function pixelIn(el: SVGSVGElement | HTMLImageElement, host: HTMLElement, delay = 0, stepMs = 60) {
  const timers: number[] = [];
  let canvas: HTMLCanvasElement | null = null;
  const stop = () => {
    timers.forEach(clearTimeout);
    canvas?.remove();
    el.style.visibility = '';
  };
  el.style.visibility = 'hidden';
  drawable(el).then((art) => {
    if (!art) return stop();
    const box = el.getBoundingClientRect();
    const own = host.getBoundingClientRect();
    canvas = makeCanvas(box.width, box.height);
    canvas.style.position = 'absolute';
    canvas.style.left = `${box.left - own.left - host.clientLeft}px`;
    canvas.style.top = `${box.top - own.top - host.clientTop}px`;
    canvas.style.inset = 'auto';
    const c = canvas;
    ICON_STEPS.forEach(([size, holes], i) =>
      timers.push(
        window.setTimeout(() => {
          if (!c.isConnected) host.append(c);
          pixelFrame(c, size, holes, (s, w, h) => s.drawImage(art, 0, 0, w, h));
        }, delay + i * stepMs),
      ),
    );
    timers.push(window.setTimeout(stop, delay + ICON_STEPS.length * stepMs));
  });
  return stop;
}
