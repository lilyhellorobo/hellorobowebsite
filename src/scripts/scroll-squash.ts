/**
 * Scroll squash — after the reference recording: while content scrolls, its pictures squash
 * a little in the direction they move (and bulge a touch the other way), like plasticine,
 * then wobble back to shape when the scrolling stops. Up and down with the page; sideways in
 * rows that scroll sideways (Latest news, the Robo Radio posters on phones). The amount
 * follows the scroll speed. A picture in a wrapper of its own squashes with the wrapper, so
 * a frame never shows an empty edge. Skips the blocks that already move their pictures
 * (same list as the image reveal), edge-to-edge pictures and small icons. Off for reduced motion.
 */

const SKIP = [
  '.pt',
  '.site-menu',
  '.nav-pill',
  '.get-in-touch',
  '.contact',
  '.services-scroller',
  '.home-showcase__stage',
  '.home-showreel',
  '.radio-clips',
  '.careers-values__scroller',
  '.project-wheel',
  '.work-wheel',
  '.project-cards',
  '.team',
].join(',');

/** squash per px/ms of scroll speed, and the most it gets */
const GAIN = 0.022;
const MAX = 0.07;
/** the other axis bulges by this share of the squash */
const BULGE = 0.35;
/** spring: pull towards the target, and how much of its speed it keeps each frame */
const PULL = 0.14;
const KEEP = 0.7;

type Spring = { value: number; speed: number; target: number };
type Item = { el: HTMLElement; row: HTMLElement | null };

const spring = (): Spring => ({ value: 0, speed: 0, target: 0 });
const step = (s: Spring) => {
  s.speed = (s.speed + (s.target - s.value) * PULL) * KEEP;
  s.value += s.speed;
  return Math.abs(s.value) > 0.0005 || Math.abs(s.speed) > 0.0005 || s.target !== 0;
};

/** the element that squashes: the picture, or the wrapper it fills */
function mover(el: HTMLElement) {
  let target: HTMLElement = el;
  for (let p = el.parentElement; p && !p.matches('body, main, section, article, li, [data-drag-scroll]'); p = p.parentElement) {
    const a = target.getBoundingClientRect();
    const b = p.getBoundingClientRect();
    if (Math.abs(a.width - b.width) > 2 || Math.abs(a.height - b.height) > 2) break;
    target = p;
  }
  return target;
}

/** rows that scroll sideways */
const isRow = (el: Element) => {
  const cs = getComputedStyle(el);
  return (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1;
};

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // the page (up / down) and each sideways row have their own spring
  const page = spring();
  const rows = new Map<HTMLElement, Spring>();

  // only the pictures on screen are touched; each is sized up the first time it shows
  // (lazy pictures have no size before they load)
  const visible = new Set<Item>();
  const items = new Map<HTMLElement, Item | null>();
  const taken = new Set<HTMLElement>();

  /** the picture's squash target, or null if it should stay as it is */
  const prepare = (el: HTMLElement): Item | null => {
    const r = el.getBoundingClientRect();
    if (r.width < 120 && r.height < 120) return null;
    const target = mover(el);
    // full-bleed pictures (edge to edge) would open a gap at the screen edges
    const t = target.getBoundingClientRect();
    if (t.left <= 1 && t.right >= innerWidth - 1) return null;
    if (taken.has(target) || getComputedStyle(target).scale !== 'none') return null;
    taken.add(target);
    let row: HTMLElement | null = null;
    for (let p = target.parentElement; p && p !== document.body; p = p.parentElement) {
      if (isRow(p)) {
        row = p;
        break;
      }
    }
    if (row && !rows.has(row)) {
      const s = spring();
      rows.set(row, s);
      row.addEventListener('scroll', track(s, () => row.scrollLeft), { passive: true });
    }
    return { el: target, row };
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const img = e.target as HTMLElement;
        if (!items.has(img)) {
          if (!e.isIntersecting || !img.getBoundingClientRect().width) continue;
          items.set(img, prepare(img));
        }
        const item = items.get(img);
        if (!item) {
          io.unobserve(img);
          continue;
        }
        if (e.isIntersecting) visible.add(item);
        else {
          visible.delete(item);
          item.el.style.scale = '';
        }
      }
    },
    { rootMargin: '10% 0px' },
  );

  let frame = 0;
  const tick = () => {
    frame = 0;
    let moving = step(page);
    for (const s of rows.values()) moving = step(s) || moving;
    for (const { el, row } of visible) {
      const v = page.value;
      const h = row ? rows.get(row)!.value : 0;
      // squash along the motion, bulge across it
      el.style.scale = `${1 - h + v * BULGE} ${1 - v + h * BULGE}`;
    }
    if (moving) frame = requestAnimationFrame(tick);
    else for (const { el } of visible) el.style.scale = '';
  };
  function run() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  /** feeds a spring from a scroll position: speed in px/ms, eased off when it stops */
  function track(s: Spring, read: () => number) {
    let last = read();
    let lastT = performance.now();
    let idle = 0;
    return () => {
      const now = performance.now();
      const pos = read();
      const dt = Math.max(8, now - lastT);
      s.target = Math.min(MAX, (Math.abs(pos - last) / dt) * GAIN);
      last = pos;
      lastT = now;
      clearTimeout(idle);
      // no scroll event for a moment: it has stopped
      idle = window.setTimeout(() => {
        s.target = 0;
        run();
      }, 60);
      run();
    };
  }

  for (const el of document.querySelectorAll<HTMLElement>('main img, main video')) if (!el.closest(SKIP)) io.observe(el);
  addEventListener('scroll', track(page, () => scrollY), { passive: true });
}
