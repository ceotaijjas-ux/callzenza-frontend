"use client";
import useClock from "../../hooks/useClock.js";
import { LivePill } from "../ui/StatusTag.jsx";

export default function Topbar({ title, subtitle }) {
  const clock = useClock();

  return (
    <div className="flex items-center justify-between gap-4 px-8 py-4 border-b border-border bg-white sticky top-0 z-20">
      <div>
        <div className="font-disp font-bold text-lg tracking-tight">{title}</div>
        <div className="text-xs text-text-secondary mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}
