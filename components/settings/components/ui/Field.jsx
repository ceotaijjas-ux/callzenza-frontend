"use client";
import Switch from "./Switch.jsx";

const inputBase =
  "border border-border rounded-[7px] px-[11px] py-[9px] bg-[#fbfbfd] text-text-primary w-full transition-colors focus:outline-none focus:border-accent focus:bg-white";

/** Wraps a labeled form control. `full` spans both grid columns inside a .field-grid. */
export function Field({ label, hint, full = false, children }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      {label && (
        <label className="text-[12px] font-semibold text-text-secondary">{label}</label>
      )}
      {children}
      {hint && <span className="text-[11px] text-text-tertiary font-normal mt-0.5">{hint}</span>}
    </div>
  );
}

/** Two-column responsive grid for grouping Fields, matches .field-grid. */
export function FieldGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 gap-x-8">{children}</div>;
}

export function Input({ mono = false, className = "", ...rest }) {
  return (
    <input className={`${inputBase} ${mono ? "font-mono text-[12.5px]" : ""} ${className}`} {...rest} />
  );
}

export function Select({ className = "", children, ...rest }) {
  return (
    <select className={`${inputBase} ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...rest }) {
  return <textarea className={`${inputBase} resize-y min-h-[64px] ${className}`} {...rest} />;
}

/** A row with a title (+ optional description) on the left and a switch on the right. */
export function RowLine({ title, description, checked, onChange, last = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 ${
        last ? "" : "border-b border-border"
      }`}
    >
      <div>
        <div className="text-[13px] font-semibold">{title}</div>
        {description && (
          <div className="text-[11.5px] text-text-tertiary mt-0.5">{description}</div>
        )}
      </div>
      <Switch checked={checked} onChange={onChange} aria-label={title} />
    </div>
  );
}

/** Selectable card used for the Inbox model radio choice. */
export function RadioCard({ name, title, description, selected, onSelect }) {
  return (
    <label
      onClick={onSelect}
      className={`flex items-start gap-3 border rounded-[8px] px-4 py-3 mb-2.5 last:mb-0 cursor-pointer transition-colors ${
        selected ? "border-accent bg-accent-dim/40" : "border-border hover:bg-[#fafafd]"
      }`}
    >
      <input type="radio" name={name} checked={selected} readOnly className="mt-1 accent-accent" />
      <div>
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[11.5px] text-text-tertiary mt-0.5">{description}</div>
      </div>
    </label>
  );
}
