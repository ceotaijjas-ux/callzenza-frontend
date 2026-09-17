"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";

interface BasicInfoStepProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  objective: string;
  setObjective: (v: string) => void;
  customObjective: string;
  setCustomObjective: (v: string) => void;
  defaultLanguage: string;
  setDefaultLanguage: (v: string) => void;
  dialerType?: "AUTO" | "MANUAL";
  setDialerType?: (v: "AUTO" | "MANUAL") => void;
  clientId?: string;
  setClientId?: (v: string) => void;
  clientName?: string;
  setClientName?: (v: string) => void;
  clientPhone?: string;
  setClientPhone?: (v: string) => void;
  clients?: import("@/lib/services/client.service").Client[];
}

export function BasicInfoStep({
  name,
  setName,
  description,
  setDescription,
  objective,
  setObjective,
  customObjective,
  setCustomObjective,
  defaultLanguage,
  setDefaultLanguage,
  dialerType = "AUTO",
  setDialerType,
  clientId = "",
  setClientId,
  clientName = "",
  setClientName,
  clientPhone = "",
  setClientPhone,
  clients = [],
}: BasicInfoStepProps) {
  const isPhoneInvalid = clientPhone.trim() !== "" && !/^\+?[1-9]\d{1,14}$/.test(clientPhone.trim());

  const handleClientSelect = (selectedId: string) => {
    if (setClientId) setClientId(selectedId);
    if (!selectedId) return;
    const found = clients.find((c) => c.id === selectedId);
    if (found) {
      if (setClientName) setClientName(found.name || found.company_name || "");
      if (setClientPhone) setClientPhone(found.contact_number || "");
    }
  };

  return (
    <Card className="p-6 space-y-4 shadow-sm border-gray-200/80 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Info className="h-5 w-5 text-indigo-500" /> Step 1: Campaign Basic Info & Client Contact
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Campaign Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-medium"
            required
          />
        </div>

        {/* Client Contact Info for 3-Party Conference Calls */}
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
            Select Client
          </h4>
          {clients && clients.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Choose Existing Client
              </label>
              <select
                value={clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm font-medium cursor-pointer mb-2"
              >
                <option value="">-- Create / Enter Custom Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ""} - {c.contact_number || "No Phone"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Client Name (Company / Manager) *
              </label>
              <Input
                value={clientName}
                onChange={(e) => {
                  setClientId?.("");
                  setClientName?.(e.target.value);
                }}
                className="font-medium bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Client Phone Number (E.164 Format)
              </label>
              <Input
                value={clientPhone}
                onChange={(e) => setClientPhone?.(e.target.value)}
                className={`font-medium bg-white ${isPhoneInvalid ? 'border-rose-500 focus:ring-rose-500' : ''}`}
              />
              {isPhoneInvalid && (
                <p className="text-[10px] font-bold text-rose-500 mt-1">
                  Must be valid E.164 format (e.g. +15550192834)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dialer Type / Mode Selection */}
        <div>
          <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1.5 font-bold flex items-center gap-1.5">
            Dialer Type / Mode *
          </label>
          <select
            value={dialerType}
            onChange={(e) => setDialerType?.(e.target.value as "AUTO" | "MANUAL")}
            className="w-full h-11 px-3 rounded-md border border-indigo-200 bg-indigo-50/40 text-sm font-bold text-indigo-950 cursor-pointer focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="AUTO">Auto Dialer (Predictive Dialer - PD)</option>
            <option value="MANUAL">Manual Dialer (Agent Triggered)</option>
          </select>
          <p className="text-[11px] font-medium text-slate-600 mt-1 leading-snug">
            {dialerType === "AUTO"
              ? "⚡ Auto Dialer: Campaign will immediately navigate to Voice Agent Dashboard with PD Ready (Inactive). Toggling ACTIVE starts auto calling leads."
              : "📞 Manual Dialer: Campaign will require the voice agent to trigger calls manually."}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Campaign Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-sm font-medium border border-input rounded-md px-3 py-2 bg-background"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Objective / Purpose
          </label>
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm font-medium mb-3 cursor-pointer"
          >
            <option value="">-- Select Objective --</option>
            <option value="Solar">Solar</option>
            <option value="ACA">ACA</option>
            <option value="MUA">MUA</option>
            <option value="Custom">Custom / Other</option>
          </select>
          {objective === "Custom" && (
            <Input
              value={customObjective}
              onChange={(e) => setCustomObjective(e.target.value)}
              placeholder="Enter custom campaign objective"
              className="font-medium mb-3"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-medium">
            Regional Language
          </label>
          <select
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value)}
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm font-medium cursor-pointer"
          >
            <option value="auto">Auto Detect</option>
            <option value="en">English</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="ml">Malayalam</option>
            <option value="kn">Kannada</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
            <option value="mr">Marathi</option>
            <option value="gu">Gujarati</option>
            <option value="pa">Punjabi</option>
            <option value="ur">Urdu</option>
            <option value="or">Odia</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
