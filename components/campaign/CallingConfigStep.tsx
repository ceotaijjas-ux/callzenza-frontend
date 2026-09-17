"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";

interface CallingConfigStepProps {
  callingMode: string;
  setCallingMode: (v: string) => void;
  twilioNumber: string;
  setTwilioNumber: (v: string) => void;
  callingHours: string;
  setCallingHours: (v: string) => void;
  timezone: string;
  setTimezone: (v: string) => void;
  maxAttempts: string;
  setMaxAttempts: (v: string) => void;
  retryDelay: string;
  setRetryDelay: (v: string) => void;
  concurrency: string;
  setConcurrency: (v: string) => void;
}

export function CallingConfigStep({
  callingMode,
  setCallingMode,
  twilioNumber,
  setTwilioNumber,
  callingHours,
  setCallingHours,
  timezone,
  setTimezone,
  maxAttempts,
  setMaxAttempts,
  retryDelay,
  setRetryDelay,
  concurrency,
  setConcurrency,
}: CallingConfigStepProps) {
  return (
    <Card className="p-6 space-y-4 shadow-sm border-gray-200/80 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Settings className="h-5 w-5 text-indigo-500" /> Step 5: Calling Configuration
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Calling Mode
          </label>
          <select
            value={callingMode}
            onChange={(e) => setCallingMode(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium cursor-pointer"
          >
            <option value="twilio">Twilio Outbound</option>
            <option value="local">Local Test Mode (Simulated)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Twilio Caller ID / Number
          </label>
          <Input
            value={callingMode === "local" ? "LOCAL_TEST" : twilioNumber}
            onChange={(e) => setTwilioNumber(e.target.value)}
            disabled={callingMode === "local"}
            className="font-medium disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Allowed calling hours
          </label>
          <Input
            value={callingHours}
            onChange={(e) => setCallingHours(e.target.value)}
            placeholder="e.g. 09:00-18:00"
            className="font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Timezone Offset
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium cursor-pointer"
          >
            <option value="Local">Local (Lead's timezone)</option>
            <option value="UTC">UTC</option>
            <option value="EST">EST / America New York</option>
            <option value="IST">IST / Asia Kolkata</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Max attempts per lead
          </label>
          <Input
            type="number"
            min="1"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
            className="font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Retry delay (Minutes)
          </label>
          <Input
            type="number"
            min="1"
            value={retryDelay}
            onChange={(e) => setRetryDelay(e.target.value)}
            className="font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Concurrency (Parallel lines)
          </label>
          <Input
            type="number"
            min="1"
            value={concurrency}
            onChange={(e) => setConcurrency(e.target.value)}
            className="font-medium"
          />
        </div>
      </div>
    </Card>
  );
}
