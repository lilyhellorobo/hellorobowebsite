/**
 * Hover for buttons and text links — after exp.fiddle.digital: on hover the label first turns
 * into chunky pixels — a blocky version of the word for a moment, then sparse blocks of two
 * sizes flickering where the letters are (~half a second) — and only then random characters
 * settle into the real word (~a third of a second). An icon next to it (an arrow, the
 * hexagon) pixelates and flickers with the label and comes back as the letters start;
 * buttons with only an icon (play / pause, close, back) do just that.
 * Every hover varies: the flicker, the characters (letters, numbers, signs, binary, katakana —
 * one or two sets mixed; no blocks, shapes or arrows), the order they settle in (left, right,
 * from the middle, random) and the pace.
 * Text links: every plain link with a short label (menu, footer, socials, "View →",
 * "Portfolio →", legal pages…), not the ones made of pictures or blocks of text. The button
 * keeps its own colours throughout. With a mouse it plays on hover (leaving early puts
 * everything back); on phones and tablets it plays on press. Off for reduced motion.
 */

import { makeCanvas, pixelFrame } from './pixel';

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

/** The characters a scramble can use — every hover mixes one or two of these, so it never
 *  looks the same twice */
const GLYPH_SETS = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '0123456789',
  '#%&*+=<>/\\|_~',
  '01',
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ',
];
/** Which letters settle first */
const ORDERS = ['left', 'right', 'middle', 'random'] as const;

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/** One pixel frame: when (ms from the start), block size (share of the font size), share of
 *  blocks left out */
type PixelStep = { at: number; block: number; holes: number };

/** A fresh look for one hover: the pixel flicker, the glyphs, the settling order, the pace.
 *  After the reference (exp.fiddle.digital): first the word turns into chunky blocks — a
 *  blocky word for a moment, then sparse blocks of two sizes flickering where the letters
 *  are (~half a second) — then random characters settle into the word (~a third). */
function variation(length: number) {
  const pixels: PixelStep[] = [];
  let at = 0;
  // the blocky word
  for (let i = 0; i < 2; i++) {
    pixels.push({ at, block: 0.3, holes: 0.2 + i * 0.1 });
    at += 55 + Math.random() * 20;
  }
  // flicker: sparse blocks, small and big, scattered again every frame
  const flickers = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < flickers; i++) {
    pixels.push({ at, block: Math.random() < 0.55 ? 0.5 : 0.9, holes: 0.38 + Math.random() * 0.2 });
    at += 50 + Math.random() * 30;
  }
  const a = pick(GLYPH_SETS);
  const glyphs = Math.random() < 0.5 ? a : a + pick(GLYPH_SETS);
  const order = pick(ORDERS);
  // frame (from the start of the letters) at which each character settles: all within a few
  // frames, whatever the word's length
  const span = 4 + Math.floor(Math.random() * 2);
  const settleAt = Array.from({ length }, (_, i) => {
    const pos =
      order === 'left' ? i
      : order === 'right' ? length - 1 - i
      : order === 'middle' ? Math.abs(i - (length - 1) / 2) * 2
      : Math.random() * length;
    return 1 + Math.round((pos / Math.max(1, length - 1)) * span + Math.random());
  });
  return { pixels, pixelEnd: at, glyphs, settleAt, pace: 55 + Math.floor(Math.random() * 20) };
}

/** a random character from `glyphs`, in the case of `ch` (lower-case words stay lower case) */
const glyph = (glyphs: string, ch: string) => {
  const g = pick([...glyphs]);
  return ch === ch.toLowerCase() && ch !== ch.toUpperCase() ? g.toLowerCase() : g;
};
const START = 20;

/**
 * Pixel frame for a label: blocks of `px` on a grid over the word, filled where the grid cell
 * falls on a letter (measured, never read back from a canvas — see pixel.ts), less a random
 * share left out. At any text size this gives solid, chunky blocks where the letters are.
 */
