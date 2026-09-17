"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { businessService, Business } from "@/lib/services/business.service";
import { Settings, ShieldCheck, Puzzle, CreditCard, LayoutDashboard, Calendar, Maximize2, Minimize2, PhoneCall } from "lucide-react";
import { motion } from "framer-motion";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { BillingTab } from "@/components/settings/BillingTab";
import { DispositionsTab } from "@/components/settings/DispositionsTab";
import { useAuthStore } from "@/lib/store";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'dispositions' | 'integrations' | 'billing'>('general');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "dispositions" || tabParam === "integrations" || tabParam === "billing" || tabParam === "general") {
        setActiveTab(tabParam as any);
      }
    }

    businessService.me()
      .then((b) => {
        setBusiness(b);
        setName(b.name);
        setIndustry(b.industry || "");
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim()) return setError("Business name is required");

    try {
      const updated = await businessService.update({ name, industry });
      setBusiness(updated);
      setName(updated.name);
      setIndustry(updated.industry || "");
      setSuccess("Settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    }
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        
        {/* Banner Header Section */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#241A47] via-[#4A3FC9] to-[#7C5CFF] p-[26px_28px] text-white shadow-[0_8px_30px_rgba(124,92,255,0.3)]">
          <div className="absolute w-[340px] h-[340px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_70%)] -top-[160px] -right-[100px] pointer-events-none" />
          <div className="absolute w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent_70%)] bottom-[10px] left-[200px] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-[14px]">
              <div className="w-[50px] h-[50px] shrink-0 rounded-[14px] bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-white leading-none mb-1 font-['Space_Grotesk']">
                  Settings & Configurations
                </h1>
                <p className="text-[11px] text-white/70 font-black tracking-widest uppercase">
                  Manage integrations, billing, and profile
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/90 text-[11px] font-black bg-white/10 border border-white/20 rounded-xl py-2.5 px-4 shadow-sm uppercase tracking-widest shrink-0 self-start sm:self-center">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="border-b border-indigo-200/40">
          <nav className="flex gap-6 px-2">
            {[
              { id: 'general', label: 'General Settings', icon: Settings, show: true },
              { id: 'dispositions', label: 'Call Dispositions', icon: PhoneCall, show: true },
              { id: 'integrations', label: 'Integrations', icon: Puzzle, show: user?.role !== "USER" },
              { id: 'billing', label: 'Billing & Plan', icon: CreditCard, show: user?.role !== "USER" }
            ].filter(t => t.show).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest relative transition-colors ${
                  activeTab === tab.id ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full shadow-[0_-2px_10px_rgba(79,70,229,0.5)]"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {error && <p className="text-sm font-bold text-rose-600 px-2">{error}</p>}
        {success && <p className="text-sm font-bold text-emerald-600 px-2">{success}</p>}

        <div className="px-2">
          {activeTab === 'general' && (
            <form onSubmit={handleUpdate} className="space-y-6 max-w-2xl">
              <Card className="p-8 space-y-6 rounded-3xl border-indigo-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Company / Organization Name</label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="h-12 bg-slate-50 border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Industry</label>
                  <Input 
                    value={industry} 
                    onChange={(e) => setIndustry(e.target.value)} 
                    placeholder="e.g. Real Estate, Tech" 
                    className="h-12 bg-slate-50 border-slate-200 font-semibold"
                  />
                </div>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-indigo-500/30">
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'dispositions' && (
            <DispositionsTab />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsTab />
          )}

          {activeTab === 'billing' && (
            <BillingTab />
          )}
        </div>
      </div>
    </AppShell>
  );
}
