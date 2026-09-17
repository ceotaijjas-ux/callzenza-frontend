"use client";
const VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent-dark",
  secondary: "bg-white text-text-primary border border-border hover:bg-[#f4f4f9]",
  danger: "bg-transparent text-danger px-[10px] hover:bg-danger-dim",
  ghost: "bg-transparent text-text-secondary px-[10px] hover:text-text-primary",
};

/**
 * Mirrors .btn / .btn-primary / .btn-secondary / .btn-danger / .btn-ghost.
 * Pass `icon` (a small SVG component) to render it before the label.
 */
export default function Button({
  variant = "secondary",
  icon: Icon,
  loading = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-[7px] px-4 py-2 text-[12.5px] font-semibold transition-colors active:scale-[.98] disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {Icon && <Icon className={`w-[13px] h-[13px] ${loading ? "animate-spin" : ""}`} />}
      {children}
    </button>
  );
}
