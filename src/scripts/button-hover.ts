/**
 * Button hover — after exp.fiddle.digital: on hover a fill rises from a thin line at the
 * bottom of the button (in the label's colour, so for a moment the button is inverted), the
 * label breaks into chunky pixels that get finer, then into random letters that settle on
 * the real word from left to right — and the fill sinks back, so the button ends in its own
 * colours. Leaving early sinks it straight away.
 * Works on every filled button (transparent ones are skipped); mouse only, and just the
 * fill (no pixels / letters) for reduced motion.
 */

const SELECTOR = [
  '.button',
  '.get-in-touch',
  '.site-menu__talk',
  '.contact__back',
  '.contact__submit',
  '.contact__next',
].join(',');

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/';
/** pixel size (in CSS px) and share of blocks left out, frame by frame */
const PIXEL_STEPS: [number, number][] = [
  [9, 0.5],
  [7, 0.4],
  [5, 0.3],
  [4, 0.2],
];
/** pixels start once the fill has mostly risen */
const PIXEL_START = 150;
const PIXEL_MS = 60;
const SCRAMBLE_MS = 45;

const transparent = (c: string) => c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c);

function setup(btn: HTMLElement, reduced: boolean) {
  const cs = getComputedStyle(btn);
  if (transparent(cs.backgroundColor)) return;

  // the inverse colours: fill = label colour, label = button colour
  btn.style.setProperty('--hover-fill', cs.color);
  btn.style.setProperty('--hover-ink', cs.backgroundColor);
  btn.classList.add('has-hover-fx');
  if (cs.position === 'static') btn.style.position = 'relative';
  const fill = document.createElement('span');
  fill.className = 'hover-fx__fill';
  fill.setAttribute('aria-hidden', 'true');
  btn.prepend(fill);

  // the label: its own span (wrapping a bare text node if needed)
  let label = btn.querySelector<HTMLElement>('.button__label, .t-button:not(.button)');
  if (!label || label === btn) {
    const text = [...btn.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
    if (text) {
      label = document.createElement('span');
      text.replaceWith(label);
      label.append(text);
    } else label = null; // icon-only (the contact arrow): fill only
  }
  label?.classList.add('hover-fx__label');

  let timers: number[] = [];
  const clear = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

  /** back to the button's own colours: the word restored, the fill sinking to the line */
  const settle = () => {
    clear();
    if (label) {
      label.querySelector('.hover-fx__pixels')?.remove();
      label.classList.remove('is-pixel');
      if (label.dataset.word) label.textContent = label.dataset.word;
      label.style.minWidth = '';
    }
    if (!btn.classList.contains('is-hot')) return;
    btn.classList.remove('is-hot');
    btn.classList.add('is-cooling');
    at(280, () => btn.classList.remove('is-cooling'));
  };

  btn.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    clear();
    btn.classList.remove('is-cooling');
    btn.classList.add('is-hot');
    if (!label || reduced) {
      at(450, settle);
      return;
    }

    const word = label.dataset.word ?? (label.dataset.word = label.textContent!.trim());
    const box = label.getBoundingClientRect();
    // keep the width while letters change, so the button doesn't jitter
    label.style.minWidth = `${box.width}px`;

    // 1 · pixels: the word drawn tiny and scaled up without smoothing, some blocks left out
    const canvas = document.createElement('canvas');
    canvas.className = 'hover-fx__pixels';
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.ceil(box.width * dpr);
    canvas.height = Math.ceil(box.height * dpr);
    const ctx = canvas.getContext('2d')!;
    const lcs = getComputedStyle(label);
    const ink = getComputedStyle(btn).getPropertyValue('--hover-ink');
    label.classList.add('is-pixel');
    label.append(canvas);

    PIXEL_STEPS.forEach(([size, holes], i) =>
      at(PIXEL_START + i * PIXEL_MS, () => {
        const w = Math.max(1, Math.round(box.width / size));
        const h = Math.max(1, Math.round(box.height / size));
        const small = document.createElement('canvas');
        small.width = w;
        small.height = h;
        const s = small.getContext('2d')!;
        s.font = `${lcs.fontWeight} ${parseFloat(lcs.fontSize) / size}px ${lcs.fontFamily}`;
        s.textBaseline = 'middle';
        s.fillStyle = ink;
        s.fillText(word, 0, h / 2);
        const img = s.getImageData(0, 0, w, h);
        for (let p = 3; p < img.data.length; p += 4) {
          // solid blocks: each pixel either on or off
          img.data[p] = img.data[p] > 60 && Math.random() > holes ? 255 : 0;
        }
        s.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
      }),
    );

    // 2 · letters: random characters settling on the word, left to right
    const start = PIXEL_START + PIXEL_STEPS.length * PIXEL_MS;
    const frames = word.length + 4;
    for (let f = 0; f <= frames; f++) {
      at(start + f * SCRAMBLE_MS, () => {
        if (f === 0) {
          canvas.remove();
          label!.classList.remove('is-pixel');
        }
        const settled = Math.max(0, f - 4);
        label!.textContent =
          f === frames
            ? word
            : [...word]
                .map((ch, i) => (ch === ' ' || i < settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
                .join('');
      });
    }
    // the word is back: a short beat inverted, then the button's own colours again
    at(start + frames * SCRAMBLE_MS + 160, settle);
  });

  btn.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') settle();
  });
}

if (matchMedia('(hover: hover)').matches) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((btn) => setup(btn, reduced));
}
