"use client";

import React from "react";
import { RecycleList } from "@/lib/services/lead-recycle.service";
import { ArrowRight } from "lucide-react";

interface ListCardProps {
  list: RecycleList;
  onOpen: (list: RecycleList) => void;
}

export default function ListCard({ list, onOpen }: ListCardProps) {
  const getTagStyle = (cls: string) => {
    switch (cls) {
      case "b-i":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "b-p":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "b-g":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "b-w":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "b-r":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadgeStyle = (statusBadge: string) => {
    if (statusBadge === "b-w") return "bg-amber-50 text-amber-700 border-amber-200";
    if (statusBadge === "b-g") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (statusBadge === "b-i") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div
      onClick={() => onOpen(list)}
      className="grid grid-cols-[40px_1fr_1fr_1fr_80px_80px_80px_100px_100px_120px] gap-4 items-center p-4 bg-white border-b border-slate-100 hover:bg-indigo-50/30 transition-all cursor-pointer group"
    >
      {/* Icon */}
      <div className="flex justify-center">
        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-bold text-base border border-indigo-100 transition-colors">
          {list.icon || "↻"}
        </span>
      </div>

      {/* Lead List Name & Desc */}
      <div className="min-w-0">
        <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
          {list.title}
        </h3>
        <p className="text-xs text-slate-500 truncate">
          {list.description}
        </p>
      </div>

      {/* Disposition / Tags */}
      <div className="flex flex-wrap gap-1.5">
        {list.tags.map((t, idx) => (
          <span
            key={idx}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getTagStyle(
              t.cls
            )}`}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* Campaign */}
      <div className="text-xs font-semibold text-slate-700 truncate">
        {(list as any).campaign || list.reason || "All Campaigns"}
      </div>

      {/* Total */}
      <div className="text-sm font-black text-slate-900 text-center">
        {list.total}
      </div>

      {/* Pending */}
      <div className="text-sm font-black text-amber-600 text-center">
        {list.pending}
      </div>

      {/* Recycled */}
      <div className="text-sm font-black text-emerald-600 text-center">
        {list.recycled}
      </div>

      {/* Created */}
      <div className="text-xs font-medium text-slate-500 text-center">
        {list.created}
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
            list.statusBadge
          )}`}
        >
          {list.status}
        </span>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(list);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer w-full ${
            list.actionStyle === "primary"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs group-hover:shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
          }`}
        >
          <span>{list.actionLabel || "Open"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
