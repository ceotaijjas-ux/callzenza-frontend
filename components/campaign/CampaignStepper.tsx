"use client";

import React from "react";
import { Info, FileText, Bot, FolderOpen, Settings, Eye } from "lucide-react";

interface CampaignStepperProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

export const CAMPAIGN_STEPS = [
  { num: 1, label: "Basic Info", icon: Info },
  { num: 2, label: "Script", icon: FileText },
  { num: 3, label: "Agent", icon: Bot },
  { num: 4, label: "Leads", icon: FolderOpen },
  { num: 5, label: "Calling Config", icon: Settings },
  { num: 6, label: "Review", icon: Eye },
];

export function CampaignStepper({ currentStep, onSelectStep }: CampaignStepperProps) {
  return (
    <div className="mb-8 max-w-4xl bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between">
        {CAMPAIGN_STEPS.map((s) => (
          <div key={s.num} className="flex flex-col items-center flex-1 last:flex-none">
            <div className="flex items-center w-full justify-center">
              <button
                type="button"
                onClick={() => onSelectStep(s.num)}
                className={`flex items-center justify-center h-10 w-10 rounded-full font-semibold border-2 transition-all cursor-pointer ${
                  currentStep === s.num
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-110"
                    : currentStep > s.num
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
                title={s.label}
              >
                <s.icon className="h-4 w-4" />
              </button>
              {s.num < 6 && (
                <div
                  className={`flex-1 h-0.5 mx-2 min-w-[20px] transition-all duration-300 ${
                    currentStep > s.num ? "bg-emerald-500" : "bg-gray-150"
                  }`}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelectStep(s.num)}
              className={`mt-2 text-[11px] font-bold transition-all truncate max-w-[80px] cursor-pointer ${
                currentStep === s.num ? "text-indigo-600 font-extrabold scale-105" : "text-gray-400 hover:text-gray-650"
              }`}
            >
              {s.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
