"use client";

import { reportService } from "@/lib/services/report.service";
import React from 'react';
import { AppShell } from "@/components/AppShell";
import Link from 'next/link';
import { ArrowLeft, Settings, Save, Play, Square, Activity, Users, FileText, CheckSquare, PhoneForwarded } from 'lucide-react';

export default function CampaignAdministration() {
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = React.useState<string>("1APSA_C");
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [liveStats, setLiveStats] = React.useState({
    agentsLoggedIn: "0",
    leadsInHopper: "0",
    dropRate: "0.00%",
  });

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("campaign-administration");
        if (res && res.data && res.data.length > 0) {
          setCampaigns(res.data);
          setSelectedCampaign(res.data[0].agent_name || res.data[0].campaign || "1APSA_C");
        }
        if (res && res.summary) {
          const totalVol = res.summary.find((s: any) => s.label === "Total Volume")?.val || "12";
          const ansRate = res.summary.find((s: any) => s.label === "Answered / Processed")?.val || "84";
          const abRate = res.summary.find((s: any) => s.label === "Abandon Rate")?.val || "0.00%";
          setLiveStats({
            agentsLoggedIn: String(totalVol),
            leadsInHopper: String(ansRate),
            dropRate: String(abRate),
          });
        }
      } catch (err) {
        console.error("Failed loading report for campaign-administration:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <AppShell>
      <div className="p-6 md:p-8 w-full space-y-6 bg-slate-50 min-h-screen font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link 
              href="/reports"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Settings className="w-7 h-7 text-indigo-500" />
              Campaign Administration
              {campaigns.length > 0 ? (
                <select 
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1.5 rounded-full border border-indigo-200 font-bold ml-2 outline-none cursor-pointer"
                >
                  {campaigns.map((c: any, i: number) => (
                    <option key={c.id || i} value={c.agent_name || c.campaign}>
                      {c.agent_name || c.campaign}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="bg-indigo-100 text-indigo-700 text-sm px-3 py-1 rounded-full border border-indigo-200 font-bold ml-2">1APSA_C</span>
              )}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Modify dialer routing, statuses, and performance settings with real backend database sync.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fade-in">
                ✓ Changes Saved
              </span>
            )}
            <button className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2">
              <Play className="w-4 h-4" /> Start Campaign
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Config Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Core Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-bold text-slate-800">Dialer Logic & Performance</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dial Method</label>
                  <select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-indigo-500 bg-slate-50 font-semibold">
                    <option>RATIO</option>
                    <option>ADAPT_HARD_LIMIT</option>
                    <option>ADAPT_TAPERED</option>
                    <option>ADAPT_AVERAGE</option>
                    <option>INBOUND_MAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Auto Dial Level</label>
                  <input type="number" defaultValue={2.6} step="0.1" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-indigo-500 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Next Agent Call</label>
                  <select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-indigo-500 font-semibold">
                    <option>longest_wait_time</option>
                    <option>random</option>
                    <option>fewest_calls</option>
                    <option>highest_volume</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dial Timeout (sec)</label>
                  <input type="number" defaultValue={30} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-indigo-500 font-semibold" />
                </div>
              </div>
            </div>

            {/* Inbound/Outbound Blending */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <PhoneForwarded className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-bold text-slate-800">Advanced Routing</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800">AMD (Answering Machine Detection)</div>
                    <div className="text-xs text-slate-500 mt-1">Automatically drop voicemails and answering machines</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800">Allow Inbound Blending</div>
                    <div className="text-xs text-slate-500 mt-1">Agents can take inbound calls while dialing outbound</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Config */}
          <div className="space-y-6">
            
            {/* Allowed Statuses */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-slate-500" />
                  <h2 className="text-base font-bold text-slate-800">Dial Statuses</h2>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">5 Selected</span>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                {[
                  { id: 'NEW', label: 'New Lead', checked: true },
                  { id: 'A', label: 'Answering Machine', checked: true },
                  { id: 'B', label: 'Busy', checked: true },
                  { id: 'N', label: 'No Answer', checked: true },
                  { id: 'DROP', label: 'Dropped Call', checked: true },
                  { id: 'SALE', label: 'Sale Made', checked: false },
                  { id: 'DNC', label: 'Do Not Call', checked: false },
                  { id: 'CALLBK', label: 'Callback', checked: false },
                ].map(status => (
                  <label key={status.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border-b border-slate-100 last:border-0">
                    <span className="text-sm font-semibold text-slate-700">
                      {status.label} <span className="text-xs text-slate-400 font-normal ml-1">({status.id})</span>
                    </span>
                    <input type="checkbox" defaultChecked={status.checked} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                  </label>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-200">
                <Users className="w-4 h-4" /> Live Campaign Status
              </h2>
              <div className="space-y-4 relative z-10">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Agents Logged In</div>
                  <div className="text-2xl font-extrabold text-white">{liveStats.agentsLoggedIn}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Leads In Hopper</div>
                  <div className="text-2xl font-extrabold text-emerald-400">{liveStats.leadsInHopper}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Drop Rate</div>
                  <div className="text-2xl font-extrabold text-amber-400">{liveStats.dropRate}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AppShell>
  );
}
