/**
 * Opens the delete dialog for an entry and deletes it on confirm.
 * Resolves true once the entry is gone, false if cancelled.
 */
export function confirmDelete(dialog: HTMLDialogElement, section: string, id: string, title: string) {
  const name = dialog.querySelector<HTMLElement>('[data-name]')!;
  const error = dialog.querySelector<HTMLElement>('[data-error]')!;
  const confirm = dialog.querySelector<HTMLButtonElement>('[data-confirm]')!;
  name.textContent = `“${title}”`;
  error.hidden = true;
  confirm.disabled = false;
  dialog.showModal();

  return new Promise<boolean>((resolve) => {
    const onConfirm = async (e: Event) => {
      e.preventDefault();
      confirm.disabled = true;
      try {
        const res = await fetch(`/admin/api/${section}/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? res.statusText);
        cleanup();
        dialog.close();
        resolve(true);
      } catch (err) {
        error.textContent = `Couldn’t delete: ${(err as Error).message}`;
        error.hidden = false;
        confirm.disabled = false;
      }
    };
    const onClose = () => {
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      confirm.removeEventListener('click', onConfirm);
      dialog.removeEventListener('close', onClose);
    };
    confirm.addEventListener('click', onConfirm);
    dialog.addEventListener('close', onClose);
  });
}
