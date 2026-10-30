/**
 * Image-to-image slide for the Work wheels (desktop drum and the phone wheel) — the same
 * move as the Home showcase, Services and Robo Radio slides: the next picture slides in
 * over the current one inside the frame (from below going forward, from above going back)
 * and settles from a slight zoom. The one underneath stays until the new one has covered
 * it, so a fast spin stacks the pictures without ever showing a gap.
 *
 * Pictures: absolutely placed layers in a clipping frame; shown by `.is-current` /
 * `.is-leaving` (the block's CSS). Timing: --slide-duration / --slide-ease (tokens.css).
 */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let top = 1;

const token = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** shows `next` of `layers`; dir 1 = forward (comes from below), -1 = back (from above) */
export function slideSwap(layers: HTMLElement[], next: HTMLElement, dir: number) {
  const prev = layers.filter((el) => el !== next && el.classList.contains('is-current'));
  prev.forEach((el) => el.classList.replace('is-current', 'is-leaving'));
  next.classList.remove('is-leaving');
  next.classList.add('is-current');
  next.getAnimations().forEach((a) => a.cancel());
  next.style.zIndex = String(++top);
  if (reduced) {
    layers.forEach((el) => el !== next && el.classList.remove('is-leaving'));
    return;
  }
  const s = token('--slide-duration', '1.4s');
  const duration = s.endsWith('ms') ? parseFloat(s) : parseFloat(s) * 1000;
  const easing = token('--slide-ease', 'cubic-bezier(0.65, 0, 0.35, 1)');
  const slide = next.animate([{ translate: `0 ${dir < 0 ? -100 : 100}%` }, { translate: '0 0' }], { duration, easing });
  const media = next.firstElementChild as HTMLElement | null;
  media?.animate([{ scale: '1.1' }, { scale: '1' }], { duration, easing });
  // covered now: the pictures underneath can go
  slide.finished.then(
    () => layers.forEach((el) => el !== next && el.classList.remove('is-leaving')),
    () => {},
  );
}
