"use client";

import React from "react";
import { AlertCircle, RotateCw } from "lucide-react";

interface ConfirmDialogProps {
  text: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  text,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="p-6">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
              <RotateCw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 mb-1">
                Confirm Recycle Action
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {text}
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2 mb-5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Leads will immediately enter the calling hopper queue.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs shadow-sm transition-colors cursor-pointer"
            >
              Confirm &amp; Recycle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
