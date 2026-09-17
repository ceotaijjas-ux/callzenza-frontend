"use client";

import React, { useEffect, useState } from "react";
import {
  HardDrive,
  FileText,
  FileSpreadsheet,
  Music,
  FolderOpen,
  PieChart,
  RefreshCw,
  Copy,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface StorageResponse {
  total_storage_used_bytes: number;
  total_storage_used_formatted: string;
  remaining_capacity_gb: number;
  disk_total_gb: number;
  disk_usage_percent: number;
  categories: Array<{
    category_name: string;
    bytes: number;
    formatted: string;
    file_count: number;
  }>;
  tenants_storage: Array<{
    tenant_id: string;
    tenant_name: string;
    storage_used_bytes: number;
    storage_used_formatted: string;
    storage_limit_mb: number;
    usage_percentage: number;
    status: string;
  }>;
}

export default function SuperAdminStoragePage() {
  const [data, setData] = useState<StorageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStorage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<StorageResponse>("/api/super-admin/storage");
      setData(res);
    } catch (err: any) {
      console.error("Storage fetch error:", err);
      setError(err?.message || "Failed to calculate storage breakdown");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  const getCategoryIcon = (name: string) => {
    if (name.includes("Lead") || name.includes("CSV")) return FileSpreadsheet;
    if (name.includes("Knowledge") || name.includes("PDF")) return FileText;
    if (name.includes("Audio") || name.includes("Voice")) return Music;
    return FolderOpen;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Application Storage Breakdown</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Live File Size Accounting
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audited storage consumption by tenant, knowledge-base document index, and telephony audio files.
          </p>
        </div>

        <Button
          onClick={fetchStorage}
          disabled={loading}
          variant="outline"
          className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs font-semibold gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          Recalculate Usage
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total App Storage */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              App Storage Consumed
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-300">
            {data?.total_storage_used_formatted || "0 KB"}
          </div>
          <p className="text-[11px] text-slate-400">Across all active tenant workspaces</p>
        </div>

        {/* Disk Capacity */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Host Disk Total
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{data?.disk_total_gb || 0} GB</div>
          <p className="text-[11px] text-slate-400">Total volume size on host node</p>
        </div>

        {/* Remaining Headroom */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Available Headroom
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {data?.remaining_capacity_gb || 0} GB
          </div>
          <p className="text-[11px] text-slate-400">Unallocated volume capacity</p>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">Storage Breakdown by Category</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.categories.map((cat, i) => {
            const Icon = getCategoryIcon(cat.category_name);
            return (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 truncate">{cat.category_name}</span>
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-white">{cat.formatted}</div>
                <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                  <span>File Count:</span>
                  <strong className="text-slate-200">{cat.file_count} files</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Tenant Storage Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">Per-Tenant Storage Allocations</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Tenant ID</th>
                <th className="py-3 px-4">Storage Consumed</th>
                <th className="py-3 px-4">Plan Quota Limit</th>
                <th className="py-3 px-4">Usage %</th>
                <th className="py-3 px-4 text-right">Quota Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.tenants_storage.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No files stored by any tenant yet.
                  </td>
                </tr>
              ) : (
                data?.tenants_storage.map((ts) => (
                  <tr key={ts.tenant_id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-100">{ts.tenant_name}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {ts.tenant_id.slice(0, 13)}...
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-purple-300">
                      {ts.storage_used_formatted}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{ts.storage_limit_mb} MB</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(ts.usage_percentage, 100)}%` }}
                            className="h-full bg-indigo-500 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{ts.usage_percentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                        {ts.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
