"use client";
const COLOR_STYLES = {
  default: "bg-[#f3f3f8] text-text-secondary",
  pink: "bg-av-pink-bg text-av-pink",
  teal: "bg-av-teal-bg text-av-teal",
  dashed: "bg-transparent border border-dashed border-border text-text-secondary",
};

const AVATAR_COLOR = {
  default: "bg-av-purple",
  pink: "bg-av-pink",
  teal: "bg-av-teal",
};

/**
 * Removable pill. `avatarLabel` renders a small round initials badge (VIP contacts);
 * omit it for plain text chips (snippets, keyword triggers).
 */
export default function Chip({ children, color = "default", avatarLabel, onRemove }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-full ${COLOR_STYLES[color]}`}
    >
      {avatarLabel && (
        <span
          className={`w-4 h-4 rounded-full text-white text-[8.5px] font-bold flex items-center justify-center shrink-0 ${AVATAR_COLOR[color]}`}
        >
          {avatarLabel}
        </span>
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-60 hover:opacity-100 leading-none text-[14px]"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}
