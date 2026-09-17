"use client";

import React from "react";
import { KpiItem } from "@/lib/services/lead-recycle.service";

interface KpiCardsProps {
  items: KpiItem[];
}

export default function KpiCards({ items }: KpiCardsProps) {
  const getBadgeStyle = (cls: string) => {
    switch (cls) {
      case "purple":
        return "text-indigo-600 bg-indigo-50 border-indigo-100";
      case "orange":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "green":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "red":
        return "text-rose-600 bg-rose-50 border-rose-100";
      default:
        return "text-slate-800 bg-slate-50 border-slate-200";
    }
  };

  const getValueColor = (cls: string) => {
    switch (cls) {
      case "purple":
        return "text-indigo-700";
      case "orange":
        return "text-amber-600";
      case "green":
        return "text-emerald-600";
      case "red":
        return "text-rose-600";
      default:
        return "text-slate-900";
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {items.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
        >
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            {kpi.label}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-black tracking-tight ${getValueColor(kpi.cls)}`}>
              {kpi.value}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                kpi.cls
              )}`}
            >
              Live
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
