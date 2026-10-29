/**
 * Hover for buttons and text links — after exp.fiddle.digital: on hover the label breaks into
 * chunky pixels that get finer, then into random letters that settle on the real word from
 * left to right; an icon next to it (an arrow, the hexagon) pixelates and snaps back at the
 * same time. Buttons with only an icon (play / pause, close, back) pixelate the icon.
 * Text links: every plain link with a short label (menu, footer, socials, "View →",
 * "Portfolio →", legal pages…), not the ones made of pictures or blocks of text. The button keeps its own colours throughout. With a mouse it plays on
 * hover (leaving early puts everything back); on phones and tablets it plays on press.
 * Off for reduced motion.
 */

const SELECTOR = [
  '.button',
  '.get-in-touch',
  '.site-menu__talk',
  '.nav-pill__menu',
  '.nav-pill__back',
  '.nav-pill__close',
  '.contact__back',
  '.contact__submit',
  '.contact__next',
  '.contact__card',
  '.radio-tv__btn',
  '.team-card__close',
].join(',');

/** where the words are: the first match inside the button wins */
const LABEL = '[data-copy-label], .button__label, .contact__card > .t-body, .t-button:not(.button), :scope > span';

/** links made of more than words: only the named part animates */
const ROW_LINKS: Record<string, string> = {
  '.careers-positions__link': '.careers-positions__title .t-h2',
};

/** text links: plain links with a short label, outside the wheels / Team canvas */
const isTextLink = (a: HTMLAnchorElement) =>
  !a.matches(SELECTOR) &&
  !a.matches(Object.keys(ROW_LINKS).join(',')) &&
  !a.closest('.project-wheel, .work-wheel, .project-cards, .team, [aria-hidden="true"]:not(.site-menu)') &&
  !a.querySelector('img, picture, video, canvas, h1, h2, h3, h4, p, li, ul, div') &&
  a.textContent!.trim().length > 0 &&
  a.textContent!.trim().length <= 40;

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/';
/** a random character in the case of `ch` (lower-case words scramble in lower case) */
const glyph = (ch: string) => {
  const g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  return ch === ch.toLowerCase() && ch !== ch.toUpperCase() ? g.toLowerCase() : g;
};
/** pixel size (in CSS px) and share of blocks left out, frame by frame */
const TEXT_STEPS: [number, number][] = [
  [9, 0.5],
  [7, 0.4],
  [5, 0.3],
  [4, 0.2],
];
const ICON_STEPS: [number, number][] = [
  [6, 0.45],
  [4, 0.3],
  [3, 0.2],
  [2, 0.1],
];
const START = 40;
const PIXEL_MS = 60;
const SCRAMBLE_MS = 45;

