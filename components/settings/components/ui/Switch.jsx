"use client";
/** Controlled toggle switch. Styling lives in index.css under .switch/.track (kept as
 *  plain CSS there since the ::before pseudo-element knob isn't expressible as a Tailwind class). */
export default function Switch({ checked, onChange, "aria-label": ariaLabel }) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-label={ariaLabel}
      />
      <span className="track" />
    </label>
  );
}
