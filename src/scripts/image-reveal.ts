/**
 * Image reveal — every picture and video fades in and rises a little as it scrolls into view
 * (once), a beat after the headlines. A picture in a wrapper of its own moves with the
 * wrapper; one that fills a frame clipping it settles from a slight zoom instead, so no
 * empty strip shows. Done with the Web Animations API, so the images' own styles are
 * untouched and come straight back when it ends. Skips blocks that already move their
 * pictures (menu, contact block, Services scroller, Robo Radio clips, the wheels and
 * project cards, Team canvas), pictures that start hidden (slideshows), and tiny icons.
 * Off for reduced motion.
 */

import { uncovered } from './uncovered';

const SKIP = [
  '.pt',
  '.site-menu',
  '.nav-pill',
  '.get-in-touch',
  '.contact',
  '.services-scroller',
  '.home-showcase__stage',
  '.radio-clips',
  '.project-wheel',
  '.work-wheel',
  '.project-cards',
  '.team',
].join(',');

const EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
/** the rise: a long soft ease-out */
const RISE_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const RISE = 'clamp(32px, 5vw, 72px)';

/** the element that moves: the picture, or the wrapper it fills */
function mover(el: HTMLElement) {
  let target: HTMLElement = el;
  // only wrappers that hold nothing but the picture (never a block with text in it; the
  // canvas bottom-bend.ts puts next to a picture doesn't count)
  const only = (p: Element) => p.childElementCount - p.querySelectorAll(':scope > canvas.bottom-bend').length === 1;
  for (let p = el.parentElement; p && only(p) && !p.matches('main, section, article, a, button'); p = p.parentElement) {
    const a = target.getBoundingClientRect();
    const b = p.getBoundingClientRect();
    if (Math.abs(a.width - b.width) > 2 || Math.abs(a.height - b.height) > 2) break;
    target = p;
  }
  return target;
}

/** a picture filling a frame that clips it (with other things in the frame): it can't rise
 *  without showing an empty strip, so it settles from a slight zoom instead */
function clipped(el: HTMLElement) {
  const p = el.parentElement;
  if (!p) return false;
  const cs = getComputedStyle(p);
  if (cs.overflow === 'visible' && cs.clipPath === 'none') return false;
  const a = el.getBoundingClientRect();
  const b = p.getBoundingClientRect();
  return a.height >= b.height - 2 && a.width >= b.width - 2;
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const waiting = new Map<Element, Animation[]>();
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const anims = waiting.get(e.target);
        if (anims) {
          // not while the page transition still covers the page
          uncovered.then(() => anims.forEach((a) => a.play()));
          waiting.delete(e.target);
        }
        seen.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px' },
  );

  for (const el of document.querySelectorAll<HTMLElement>('img, video')) {
    if (el.closest(SKIP)) continue;
    const cs = getComputedStyle(el);
    // already hidden (slideshow frames, mobile-only art) or decorative specks
    // (img-wait = still loading: that's the load fade, not a hidden picture)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (parseFloat(cs.opacity) < 1 && !el.classList.contains('img-wait')) continue;
    const r = el.getBoundingClientRect();
    if (r.width && r.width < 24 && r.height < 24) continue;
    const target = mover(el);
    if (waiting.has(target)) continue;
    // held at the first frame (invisible, lower down) until it comes into view; the rise adds
    // to the element's own translate / scale, so centred pictures stay centred
    const anims = [
      target.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: EASE, delay: 120, fill: 'backwards' }),
      target.animate(clipped(target) ? [{ scale: '1.12' }, { scale: '1' }] : [{ translate: `0 ${RISE}` }, { translate: '0 0' }], {
        duration: 1400,
        easing: RISE_EASE,
        delay: 120,
        fill: 'backwards',
        composite: 'add',
      }),
    ];
    anims.forEach((a) => a.pause());
    waiting.set(target, anims);
    seen.observe(target);
  }
}