/** Draws `draw` (into a w×h context) at 1/size resolution, drops some blocks, scales up */
function pixelFrame(canvas: HTMLCanvasElement, size: number, holes: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
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

function makeCanvas(w: number, h: number) {
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

function setup(btn: HTMLElement, labelSelector?: string) {
  // the label: its own span (wrapping a bare text node if needed)
  // in the order of LABEL (not document order: the copy card's words sit inside its .t-body)
  let label: HTMLElement | null = null;
  for (const sel of (labelSelector ?? LABEL).split(',')) if ((label = btn.querySelector<HTMLElement>(sel.trim()))) break;
  if (labelSelector && !label) return;
  if (!label) {
    const text = [...btn.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
    if (text) {
      label = document.createElement('span');
      text.replaceWith(label);
      label.append(text);
    }
  }
  label?.classList.add('hover-fx__label');
  btn.classList.add('has-hover-fx');

  let timers: number[] = [];
  let running = false;
  let word = '';
  /** what the effect last wrote, to notice when the button's own script changes the words */
  let written = '';
  let icon: SVGSVGElement | null = null;
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

  /** stops the effect and puts the label / icon back as they were */
  const settle = () => {
    timers.forEach(clearTimeout);
    timers = [];
    btn.querySelectorAll('.hover-fx__pixels').forEach((c) => c.remove());
    if (icon) icon.style.visibility = '';
    if (label) {
      label.classList.remove('is-pixel');
      if (running) label.textContent = word;
      label.style.minWidth = '';
    }
    running = false;
  };

  /** the button's own script changed the words mid-effect ("Email copied"): leave them be */
  const interrupted = (lbl: HTMLElement, canvas: HTMLCanvasElement) => {
    const changed = canvas.isConnected ? false : lbl.classList.contains('is-pixel') || lbl.textContent !== written;
    if (!changed) return false;
    timers.forEach(clearTimeout);
    timers = [];
    lbl.classList.remove('is-pixel');
    lbl.style.minWidth = '';
    running = false;
    return true;
  };

  /** the label: pixels, then random letters settling on the word */
  const playText = (lbl: HTMLElement) => {
    word = lbl.textContent!.trim();
    written = lbl.textContent!;
    const box = lbl.getBoundingClientRect();
    if (!word || !box.width) return;
    running = true;
    // keep the width while letters change, so the button doesn't jitter
    lbl.style.minWidth = `${box.width}px`;
    const canvas = makeCanvas(box.width, box.height);
    const cs = getComputedStyle(lbl);
    lbl.classList.add('is-pixel');
    lbl.append(canvas);
    TEXT_STEPS.forEach(([size, holes], i) =>
      at(START + i * PIXEL_MS, () =>
        !interrupted(lbl, canvas) && pixelFrame(canvas, size, holes, (s, _w, h) => {
          s.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) / size}px ${cs.fontFamily}`;
          s.textBaseline = 'middle';
          s.fillStyle = cs.color;
          s.fillText(word, 0, h / 2);
        }),
      ),
    );
    const start = START + TEXT_STEPS.length * PIXEL_MS;
    const frames = word.length + 4;
    for (let f = 0; f <= frames; f++) {
      at(start + f * SCRAMBLE_MS, () => {
        if (f === 0) {
          if (interrupted(lbl, canvas)) return;
          canvas.remove();
          lbl.classList.remove('is-pixel');
        } else if (lbl.textContent !== written) {
          // changed by the button's own script between frames
          timers.forEach(clearTimeout);
          timers = [];
          running = false;
          lbl.style.minWidth = '';
          return;
        }
        const settled = Math.max(0, f - 4);
        lbl.textContent =
          f === frames
            ? word
            : [...word].map((ch, i) => (ch === ' ' || i < settled ? ch : glyph(ch))).join('');
        written = lbl.textContent;
        if (f === frames) {
          running = false;
          lbl.style.minWidth = '';
        }
      });
    }
  };

  /** the icon pixelates and snaps back (on its own, or next to the label) */
  const playIcon = () => {
    icon = [...btn.querySelectorAll<SVGSVGElement>('svg')].find((s) => !label?.contains(s) && s.getBoundingClientRect().width > 0) ?? null;
    if (!icon) return;
    const box = icon.getBoundingClientRect();
    const own = btn.getBoundingClientRect();
    const color = getComputedStyle(icon).color;
    const svg = icon.cloneNode(true) as SVGSVGElement;
    svg.setAttribute('width', String(box.width));
    svg.setAttribute('height', String(box.height));
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML.replaceAll('currentColor', color))}`;
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    const canvas = makeCanvas(box.width, box.height);
    canvas.style.left = `${box.left - own.left - btn.clientLeft}px`;
    canvas.style.top = `${box.top - own.top - btn.clientTop}px`;
    canvas.style.inset = 'auto';
    const shown = icon;
    img.onload = () => {
      shown.style.visibility = 'hidden';
      btn.append(canvas);
      ICON_STEPS.forEach(([size, holes], i) =>
        at(i * PIXEL_MS, () => pixelFrame(canvas, size, holes, (s, w, h) => s.drawImage(img, 0, 0, w, h))),
      );
      at(ICON_STEPS.length * PIXEL_MS, () => {
        canvas.remove();
        shown.style.visibility = '';
      });
    };
  };

  const play = () => {
    settle();
    if (label) playText(label);
    playIcon();
  };
  // mouse: on hover, back when it leaves
  btn.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') play();
  });
  btn.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') settle();
  });
  // phones and tablets: on press (it plays out even after the finger lifts)
  btn.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' && !running) play();
  });
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((b) => setup(b));
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => isTextLink(a) && setup(a));
  for (const [row, label] of Object.entries(ROW_LINKS)) document.querySelectorAll<HTMLElement>(row).forEach((a) => setup(a, label));
}
