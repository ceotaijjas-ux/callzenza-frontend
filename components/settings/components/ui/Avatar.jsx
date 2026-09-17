"use client";
const COLOR_STYLES = {
  default: "bg-av-purple-bg text-av-purple",
  pink: "bg-av-pink-bg text-av-pink",
  teal: "bg-av-teal-bg text-av-teal",
  amber: "bg-av-amber-bg text-av-amber",
};

/** Small circular initials avatar, matches .avatar-sm (+ color modifiers). */
export function AvatarSm({ children, color = "default" }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10.5px] font-bold mr-2 ${COLOR_STYLES[color]}`}
    >
      {children}
    </span>
  );
}

/** Larger square-ish accent avatar chip used in the sidebar footer / identity panel. */
export function AvatarChip({ children, size = 30, className = "" }) {
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className={`rounded-lg bg-accent text-white font-disp font-bold flex items-center justify-center shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}
