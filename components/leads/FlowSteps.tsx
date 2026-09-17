"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

interface FlowStepsProps {
  title: string;
  subtitle: string;
  steps: string[];
  activeIndex?: number;
  onStepClick?: (stepIndex: number, stepName: string) => void;
}

const STEP_URLS: Record<string, string> = {
  // Lead Recycle flow
  "Call Disposition": "/settings?tab=dispositions",
  "Recycle List": "/leads/recycle",
  "Campaign": "/leads/recycle",
  "Recycle": "/leads/recycle",
  "Hopper": "/leads/hopper",

  // Lead Hopper flow
  "Recycle Complete": "/leads/recycle",
  "Lead Hopper": "/leads/hopper",
  "Agent Routing": "/campaigns",
  "Live Call": "/live-calls",
};

export default function FlowSteps({
  title,
  subtitle,
  steps,
  activeIndex = 1,
  onStepClick,
}: FlowStepsProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {steps.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const stepName = step.replace(/^\d+\s*/, "").trim();
          const targetUrl = STEP_URLS[stepName];

          const buttonContent = (
            <div
              onClick={() => onStepClick?.(idx, stepName)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none ${
                isCurrent
                  ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 hover:bg-indigo-700"
                  : isDone
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-2xs"
              }`}
              title={`Step ${idx + 1}: ${stepName} (Click to open)`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isCurrent
                      ? "bg-white text-indigo-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {idx + 1}
                </span>
              )}
              <span>{stepName}</span>
            </div>
          );

          return (
            <React.Fragment key={idx}>
              {onStepClick ? (
                buttonContent
              ) : targetUrl ? (
                <Link href={targetUrl} className="shrink-0">
                  {buttonContent}
                </Link>
              ) : (
                buttonContent
              )}
              {idx < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
