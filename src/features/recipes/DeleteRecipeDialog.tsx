import { useEffect, useId, useRef } from 'react';
import { Button } from '../../components/Button';

interface DeleteRecipeDialogProps {
  recipeTitle: string;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteRecipeDialog({ recipeTitle, error, onConfirm, onCancel }: DeleteRecipeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    dialog.showModal();
    // Безопасное действие получает фокус первым; модальность обеспечивает браузер.
    dialog.querySelector('button')?.focus();
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
    >
      <h2 className="confirm-dialog__title" id={titleId}>Удалить рецепт?</h2>
      <p className="confirm-dialog__description" id={descriptionId}>
        Рецепт «{recipeTitle}» будет удалён. Это действие нельзя отменить.
      </p>
      {error && <p className="confirm-dialog__error" role="alert">{error}</p>}
      <div className="confirm-dialog__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Отмена</Button>
        <Button type="button" onClick={onConfirm}>Удалить</Button>
      </div>
    </dialog>
  );
}
