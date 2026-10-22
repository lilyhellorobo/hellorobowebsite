/**
 * Drag-to-reorder for the CMS list page. Drag a row by its handle (mouse, pen or touch),
 * or focus the handle and use ↑ / ↓. The new order is saved as soon as a row is dropped.
 */

export function makeSortable(list: HTMLElement, section: string, status: HTMLElement) {
  const rows = () => [...list.querySelectorAll<HTMLElement>(':scope > [data-id]')];
  const ids = () => rows().map((r) => r.dataset.id!);
  let saved = ids();
  let saving: Promise<void> = Promise.resolve();

  const renumber = () =>
    rows().forEach((row, i) => {
      const badge = row.querySelector('.cms-badge');
      if (badge) badge.textContent = String(i + 1);
    });

  const say = (text: string, error = false) => {
    status.textContent = text;
    status.classList.toggle('cms-sort-status--error', error);
  };

  const save = () => {
    const order = ids();
    if (order.join() === saved.join()) return;
    renumber();
    say('Saving order…');
    // Saves run one after another so a quick second drag can't overtake the first
    saving = saving.then(async () => {
      try {
        const res = await fetch(`/admin/api/${section}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: order }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? res.statusText);
        saved = order;
        say('Order saved.');
      } catch (err) {
        // Put the rows back the way the server has them
        const byId = new Map(rows().map((r) => [r.dataset.id!, r]));
        list.append(...saved.map((id) => byId.get(id)!).filter(Boolean));
        renumber();
        say(`Couldn’t save the order: ${(err as Error).message}`, true);
      }
    });
  };

  for (const row of rows()) {
    const handle = row.querySelector<HTMLElement>('[data-drag-handle]');
    if (!handle) continue;

    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      let startY = e.clientY;
      row.classList.add('is-dragging');
      list.classList.add('is-sorting');

      const move = (ev: PointerEvent) => {
        // Swap with neighbours while the row has moved past half of them (a fast drag can pass several)
        for (;;) {
          const dy = ev.clientY - startY;
          const next = row.nextElementSibling as HTMLElement | null;
          const prev = row.previousElementSibling as HTMLElement | null;
          if (next && dy > next.offsetHeight / 2) {
            next.after(row);
            startY += next.offsetHeight;
          } else if (prev && dy < -prev.offsetHeight / 2) {
            prev.before(row);
            startY -= prev.offsetHeight;
          } else break;
        }
        row.style.transform = `translateY(${ev.clientY - startY}px)`;
      };
      const end = (ev: PointerEvent) => {
        move(ev);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        row.style.transform = '';
        row.classList.remove('is-dragging');
        list.classList.remove('is-sorting');
        save();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });

    handle.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && row.previousElementSibling) row.previousElementSibling.before(row);
      else if (e.key === 'ArrowDown' && row.nextElementSibling) row.nextElementSibling.after(row);
      else return;
      e.preventDefault();
      handle.focus();
      save();
    });
  }
}
