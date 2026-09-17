"use client";

import React, { useEffect, useState } from "react";
import {
  Server,
  Database,
  Cpu,
  Activity,
  HardDrive,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface ServerStatusResponse {
  api_status: string;
  backend_api_status?: string;
  db_status: string;
  database_status?: string;
  database_latency_ms?: number;
  uptime_seconds: number;
  uptime_formatted: string;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_usage_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  disk_free_gb: number;
  application_health: string;
  last_health_check: string;
  process_id?: number;
  threads_count?: number;
  python_version?: string;
  platform_system?: string;
}

export default function SuperAdminServerStatusPage() {
  const [data, setData] = useState<ServerStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ServerStatusResponse>("/api/super-admin/server-status");
      setData(res);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("Server status error:", err);
      setError(err?.message || "Failed to query server metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (pct: number) => {
    if (pct >= 90) return { bar: "bg-rose-500", text: "text-rose-400", badge: "CRITICAL" };
    if (pct >= 75) return { bar: "bg-amber-500", text: "text-amber-400", badge: "WARNING" };
    return { bar: "bg-emerald-500", text: "text-emerald-400", badge: "OPTIMAL" };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Server Health &amp; Infrastructure</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
              Live Hardware Metrics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time operating system telemetry, CPU, RAM, disk, and database connection checks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            Updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <Button
            onClick={fetchStatus}
            disabled={loading}
            variant="outline"
            className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            Query Node
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Main Status High-Level Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Backend API */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              FastAPI Runtime
            </span>
            <div className="text-lg font-black text-white">{data?.api_status || data?.backend_api_status || "Online"}</div>
            <div className="text-[11px] text-slate-400">
              REST + WebSocket Gateway {data?.python_version ? `• Python ${data.python_version}` : ""}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Database */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PostgreSQL Engine
            </span>
            <div className="text-lg font-black text-white">{data?.db_status || data?.database_status || "Connected"}</div>
            <div className="text-[11px] text-slate-400">
              Async SQLAlchemy Pool {data?.database_latency_ms !== undefined ? `• ${data.database_latency_ms}ms ping` : ""}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Server Uptime */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Process Uptime
            </span>
            <div className="text-lg font-black text-slate-200">
              {data?.uptime_formatted || "Active"}
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
              PID: {data?.process_id || "-"} {data?.platform_system ? `• ${data.platform_system}` : "• Continuous Service"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Hardware Utilization Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU */}
        {(() => {
          const cpuPct = data?.cpu_usage_percent ?? 0;
          const style = getMetricColor(cpuPct);
          return (
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Host CPU Utilization</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.text} bg-slate-950 border border-slate-800`}>
                  {style.badge}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{cpuPct}%</span>
                  <span className="text-xs text-slate-400">All cores combined</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div style={{ width: `${Math.min(100, Math.max(0, cpuPct))}%` }} className={`h-full rounded-full transition-all ${style.bar}`} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Live processor load across active runtime threads ({data?.threads_count ? `${data.threads_count} threads` : "all cores"}).
              </p>
            </div>
          );
        })()}

        {/* Memory */}
        {(() => {
          const memPct = data?.memory_usage_percent ?? 0;
          const style = getMetricColor(memPct);
          const usedGb = data?.memory_used_gb !== undefined ? data.memory_used_gb : 0;
          const totalGb = data?.memory_total_gb !== undefined ? data.memory_total_gb : 0;
          return (
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Host Memory (RAM)</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.text} bg-slate-950 border border-slate-800`}>
                  {style.badge}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{memPct}%</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {usedGb.toFixed(2)} / {totalGb.toFixed(2)} GB
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div style={{ width: `${Math.min(100, Math.max(0, memPct))}%` }} className={`h-full rounded-full transition-all ${style.bar}`} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Physical host RAM currently committed and allocated by runtime processes.
              </p>
            </div>
          );
        })()}

        {/* Disk */}
        {(() => {
          const diskPct = data?.disk_usage_percent ?? 0;
          const style = getMetricColor(diskPct);
          const usedGb = data?.disk_used_gb !== undefined ? data.disk_used_gb : 0;
          const totalGb = data?.disk_total_gb !== undefined ? data.disk_total_gb : 0;
          const freeGb = data?.disk_free_gb !== undefined ? data.disk_free_gb : 0;
          return (
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <HardDrive className="w-4 h-4 text-teal-400" />
                  <span>Host Disk Volume</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.text} bg-slate-950 border border-slate-800`}>
                  {style.badge}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{diskPct}%</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {usedGb.toFixed(2)} / {totalGb.toFixed(2)} GB
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div style={{ width: `${Math.min(100, Math.max(0, diskPct))}%` }} className={`h-full rounded-full transition-all ${style.bar}`} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Free space remaining: <strong className="text-emerald-400">{freeGb.toFixed(2)} GB</strong>
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
