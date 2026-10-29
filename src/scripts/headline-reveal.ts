/**
 * Headline reveal — after the reference recording: when a headline scrolls into view, its
 * words slide up out of their line one after another (the line clips them), the next line
 * following the first. Every h1 / h2 / h3 and every text set in a heading style (H1–H3,
 * e.g. the big statement paragraphs) on the site — body text has the reading reveal
 * (text-reveal.ts) instead — except blocks that
 * already move their titles (Services scroller, Robo Radio clips, Careers values, the
 * contact block, the Home showcase slides, the wheels, the menu) and labels that run the
 * hover scramble. Runs once per headline; off for reduced motion. Without JS, headlines
 * simply show.
 */

const HEADLINES = 'h1, h2, h3, .t-h1, .t-h2, .t-h3';
const SKIP = [
  '.footer',
  '.nav-pill',
  'a',
  'button',
  '.services-scroller',
  '.radio-clips',
  '.careers-values',
  '.contact',
  '.home-showcase__titles',
  '.project-wheel',
  '.work-wheel',
  '.project-cards',
  '.team',
  '.site-menu',
  '.visually-hidden',
  '[aria-hidden="true"]',
  '.has-hover-fx',
].join(',');

/** ms between one word and the next */
const STAGGER = 55;

function split(h: HTMLElement) {
  let n = 0;
  const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let t = walker.nextNode(); t; t = walker.nextNode()) texts.push(t as Text);
  for (const text of texts) {
    const parts = text.nodeValue!.split(/( +)/);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (/^ +$/.test(part)) {
        frag.append(part);
        continue;
      }
      // the word sits in a clipping box and rises into it
      const mask = document.createElement('span');
      mask.className = 'hl-mask';
      const word = document.createElement('span');
      word.className = 'hl-word';
      word.style.setProperty('--d', String(n++));
      word.textContent = part;
      mask.append(word);
      frag.append(mask);
    }
    text.replaceWith(frag);
  }
  return n;
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // headings, and big statement paragraphs without a heading class
  const big = [...document.querySelectorAll<HTMLElement>('main p')].filter((p) => !p.matches(HEADLINES) && parseFloat(getComputedStyle(p).fontSize) > 26);
  const heads = [...document.querySelectorAll<HTMLElement>(HEADLINES), ...big].filter(
    (h) =>
      !h.closest(SKIP) &&
      !h.querySelector('.has-hover-fx, .hover-fx__label') &&
      // an H1/H2 style inside a heading is the same headline
      !h.parentElement?.closest(HEADLINES) &&
      h.textContent!.trim(),
  );
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        seen.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const h of heads) {
    if (!split(h)) continue;
    h.classList.add('hl-ready');
    seen.observe(h);
  }
}
