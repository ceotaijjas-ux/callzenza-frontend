"use client";
import { useEffect } from "react";

/**
 * Centered modal dialog with a backdrop. Controlled via `open`; renders
 * nothing when closed. Closes on backdrop click or Escape.
 *
 * `footer` is typically a pair of <Button>s (Cancel / primary action).
 * `width` caps the dialog's max-width in px — it's still `w-full` below
 * that, and scrolls internally if content is taller than the viewport,
 * so it works down to small phone widths without extra tuning per call site.
 */
export default function Modal({ open, onClose, title, children, footer, width = 440 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(10,10,20,.5)]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-card-bg rounded-[12px] shadow-toast w-full max-h-[90vh] overflow-y-auto animate-fade"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <strong className="text-[14px] font-bold">{title}</strong>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="bg-transparent border-none text-text-tertiary hover:text-text-primary text-xl leading-none w-6 h-6 flex items-center justify-center shrink-0"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-[18px]">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-[14px] border-t border-border bg-[#fafafd] flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
