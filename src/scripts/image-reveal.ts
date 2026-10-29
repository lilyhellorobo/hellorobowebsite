/**
 * Image reveal — every picture and video fades in as it scrolls into view (once), a beat
 * after the headlines. Done with the Web Animations API, so the images' own styles are
 * untouched and come straight back when it ends. Skips blocks that already move their
 * pictures (menu, contact block, Services scroller, Robo Radio clips, the wheels and
 * project cards, Team canvas), pictures that start hidden (slideshows), and tiny icons.
 * Off for reduced motion.
 */

const SKIP = [
  '.site-menu',
  '.nav-pill',
  '.get-in-touch',
  '.contact',
  '.services-scroller',
  '.radio-clips',
  '.project-wheel',
  '.work-wheel',
  '.project-cards',
  '.team',
].join(',');

const EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const waiting = new Map<Element, Animation>();
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const anim = waiting.get(e.target);
        if (anim) {
          anim.play();
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
    // held at the first frame (invisible) until it comes into view
    const anim = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1100, easing: EASE, delay: 120, fill: 'backwards' });
    anim.pause();
    waiting.set(el, anim);
    seen.observe(el);
  }
}
