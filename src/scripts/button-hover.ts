/**
 * Hover for buttons and text links — after exp.fiddle.digital: on hover the label breaks into
 * chunky pixels that get finer, then into random characters that settle on the real word.
 * Every hover varies: the characters (letters, numbers, signs, binary, katakana — one or
 * two sets mixed; no blocks, shapes or arrows), the order they settle in (left, right, from the
 * middle, random), the pace and the pixel steps; an icon next to it (an arrow, the hexagon) pixelates and snaps back at the
 * same time. Buttons with only an icon (play / pause, close, back) pixelate the icon.
 * Text links: every plain link with a short label (menu, footer, socials, "View →",
 * "Portfolio →", legal pages…), not the ones made of pictures or blocks of text. The button keeps its own colours throughout. With a mouse it plays on
 * hover (leaving early puts everything back); on phones and tablets it plays on press.
 * Off for reduced motion.
 */

import { ICON_STEPS, makeCanvas, pixelFrame } from './pixel';

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

/** A fresh look for one hover: the glyphs, the settling order, the pace and the pixels */
function variation(length: number) {
  const a = pick(GLYPH_SETS);
  const glyphs = Math.random() < 0.5 ? a : a + pick(GLYPH_SETS);
  const order = pick(ORDERS);
  // frame (from the start of the letters) at which each character settles
  const lead = 2 + Math.floor(Math.random() * 4);
  const settleAt = Array.from({ length }, (_, i) => {
    const pos =
      order === 'left' ? i
      : order === 'right' ? length - 1 - i
      : order === 'middle' ? Math.abs(i - (length - 1) / 2) * 2
      : Math.random() * length;
    return lead + Math.round(pos + Math.random() * 1.5);
  });
  // pixel blocks per letter height: coarse to fine (so 20px text and 160px headlines both
  // read as blocky words, never as an empty box)
  const coarse = 3 + Math.random() * 1.5;
  const fine = 7 + Math.random() * 2;
  const steps = 2 + Math.floor(Math.random() * 3);
  const pixels: [number, number][] = Array.from({ length: steps }, (_, i) => [
    coarse + ((fine - coarse) * i) / Math.max(1, steps - 1),
    0.1 + Math.random() * 0.25,
  ]);
  return { glyphs, settleAt, pixels, pace: 35 + Math.floor(Math.random() * 25) };
}

/** a random character from `glyphs`, in the case of `ch` (lower-case words stay lower case) */
const glyph = (glyphs: string, ch: string) => {
  const g = pick([...glyphs]);
  return ch === ch.toLowerCase() && ch !== ch.toUpperCase() ? g.toLowerCase() : g;
};
const START = 40;
const PIXEL_MS = 60;

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
    const look = variation([...word].length);
    look.pixels.forEach(([size, holes], i) =>
      at(START + i * PIXEL_MS, () =>
        !interrupted(lbl, canvas) && pixelFrame(canvas, Math.max(2, parseFloat(cs.fontSize) / size), holes, (s, _w, h) => {
          s.font = `${cs.fontWeight} ${Math.min(parseFloat(cs.fontSize), size)}px ${cs.fontFamily}`;
          s.textBaseline = 'middle';
          s.fillStyle = cs.color;
          s.fillText(word, 0, h / 2);
        }),
      ),
    );
    const start = START + look.pixels.length * PIXEL_MS;
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
    // inset first: setting it afterwards wiped left / top and misplaced the pixels
    canvas.style.inset = 'auto';
    canvas.style.left = `${box.left - own.left - btn.clientLeft}px`;
    canvas.style.top = `${box.top - own.top - btn.clientTop}px`;
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
