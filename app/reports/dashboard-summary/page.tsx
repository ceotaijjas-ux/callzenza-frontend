"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from "@/components/AppShell";
import Link from 'next/link';
import { ArrowLeft, Activity, Users, PhoneCall, Zap, AlertTriangle, HardDrive, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from "@/lib/api-client";

interface DashboardSummaryData {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  qualification_rate: number;
  active_conversations: number;
  human_handoffs: number;
  open_deals: number;
  won_deals: number;
  revenue: number;
  conversion_rate: number;
  lead_sources: Record<string, number>;
  pipeline_by_stage: Record<string, number>;
  ai_calls_in_progress: number;
  completed_ai_calls: number;
  assigned_leads: number;
  unassigned_leads: number;
  waiting_queue_count: number;
  available_agents_count: number;
  busy_agents_count: number;
  offline_agents_count: number;
  active_transfers_count: number;
}

// A custom SVG Speedometer component
const Speedometer = ({ value, max }: { value: number, max: number }) => {
  const percentage = Math.min(value / (max || 1), 1);
  const angle = -135 + (percentage * 270);

  return (
    <div className="relative w-56 h-56 flex items-center justify-center my-4">
      <svg className="w-full h-full drop-shadow-xl" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path d="M 20 80 A 45 45 0 1 1 80 80" fill="none" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />
        <path 
          d="M 20 80 A 45 45 0 1 1 80 80" 
          fill="none" 
          stroke="url(#speedGrad)" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeDasharray="200" 
          strokeDashoffset={200 - (200 * percentage)} 
          className="transition-all duration-1000 ease-out" 
          filter="url(#glow)" 
        />
        {[...Array(11)].map((_, i) => (
          <line key={i} x1="50" y1="12" x2="50" y2="16" stroke="#cbd5e1" strokeWidth="2" transform={`rotate(${-135 + i * 27} 50 50)`} />
        ))}
      </svg>
      
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ rotate: -135 }}
        animate={{ rotate: angle }}
        transition={{ type: "spring", stiffness: 40, damping: 15 }}
      >
        <div className="w-1.5 h-[85px] bg-slate-800 rounded-full origin-bottom translate-y-[-20px] shadow-sm relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[10px] border-l-transparent border-r-transparent border-b-rose-500 -mt-1"></div>
        </div>
      </motion.div>
      
      <div className="absolute w-8 h-8 bg-slate-800 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
        <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
      </div>
      
      <div className="absolute bottom-2 flex flex-col items-center">
        <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">{value}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Calls</span>
      </div>
    </div>
  );
};

const LivePulseGraph = () => {
  return (
    <div className="relative w-full h-[140px] overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 shadow-inner flex items-center mt-2">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:15px_15px]"></div>
      <motion.svg 
        className="absolute w-[200%] h-full text-emerald-400" 
        preserveAspectRatio="none" 
        viewBox="0 0 1000 100"
        initial={{ x: "0%" }}
        animate={{ x: "-50%" }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      >
        <path 
          d="M0,50 L50,50 L60,20 L70,80 L80,50 L150,50 L160,10 L170,90 L180,50 L250,50 L260,30 L270,70 L280,50 L350,50 L360,20 L370,80 L380,50 L450,50 L460,10 L470,90 L480,50 L500,50 L550,50 L560,20 L570,80 L580,50 L650,50 L660,10 L670,90 L680,50 L750,50 L760,30 L770,70 L780,50 L850,50 L860,20 L870,80 L880,50 L950,50 L960,10 L970,90 L980,50 L1000,50" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinejoin="round" 
          strokeLinecap="round" 
          style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,0.9))" }}
        />
      </motion.svg>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 pointer-events-none"></div>
      <div className="absolute top-4 left-5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.9)]"></div>
        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Live DB Stream Active</span>
      </div>
    </div>
  );
};

const ActiveDialerRing = () => {
  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <motion.div 
        className="absolute w-full h-full border-2 border-indigo-400 rounded-full"
        animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
      />
      <motion.div 
        className="absolute w-full h-full border-2 border-indigo-300 rounded-full"
        animate={{ scale: [1, 2.8], opacity: [0.5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.3 }}
      />
      <div className="relative w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50">
        <PhoneCall className="w-5 h-5 text-white animate-pulse" />
      </div>
    </div>
  );
};

export default function DashboardSummary() {
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dash, camps] = await Promise.allSettled([
        apiFetch<DashboardSummaryData>("/api/reports/dashboard-summary"),
        apiFetch<any[]>("/api/campaigns")
      ]);
      if (dash.status === "fulfilled" && dash.value) setData(dash.value);
      if (camps.status === "fulfilled" && Array.isArray(camps.value)) setCampaigns(camps.value);
    } catch (err) {
      console.warn("Failed to load dashboard summary data:", err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const totalCallsToday = (data?.completed_ai_calls ?? 0) + (data?.ai_calls_in_progress ?? 0);
  const agentsLive = (data?.available_agents_count ?? 0) + (data?.busy_agents_count ?? 0);
  const qualificationRate = data?.qualification_rate ?? 0.0;
  const activeCalls = data?.ai_calls_in_progress ?? 0;

  return (
    <AppShell>
      <div className="p-4 md:p-6 w-full bg-slate-100 min-h-screen font-sans">
        
        {/* Header */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link 
              href="/reports"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-bold transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Reports
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
              Live Command Center
            </h1>
          </div>
          <div className="flex gap-3">
            <span className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl border border-emerald-200 flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative"></span>
              System Live
            </span>
          </div>
        </div>

        {/* Top Graphical Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Speedometer Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-md shadow-slate-200/50 border border-slate-200/60 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute top-5 left-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Call Load</span>
            </div>
            
            <div className="mt-6">
              <Speedometer value={activeCalls} max={Math.max(activeCalls * 2, 50)} />
            </div>
            
            <div className="w-full mt-2 flex justify-between px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Idle</span>
              <span>High Capacity</span>
            </div>
          </motion.div>

          {/* Active Dialing Status Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 text-white relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30 animate-pulse"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20" style={{ animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    Global System Status
                  </h3>
                  <div className="text-3xl font-black text-white flex items-center gap-4">
                    <ActiveDialerRing />
                    <span className="tracking-tight">
                      {activeCalls > 0 ? "Voice Calls Active" : "Standing By"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">{qualificationRate}%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Qualification Rate</div>
                </div>
              </div>

              <LivePulseGraph />
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Calls Today</div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{totalCallsToday}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Agents Online</div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{agentsLive} <span className="text-sm font-bold text-emerald-500 ml-1">Live</span></div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Queue Waiting</div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{data?.waiting_queue_count ?? 0}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4 border border-purple-100">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Active Conversations</div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{data?.active_conversations ?? 0}</div>
          </motion.div>
        </div>

        {/* System Bars / Active Campaigns */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-2 mb-6">
            <HardDrive className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black text-slate-800">Active Campaigns ({campaigns.length})</h2>
          </div>
          
          <div className="space-y-6">
            {campaigns.length === 0 ? (
              <div className="text-center text-slate-400 py-6 font-medium">No campaigns created yet</div>
            ) : (
              campaigns.slice(0, 5).map((camp: any, i: number) => {
                const load = Math.min(100, Math.max(10, ((i + 1) * 25) % 100));
                return (
                  <div key={camp.id || i}>
                    <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">
                      <span>{camp.name || 'CAMPAIGN'}</span>
                      <span className="text-indigo-600">{camp.status || 'ACTIVE'}</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${load}%` }}
                        transition={{ duration: 1.5, delay: 0.2 * i, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 relative overflow-hidden"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
