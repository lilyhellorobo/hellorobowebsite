/**
 * Resolves once the page is no longer covered by the page transition (page-transition.ts:
 * html.pt-cover / pt-in / pt-hold) — at once on a page opened directly. The reveals that
 * play on load (headlines, reading text, pictures, first slides) wait for it, so they play
 * as the black columns drop instead of unseen underneath them. A page prerendered on hover
 * stays covered until it's shown, so its reveals wait for that too.
 */

const html = document.documentElement;
const covered = () => /\bpt-(cover|in|hold)\b/.test(html.className);

export const uncovered: Promise<void> = new Promise((resolve) => {
  if (!covered()) return resolve();
  const watch = new MutationObserver(() => {
    if (covered()) return;
    watch.disconnect();
    resolve();
  });
  watch.observe(html, { attributes: true, attributeFilter: ['class'] });
});
