"use client";
const STATUS_STYLES = {
  on: "bg-success-dim text-success",
  off: "bg-danger-dim text-danger",
  pending: "bg-warning-dim text-warning",
};

/** status: 'on' | 'off' | 'pending'. The dot pulses when status is 'on'. */
export function StatusTag({ status = "on", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${status === "on" ? "animate-pulse-dot" : ""}`}
      />
      {children}
    </span>
  );
}

const BADGE_STYLES = {
  approved: "bg-success-dim text-success",
  pending: "bg-warning-dim text-warning",
  rejected: "bg-danger-dim text-danger",
};

/** variant: 'approved' | 'pending' | 'rejected' */
export function Badge({ variant = "approved", children }) {
  return (
    <span
      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[5px] uppercase tracking-[.03em] ${BADGE_STYLES[variant]}`}
    >
      {children}
    </span>
  );
}

/** Green "N channels live" style pill in the topbar. */
export function LivePill({ children }) {
  return (
    <span className="flex items-center gap-[5px] px-2.5 py-1 rounded-full bg-success-dim text-success font-semibold text-[11.5px]">
      <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_0_3px_var(--tw-shadow-color)] shadow-success-dim" />
      {children}
    </span>
  );
}
