import { useEffect, useId, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Full-height sheet for long content like the exercise picker. */
  tall?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Bottom sheet built on the native <dialog>, which handles focus trapping,
 * Escape, and the inert background for us.
 */
export default function Sheet({ open, onClose, title, tall, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={tall ? 'sheet sheet-tall' : 'sheet'}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="sheet-inner">
          <div className="sheet-header">
            <h2 id={titleId} className="sheet-title">
              {title}
            </h2>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="sheet-body">{children}</div>
          {footer && <div className="sheet-footer">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

type Action = { label: string; onSelect: () => void; danger?: boolean; disabled?: boolean };

/** A sheet with a list of actions, like an iOS action sheet. */
export function ActionSheet({
  open,
  onClose,
  title,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  actions: Action[];
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <ul className="list action-list">
        {actions.map((a) => (
          <li key={a.label}>
            <button
              type="button"
              className={a.danger ? 'action action-danger' : 'action'}
              disabled={a.disabled}
              onClick={() => {
                onClose();
                a.onSelect();
              }}
            >
              {a.label}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
