/**
 * Page to page transition — after the reference: black columns rise from the bottom, a beat
 * apart left to right, until the screen is black; the Hello Robo logo sits in the middle
 * (Figma "transition" 10434:7805 / 10434:7902). The new page opens covered, the robot blinks
 * twice, then the columns drop back down, left to right, and the page shows.
 *
 * The overlay is in BaseLayout; an inline script in <head> marks a page that should open
 * covered (html.pt-cover) before its first paint. Links to other pages of the site are
 * caught here; new tabs, downloads, the CMS, hash links and links other scripts already
 * handle (e.g. Get in touch opening the contact block) are left alone. Back / forward from
 * the browser cache uncovers too. Off for reduced motion.
 */

const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const KEY = 'pt';

/** columns rise: 0.55s each, 50ms apart; logo shows once they're all up */
const COVER_MS = 550 + 7 * 50;
/** columns drop back down */
const UNCOVER_MS = 650 + 7 * 55;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** eyes: open → closed → open → closed → open */
async function blink() {
  const logo = document.querySelector<HTMLElement>('[data-pt-logo]');
  if (!logo) return;
  for (const [closed, ms] of [[false, 180], [true, 220], [false, 240], [true, 220], [false, 200]] as const) {
    logo.classList.toggle('is-blink', closed);
    await wait(ms);
  }
}

/** The new page is in: blink, then drop the columns */
async function reveal() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
  html.classList.add('pt-cover');
  await Promise.race([document.fonts?.ready, wait(600)]);
  await blink();
  html.classList.remove('pt-cover', 'pt-in', 'pt-hold');
  html.classList.add('pt-out');
  await wait(UNCOVER_MS + 50);
  html.classList.remove('pt-out');
}

/** Cover the page, then go to `url` */
async function leave(url: string) {
  html.classList.remove('pt-out');
  html.classList.add('pt-in');
  await wait(COVER_MS);
  html.classList.add('pt-hold');
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {}
  location.assign(url);
}

const isPageLink = (a: HTMLAnchorElement, e: MouseEvent) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.target && a.target !== '_self') return false;
  if (a.hasAttribute('download') || a.getAttribute('href')?.startsWith('#')) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  if (/^\/(admin|api)(\/|$)/.test(url.pathname)) return false;
  // same page, only the hash changes: let the browser scroll
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
  return true;
};

if (!reduced) {
  // opened covered (from another page of the site): uncover
  if (document.prerendering) {
    // prepared in the background while hovering: shown covered, uncovered on arrival if we
    // came here through the transition
    document.addEventListener(
      'prerenderingchange',
      () => {
        let came = false;
        try {
          came = sessionStorage.getItem(KEY) === '1';
        } catch {}
        if (came) reveal();
        else html.classList.remove('pt-cover');
      },
      { once: true },
    );
  } else if (html.classList.contains('pt-cover')) {
    reveal();
  }

  // links to other pages: cover first (bubble phase, after other scripts had their say)
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href]');
    if (!a || !isPageLink(a, e)) return;
    e.preventDefault();
    leave(a.href);
  });

  // back / forward from the browser cache: the page comes back as it was left (covered)
  addEventListener('pageshow', (e) => {
    if (e.persisted && (html.classList.contains('pt-in') || html.classList.contains('pt-hold'))) reveal();
  });
}
