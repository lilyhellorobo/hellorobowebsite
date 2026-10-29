/**
 * Reading text reveal — after the reference recording: as a paragraph scrolls up into view
 * its words light up one after another, dim to full, in reading order; scrolling back
 * dims them again from the end. Scroll-linked, so it follows the reader's pace.
 * Body text only — paragraphs and list items in the body sizes; anything set in a heading
 * style (H1–H3, big statements) rises like the headlines instead (headline-reveal.ts). Not links, buttons, the menu, the footer, or blocks that already move
 * their text (contact block, Services scroller, Robo Radio clips, Careers values, the
 * wheels, Team canvas). Off for reduced motion.
 */

const TEXT = 'main p, main li, main blockquote, main dd';
const SKIP = [
  'h1', 'h2', 'h3', '.t-h1', '.t-h2', '.t-h3', 'a', 'button', 'label',
  '.site-menu', '.nav-pill', '.footer', '.contact', '.services-scroller', '.radio-clips',
  '.careers-values', '.home-showcase__titles', '.project-wheel', '.work-wheel', '.project-cards',
  '.team', '.careers-positions', '.visually-hidden', '[aria-hidden="true"]', '.has-hover-fx',
].join(',');
/** dimmest a word gets */
const FLOOR = 0.15;
/** share of the reveal each word takes (the rest is the stagger) */
const SPAN = 0.3;
/** how long text that's on screen at load takes to light up, after the headlines start */
const AUTO_MS = 1400;
const AUTO_DELAY = 350;

/** `auto`: on screen when the page opened — lights up by itself (from that time) */
type Para = { el: HTMLElement; words: HTMLElement[]; last: number[]; auto?: number };

function split(el: HTMLElement): HTMLElement[] {
  const words: HTMLElement[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    // text inside links stays as it is (and keeps its own hover)
    acceptNode: (n) => (n.parentElement?.closest('a, button') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const texts: Text[] = [];
  for (let t = walker.nextNode(); t; t = walker.nextNode()) texts.push(t as Text);
  for (const text of texts) {
    const frag = document.createDocumentFragment();
    for (const part of text.nodeValue!.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(part);
        continue;
      }
      const w = document.createElement('span');
      w.className = 'tr-word';
      w.textContent = part;
      words.push(w);
      frag.append(w);
    }
    text.replaceWith(frag);
  }
  return words;
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const paras: Para[] = [];
  for (const el of document.querySelectorAll<HTMLElement>(TEXT)) {
    if (el.closest(SKIP) || el.querySelector('.mask, .hl-mask')) continue;
    // a list item holding paragraphs: the paragraphs do it
    if (el.querySelector('p, li, blockquote, dd')) continue;
    if (el.textContent!.trim().length < 30) continue;
    // body sizes only (a big statement without a heading class is still a headline)
    if (parseFloat(getComputedStyle(el).fontSize) > 26) continue;
    const words = split(el);
    if (words.length < 4) continue;
    paras.push({ el, words, last: [] });
  }

  const active = new Set<Para>();
  const byEl = new Map(paras.map((p) => [p.el, p]));
  let frame = 0;

  const update = () => {
    frame = 0;
    const vh = innerHeight;
    for (const p of active) {
      const r = p.el.getBoundingClientRect();
      // 0 when the paragraph's top is near the bottom of the screen, 1 a bit above the middle
      let progress = Math.min(1, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.42 + Math.min(r.height, vh * 0.25))));
      if (p.auto !== undefined) {
        const t = Math.min(1, (performance.now() - p.auto) / AUTO_MS);
        progress = Math.max(progress, t);
        if (t < 1) schedule();
        else p.auto = undefined;
        if (t >= 1) progress = 1;
      }
      const n = p.words.length;
      p.words.forEach((w, i) => {
        const start = (i / n) * (1 - SPAN);
        const t = Math.min(1, Math.max(0, (progress - start) / SPAN));
        const o = Math.round((FLOOR + (1 - FLOOR) * t) * 50) / 50;
        if (p.last[i] !== o) {
          p.last[i] = o;
          w.style.opacity = o === 1 ? '' : String(o);
        }
      });
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  // only paragraphs near the screen are worked on
  const near = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const p = byEl.get(e.target as HTMLElement)!;
        if (e.isIntersecting) active.add(p);
        else {
          // left the screen: settle it fully lit (above) or fully dim (below)
          update();
          active.delete(p);
        }
      }
      schedule();
    },
    { rootMargin: '20% 0px 20% 0px' },
  );
  paras.forEach((p) => near.observe(p.el));
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  // first paint: everything starts dim; what's on screen now lights up by itself, what's
  // already been scrolled past shows lit
  const start = performance.now() + AUTO_DELAY;
  for (const p of paras) {
    const r = p.el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) {
      p.auto = start;
      active.add(p);
    }
  }
  paras.forEach((p) => active.add(p));
  update();
  active.clear();
  paras.filter((p) => p.auto !== undefined).forEach((p) => active.add(p));
  schedule();
}
