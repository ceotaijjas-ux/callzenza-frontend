"use client";

import React from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

const REPORT_GROUPS = [
  {
    title: "Real-Time Reports",
    icon: "⏱️",
    accent: "#7C5CFF",
    items: ["Real-Time Main Report", "Real-Time Campaign Summary", "Real-Time Whiteboard Report"],
  },
  {
    title: "Inbound & Outbound Calling",
    icon: "📞",
    accent: "#3B6EF6",
    items: [
      "Inbound Report - v2",
      "Inbound Report by DID",
      "Inbound Service Level Report",
      "Inbound Summary Hourly Report",
      "Inbound Daily Report",
      "Inbound DID Report - DID Summary - Agent DID",
      "Inbound IVR Report",
      "Inbound Forecasting Report - Advanced",
      "Outbound Calling Report",
      "Outbound Summary Interval Report",
      "Outbound IVR Report - Export",
      "Outbound Lead Source Report",
      "Fronter - Closer Report - Detail",
      "Lists Pass Report",
      "Lists Campaign Statuses Report",
      "Called Counts List IDs Report",
      "Campaign Status List Report",
      "Dialer Inventory Report",
      "Inbound Email Report",
      "Email Log Report",
      "Inbound Chat Report",
      "Export Calls Report",
      "Export Leads Report",
    ],
  },
  {
    title: "Agent Reports",
    icon: "🧑💻",
    accent: "#1FAE7A",
    items: [
      "Agent Time Detail",
      "Agent Status Detail - Inbound Summary",
      "Agent Performance Detail",
      "Team Performance Detail",
      "Performance Comparison Report",
      "Single Agent Daily - Time",
      "User Group Login Report",
      "User Group Hourly Report - v2",
      "User Stats",
      "User Time Sheet",
    ],
  },
  {
    title: "Time Clock Reports",
    icon: "🕒",
    accent: "#F5A623",
    items: [
      "User Timeclock Report",
      "User Group Timeclock Status Report",
      "User Timeclock Detail Report",
    ],
  },
  {
    title: "Other Reports & Links",
    icon: "🔗",
    accent: "#EF5B5B",
    items: [
      "Server Performance Report",
      "Maximum System Stats",
      "Administration Change Log",
      "QueueMetrics Reports",
      "List Update Stats",
      "CallCard Search",
      "Dashboard Summary Screen",
      "Automated Reports Admin Screen",
      "Campaign Administration Screen",
    ],
  },
  {
    title: "Custom Reports",
    icon: "🧩",
    accent: "#9B59FF",
    items: [
      "New test report",
      "Another test process",
      "1-month APD report for test campaigns",
    ],
  },
];

const OVERRIDES: Record<string, string> = {
  "Real-Time Main Report": "/reports/real-time-main",
  "Real-Time Campaign Summary": "/reports/real-time-campaign-summary",
  "Real-Time Whiteboard Report": "/reports/real-time-whiteboard",
  "Inbound Report - v2": "/reports/inbound-report-v2",
  "Inbound Report by DID": "/reports/inbound-report-by-did",
  "Inbound Service Level Report": "/reports/inbound-service-level",
  "Inbound Summary Hourly Report": "/reports/inbound-summary-hourly",
  "Inbound Daily Report": "/reports/inbound-daily",
  "Inbound DID Report - DID Summary - Agent DID": "/reports/inbound-report-by-did",
  "Inbound IVR Report": "/reports/inbound-ivr",
  "Inbound Call Forecasting Report": "/reports/inbound-call-forecasting",
  "Inbound Forecasting Report - Advanced": "/reports/inbound-call-forecasting",
  "Outbound Calling Report": "/reports/outbound-calling",
  "Outbound Summary Interval Report": "/reports/outbound-summary-interval",
  "Outbound IVR Report - Export": "/reports/outbound-ivr-export",
  "Outbound Lead Source Report": "/reports/outbound-lead-source",
  "Fronter - Closer Report - Detail": "/reports/fronter-closer-detail",
  "Lists Campaign Statuses Report": "/reports/lists-campaign-statuses",
  "Lists Pass Report": "/reports/lists-pass",
  "Called Counts List IDs Report": "/reports/called-counts-list-ids",
  "Campaign Status List Report": "/reports/campaign-status-list",
  "Dialer Inventory Report": "/reports/dialer-inventory",
  "Inbound Email Report": "/reports/inbound-email",
  "Email Log Report": "/reports/email-log",
  "Inbound Chat Report": "/reports/inbound-chat",
  "Export Calls Report": "/reports/export-calls",
  "Export Leads Report": "/reports/export-leads",
  "User Timeclock Report": "/reports/user-timeclock",
  "User Group Timeclock Status Report": "/reports/user-group-timeclock-status",
  "User Timeclock Detail Report": "/reports/user-timeclock-detail",
  "Agent Time Detail": "/reports/agent-time-detail",
  "Agent Status Detail - Inbound Summary": "/reports/agent-status-detail-inbound-summary",
  "Agent Performance Detail": "/reports/agent-performance-detail",
  "Team Performance Detail": "/reports/team-performance-detail",
  "Performance Comparison Report": "/reports/performance-comparison",
  "Single Agent Daily - Time": "/reports/single-agent-daily-time",
  "User Group Login Report": "/reports/user-group-login",
  "User Group Hourly Report - v2": "/reports/user-group-hourly-v2",
  "User Stats": "/reports/user-stats",
  "User Time Sheet": "/reports/user-time-sheet",
  "Dashboard Summary Screen": "/reports/dashboard-summary",
  "Automated Reports Admin Screen": "/reports/automated-reports-admin",
  "Campaign Administration Screen": "/reports/campaign-administration",
  "1-month APD report for test campaigns": "/reports/1-month-apd-report-for-test-campaigns",
  "New test report": "/reports/new-test-report",
  "Another test process": "/reports/another-test-process",
  "Another test reports": "/reports/another-test-process",
};

function getReportPath(item: string): string {
  if (OVERRIDES[item]) return OVERRIDES[item];

  const normalized = item.replace(/\s+/g, "").toLowerCase();
  for (const [key, val] of Object.entries(OVERRIDES)) {
    if (key.replace(/\s+/g, "").toLowerCase() === normalized) {
      return val;
    }
  }

  const slug = item
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `/reports/${slug}`;
}

import { reportService } from "@/lib/services/report.service";

export default function ViciHostDashboard() {
  const [liveCount, setLiveCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    reportService.getCallsReport().then((res) => {
      if (res && typeof res.total === "number") {
        setLiveCount(res.total);
      }
    }).catch(console.error);
  }, []);

  return (
    <AppShell>
      <div className="p-6 md:p-8 w-full space-y-6 bg-slate-50 min-h-screen relative">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mb-2">
              📊 Reports Dashboard
            </h1>
            <p className="text-slate-500 text-sm">
              Select a report category from the options below.
            </p>
          </div>
          {liveCount !== null && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              {liveCount} Total DB Records Indexed
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REPORT_GROUPS.map((group) => (
            <div key={group.title} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${group.accent}15` }}>
                  {group.icon}
                </div>
                <h2 className="font-bold text-lg text-slate-800">{group.title}</h2>
              </div>
              <ul className="space-y-2.5 flex-1 text-sm">
                {group.items.map((item) => {
                  const path = getReportPath(item);

                  return (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.accent }}></div>
                      <Link href={path} className="text-slate-600 hover:text-indigo-600 hover:underline transition-colors block py-0.5">
                        {item}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
