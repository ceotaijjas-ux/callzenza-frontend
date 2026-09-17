"use client";

import React, { useState, useEffect } from "react";
import { X, Layers, Plus } from "lucide-react";
import { CreateRecycleListPayload } from "@/lib/services/lead-recycle.service";
import { campaignService, Campaign } from "@/lib/services/campaign.service";

interface CreateListModalProps {
  onClose: () => void;
  onCreate: (payload: CreateRecycleListPayload) => void;
}

export default function CreateListModal({ onClose, onCreate }: CreateListModalProps) {
  const [sourceDisposition, setSourceDisposition] = useState("Call Back");
  const [sourceCampaign, setSourceCampaign] = useState("");
  const [leadSelection, setLeadSelection] = useState("All eligible leads");
  const [retryWindow, setRetryWindow] = useState("Next available window");
  const [defaultQueue, setDefaultQueue] = useState("Auto Route");
  const [listName, setListName] = useState("Call Back");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    campaignService.list().then((data) => {
      setCampaigns(data);
      if (data.length > 0) {
        setSourceCampaign(data[0].name);
        setListName(`Call Back — ${data[0].name}`);
      }
    }).catch(console.error);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      source_disposition: sourceDisposition,
      source_campaign: sourceCampaign,
      lead_selection: leadSelection,
      retry_window: retryWindow,
      default_hopper_queue: defaultQueue,
      list_name: listName,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="p-5 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Layers className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">Create Recycle Lead List</h3>
              <p className="text-xs text-indigo-200">Group leads by disposition for automated recycle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
              Source Disposition *
            </label>
            <select
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
              value={sourceDisposition}
              onChange={(e) => {
                setSourceDisposition(e.target.value);
                setListName(`${e.target.value} — ${sourceCampaign}`);
              }}
            >
              <option value="Call Back">Call Back</option>
              <option value="Voice Mail">Voice Mail</option>
              <option value="Others">Others</option>
              <option value="No Answer">No Answer</option>
              <option value="Busy">Busy</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
                Source Campaign
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                value={sourceCampaign}
                onChange={(e) => {
                  setSourceCampaign(e.target.value);
                  setListName(`${sourceDisposition} — ${e.target.value}`);
                }}
              >
                <option value="" disabled>Select Campaign</option>
                {campaigns.map((camp) => (
                  <option key={camp.id} value={camp.name}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
                Lead Selection
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                value={leadSelection}
                onChange={(e) => setLeadSelection(e.target.value)}
              >
                <option value="All eligible leads">All eligible leads</option>
                <option value="Manual selection">Manual selection</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
                Retry Window
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                value={retryWindow}
                onChange={(e) => setRetryWindow(e.target.value)}
              >
                <option value="Next available window">Next available window</option>
                <option value="Today">Today</option>
                <option value="Tomorrow">Tomorrow</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
                Default Hopper Queue
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                value={defaultQueue}
                onChange={(e) => setDefaultQueue(e.target.value)}
              >
                <option value="Auto Route">Auto Route</option>
                <option value="Callback Queue">Callback Queue</option>
                <option value="Priority Queue">Priority Queue</option>
                <option value="General Queue">General Queue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
              Custom List Name
            </label>
            <input
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g. Call Back — Product Campaign"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lead List</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
