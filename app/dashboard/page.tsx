"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { analyticsService, DashboardSummary } from "@/lib/services/analytics.service";
import { campaignService, Campaign } from "@/lib/services/campaign.service";
import { useAuthStore } from "@/lib/store";
import { adminService, AdminUser, AdminCampaign, AdminLead } from "@/lib/services/admin.service";
import { callService, Call } from "@/lib/services/call.service";
import Link from "next/link";
import { 
  Shield, Users, Play, FileText, UserCheck, AlertCircle, 
  MessageSquare, Handshake, DollarSign, Activity, Percent, Calendar,
  PhoneCall, PhoneForwarded, Zap, ArrowUpRight, Maximize2, Minimize2,
  Headphones, Radio, Globe2, LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";

// --- ANIMATED BACKGROUND COMPONENTS ---

const AnimatedDashboardBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{ rotate: 360, x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="absolute -top-40 -left-20 opacity-5 text-indigo-700"
      >
        <PhoneCall size={700} strokeWidth={0.5} />
      </motion.div>
      <motion.div
        animate={{ rotate: -360, x: [0, -80, 0], y: [0, 50, 0] }}
        transition={{ duration: 160, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 -right-40 opacity-5 text-purple-700"
      >
        <Headphones size={800} strokeWidth={0.5} />
      </motion.div>
      <motion.div
        animate={{ rotate: 360, x: [0, 60, 0], y: [0, -80, 0] }}
        transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-60 left-[20%] opacity-[0.03] text-emerald-700"
      >
        <Globe2 size={1000} strokeWidth={0.5} />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600"
      >
        <Radio size={500} strokeWidth={0.5} />
      </motion.div>
      
      {/* Scanning Laser Line */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        animate={{ y: [0, typeof window !== 'undefined' ? window.innerHeight : 1000, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

// --- ANIMATED UI COMPONENTS ---

const Speedometer = ({ value, max, label }: { value: number, max: number, label: string }) => {
  const percentage = Math.min(value / max, 1);
  const angle = -135 + (percentage * 270); // From -135deg to +135deg

  return (
    <div className="relative w-full h-48 flex flex-col items-center justify-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="speedGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="glow3" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Background track */}
          <path d="M 20 80 A 45 45 0 1 1 80 80" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          
          {/* Colored Track */}
          <path 
            d="M 20 80 A 45 45 0 1 1 80 80" 
            fill="none" 
            stroke="url(#speedGrad3)" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeDasharray="200" 
            strokeDashoffset={200 - (200 * percentage)} 
            className="transition-all duration-1000 ease-out" 
            filter="url(#glow3)" 
          />
          
          {/* Ticks */}
          {[...Array(11)].map((_, i) => (
            <line key={i} x1="50" y1="14" x2="50" y2="18" stroke="#cbd5e1" strokeWidth="2" transform={`rotate(${-135 + i * 27} 50 50)`} />
          ))}
        </svg>
        
        {/* Needle */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ rotate: -135 }}
          animate={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 40, damping: 15 }}
        >
          <div className="w-1 h-[65px] bg-slate-800 rounded-full origin-bottom translate-y-[10px] shadow-sm relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[8px] border-l-transparent border-r-transparent border-b-indigo-500 -mt-1"></div>
          </div>
        </motion.div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 rounded-full border-4 border-white shadow-md flex items-center justify-center mt-2">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
        </div>
      </div>
      
      {/* Value Text */}
      <div className="absolute bottom-0 flex flex-col items-center mt-4">
        <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</span>
      </div>
    </div>
  );
};

const LivePulseGraph = ({ isActive = true }: { isActive?: boolean }) => {
  return (
    <div className="relative w-full h-[120px] overflow-hidden bg-indigo-950/40 rounded-xl border border-indigo-500/20 shadow-inner flex items-center mt-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:15px_15px]"></div>
      
      {isActive ? (
        <motion.svg 
          className="absolute w-[200%] h-full text-indigo-400" 
          preserveAspectRatio="none" 
          viewBox="0 0 1000 100"
          initial={{ x: "0%" }}
          animate={{ x: "-50%" }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        >
          <path 
            d="M0,50 L50,50 L60,20 L70,80 L80,50 L150,50 L160,10 L170,90 L180,50 L250,50 L260,30 L270,70 L280,50 L350,50 L360,20 L370,80 L380,50 L450,50 L460,10 L470,90 L480,50 L500,50 L550,50 L560,20 L570,80 L580,50 L650,50 L660,10 L670,90 L680,50 L750,50 L760,30 L770,70 L780,50 L850,50 L860,20 L870,80 L880,50 L950,50 L960,10 L970,90 L980,50 L1000,50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.8))" }}
          />
        </motion.svg>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full text-slate-600/30" preserveAspectRatio="none" viewBox="0 0 1000 100">
            <line x1="0" y1="50" x2="1000" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <span className="absolute text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-slate-950/80 px-3 py-1 rounded-md border border-slate-800">
            No Active Campaign
          </span>
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 via-transparent to-indigo-900/50 pointer-events-none"></div>
    </div>
  );
};

const ActiveDialerRing = ({ isActive = true }: { isActive?: boolean }) => {
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      {isActive && (
        <>
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
        </>
      )}
      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isActive ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-indigo-500/50' : 'bg-slate-700 shadow-none'}`}>
        <PhoneCall className={`w-4 h-4 text-white ${isActive ? 'animate-pulse' : 'opacity-50'}`} />
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Animation values
  const [speedVal, setSpeedVal] = useState(0);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return () => unsub();
  }, []);

  const isAdmin = hydrated && user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "BUSINESS_OWNER");

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin Dashboard State
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminCampaigns, setAdminCampaigns] = useState<AdminCampaign[]>([]);
  const [adminLeads, setAdminLeads] = useState<AdminLead[]>([]);
  const [adminCalls, setAdminCalls] = useState<Call[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Determine active running campaigns across all agents / system
  const targetCampaignList = useMemo(() => {
    return isAdmin
      ? (adminCampaigns.length > 0 ? adminCampaigns : allCampaigns)
      : (allCampaigns.length > 0 ? allCampaigns : adminCampaigns);
  }, [isAdmin, adminCampaigns, allCampaigns]);

  const activeRunningCampaigns = useMemo(() => {
    return targetCampaignList.filter(c => (c.status || "").toUpperCase() === "RUNNING");
  }, [targetCampaignList]);

  const hasActiveCampaign = activeRunningCampaigns.length > 0;

  const ratioSum = useMemo(() => {
    return activeRunningCampaigns.reduce((sum, c) => sum + ((c as any).auto_dial_ratio || 1), 0);
  }, [activeRunningCampaigns]);

  const liveActiveCount = useMemo(() => {
    const activeCallsList = isAdmin ? adminCalls : recentCalls;
    return activeCallsList.filter(c =>
      ["DIALING", "RINGING", "CONNECTED", "IN_PROGRESS", "HUMAN_HANDLING", "AI_HANDLING"].includes((c.status || "").toUpperCase())
    ).length;
  }, [isAdmin, adminCalls, recentCalls]);

  const baseIntensity = useMemo(() => {
    return Math.max(30, (ratioSum * 50) + (liveActiveCount * 25));
  }, [ratioSum, liveActiveCount]);

  // Calculate & Update Dial Intensity Speedometer
  useEffect(() => {
    if (!hydrated) return;

    if (!hasActiveCampaign) {
      setSpeedVal(0);
      return;
    }

    const updateSpeed = () => {
      const microVariation = Math.floor(Math.random() * 20) - 10;
      setSpeedVal(Math.min(500, Math.max(10, baseIntensity + microVariation)));
    };

    updateSpeed();

    const interval = setInterval(updateSpeed, 2000);
    return () => clearInterval(interval);
  }, [hydrated, hasActiveCampaign, baseIntensity]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      dashboardRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const fetchData = async (showLoader = true) => {
    if (!hydrated || !user) return;
    if (showLoader) {
      if (isAdmin) setAdminLoading(true);
      else setLoading(true);
    }
    
    try {
      if (isAdmin) {
        const [usersRes, campaignsRes, leadsRes, callsRes, fullCampsRes] = await Promise.all([
          adminService.getUsers(),
          adminService.getCampaigns(),
          adminService.getLeads(),
          callService.list().catch(() => [] as Call[]),
          campaignService.list().catch(() => [] as Campaign[])
        ]);
        setAdminUsers(usersRes);
        setAdminCampaigns(campaignsRes);
        setAdminLeads(leadsRes);
        setAdminCalls(callsRes);
        setAllCampaigns(fullCampsRes);
      } else {
        const [dashboardRes, callsRes, fullCampsRes] = await Promise.all([
          analyticsService.dashboard(),
          callService.list().catch(() => [] as Call[]),
          campaignService.list().catch(() => [] as Campaign[])
        ]);
        setData(dashboardRes);
        setRecentCalls(callsRes.slice(0, 5));
        setAllCampaigns(fullCampsRes);
      }
    } catch (e: any) {
      if (isAdmin) setAdminError(e.message || "Failed to load admin dashboard data");
      else setError(e.message);
    } finally {
      if (showLoader) {
        if (isAdmin) setAdminLoading(false);
        else setLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    if (!hydrated || !user) return;
    fetchData(true);
  }, [hydrated, user, isAdmin]);

  // Active Campaign Live Polling - Runs ONLY when hasActiveCampaign is true
  useEffect(() => {
    if (!hydrated || !user || !hasActiveCampaign) return;

    const intervalId = setInterval(() => {
      fetchData(false);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [hydrated, user, hasActiveCampaign]);

  // Real-time WebSocket event listener for Campaign & Call events
  useEffect(() => {
    if (!hydrated || !user || typeof window === "undefined") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const token = useAuthStore.getState().token || "";
    const wsUrl = `${protocol}//${host}/api/ws/call-events?token=${encodeURIComponent(token)}`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (
            msg.event === "campaign_status_changed" ||
            msg.event === "call_status" ||
            msg.type === "CALL_UPDATE"
          ) {
            fetchData(false);
          }
        } catch (e) {}
      };
    } catch (err) {}

    return () => {
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
    };
  }, [hydrated, user]);

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isAdmin) {
    return (
      <AppShell>
        <div ref={dashboardRef} className={`flex flex-col animate-in fade-in duration-300 font-sans relative ${isFullscreen ? 'bg-slate-50 p-8 h-screen overflow-y-auto' : 'gap-8'}`}>
          <AnimatedDashboardBackground />
          
          <div className="z-10 relative space-y-8">
            {/* Banner Header Section */}
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#241A47] via-[#4A3FC9] to-[#7C5CFF] p-[26px_28px] text-white mb-2 shadow-[0_8px_30px_rgba(124,92,255,0.3)]">
              {/* Decorative Glow */}
              <div className="absolute w-[340px] h-[340px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_70%)] -top-[160px] -right-[100px] pointer-events-none" />
              <div className="absolute w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent_70%)] bottom-[10px] left-[200px] pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-[14px]">
                  <motion.div 
                    whileHover={{ rotate: 90 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-[50px] h-[50px] shrink-0 rounded-[14px] bg-white/10 flex items-center justify-center border border-white/20 shadow-inner"
                  >
                    <Shield className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-white leading-none mb-1 font-['Space_Grotesk']">
                      Admin Control Center
                    </h1>
                    <p className="text-[11px] text-white/70 font-black tracking-widest uppercase">
                      Platform Operations & Logs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-start sm:self-center shrink-0">
                  <div className="flex items-center gap-2 text-white/90 text-[11px] font-black bg-white/10 border border-white/20 rounded-xl py-2.5 px-4 shadow-sm uppercase tracking-widest">
                    <Calendar className="w-4 h-4" />
                    <span>{formattedDate}</span>
                  </div>
                  <button 
                    onClick={toggleFullscreen}
                    className="p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors shadow-sm text-white group"
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> : <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                  </button>
                </div>
              </div>
            </div>

            {adminError && (
              <div className="p-4 bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            {adminLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-3xl border border-slate-100/50 bg-white/50 backdrop-blur-md p-6 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Graphical Top Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2">
                  
                  {/* Active Calls Animatic Card */}
                  <Link href="/live-calls" className="lg:col-span-2 group relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 shadow-2xl border border-indigo-700/50 text-white hover:scale-[1.02] transition-all duration-300 block">
                    <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/20 rounded-full filter blur-[80px] animate-pulse"></div>
                    <div className="absolute left-[-20%] bottom-[-20%] w-80 h-80 bg-purple-500/20 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-3 bg-black/20 w-max px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <h3 className="text-indigo-200 font-bold uppercase tracking-widest text-[10px]">Live Calls Monitor</h3>
                          </div>
                          <div className="text-4xl font-black text-white flex items-center gap-4">
                            <ActiveDialerRing isActive={hasActiveCampaign} />
                            <span>Active Interactions</span>
                          </div>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-indigo-500 transition-colors border border-white/10 backdrop-blur-md shadow-lg">
                          <ArrowUpRight className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      <LivePulseGraph isActive={hasActiveCampaign} />
                    </div>
                  </Link>

                  {/* Speedometer Card */}
                  <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 shadow-xl border border-white/80 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-white/90 transition-colors">
                    <div className="absolute top-6 left-6 flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                      <Activity className={`w-4 h-4 ${hasActiveCampaign ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                        Dial Intensity <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${hasActiveCampaign ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>{hasActiveCampaign ? 'ACTIVE' : 'INACTIVE'}</span>
                      </span>
                    </div>
                    
                    <div className="mt-8 transform group-hover:scale-105 transition-transform duration-500">
                      <Speedometer value={hasActiveCampaign ? speedVal : 0} max={500} label={hasActiveCampaign ? "Calls / Min" : "Inactive (0)"} />
                    </div>
                  </div>

                </div>

                {/* Summary Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: "Registered Users", value: adminUsers.length, icon: Users, gradient: "from-blue-600 to-indigo-900", shadow: "shadow-blue-500/30" },
                    { label: "Active Campaigns", value: activeRunningCampaigns.length, icon: Play, gradient: "from-emerald-500 to-teal-900", shadow: "shadow-emerald-500/30" },
                    { label: "Uploaded Leads", value: adminLeads.length, icon: FileText, gradient: "from-purple-600 to-fuchsia-900", shadow: "shadow-purple-500/30" },
                  ].map((stat, i) => (
                    <motion.div 
                      whileHover={{ y: -8, scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15, type: "spring", stiffness: 300, damping: 20 }}
                      key={i} 
                      className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} rounded-3xl shadow-2xl p-6 text-white border border-white/10 group`}
                    >
                      {/* Background Floating Icon */}
                      <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-125 transition-transform duration-700 ease-out">
                        <stat.icon className="w-40 h-40" />
                      </div>
                      
                      {/* Simulated Mini Chart Line */}
                      <motion.svg className="absolute inset-x-0 bottom-0 w-full h-1/2 opacity-20" preserveAspectRatio="none" viewBox="0 0 100 20"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} transition={{ delay: 0.5 }}
                      >
                        <path d={`M0,20 Q20,${Math.random()*15} 40,15 T100,${Math.random()*15}`} fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </motion.svg>

                      <div className="relative z-10 flex justify-between items-start">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">{stat.label}</p>
                          </div>
                          <h3 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{stat.value}</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner group-hover:bg-white/20 transition-colors">
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Data Tables Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-4">
                  {/* Users List */}
                  <div className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-2xl p-6 rounded-3xl border border-indigo-500/20 shadow-[0_15px_40px_rgba(0,0,0,0.2)] flex flex-col gap-5 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/30 rounded-full blur-[80px] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight">User Directory</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">
                          Live Top 10
                        </span>
                      </div>
                    </div>
                    
                    <div className="overflow-auto max-h-[350px] relative z-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-indigo-500/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pr-2">
                      {adminUsers.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center">
                          <Users className="w-8 h-8 text-indigo-400/40 mb-2" />
                          <p className="text-xs font-bold text-white">No Users Found</p>
                          <p className="text-[10px] text-indigo-300/50 mt-0.5">No active users in the system.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-sm">
                          <thead className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-20">
                            <tr className="border-b border-indigo-500/10 text-indigo-300/70 text-[10px] font-black uppercase tracking-widest">
                              <th className="pb-3 pt-2">Identity</th>
                              <th className="pb-3 pt-2">Role</th>
                              <th className="pb-3 pt-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-500/10 text-white font-bold">
                            {adminUsers.slice(0, 10).map((u, idx) => (
                              <motion.tr 
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                key={u.id} className="hover:bg-white/5 transition-colors group/row"
                              >
                                <td className="py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs shadow-lg font-black text-white">
                                      {u.full_name ? u.full_name[0].toUpperCase() : u.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-white font-black">{u.full_name || "—"}</p>
                                      <p className="text-indigo-200/50 text-[10px] font-medium">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border ${
                                    u.role.includes("ADMIN") ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]" : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                  }`}>
                                    {u.role.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    u.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-slate-800 text-slate-400 border-slate-700"
                                  }`}>
                                    {u.is_active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                    {u.is_active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Campaigns List */}
                  <div className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-2xl p-6 rounded-3xl border border-purple-500/20 shadow-[0_15px_40px_rgba(0,0,0,0.2)] flex flex-col gap-5 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/30 rounded-full blur-[80px] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="flex items-center justify-between pb-4 border-b border-purple-500/20 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                          <Play className="w-5 h-5 fill-purple-400" />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight">Global Campaigns</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="text-[10px] text-purple-300 font-black uppercase tracking-widest">
                          Active Top 10
                        </span>
                      </div>
                    </div>
                    
                    <div className="overflow-auto max-h-[350px] relative z-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-purple-500/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pr-2">
                      {adminCampaigns.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center">
                          <Play className="w-8 h-8 text-purple-400/40 mb-2" />
                          <p className="text-xs font-bold text-white">No Campaigns Found</p>
                          <p className="text-[10px] text-purple-300/50 mt-0.5">No active campaigns running.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-sm">
                          <thead className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-20">
                            <tr className="border-b border-purple-500/10 text-purple-300/70 text-[10px] font-black uppercase tracking-widest">
                              <th className="pb-3 pt-2">Campaign</th>
                              <th className="pb-3 pt-2">Business</th>
                              <th className="pb-3 pt-2">Number</th>
                              <th className="pb-3 pt-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-500/10 text-white font-bold">
                            {adminCampaigns.slice(0, 10).map((c, idx) => (
                              <motion.tr 
                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                key={c.id} className="hover:bg-white/5 transition-colors"
                              >
                                <td className="py-4">
                                  <span className="font-black text-white">{c.name}</span>
                                </td>
                                <td className="py-4 text-purple-200/60 font-medium text-[11px]">{c.business_name}</td>
                                <td className="py-4">
                                  <span className="text-indigo-300 font-mono text-[10px] bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-1 shadow-sm">
                                    {c.twilio_number}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    c.status === "RUNNING" ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-slate-800 text-slate-400 border-slate-700"
                                  }`}>
                                    {c.status === "RUNNING" && <Play className="w-2.5 h-2.5 fill-amber-400" />}
                                    {c.status}
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // Business User Dashboard
  return (
    <AppShell>
      <div className="flex flex-col gap-8 animate-in fade-in duration-300 relative">
        <AnimatedDashboardBackground />

        <div className="z-10 relative">
          {/* Banner Header Section */}
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#241A47] via-[#4A3FC9] to-[#7C5CFF] p-[26px_28px] text-white mb-2 shadow-[0_8px_30px_rgba(124,92,255,0.3)]">
            {/* Decorative Glow */}
            <div className="absolute w-[340px] h-[340px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_70%)] -top-[160px] -right-[100px] pointer-events-none" />
            <div className="absolute w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent_70%)] bottom-[10px] left-[200px] pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-[14px]">
                <div className="w-[50px] h-[50px] shrink-0 rounded-[14px] bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-white leading-none mb-1 font-['Space_Grotesk']">
                    Good morning, {user?.full_name ? (user.full_name.toLowerCase().includes("admin") ? "System Admin" : user.full_name.split(" ")[0]) : (user?.email?.split("@")[0] || "Admin")}
                  </h1>
                  <p className="text-[11px] text-white/70 font-black tracking-widest uppercase">
                    Here is what is happening with your workspace today.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/90 text-[11px] font-black bg-white/10 border border-white/20 rounded-xl py-2.5 px-4 shadow-sm uppercase tracking-widest shrink-0 self-start sm:self-center">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 mt-6 bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error} &mdash; Create or join a business workspace to enable call features.</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-32 rounded-3xl border border-slate-100/50 bg-white/50 backdrop-blur-md p-6 animate-pulse" />
              ))}
            </div>
          ) : (
            data && (
              <div className="mt-8 space-y-8">
                {/* Animated Top Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2">
                  <Link href="/live-calls" className="lg:col-span-2 group relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 shadow-2xl border border-indigo-700/50 text-white hover:scale-[1.02] transition-all duration-300 block">
                    <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/20 rounded-full filter blur-[80px] animate-pulse"></div>
                    <div className="absolute left-[-20%] bottom-[-20%] w-80 h-80 bg-purple-500/20 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-3 bg-black/20 w-max px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <h3 className="text-indigo-200 font-bold uppercase tracking-widest text-[10px]">Live Calls Monitor</h3>
                          </div>
                          <div className="text-4xl font-black text-white flex items-center gap-4">
                            <ActiveDialerRing isActive={hasActiveCampaign} />
                            <span>Active Human Voice Interactions</span>
                          </div>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-indigo-500 transition-colors border border-white/10 backdrop-blur-md shadow-lg">
                          <ArrowUpRight className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <LivePulseGraph isActive={hasActiveCampaign} />
                    </div>
                  </Link>

                  <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 shadow-xl border border-white/80 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-white/90 transition-colors">
                    <div className="absolute top-6 left-6 flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                      <Activity className={`w-4 h-4 ${hasActiveCampaign ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                        Dial Intensity <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${hasActiveCampaign ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>{hasActiveCampaign ? 'ACTIVE' : 'INACTIVE'}</span>
                      </span>
                    </div>
                    <div className="mt-8 transform group-hover:scale-105 transition-transform duration-500">
                      <Speedometer value={hasActiveCampaign ? speedVal : 0} max={500} label={hasActiveCampaign ? "Calls / Min" : "Inactive (0)"} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: "Total Leads", value: data.total_leads, icon: Users, gradient: "from-blue-600 to-indigo-900" },
                    { label: "Qualified Leads", value: data.qualified_leads, icon: UserCheck, gradient: "from-emerald-500 to-teal-900" },
                    { label: "Qualification Rate", value: `${data.qualification_rate}%`, icon: Percent, gradient: "from-amber-500 to-orange-900" },
                    { label: "Active Conversations", value: data.active_conversations, icon: MessageSquare, gradient: "from-purple-600 to-fuchsia-900" },
                    { label: "Human Handoffs", value: data.human_handoffs, icon: Handshake, gradient: "from-indigo-600 to-slate-900" },
                    { label: "Revenue", value: `$${data.revenue.toLocaleString()}`, icon: DollarSign, gradient: "from-emerald-400 to-green-900" },
                  ].map((metric, i) => (
                    <motion.div 
                      whileHover={{ y: -8, scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      key={i} className={`relative overflow-hidden bg-gradient-to-br ${metric.gradient} rounded-3xl shadow-xl p-6 text-white border border-white/10 group`}
                    >
                      {/* Background Floating Icon */}
                      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-700 ease-out">
                        <metric.icon className="w-32 h-32" />
                      </div>

                      <div className="relative z-10 flex justify-between items-start w-full">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">{metric.label}</p>
                          <h3 className="text-4xl font-black text-white tracking-tighter drop-shadow-md">{metric.value}</h3>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner group-hover:bg-white/20 transition-colors">
                          <metric.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Call History Table */}
                <div className="mt-8 bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-xl flex flex-col gap-5 relative overflow-hidden group hover:bg-white/80 transition-colors">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-inner">
                        <PhoneForwarded className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Call History</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live interaction logs</p>
                      </div>
                    </div>
                    <Link href="/reports" className="text-[10px] bg-slate-800 hover:bg-indigo-600 transition-colors px-4 py-2 rounded-full font-black text-white uppercase tracking-wider shadow-md">
                      View All Reports
                    </Link>
                  </div>
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200/60 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          <th className="pb-3 pt-2">Contact Name</th>
                          <th className="pb-3 pt-2">Phone Number</th>
                          <th className="pb-3 pt-2">Agent</th>
                          <th className="pb-3 pt-2">Duration</th>
                          <th className="pb-3 pt-2">Outcome</th>
                          <th className="pb-3 pt-2">Date/Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                        {recentCalls.length > 0 ? recentCalls.map((call, idx) => (
                          <tr key={call.id || idx} className="hover:bg-white/50 transition-colors">
                            <td className="py-4 text-slate-900">{call.lead_name || call.client_name || "Unknown"}</td>
                            <td className="py-4 text-slate-500 font-medium text-xs font-mono">{call.client_phone || call.to_number || call.from_number}</td>
                            <td className="py-4 text-slate-700 font-semibold">{call.agent_name || "Unknown"}</td>
                            <td className="py-4 text-slate-600">
                              {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : "0m 0s"}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black shadow-sm border ${
                                call.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                call.status === "FAILED" ? "bg-red-50 text-red-700 border-red-200" :
                                call.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}>
                                {call.status || "Unknown"}
                              </span>
                            </td>
                            <td className="py-4 text-slate-400 text-xs font-medium">
                              {new Date(call.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                              No recent calls found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
