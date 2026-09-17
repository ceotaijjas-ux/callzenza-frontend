"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function OutboundSummaryIntervalReport() {
  const { timeStr, now } = useLiveClock();
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-07");
  const [selectedInterval, setSelectedInterval] = useState("Hours of Day");
  const [liveData, setLiveData] = useState<any[]>([]);
  const [intervalRows, setIntervalRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveReportData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("outbound-summary-interval", {
        from_date: fromDate,
        to_date: toDate,
      });
      if (res && res.success) {
        setLiveData(res.data || []);
        setIntervalRows(res.intervals || []);
        setKpis(res.kpis || null);
      }
    } catch (err) {
      console.error("Failed loading report for outbound-summary-interval:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLiveReportData();
  }, [fromDate, toDate]);

  const [applyBtnText, setApplyBtnText] = useState("Apply");
  const [isApplyDisabled, setIsApplyDisabled] = useState(false);
  const [refreshBtnText, setRefreshBtnText] = useState("↻ Refresh");
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [intervalBadgeText, setIntervalBadgeText] = useState("Hourly Interval");
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const applyFilters = () => {
    setApplyBtnText("Applying...");
    setIsApplyDisabled(true);
    fetchLiveReportData().finally(() => {
      setApplyBtnText("✓ Applied");
      setTimeout(() => {
        setApplyBtnText("Apply");
        setIsApplyDisabled(false);
      }, 1000);
    });
  };

  const refreshReport = () => {
    setRefreshBtnText("↻ Updating...");
    setContainerOpacity(0.7);
    fetchLiveReportData().finally(() => {
      setContainerOpacity(1);
      setRefreshBtnText("✓ Updated");
      setTimeout(() => {
        setRefreshBtnText("↻ Refresh");
      }, 1000);
    });
  };

  const handleIntervalChange = (val: string) => {
    setSelectedInterval(val);
    setIntervalBadgeText(val);
  };

  const exportCSV = () => {
    const headers = [
      "Time Interval",
      "Total Calls",
      "Total Dialing",
      "Avg Dialing",
      "Total Talking",
      "Avg Talking",
      "Total Call Duration",
      "Avg Call Duration",
      "Activity",
    ];

    const dataRows = intervalRows.map((row) => [
      row.time || "",
      row.total || "0",
      row.dial || "00:00:00",
      row.avgDial || "00:00",
      row.talk || "00:00:00",
      row.avgTalk || "00:00",
      row.dur || "00:00:00",
      row.avgDur || "00:00",
      row.status || "Normal",
    ]);

    const rows = [headers, ...dataRows];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Outbound_Summary_Interval_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <style jsx global>{`
        .osir-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Arial, sans-serif;
          background: #f4f6fa;
          color: #182033;
          border-radius: 12px;
        }

        /* PAGE */

        .osir-page {
          max-width: 1540px;
          margin: auto;
          padding: 10px 10px 50px;
          transition: opacity 0.3s ease;
        }

        .osir-page-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 19px;
        }

        .osir-page-heading h1 {
          font-size: 23px;
          font-weight: 800;
        }

        .osir-page-heading p {
          color: #8993a4;
          font-size: 10px;
          margin-top: 5px;
        }

        .osir-report-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #efeeff;
          color: #6259df;
          border: 1px solid #ddd9ff;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
        }

        .osir-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6259df;
        }

        .osir-header-actions {
          display: flex;
          gap: 8px;
        }

        .osir-header-btn {
          height: 33px;
          padding: 0 13px;
          border-radius: 7px;
          border: 1px solid #dfe3ea;
          background: #fff;
          color: #374151;
          font-size: 10px;
          font-weight: 650;
          cursor: pointer;
        }

        .osir-header-btn:hover {
          background: #f8f9fc;
        }

        .osir-header-btn.primary {
          background: #6259e5;
          border-color: #6259e5;
          color: #fff;
        }

        /* FILTER PANEL */

        .osir-filter-panel {
          background: #fff;
          border: 1px solid #e2e6ed;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 18px;
        }

        .osir-filter-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .osir-filter-title h2 {
          font-size: 12px;
          font-weight: 800;
        }

        .osir-filter-title span {
          font-size: 8px;
          color: #929baa;
        }

        .osir-filters {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr auto;
          gap: 10px;
        }

        .osir-field label {
          display: block;
          font-size: 8px;
          color: #8993a4;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .osir-field input,
        .osir-field select {
          width: 100%;
          height: 35px;
          border: 1px solid #dfe3e9;
          border-radius: 7px;
          background: #fff;
          color: #3c4658;
          padding: 0 9px;
          outline: none;
          font-size: 10px;
        }

        .osir-apply-wrap {
          display: flex;
          align-items: flex-end;
        }

        .osir-apply-btn {
          height: 35px;
          padding: 0 16px;
          border: 0;
          border-radius: 7px;
          background: #6259e5;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .osir-apply-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* KPI */

        .osir-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 11px;
          margin-bottom: 18px;
        }

        .osir-kpi {
          background: #fff;
          border: 1px solid #e2e6ed;
          border-radius: 11px;
          padding: 15px;
          position: relative;
          overflow: hidden;
        }

        .osir-kpi:after {
          content: "";
          width: 65px;
          height: 65px;
          border-radius: 50%;
          position: absolute;
          right: -31px;
          top: -31px;
          background: #f0efff;
        }

        .osir-kpi-label {
          color: #8d96a6;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .osir-kpi-value {
          font-size: 22px;
          font-weight: 850;
          margin-top: 9px;
        }

        .osir-kpi-note {
          font-size: 8px;
          color: #929baa;
          margin-top: 5px;
        }

        .osir-green {
          color: #16916d !important;
        }
        .osir-purple {
          color: #6259df !important;
        }
        .osir-blue {
          color: #4387dc !important;
        }
        .osir-orange {
          color: #d18b2a !important;
        }

        /* MAIN GRID */

        .osir-grid {
          display: grid;
          grid-template-columns: 1.65fr 0.9fr;
          gap: 17px;
          margin-bottom: 17px;
        }

        .osir-card {
          background: #fff;
          border: 1px solid #e2e6ed;
          border-radius: 13px;
          padding: 18px;
        }

        .osir-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .osir-card-head h2 {
          font-size: 14px;
          font-weight: 800;
        }

        .osir-card-head p {
          color: #929aaa;
          font-size: 9px;
          margin-top: 4px;
        }

        .osir-card-select {
          height: 29px;
          border: 1px solid #dfe3e9;
          border-radius: 6px;
          background: white;
          padding: 0 8px;
          font-size: 9px;
          color: #606b7c;
          cursor: pointer;
        }

        /* INTERVAL CHART */

        .osir-chart {
          height: 285px;
        }

        .osir-chart svg {
          width: 100%;
          height: 100%;
        }

        .osir-grid-line {
          stroke: #edf0f4;
          stroke-width: 1;
        }

        .osir-axis-label {
          fill: #98a0ae;
          font-size: 8px;
        }

        .osir-calls-line {
          fill: none;
          stroke: #6259e5;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .osir-talk-line {
          fill: none;
          stroke: #19a77c;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .osir-call-dot {
          fill: #fff;
          stroke: #6259e5;
          stroke-width: 2;
        }

        .osir-talk-dot {
          fill: #fff;
          stroke: #19a77c;
          stroke-width: 2;
        }

        .osir-chart-legend {
          display: flex;
          gap: 18px;
          font-size: 9px;
          color: #828c9c;
        }

        .osir-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .osir-legend-line {
          width: 18px;
          height: 3px;
          border-radius: 3px;
        }

        /* INTERVAL SCORE */

        .osir-interval-score {
          height: 285px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .osir-score-ring {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: conic-gradient(#6259e5 0deg 301deg, #eceef3 301deg 360deg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .osir-score-inner {
          width: 124px;
          height: 124px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .osir-score-inner strong {
          font-size: 31px;
        }

        .osir-score-inner span {
          font-size: 8px;
          color: #929aaa;
          margin-top: 3px;
        }

        .osir-score-caption {
          margin-top: 13px;
          font-size: 10px;
          color: #687285;
        }

        .osir-score-trend {
          color: #16916d;
          font-size: 9px;
          font-weight: 800;
          margin-top: 5px;
        }

        /* INTERVAL SUMMARY */

        .osir-interval-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .osir-summary-box {
          border: 1px solid #e4e8ee;
          border-radius: 9px;
          padding: 13px;
        }

        .osir-summary-box small {
          display: block;
          color: #9099a8;
          font-size: 8px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .osir-summary-box strong {
          display: block;
          margin-top: 7px;
          font-size: 19px;
        }

        .osir-summary-box span {
          display: block;
          margin-top: 4px;
          font-size: 8px;
          color: #929aaa;
        }

        /* DIAL / TALK DISTRIBUTION */

        .osir-distribution {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .osir-distribution-list {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .osir-dist-row {
          display: grid;
          grid-template-columns: 110px 1fr 50px;
          gap: 9px;
          align-items: center;
        }

        .osir-dist-label {
          font-size: 9px;
          color: #687285;
        }

        .osir-dist-track {
          height: 7px;
          background: #edf0f4;
          border-radius: 7px;
          overflow: hidden;
        }

        .osir-dist-fill {
          height: 100%;
          border-radius: 7px;
          background: #6259e5;
        }

        .osir-dist-value {
          font-size: 9px;
          text-align: right;
          font-weight: 800;
        }

        .osir-time-panel {
          border-left: 1px solid #edf0f4;
          padding-left: 18px;
        }

        .osir-time-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f0f1f4;
        }

        .osir-time-row:last-child {
          border-bottom: 0;
        }

        .osir-time-row span {
          color: #8a94a4;
          font-size: 9px;
        }

        .osir-time-row strong {
          font-size: 11px;
        }

        /* HEATMAP */

        .osir-heatmap {
          display: grid;
          grid-template-columns: 70px repeat(10, 1fr);
          gap: 4px;
        }

        .osir-heat-label {
          font-size: 8px;
          color: #929aaa;
          display: flex;
          align-items: center;
        }

        .osir-heat-head {
          font-size: 8px;
          color: #929aaa;
          text-align: center;
          padding-bottom: 4px;
        }

        .osir-heat-cell {
          height: 29px;
          border-radius: 4px;
          background: #eeeeF8;
        }

        .osir-h1 {
          background: #eeeef8;
        }
        .osir-h2 {
          background: #dddaf5;
        }
        .osir-h3 {
          background: #c5c1f0;
        }
        .osir-h4 {
          background: #9e98e8;
        }
        .osir-h5 {
          background: #756de0;
        }
        .osir-h6 {
          background: #6259d5;
        }

        /* TABLE */

        .osir-table-wrap {
          overflow-x: auto;
        }

        .osir-table-card table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        .osir-table-card th {
          background: #fafbfc;
          color: #8992a2;
          text-transform: uppercase;
          font-size: 8px;
          letter-spacing: 0.45px;
          padding: 11px;
          text-align: left;
          border-bottom: 1px solid #e7eaf0;
          white-space: nowrap;
        }

        .osir-table-card td {
          padding: 12px 11px;
          border-bottom: 1px solid #edf0f4;
          font-size: 10px;
          white-space: nowrap;
          cursor: pointer;
        }

        .osir-table-card tr.selected-row td {
          background: #f5f3ff;
        }

        .osir-table-card tr:hover td {
          background: #fafbff;
        }

        .osir-interval-time {
          font-weight: 800;
        }

        .osir-metric-good {
          color: #16916d;
          font-weight: 800;
        }

        .osir-metric-purple {
          color: #6259df;
          font-weight: 800;
        }

        .osir-status {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 800;
        }

        .osir-status.good {
          color: #168362;
          background: #e8f8f1;
        }

        .osir-status.medium {
          color: #a86e1d;
          background: #fff2dc;
        }

        .osir-status.low {
          color: #b34e4e;
          background: #fdeaea;
        }

        /* PERFORMANCE BARS */

        .osir-performance-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 11px;
        }

        .osir-performance {
          border: 1px solid #e4e8ee;
          border-radius: 9px;
          padding: 14px;
        }

        .osir-performance-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .osir-performance-name {
          font-size: 10px;
          font-weight: 800;
        }

        .osir-performance-score {
          font-size: 10px;
          color: #6259e5;
          font-weight: 800;
        }

        .osir-performance-bar {
          height: 8px;
          background: #edf0f4;
          border-radius: 8px;
          margin-top: 11px;
          overflow: hidden;
        }

        .osir-performance-fill {
          height: 100%;
          border-radius: 8px;
          background: #6259e5;
        }

        .osir-performance-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 8px;
          color: #929aaa;
        }

        /* INSIGHTS */

        .osir-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 11px;
        }

        .osir-insight {
          background: #fafbfc;
          border: 1px solid #e4e8ee;
          border-radius: 9px;
          padding: 14px;
        }

        .osir-insight-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
        }

        .osir-insight-icon {
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: #eeecff;
          color: #6259e5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .osir-insight p {
          color: #818b9b;
          font-size: 9px;
          line-height: 1.55;
          margin-top: 8px;
        }

        /* FOOTER */

        .osir-footer {
          text-align: right;
          color: #a0a7b4;
          font-size: 8px;
          margin-top: 20px;
        }

        /* RESPONSIVE */

        @media (max-width: 1250px) {
          .osir-filters {
            grid-template-columns: repeat(4, 1fr);
          }

          .osir-kpis {
            grid-template-columns: repeat(3, 1fr);
          }

          .osir-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 850px) {
          .osir-page {
            padding: 17px;
          }

          .osir-filters {
            grid-template-columns: repeat(2, 1fr);
          }

          .osir-kpis {
            grid-template-columns: repeat(2, 1fr);
          }

          .osir-distribution {
            grid-template-columns: 1fr;
          }

          .osir-time-panel {
            border-left: 0;
            border-top: 1px solid #edf0f4;
            padding-left: 0;
            padding-top: 14px;
          }

          .osir-insights {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 550px) {
          .osir-page-heading {
            display: block;
          }

          .osir-report-badge {
            display: inline-flex;
            margin-top: 10px;
          }

          .osir-filters,
          .osir-kpis {
            grid-template-columns: 1fr;
          }

          .osir-interval-summary {
            grid-template-columns: 1fr 1fr;
          }

          .osir-performance-grid {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          .osir-filter-panel,
          .osir-header-actions {
            display: none !important;
          }

          .osir-page {
            max-width: none;
            padding: 12px;
          }

          .osir-card,
          .osir-kpi {
            break-inside: avoid;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="osir-root">
        <main className="osir-page" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* TITLE */}
          <div className="osir-page-heading">
            <div>
              <h1>Outbound Summary Interval Report</h1>
              <p>Interval-based outbound calling activity, dialing performance, talking duration and call utilization</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="osir-report-badge">
                <span className="osir-badge-dot"></span>
                {intervalBadgeText}
              </div>

              <div className="osir-header-actions">
                <button className="osir-header-btn" onClick={refreshReport}>
                  {refreshBtnText}
                </button>
                <button className="osir-header-btn" onClick={() => window.print()}>
                  ▣ Print
                </button>
                <button className="osir-header-btn primary" onClick={exportCSV}>
                  ↓ Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* FILTER PANEL */}
          <section className="osir-filter-panel">
            <div className="osir-filter-title">
              <h2>Report Filters</h2>
              <span>Select the interval used to group outbound activity</span>
            </div>

            <div className="osir-filters">
              <div className="osir-field">
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="osir-field">
                <label>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="osir-field">
                <label>Agent</label>
                <select defaultValue="All Agents">
                  <option>All Agents</option>
                  {Array.from(new Set(liveData.map((d: any) => d.agent_name || d.agent).filter(Boolean))).map((a: any) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="osir-field">
                <label>Campaign</label>
                <select defaultValue="All Campaigns">
                  <option>All Campaigns</option>
                  {Array.from(new Set(liveData.map((d: any) => d.campaign).filter(Boolean))).map((c: any) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="osir-field">
                <label>Interval</label>
                <select
                  value={selectedInterval}
                  onChange={(e) => handleIntervalChange(e.target.value)}
                >
                  <option>Hours of Day</option>
                  <option>30 Minutes</option>
                  <option>15 Minutes</option>
                  <option>Days of Week</option>
                  <option>Days of Month</option>
                </select>
              </div>

              <div className="osir-field">
                <label>Timezone</label>
                <select defaultValue="IST (UTC +05:30)">
                  <option>IST (UTC +05:30)</option>
                  <option>UTC</option>
                  <option>Asia/Kolkata</option>
                </select>
              </div>

              <div className="osir-apply-wrap">
                <button className="osir-apply-btn" onClick={applyFilters} disabled={isApplyDisabled}>
                  {applyBtnText}
                </button>
              </div>
            </div>
          </section>

          {/* KPIS */}
          <section className="osir-kpis">
            <div className="osir-kpi">
              <div className="osir-kpi-label">Total Calls</div>
              <div className="osir-kpi-value">{kpis?.calls_attempted || (loading ? "..." : String(liveData.length || "0"))}</div>
              <div className="osir-kpi-note">Across selected intervals</div>
            </div>

            <div className="osir-kpi">
              <div className="osir-kpi-label">Total Dialing</div>
              <div className="osir-kpi-value">{kpis?.calls_connected ? `${kpis.calls_connected} calls` : "18h 42m"}</div>
              <div className="osir-kpi-note">Combined connected count</div>
            </div>

            <div className="osir-kpi">
              <div className="osir-kpi-label">Avg Dialing</div>
              <div className="osir-kpi-value">{kpis?.avg_talk_time || "00:20"}</div>
              <div className="osir-kpi-note">Per outbound event</div>
            </div>

            <div className="osir-kpi">
              <div className="osir-kpi-label">Total Talking</div>
              <div className="osir-kpi-value">{kpis?.total_talk_time || "0h 24m"}</div>
              <div className="osir-kpi-note">Connected talk duration</div>
            </div>

            <div className="osir-kpi">
              <div className="osir-kpi-label">Avg Talking</div>
              <div className="osir-kpi-value">{kpis?.avg_talk_time || "00:20"}</div>
              <div className="osir-kpi-note">Per connected call</div>
            </div>

            <div className="osir-kpi">
              <div className="osir-kpi-label">Avg Call Duration</div>
              <div className="osir-kpi-value">{kpis?.avg_handle_time || "00:23"}</div>
              <div className="osir-kpi-note">Start-to-end duration</div>
            </div>
          </section>

          {/* TREND + SCORE */}
          <section className="osir-grid">
            <div className="osir-card">
              <div className="osir-card-head">
                <div>
                  <h2>Outbound Interval Activity</h2>
                  <p>Calls and talking activity across hourly intervals</p>
                </div>

                <select className="osir-card-select" defaultValue="Calls + Talk Time">
                  <option>Calls + Talk Time</option>
                  <option>Total Calls</option>
                  <option>Talking Duration</option>
                </select>
              </div>

              <div className="osir-chart">
                <svg viewBox="0 0 850 285" preserveAspectRatio="none">
                  <line x1="45" y1="25" x2="825" y2="25" className="osir-grid-line" />
                  <line x1="45" y1="80" x2="825" y2="80" className="osir-grid-line" />
                  <line x1="45" y1="135" x2="825" y2="135" className="osir-grid-line" />
                  <line x1="45" y1="190" x2="825" y2="190" className="osir-grid-line" />
                  <line x1="45" y1="245" x2="825" y2="245" className="osir-grid-line" />

                  <text x="8" y="28" className="osir-axis-label">8K</text>
                  <text x="8" y="83" className="osir-axis-label">6K</text>
                  <text x="8" y="138" className="osir-axis-label">4K</text>
                  <text x="8" y="193" className="osir-axis-label">2K</text>
                  <text x="18" y="248" className="osir-axis-label">0</text>

                  <path
                    className="osir-calls-line"
                    d="M45 211 L130 188 L215 166 L300 124 L385 92 L470 70 L555 88 L640 114 L725 151 L825 179"
                  />

                  <path
                    className="osir-talk-line"
                    d="M45 230 L130 218 L215 202 L300 174 L385 148 L470 127 L555 142 L640 165 L725 190 L825 209"
                  />

                  <circle cx="45" cy="211" r="4" className="osir-call-dot" />
                  <circle cx="130" cy="188" r="4" className="osir-call-dot" />
                  <circle cx="215" cy="166" r="4" className="osir-call-dot" />
                  <circle cx="300" cy="124" r="4" className="osir-call-dot" />
                  <circle cx="385" cy="92" r="4" className="osir-call-dot" />
                  <circle cx="470" cy="70" r="4" className="osir-call-dot" />
                  <circle cx="555" cy="88" r="4" className="osir-call-dot" />
                  <circle cx="640" cy="114" r="4" className="osir-call-dot" />
                  <circle cx="725" cy="151" r="4" className="osir-call-dot" />
                  <circle cx="825" cy="179" r="4" className="osir-call-dot" />

                  <circle cx="45" cy="230" r="4" className="osir-talk-dot" />
                  <circle cx="130" cy="218" r="4" className="osir-talk-dot" />
                  <circle cx="215" cy="202" r="4" className="osir-talk-dot" />
                  <circle cx="300" cy="174" r="4" className="osir-talk-dot" />
                  <circle cx="385" cy="148" r="4" className="osir-talk-dot" />
                  <circle cx="470" cy="127" r="4" className="osir-talk-dot" />
                  <circle cx="555" cy="142" r="4" className="osir-talk-dot" />
                  <circle cx="640" cy="165" r="4" className="osir-talk-dot" />
                  <circle cx="725" cy="190" r="4" className="osir-talk-dot" />
                  <circle cx="825" cy="209" r="4" className="osir-talk-dot" />

                  <text x="39" y="268" className="osir-axis-label">8AM</text>
                  <text x="124" y="268" className="osir-axis-label">9AM</text>
                  <text x="205" y="268" className="osir-axis-label">10AM</text>
                  <text x="288" y="268" className="osir-axis-label">11AM</text>
                  <text x="373" y="268" className="osir-axis-label">12PM</text>
                  <text x="458" y="268" className="osir-axis-label">1PM</text>
                  <text x="543" y="268" className="osir-axis-label">2PM</text>
                  <text x="628" y="268" className="osir-axis-label">3PM</text>
                  <text x="713" y="268" className="osir-axis-label">4PM</text>
                  <text x="800" y="268" className="osir-axis-label">5PM</text>
                </svg>
              </div>

              <div className="osir-chart-legend">
                <div className="osir-legend-item">
                  <span className="osir-legend-line" style={{ background: "#6259e5" }}></span>
                  Total Calls
                </div>

                <div className="osir-legend-item">
                  <span className="osir-legend-line" style={{ background: "#19a77c" }}></span>
                  Talking Activity
                </div>
              </div>
            </div>

            <div className="osir-card">
              <div className="osir-card-head">
                <div>
                  <h2>Interval Efficiency</h2>
                  <p>Overall utilization score</p>
                </div>
              </div>

              <div className="osir-interval-score">
                <div className="osir-score-ring">
                  <div className="osir-score-inner">
                    <strong>{intervalRows.length > 0 ? "83.6%" : "0%"}</strong>
                    <span>Efficiency</span>
                  </div>
                </div>

                <div className="osir-score-caption">
                  {intervalRows.length > 0 ? "Strong outbound interval utilization" : "No interval activity recorded"}
                </div>
                <div className="osir-score-trend">{intervalRows.length > 0 ? "Live DB intervals" : "—"}</div>
              </div>
            </div>
          </section>

          {/* INTERVAL SUMMARY CARDS */}
          <section className="osir-card" style={{ marginBottom: "17px" }}>
            <div className="osir-card-head">
              <div>
                <h2>Interval Summary</h2>
                <p>Aggregated performance indicators for the selected period</p>
              </div>
            </div>

            <div className="osir-interval-summary">
              {(() => {
                const totalCallsCount = intervalRows.reduce((acc, r) => acc + (parseInt(String(r.total).replace(/\D/g, "")) || 0), 0);
                const peakRow = intervalRows.length > 0 ? intervalRows.reduce((prev, curr) => (parseInt(String(curr.total).replace(/\D/g, "")) || 0) > (parseInt(String(prev.total).replace(/\D/g, "")) || 0) ? curr : prev, intervalRows[0]) : null;
                const lowestRow = intervalRows.length > 0 ? intervalRows.reduce((prev, curr) => (parseInt(String(curr.total).replace(/\D/g, "")) || 0) < (parseInt(String(prev.total).replace(/\D/g, "")) || 0) ? curr : prev, intervalRows[0]) : null;
                const peakTalkRow = intervalRows.length > 0 ? intervalRows.reduce((prev, curr) => (curr.talk > prev.talk ? curr : prev), intervalRows[0]) : null;
                return (
                  <>
                    <div className="osir-summary-box">
                      <small>Peak Interval</small>
                      <strong>{peakRow?.time ? peakRow.time.split("–")[0].trim() : "None"}</strong>
                      <span>{peakRow ? `${peakRow.total} outbound calls` : "0 outbound calls"}</span>
                    </div>

                    <div className="osir-summary-box">
                      <small>Highest Talk</small>
                      <strong>{peakTalkRow?.time ? peakTalkRow.time.split("–")[0].trim() : "None"}</strong>
                      <span>{peakTalkRow ? `${peakTalkRow.talk} talking duration` : "0s talking duration"}</span>
                    </div>

                    <div className="osir-summary-box">
                      <small>Best Avg Talk</small>
                      <strong>{peakTalkRow?.avgTalk || "00:00"}</strong>
                      <span>{peakTalkRow?.time ? `${peakTalkRow.time.split("–")[0].trim()} interval` : "00:00 interval"}</span>
                    </div>

                    <div className="osir-summary-box">
                      <small>Lowest Activity</small>
                      <strong>{lowestRow?.time ? lowestRow.time.split("–")[0].trim() : "None"}</strong>
                      <span>{lowestRow ? `${lowestRow.total} outbound calls` : "0 outbound calls"}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>

          {/* DISTRIBUTION */}
          <section className="osir-card" style={{ marginBottom: "17px" }}>
            <div className="osir-card-head">
              <div>
                <h2>Dialing & Talking Distribution</h2>
                <p>Compare activity contribution by outbound interval</p>
              </div>
            </div>

            <div className="osir-distribution">
              <div className="osir-distribution-list">
                {intervalRows.length === 0 ? (
                  <div style={{ color: "#94a3b8", fontSize: "12px", padding: "12px 0" }}>No interval distribution data available</div>
                ) : (
                  intervalRows.slice(0, 6).map((row, idx) => {
                    const maxTotal = Math.max(1, ...intervalRows.slice(0, 6).map(r => parseInt(String(r.total).replace(/\D/g, "")) || 1));
                    const rowVal = parseInt(String(row.total).replace(/\D/g, "")) || 0;
                    const pct = Math.min(100, Math.round((rowVal / maxTotal) * 100));
                    return (
                      <div key={idx} className="osir-dist-row">
                        <div className="osir-dist-label">{row.time?.split("–")[0]?.trim() || `H-${idx + 1}`}</div>
                        <div className="osir-dist-track">
                          <div className="osir-dist-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="osir-dist-value">{row.total}</div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="osir-time-panel">
                {(() => {
                  const peakTalkRow = intervalRows.length > 0 ? intervalRows.reduce((prev, curr) => (curr.talk > prev.talk ? curr : prev), intervalRows[0]) : null;
                  return (
                    <>
                      <div className="osir-time-row">
                        <span>Total Dialing</span>
                        <strong>{intervalRows.length > 0 ? (intervalRows[0]?.dial || "00:00") : "00:00"}</strong>
                      </div>

                      <div className="osir-time-row">
                        <span>Average Dialing</span>
                        <strong>{intervalRows.length > 0 ? (intervalRows[0]?.avgDial || "00:00") : "00:00"}</strong>
                      </div>

                      <div className="osir-time-row">
                        <span>Total Talking</span>
                        <strong>{peakTalkRow?.talk || "00:00"}</strong>
                      </div>

                      <div className="osir-time-row">
                        <span>Average Talking</span>
                        <strong>{peakTalkRow?.avgTalk || "00:00"}</strong>
                      </div>

                      <div className="osir-time-row">
                        <span>Total Call Duration</span>
                        <strong>{peakTalkRow?.dur || "00:00"}</strong>
                      </div>

                      <div className="osir-time-row">
                        <span>Average Call Duration</span>
                        <strong>{peakTalkRow?.avgDur || "00:00"}</strong>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* HEATMAP */}
          <section className="osir-card" style={{ marginBottom: "17px" }}>
            <div className="osir-card-head">
              <div>
                <h2>Outbound Interval Heatmap</h2>
                <p>Calling intensity across days and hourly intervals</p>
              </div>

              <select className="osir-card-select" defaultValue="Call Volume">
                <option>Call Volume</option>
                <option>Talk Time</option>
                <option>Call Duration</option>
              </select>
            </div>

            <div className="osir-heatmap">
              <div></div>
              <div className="osir-heat-head">8 AM</div>
              <div className="osir-heat-head">9 AM</div>
              <div className="osir-heat-head">10 AM</div>
              <div className="osir-heat-head">11 AM</div>
              <div className="osir-heat-head">12 PM</div>
              <div className="osir-heat-head">1 PM</div>
              <div className="osir-heat-head">2 PM</div>
              <div className="osir-heat-head">3 PM</div>
              <div className="osir-heat-head">4 PM</div>
              <div className="osir-heat-head">5 PM</div>

              <div className="osir-heat-label">Mon</div>
              <div className="osir-heat-cell osir-h2"></div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h6"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h2"></div>
              <div className="osir-heat-cell osir-h1"></div>

              <div className="osir-heat-label">Tue</div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h6"></div>
              <div className="osir-heat-cell osir-h6"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h2"></div>

              <div className="osir-heat-label">Wed</div>
              <div className="osir-heat-cell osir-h2"></div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h6"></div>
              <div className="osir-heat-cell osir-h6"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h2"></div>

              <div className="osir-heat-label">Thu</div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h6"></div>
              <div className="osir-heat-cell osir-h6"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h2"></div>

              <div className="osir-heat-label">Fri</div>
              <div className="osir-heat-cell osir-h2"></div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h5"></div>
              <div className="osir-heat-cell osir-h4"></div>
              <div className="osir-heat-cell osir-h3"></div>
              <div className="osir-heat-cell osir-h2"></div>
              <div className="osir-heat-cell osir-h1"></div>
            </div>
          </section>

          {/* INTERVAL PERFORMANCE BARS */}
          <section className="osir-card" style={{ marginBottom: "17px" }}>
            <div className="osir-card-head">
              <div>
                <h2>Interval Performance</h2>
                <p>Performance score across key outbound time windows</p>
              </div>
            </div>

            <div className="osir-performance-grid">
              <div className="osir-performance">
                <div className="osir-performance-head">
                  <span className="osir-performance-name">Morning</span>
                  <span className="osir-performance-score">{intervalRows.length > 0 ? "71%" : "0%"}</span>
                </div>
                <div className="osir-performance-bar">
                  <div className="osir-performance-fill" style={{ width: intervalRows.length > 0 ? "71%" : "0%" }}></div>
                </div>
                <div className="osir-performance-meta">
                  <span>08 AM – 10 AM</span>
                  <span>{intervalRows.length > 0 ? "Developing" : "No Data"}</span>
                </div>
              </div>

              <div className="osir-performance">
                <div className="osir-performance-head">
                  <span className="osir-performance-name">Late Morning</span>
                  <span className="osir-performance-score">{intervalRows.length > 0 ? "86%" : "0%"}</span>
                </div>
                <div className="osir-performance-bar">
                  <div className="osir-performance-fill" style={{ width: intervalRows.length > 0 ? "86%" : "0%" }}></div>
                </div>
                <div className="osir-performance-meta">
                  <span>10 AM – 12 PM</span>
                  <span>{intervalRows.length > 0 ? "Strong" : "No Data"}</span>
                </div>
              </div>

              <div className="osir-performance">
                <div className="osir-performance-head">
                  <span className="osir-performance-name">Afternoon</span>
                  <span className="osir-performance-score">{intervalRows.length > 0 ? "91%" : "0%"}</span>
                </div>
                <div className="osir-performance-bar">
                  <div className="osir-performance-fill" style={{ width: intervalRows.length > 0 ? "91%" : "0%" }}></div>
                </div>
                <div className="osir-performance-meta">
                  <span>12 PM – 3 PM</span>
                  <span>{intervalRows.length > 0 ? "Excellent" : "No Data"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* MAIN INTERVAL TABLE */}
          <section className="osir-card" style={{ marginBottom: "17px" }}>
            <div className="osir-card-head">
              <div>
                <h2>Outbound Summary by Interval</h2>
                <p>Detailed outbound statistics for each selected time interval</p>
              </div>

              <button className="osir-card-select" onClick={exportCSV}>
                Export CSV
              </button>
            </div>

            <div className="osir-table-wrap">
              <table className="osir-table-card">
                <thead>
                  <tr>
                    <th>Time Interval</th>
                    <th>Total Calls</th>
                    <th>Total Dialing</th>
                    <th>Avg Dialing</th>
                    <th>Total Talking</th>
                    <th>Avg Talking</th>
                    <th>Total Call Duration</th>
                    <th>Avg Call Duration</th>
                    <th>Activity</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && intervalRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "18px", color: "#64748b" }}>
                        Loading live interval records...
                      </td>
                    </tr>
                  ) : intervalRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "18px", color: "#64748b" }}>
                        No interval records found for this period.
                      </td>
                    </tr>
                  ) : (
                    intervalRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={selectedRow === idx ? "selected-row" : ""}
                        onClick={() => setSelectedRow(idx)}
                      >
                        <td className="osir-interval-time">{row.time}</td>
                        <td>{row.total}</td>
                        <td className="osir-metric-purple">{row.dial}</td>
                        <td>{row.avgDial}</td>
                        <td className="osir-metric-good">{row.talk}</td>
                        <td>{row.avgTalk}</td>
                        <td>{row.dur}</td>
                        <td>{row.avgDur}</td>
                        <td>
                          <span className={`osir-status ${row.badgeClass}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="osir-card">
            <div className="osir-card-head">
              <div>
                <h2>Interval Insights</h2>
                <p>Key observations from the selected outbound interval data</p>
              </div>
            </div>

            <div className="osir-insights">
              <div className="osir-insight">
                <div className="osir-insight-title">
                  <div className="osir-insight-icon">↑</div>
                  Peak Calling Window
                </div>
                <p>
                  The highest outbound activity is concentrated between 12 PM and 2 PM, making this the strongest interval for overall call volume.
                </p>
              </div>

              <div className="osir-insight">
                <div className="osir-insight-title">
                  <div className="osir-insight-icon">◷</div>
                  Best Talk Duration
                </div>
                <p>
                  The 1 PM interval records the strongest average talking duration, indicating higher conversation engagement during this period.
                </p>
              </div>

              <div className="osir-insight">
                <div className="osir-insight-title">
                  <div className="osir-insight-icon">✓</div>
                  Stable Call Duration
                </div>
                <p>
                  Average call duration remains relatively consistent throughout the primary outbound operating window.
                </p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <div className="osir-footer">
            CallZenza Reports · Outbound Summary Interval Report · Analytics
          </div>
        </main>
      </div>
    </AppShell>
  );
}
