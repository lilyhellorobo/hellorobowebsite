/**
 * Success notices ("Saved.", "Deleted …", the order saved) show as a toast pinned to the
 * very top of the window for 5 seconds, then fade away. Error notices stay in place.
 */
const SHOW_MS = 5000;

document.querySelectorAll<HTMLElement>('.cms-notice[role="status"]:not(.cms-notice--error)').forEach((note) => {
  if (!note.textContent?.trim()) return;
  note.classList.add('cms-toast');
  setTimeout(() => {
    note.classList.add('cms-toast--out');
    note.addEventListener('transitionend', () => note.remove(), { once: true });
  }, SHOW_MS);
});
