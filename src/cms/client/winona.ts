/**
 * "Winona" button hover (Codrops Creative Buttons, codepen.io/dansully/pen/meVLaW):
 * the label slides up and fades while a copy slides up into its place. The copy is the
 * button's ::after (content from data-text, styles in admin.css). This wraps every
 * text button's label in a span and keeps data-text in step, including buttons added
 * later by the editor and labels that change ("Saving…").
 */
const LABEL = 'cms-btn__label';

function wrap(btn: HTMLElement) {
  // Only plain-text buttons; leave anything with other elements inside alone
  if ([...btn.children].some((c) => !c.classList.contains(LABEL))) return;
  const text = btn.textContent?.trim() ?? '';
  const label = btn.firstElementChild;
  if (!text) return;
  if (label && btn.childNodes.length === 1 && btn.dataset.text === text) return;
  btn.dataset.text = text;
  // Name it explicitly so assistive tech reads the label once (not label + its copy)
  if (!btn.hasAttribute('aria-label') || btn.dataset.winonaLabel === '') {
    btn.setAttribute('aria-label', text);
    btn.dataset.winonaLabel = '';
  }
  const span = document.createElement('span');
  span.className = LABEL;
  span.textContent = text;
  btn.replaceChildren(span);
}

function wrapAll(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.cms-btn').forEach(wrap);
}

wrapAll(document);
new MutationObserver((records) => {
  for (const r of records) {
    const target = r.target instanceof Element ? r.target : r.target.parentElement;
    const btn = target?.closest<HTMLElement>('.cms-btn');
    if (btn) wrap(btn);
    r.addedNodes.forEach((n) => {
      if (!(n instanceof HTMLElement)) return;
      if (n.matches('.cms-btn')) wrap(n);
      wrapAll(n);
    });
  }
}).observe(document.body, { childList: true, subtree: true, characterData: true });
