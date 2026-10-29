/**
 * Button hover — after exp.fiddle.digital: on hover the label breaks into chunky pixels that
 * get finer, then into random letters that settle on the real word from left to right. The
 * button keeps its own colours throughout. Leaving early puts the word straight back.
 * Mouse only; off for reduced motion.
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
/** a beat before the pixels start */
const PIXEL_START = 40;
const PIXEL_MS = 60;
const SCRAMBLE_MS = 45;

function setup(btn: HTMLElement, reduced: boolean) {
  btn.classList.add('has-hover-fx');

  // the label: its own span (wrapping a bare text node if needed)
  let label = btn.querySelector<HTMLElement>('.button__label, .t-button:not(.button)');
  if (!label || label === btn) {
    const text = [...btn.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
    if (text) {
      label = document.createElement('span');
      text.replaceWith(label);
      label.append(text);
    } else label = null; // icon-only (the contact arrow): nothing to do
  }
  if (!label || reduced) return;
  const lbl: HTMLElement = label;
  lbl.classList.add('hover-fx__label');

  let timers: number[] = [];
  const clear = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

  /** the word back as it was */
  const settle = () => {
    clear();
    lbl.querySelector('.hover-fx__pixels')?.remove();
    lbl.classList.remove('is-pixel');
    if (lbl.dataset.word) lbl.textContent = lbl.dataset.word;
    lbl.style.minWidth = '';
  };

  btn.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    settle();

    const word = lbl.dataset.word ?? (lbl.dataset.word = lbl.textContent!.trim());
    const box = lbl.getBoundingClientRect();
    // keep the width while letters change, so the button doesn't jitter
    lbl.style.minWidth = `${box.width}px`;

    // 1 · pixels: the word drawn tiny and scaled up without smoothing, some blocks left out
    const canvas = document.createElement('canvas');
    canvas.className = 'hover-fx__pixels';
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.ceil(box.width * dpr);
    canvas.height = Math.ceil(box.height * dpr);
    const ctx = canvas.getContext('2d')!;
    const lcs = getComputedStyle(lbl);
    const ink = lcs.color;
    lbl.classList.add('is-pixel');
    lbl.append(canvas);

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
          lbl.classList.remove('is-pixel');
        }
        const settled = Math.max(0, f - 4);
        lbl.textContent =
          f === frames
            ? word
            : [...word]
                .map((ch, i) => (ch === ' ' || i < settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
                .join('');
      });
    }
  });

  btn.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') settle();
  });
}

if (matchMedia('(hover: hover)').matches) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((btn) => setup(btn, reduced));
}
