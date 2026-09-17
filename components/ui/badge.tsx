import { HTMLAttributes } from "react";
import { clsx } from "clsx";

const COLORS: Record<string, string> = {
  NEW: "bg-slate-50 text-slate-700 border-slate-200",
  ENGAGED: "bg-blue-50 text-blue-700 border-blue-100",
  QUALIFYING: "bg-amber-50 text-amber-700 border-amber-200",
  QUALIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UNQUALIFIED: "bg-rose-50 text-rose-700 border-rose-200",
  NURTURE: "bg-purple-50 text-purple-700 border-purple-200",
  ASSIGNED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  WON: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST: "bg-rose-50 text-rose-700 border-rose-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-500 border-slate-200",
  HANDED_OFF: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: string;
}

export function Badge({ className, children, variant, ...props }: BadgeProps) {
  const label = String(children ?? "");
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
        COLORS[label] ?? "bg-slate-50 text-slate-700 border-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