function blockFrame(canvas: HTMLCanvasElement, cs: CSSStyleDeclaration, color: string, word: string, px: number, holes: number) {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.clientWidth || parseFloat(canvas.style.width);
  const h = canvas.clientHeight || parseFloat(canvas.style.height);
  const dpr = canvas.width / w;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
  // where each letter is, left to right
  const spans: [number, number][] = [];
  const chars = [...word];
  let x = 0;
  chars.forEach((ch, i) => {
    const next = ctx.measureText(chars.slice(0, i + 1).join('')).width;
    if (ch.trim()) spans.push([x, next]);
    x = next;
  });
  // the letters' height: about the cap height, centred on the line
  const fs = parseFloat(cs.fontSize);
  const top = h / 2 - fs * 0.36;
  const rows = Math.max(1, Math.round((fs * 0.72) / px));
  const cols = Math.ceil(x / px);
  ctx.fillStyle = color;
  for (let c = 0; c < cols; c++) {
    const a = c * px;
    const b = a + px;
    const on = spans.some(([s0, s1]) => Math.min(b, s1) - Math.max(a, s0) > px * 0.35);
    if (!on) continue;
    for (let r = 0; r < rows; r++) if (Math.random() >= holes) ctx.fillRect(Math.round(a), Math.round(top + r * px), Math.ceil(px), Math.ceil(px));
  }
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
  const playText = (lbl: HTMLElement, look: ReturnType<typeof variation>) => {
    word = lbl.textContent!.trim();
    written = lbl.textContent!;
    const box = lbl.getBoundingClientRect();
    if (!word || !box.width) return;
    running = true;
    // keep the width while letters change, so the button doesn't jitter
    lbl.style.minWidth = `${box.width}px`;
    const canvas = makeCanvas(box.width, box.height);
    const cs = getComputedStyle(lbl);
    // the colour now: hiding the words (is-pixel) makes the live one transparent, which drew
    // every pixel frame invisible
    const color = cs.color;
    lbl.classList.add('is-pixel');
    lbl.append(canvas);
    const fontSize = parseFloat(cs.fontSize);
    for (const { at: t, block, holes } of look.pixels) {
      const px = Math.max(2, fontSize * block);
      at(START + t, () => !interrupted(lbl, canvas) && blockFrame(canvas, cs, color, word, px, holes));
    }
    const start = START + look.pixelEnd;
    const frames = Math.max(...look.settleAt) + 1;
    for (let f = 0; f <= frames; f++) {
      at(start + f * look.pace, () => {
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
        lbl.textContent =
          f === frames
            ? word
            : [...word].map((ch, i) => (ch === ' ' || f >= look.settleAt[i] ? ch : glyph(look.glyphs, ch))).join('');
        written = lbl.textContent;
        if (f === frames) {
          running = false;
          lbl.style.minWidth = '';
        }
      });
    }
  };

  /** the icon pixelates and flickers with the label, then snaps back as the letters start */
  const playIcon = (look: ReturnType<typeof variation>) => {
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
    // inset first: setting it afterwards wiped left / top and misplaced the pixels
    canvas.style.inset = 'auto';
    canvas.style.left = `${box.left - own.left - btn.clientLeft}px`;
    canvas.style.top = `${box.top - own.top - btn.clientTop}px`;
    const shown = icon;
    const begun = performance.now();
    img.onload = () => {
      shown.style.visibility = 'hidden';
      btn.append(canvas);
      // on the label's timeline (the picture took a moment to load)
      const late = performance.now() - begun;
      for (const { at: t, block, holes } of look.pixels) {
        // the icon's blocks: a little finer than the letters' (it's small)
        const px = Math.max(2, box.height * block * 0.45);
        at(Math.max(0, START + t - late), () => pixelFrame(canvas, px, holes * 0.6, (s, w, h) => s.drawImage(img, 0, 0, w, h)));
      }
      at(Math.max(0, START + look.pixelEnd - late), () => {
        canvas.remove();
        shown.style.visibility = '';
      });
    };
  };

  const play = () => {
    settle();
    const look = variation([...(label?.textContent?.trim() ?? '')].length);
    if (label) playText(label, look);
    playIcon(look);
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
