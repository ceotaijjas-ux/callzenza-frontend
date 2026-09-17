"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { analyticsService, DashboardSummary } from "@/lib/services/analytics.service";
import { leadAssignmentService } from "@/lib/services/lead-assignment.service";
import { Users, UserCheck, PhoneCall, Clock, Headphones, PhoneIncoming, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SupervisorDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSupervisorMetrics = async () => {
    try {
      const [sum, assignList, qList] = await Promise.all([
        analyticsService.dashboard().catch(() => null),
        leadAssignmentService.getAssignments().catch(() => []),
        leadAssignmentService.getQueue("WAITING").catch(() => []),
      ]);
      setSummary(sum);
      setAssignments(assignList);
      setQueueItems(qList);
    } catch (e) {
      console.error("Failed to load supervisor metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisorMetrics();
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col gap-8 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Supervisor Command Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time team oversight, lead transfers, and voice agent monitoring.</p>
          </div>
          <button
            onClick={loadSupervisorMetrics}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 self-start sm:self-center shadow-xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-600" /> Refresh Metrics
          </button>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 border-slate-150 shadow-sm rounded-2xl bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Available Agents</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{summary?.available_agents_count ?? 0}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Headphones className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-150 shadow-sm rounded-2xl bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Busy / In-Call</p>
                <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{summary?.busy_agents_count ?? 0}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <PhoneCall className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-150 shadow-sm rounded-2xl bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Leads in Queue</p>
                <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{queueItems.length}</h3>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-150 shadow-sm rounded-2xl bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Active Handoffs</p>
                <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{assignments.length}</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <PhoneIncoming className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Action Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/supervisor/users">
            <Card className="p-6 border border-slate-200/60 shadow-sm rounded-3xl hover:shadow-lg transition-all cursor-pointer group bg-white">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Users className="w-7 h-7" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-all" />
              </div>
              <h2 className="text-xl font-bold mt-5 text-slate-900 group-hover:text-indigo-600 transition-all">User Directory & Roles</h2>
              <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed">View workspace users, manage team roles, and monitor user statuses.</p>
            </Card>
          </Link>
          
          <Link href="/supervisor/voice-agents">
            <Card className="p-6 border border-slate-200/60 shadow-sm rounded-3xl hover:shadow-lg transition-all cursor-pointer group bg-white">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <UserCheck className="w-7 h-7" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 transition-all" />
              </div>
              <h2 className="text-xl font-bold mt-5 text-slate-900 group-hover:text-emerald-600 transition-all">Voice Agents & Queue Console</h2>
              <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed">Live agent availability matrix, queue monitoring, and AI call transfer tracking.</p>
            </Card>
          </Link>
        </div>

        {/* Live Transferred Leads Table */}
        <Card className="p-6 border-slate-200/60 shadow-sm rounded-3xl bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PhoneIncoming className="h-5 w-5 text-indigo-600" /> Active Lead Assignments & AI Context
            </h3>
            <span className="text-xs font-bold text-slate-400">Showing latest transfers</span>
          </div>

          {assignments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              No active lead transfers recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Lead ID / Info</th>
                    <th className="pb-3">Assigned Voice Agent</th>
                    <th className="pb-3">AI Agent Source</th>
                    <th className="pb-3">Qualification Stage</th>
                    <th className="pb-3">Assignment Source</th>
                    <th className="pb-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {assignments.slice(0, 5).map((assign: any) => (
                    <tr key={assign.id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900">{assign.context?.lead_name || assign.lead_id.slice(0, 8)}</td>
                      <td className="py-3 font-bold text-indigo-700">{assign.expert_name || "Agent"}</td>
                      <td className="py-3 text-slate-500">{assign.ai_agent_name}</td>
                      <td className="py-3 font-bold text-emerald-600">{assign.qualification_stage}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          assign.trigger_source === "SPECIFIC_AGENT_REQUEST"
                            ? "bg-purple-600 text-white"
                            : assign.trigger_source === "TALK_TO_AGENT"
                            ? "bg-indigo-600 text-white"
                            : assign.trigger_source === "QUALIFIED_LEAD"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}>
                          {assign.trigger_source === "SPECIFIC_AGENT_REQUEST" ? "Specific Agent Request" : assign.trigger_source === "TALK_TO_AGENT" ? "Talk to Agent" : assign.trigger_source === "QUALIFIED_LEAD" ? "Qualified Lead" : "Queue Auto"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono">{new Date(assign.assigned_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
