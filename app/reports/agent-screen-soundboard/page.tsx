"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AgentScreenSoundboard() {
  const [liveClips, setLiveClips] = useState<any[]>([]);
  const [liveAgents, setLiveAgents] = useState<any[]>([]);

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("agent-screen-soundboard");
        if (res) {
          if (Array.isArray(res.clips)) setLiveClips(res.clips);
          else if (Array.isArray(res.data)) setLiveClips(res.data);
          if (Array.isArray(res.agents)) setLiveAgents(res.agents);
        }
      } catch (err) {
        console.error("Failed loading report for agent-screen-soundboard:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const [filterBtnText, setFilterBtnText] = useState("Apply Filters");
  const [refreshBtnText, setRefreshBtnText] = useState("↻ Refresh");
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [activePage, setActivePage] = useState(1);

  const applyFilters = () => {
    setFilterBtnText("Loading...");
    setTimeout(() => {
      setFilterBtnText("Applied ✓");
      setTimeout(() => {
        setFilterBtnText("Apply Filters");
      }, 1000);
    }, 600);
  };

  const refreshReport = () => {
    setRefreshBtnText("Refreshing...");
    setContainerOpacity(0.7);
    setTimeout(() => {
      setContainerOpacity(1);
      setRefreshBtnText("↻ Refresh");
    }, 700);
  };

  const exportCSV = () => {
    const table = document.getElementById("reportTable");
    if (!table) return;

    const rows = table.querySelectorAll("tr");
    let csv: string[] = [];

    rows.forEach((row) => {
      const cols = row.querySelectorAll("th, td");
      let data: string[] = [];
      cols.forEach((col) => {
        data.push('"' + (col as HTMLElement).innerText.replace(/"/g, '""') + '"');
      });
      csv.push(data.join(","));
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "agent-audio-soundboard-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <AppShell>
      <style jsx global>{`
        .ass-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Arial, sans-serif;
          background: #f4f6fa;
          color: #172033;
          border-radius: 12px;
        }

        /* ================= CONTAINER ================= */

        .ass-container {
          max-width: 1650px;
          margin: auto;
          padding: 10px 10px 28px;
          transition: opacity 0.3s ease;
        }

        /* ================= PAGE TITLE ================= */

        .ass-page-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .ass-page-title h1 {
          font-size: 27px;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .ass-page-title p {
          font-size: 12px;
          color: #7f899b;
        }

        .ass-actions {
          display: flex;
          gap: 8px;
        }

        .ass-btn {
          height: 38px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid #dfe4ec;
          background: white;
          color: #59657a;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .ass-btn:hover {
          background: #f3f1ff;
          color: #5e54df;
        }

        .ass-btn-primary {
          background: #6559e9;
          color: white;
          border-color: #6559e9;
        }

        .ass-btn-primary:hover {
          color: white;
          background: #564ad9;
        }

        /* ================= FILTER BAR ================= */

        .ass-filters {
          background: white;
          border: 1px solid #e4e8ef;
          border-radius: 15px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr auto;
          gap: 11px;
          align-items: end;
          margin-bottom: 20px;
        }

        .ass-field label {
          display: block;
          color: #7b8597;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .ass-field input,
        .ass-field select {
          width: 100%;
          height: 39px;
          border: 1px solid #dfe4eb;
          border-radius: 8px;
          background: #fafbfc;
          padding: 0 10px;
          font-size: 10px;
          color: #263147;
          outline: none;
        }

        .ass-field input:focus,
        .ass-field select:focus {
          border-color: #7166ef;
        }

        .ass-apply-btn {
          height: 39px;
          padding: 0 18px;
          border: none;
          border-radius: 8px;
          background: #111827;
          color: white;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        /* ================= KPI GRID ================= */

        .ass-kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 13px;
          margin-bottom: 20px;
        }

        .ass-kpi {
          background: white;
          border: 1px solid #e4e8ef;
          border-radius: 15px;
          padding: 17px;
          position: relative;
          overflow: hidden;
          transition: transform 0.18s ease;
        }

        .ass-kpi:hover {
          transform: translateY(-2px);
        }

        .ass-kpi:after {
          content: "";
          position: absolute;
          width: 75px;
          height: 75px;
          border-radius: 50%;
          right: -30px;
          top: -30px;
          background: #f1efff;
        }

        .ass-kpi-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ass-kpi-label {
          color: #7e889a;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .ass-kpi-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #efedff;
          color: #6258e7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }

        .ass-kpi-value {
          font-size: 24px;
          font-weight: 900;
          margin-top: 13px;
        }

        .ass-kpi-change {
          font-size: 9px;
          margin-top: 6px;
          color: #1ca276;
        }

        .ass-kpi-change.warning {
          color: #db922a;
        }

        .ass-kpi-change.danger {
          color: #d95757;
        }

        /* ================= GRID ================= */

        .ass-grid {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .ass-card {
          background: white;
          border: 1px solid #e4e8ef;
          border-radius: 16px;
          padding: 19px;
        }

        .ass-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 17px;
        }

        .ass-card-header h3 {
          font-size: 14px;
          font-weight: 700;
        }

        .ass-card-header p {
          font-size: 9px;
          color: #8b95a5;
          margin-top: 4px;
        }

        .ass-card-action {
          font-size: 9px;
          color: #6559e9;
          font-weight: 700;
          cursor: pointer;
        }

        /* ================= LINE CHART ================= */

        .ass-chart {
          height: 260px;
          position: relative;
        }

        .ass-chart-grid {
          position: absolute;
          left: 0;
          right: 0;
          top: 10px;
          bottom: 30px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .ass-grid-line {
          border-top: 1px dashed #e9ecf2;
          width: 100%;
        }

        .ass-chart-svg {
          position: absolute;
          left: 0;
          right: 0;
          top: 10px;
          bottom: 30px;
          width: 100%;
          height: 220px;
        }

        .ass-chart-labels {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: space-between;
          color: #929bab;
          font-size: 9px;
        }

        /* ================= DONUT ================= */

        .ass-donut-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          min-height: 250px;
        }

        .ass-donut {
          width: 165px;
          height: 165px;
          border-radius: 50%;
          background: conic-gradient(
            #6659ed 0deg 122deg,
            #35bea0 122deg 215deg,
            #f2ad45 215deg 285deg,
            #e45d69 285deg 327deg,
            #dfe3eb 327deg 360deg
          );
          position: relative;
        }

        .ass-donut:after {
          content: "";
          position: absolute;
          width: 105px;
          height: 105px;
          background: white;
          border-radius: 50%;
          left: 30px;
          top: 30px;
        }

        .ass-donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .ass-donut-center strong {
          font-size: 22px;
        }

        .ass-donut-center span {
          font-size: 9px;
          color: #8993a4;
          margin-top: 3px;
        }

        .ass-legend {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .ass-legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          font-size: 10px;
        }

        .ass-legend-left {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #677287;
        }

        .ass-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .ass-dot.greeting {
          background: #6659ed;
        }
        .ass-dot.hold {
          background: #35bea0;
        }
        .ass-dot.closing {
          background: #f2ad45;
        }
        .ass-dot.compliance {
          background: #e45d69;
        }
        .ass-dot.custom {
          background: #dfe3eb;
        }

        /* ================= SOUND RANKING ================= */

        .ass-sound-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ass-sound-row {
          display: grid;
          grid-template-columns: 35px 1fr 90px;
          align-items: center;
          gap: 10px;
        }

        .ass-sound-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #efedff;
          color: #6358e5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ass-sound-name {
          font-size: 10px;
          font-weight: 800;
        }

        .ass-sound-meta {
          font-size: 8px;
          color: #8d97a8;
          margin-top: 3px;
        }

        .ass-sound-count {
          text-align: right;
          font-size: 10px;
          font-weight: 800;
        }

        .ass-mini-progress {
          height: 5px;
          background: #eef0f5;
          border-radius: 10px;
          margin-top: 6px;
          overflow: hidden;
        }

        .ass-mini-progress span {
          display: block;
          height: 100%;
          background: #6a5eed;
          border-radius: 10px;
        }

        /* ================= AGENT PERFORMANCE ================= */

        .ass-agent-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .ass-agent-row {
          display: grid;
          grid-template-columns: 32px 1fr 80px 55px;
          align-items: center;
          gap: 9px;
          padding: 10px;
          background: #f8f9fc;
          border-radius: 10px;
        }

        .ass-agent-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #eae8ff;
          color: #5d53dd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
        }

        .ass-agent-name {
          font-size: 10px;
          font-weight: 800;
        }

        .ass-agent-role {
          font-size: 8px;
          color: #9099a9;
          margin-top: 3px;
        }

        .ass-agent-bar {
          height: 5px;
          background: #e9ecf2;
          border-radius: 10px;
          overflow: hidden;
        }

        .ass-agent-bar span {
          display: block;
          height: 100%;
          background: #6659ed;
        }

        .ass-agent-score {
          font-size: 10px;
          font-weight: 800;
          text-align: right;
        }

        /* ================= STATUS CARDS ================= */

        .ass-status-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .ass-status-card {
          padding: 13px;
          border-radius: 11px;
          background: #f8f9fc;
          border: 1px solid #edf0f5;
        }

        .ass-status-number {
          font-size: 20px;
          font-weight: 900;
        }

        .ass-status-label {
          font-size: 9px;
          color: #7f899a;
          margin-top: 4px;
        }

        .ass-status-percent {
          font-size: 8px;
          margin-top: 8px;
          color: #20a17a;
        }

        /* ================= HEATMAP ================= */

        .ass-heatmap {
          display: grid;
          grid-template-columns: 70px repeat(12, 1fr);
          gap: 4px;
        }

        .ass-heat-label {
          height: 22px;
          font-size: 8px;
          color: #8993a4;
          display: flex;
          align-items: center;
        }

        .ass-heat-head {
          font-size: 7px;
          color: #9aa3b2;
          text-align: center;
          padding-bottom: 3px;
        }

        .ass-heat-cell {
          height: 22px;
          border-radius: 4px;
          background: #eef0f5;
        }

        .ass-level1 {
          background: #e4e1ff;
        }
        .ass-level2 {
          background: #c9c4ff;
        }
        .ass-level3 {
          background: #9c94f5;
        }
        .ass-level4 {
          background: #675be8;
        }

        /* ================= INSIGHTS ================= */

        .ass-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 11px;
        }

        .ass-insight {
          padding: 13px;
          border-radius: 11px;
          border: 1px solid #e7eaf0;
          background: #fafbfc;
        }

        .ass-insight-icon {
          width: 29px;
          height: 29px;
          border-radius: 8px;
          background: #efedff;
          color: #6358e5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ass-insight strong {
          display: block;
          font-size: 11px;
          margin-top: 9px;
        }

        .ass-insight p {
          color: #8993a3;
          font-size: 9px;
          line-height: 1.5;
          margin-top: 4px;
        }

        /* ================= TABLE ================= */

        .ass-table-card {
          background: white;
          border: 1px solid #e4e8ef;
          border-radius: 16px;
          overflow: hidden;
        }

        .ass-table-header {
          padding: 18px 19px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ass-table-header h3 {
          font-size: 14px;
          font-weight: 700;
        }

        .ass-table-header span {
          color: #8993a4;
          font-size: 9px;
        }

        .ass-table-wrapper {
          overflow-x: auto;
        }

        .ass-table-card table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        .ass-table-card th {
          background: #f8f9fc;
          padding: 12px 15px;
          text-align: left;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #778194;
          border-bottom: 1px solid #e5e8ee;
        }

        .ass-table-card td {
          padding: 13px 15px;
          font-size: 9px;
          border-bottom: 1px solid #edf0f4;
        }

        .ass-table-card tr:hover td {
          background: #fafbfe;
        }

        .ass-user {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ass-user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: #eceaff;
          color: #5f55df;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 800;
        }

        .ass-user-name {
          font-size: 9px;
          font-weight: 800;
        }

        .ass-user-role {
          color: #919aaa;
          font-size: 8px;
          margin-top: 2px;
        }

        .ass-pill {
          display: inline-flex;
          padding: 5px 7px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 800;
        }

        .ass-pill.green {
          background: #e9faf4;
          color: #168565;
        }

        .ass-pill.yellow {
          background: #fff5df;
          color: #af781e;
        }

        .ass-pill.red {
          background: #fff0f0;
          color: #d45353;
        }

        .ass-pill.blue {
          background: #edf3ff;
          color: #3e70bf;
        }

        .ass-table-footer {
          padding: 13px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ass-pagination {
          display: flex;
          gap: 4px;
        }

        .ass-page {
          width: 28px;
          height: 28px;
          border: 1px solid #dfe4eb;
          background: white;
          border-radius: 6px;
          font-size: 9px;
          cursor: pointer;
        }

        .ass-page.active {
          background: #6659ed;
          color: white;
          border-color: #6659ed;
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1250px) {
          .ass-kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .ass-filters {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 950px) {
          .ass-grid {
            grid-template-columns: 1fr;
          }

          .ass-container {
            padding: 18px;
          }

          .ass-status-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .ass-insights {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .ass-container {
            padding: 14px;
          }

          .ass-page-title {
            flex-direction: column;
            gap: 14px;
          }

          .ass-actions {
            width: 100%;
          }

          .ass-actions .ass-btn {
            flex: 1;
          }

          .ass-filters {
            grid-template-columns: 1fr;
          }

          .ass-kpi-grid {
            grid-template-columns: 1fr 1fr;
          }

          .ass-donut-wrap {
            flex-direction: column;
          }
        }

        /* PRINT */

        @media print {
          .ass-actions,
          .ass-filters,
          .ass-table-footer {
            display: none !important;
          }

          body {
            background: white;
          }

          .ass-container {
            padding: 10px;
          }

          .ass-card,
          .ass-kpi,
          .ass-table-card {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="ass-root">
        <main className="ass-container" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* TITLE */}
          <div className="ass-page-title">
            <div>
              <h1>Agent Screen — Audio Soundboard Report</h1>
              <p>Analyze agent soundboard usage, audio playback activity and message performance.</p>
            </div>

            <div className="ass-actions">
              <button className="ass-btn" onClick={() => window.print()}>
                Print
              </button>

              <button className="ass-btn" onClick={refreshReport}>
                {refreshBtnText}
              </button>

              <button className="ass-btn ass-btn-primary" onClick={exportCSV}>
                Export CSV
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <section className="ass-filters">
            <div className="ass-field">
              <label>Date Range</label>
              <select defaultValue="Today">
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Month</option>
              </select>
            </div>

            <div className="ass-field">
              <label>From Date</label>
              <input type="date" defaultValue="2026-09-01" />
            </div>

            <div className="ass-field">
              <label>To Date</label>
              <input type="date" defaultValue="2026-09-07" />
            </div>

            <div className="ass-field">
              <label>Agent</label>
              <select defaultValue="All Agents">
                <option>All Agents</option>
                {Array.from(new Set(liveAgents.map((a: any) => a.name).filter(Boolean))).map((name: any) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="ass-field">
              <label>Audio Category</label>
              <select defaultValue="All Categories">
                <option>All Categories</option>
                <option>Greetings</option>
                <option>Hold / Waiting</option>
                <option>Closing</option>
                <option>Compliance</option>
                <option>Transfer</option>
                <option>Custom</option>
              </select>
            </div>

            <button className="ass-apply-btn" onClick={applyFilters}>
              {filterBtnText}
            </button>
          </section>

          {/* KPI */}
          <section className="ass-kpi-grid">
            <div className="ass-kpi">
              <div className="ass-kpi-top">
                <span className="ass-kpi-label">Total Playbacks</span>
                <div className="ass-kpi-icon">♫</div>
              </div>
              <div className="ass-kpi-value">4,826</div>
              <div className="ass-kpi-change">↑ 12.8% vs previous period</div>
            </div>

            <div className="ass-kpi">
              <div className="ass-kpi-top">
                <span className="ass-kpi-label">Active Agents</span>
                <div className="ass-kpi-icon">◉</div>
              </div>
              <div className="ass-kpi-value">42</div>
              <div className="ass-kpi-change">↑ 5 agents</div>
            </div>

            <div className="ass-kpi">
              <div className="ass-kpi-top">
                <span className="ass-kpi-label">Avg Playback</span>
                <div className="ass-kpi-icon">◷</div>
              </div>
              <div className="ass-kpi-value">09.4s</div>
              <div className="ass-kpi-change">↓ 0.8s improvement</div>
            </div>

            <div className="ass-kpi">
              <div className="ass-kpi-top">
                <span className="ass-kpi-label">Success Rate</span>
                <div className="ass-kpi-icon">✓</div>
              </div>
              <div className="ass-kpi-value">98.7%</div>
              <div className="ass-kpi-change">↑ 1.4%</div>
            </div>

            <div className="ass-kpi">
              <div className="ass-kpi-top">
                <span className="ass-kpi-label">Audio Minutes</span>
                <div className="ass-kpi-icon">◴</div>
              </div>
              <div className="ass-kpi-value">756</div>
              <div className="ass-kpi-change">↑ 9.2%</div>
            </div>

            <div className="ass-kpi">
              <div className="ass-kpi-top">
                <span className="ass-kpi-label">Failed Plays</span>
                <div className="ass-kpi-icon">!</div>
              </div>
              <div className="ass-kpi-value">63</div>
              <div className="ass-kpi-change danger">↓ 18.5%</div>
            </div>
          </section>

          {/* TREND + CATEGORY */}
          <section className="ass-grid">
            {/* TREND */}
            <div className="ass-card">
              <div className="ass-card-header">
                <div>
                  <h3>Audio Playback Trend</h3>
                  <p>Daily soundboard usage over the selected period</p>
                </div>
                <span className="ass-card-action">Daily</span>
              </div>

              <div className="ass-chart">
                <div className="ass-chart-grid">
                  <div className="ass-grid-line"></div>
                  <div className="ass-grid-line"></div>
                  <div className="ass-grid-line"></div>
                  <div className="ass-grid-line"></div>
                  <div className="ass-grid-line"></div>
                </div>

                <svg className="ass-chart-svg" viewBox="0 0 900 220" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7569ef" stopOpacity=".22" />
                      <stop offset="100%" stopColor="#7569ef" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M0 175 L70 152 L140 160 L210 121 L280 135 L350 96 L420 108 L490 76 L560 88 L630 58 L700 74 L770 43 L840 62 L900 28 L900 220 L0 220 Z"
                    fill="url(#area)"
                  />

                  <polyline
                    points="0,175 70,152 140,160 210,121 280,135 350,96 420,108 490,76 560,88 630,58 700,74 770,43 840,62 900,28"
                    fill="none"
                    stroke="#6659ed"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <circle cx="900" cy="28" r="5" fill="#6659ed" />
                </svg>

                <div className="ass-chart-labels">
                  <span>Sep 01</span>
                  <span>Sep 02</span>
                  <span>Sep 03</span>
                  <span>Sep 04</span>
                  <span>Sep 05</span>
                  <span>Sep 06</span>
                  <span>Sep 07</span>
                </div>
              </div>
            </div>

            {/* CATEGORY DISTRIBUTION */}
            <div className="ass-card">
              <div className="ass-card-header">
                <div>
                  <h3>Audio Category Usage</h3>
                  <p>Playback distribution</p>
                </div>
              </div>

              <div className="ass-donut-wrap">
                <div className="ass-donut">
                  <div className="ass-donut-center">
                    <strong>4.8K</strong>
                    <span>Playbacks</span>
                  </div>
                </div>

                <div className="ass-legend">
                  <div className="ass-legend-row">
                    <div className="ass-legend-left">
                      <span className="ass-dot greeting"></span>
                      Greetings
                    </div>
                    <strong>34%</strong>
                  </div>

                  <div className="ass-legend-row">
                    <div className="ass-legend-left">
                      <span className="ass-dot hold"></span>
                      Hold / Waiting
                    </div>
                    <strong>26%</strong>
                  </div>

                  <div className="ass-legend-row">
                    <div className="ass-legend-left">
                      <span className="ass-dot closing"></span>
                      Closing
                    </div>
                    <strong>19%</strong>
                  </div>

                  <div className="ass-legend-row">
                    <div className="ass-legend-left">
                      <span className="ass-dot compliance"></span>
                      Compliance
                    </div>
                    <strong>12%</strong>
                  </div>

                  <div className="ass-legend-row">
                    <div className="ass-legend-left">
                      <span className="ass-dot custom"></span>
                      Custom
                    </div>
                    <strong>9%</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TOP AUDIO + AGENT PERFORMANCE */}
          <section className="ass-grid">
            {/* TOP AUDIO */}
            <div className="ass-card">
              <div className="ass-card-header">
                <div>
                  <h3>Most Used Audio Messages</h3>
                  <p>Top soundboard messages by playback count</p>
                </div>
                <span className="ass-card-action">View All</span>
              </div>

              <div className="ass-sound-list">
                <div className="ass-sound-row">
                  <div className="ass-sound-icon">♫</div>
                  <div>
                    <div className="ass-sound-name">Welcome Greeting</div>
                    <div className="ass-sound-meta">Greeting · 00:08</div>
                    <div className="ass-mini-progress">
                      <span style={{ width: "92%" }}></span>
                    </div>
                  </div>
                  <div className="ass-sound-count">1,248</div>
                </div>

                <div className="ass-sound-row">
                  <div className="ass-sound-icon">♫</div>
                  <div>
                    <div className="ass-sound-name">Please Hold</div>
                    <div className="ass-sound-meta">Hold · 00:11</div>
                    <div className="ass-mini-progress">
                      <span style={{ width: "78%" }}></span>
                    </div>
                  </div>
                  <div className="ass-sound-count">936</div>
                </div>

                <div className="ass-sound-row">
                  <div className="ass-sound-icon">✓</div>
                  <div>
                    <div className="ass-sound-name">Thank You & Goodbye</div>
                    <div className="ass-sound-meta">Closing · 00:09</div>
                    <div className="ass-mini-progress">
                      <span style={{ width: "66%" }}></span>
                    </div>
                  </div>
                  <div className="ass-sound-count">782</div>
                </div>

                <div className="ass-sound-row">
                  <div className="ass-sound-icon">🔒</div>
                  <div>
                    <div className="ass-sound-name">Call Recording Notice</div>
                    <div className="ass-sound-meta">Compliance · 00:10</div>
                    <div className="ass-mini-progress">
                      <span style={{ width: "52%" }}></span>
                    </div>
                  </div>
                  <div className="ass-sound-count">614</div>
                </div>

                <div className="ass-sound-row">
                  <div className="ass-sound-icon">↗</div>
                  <div>
                    <div className="ass-sound-name">Transfer Message</div>
                    <div className="ass-sound-meta">Transfer · 00:12</div>
                    <div className="ass-mini-progress">
                      <span style={{ width: "41%" }}></span>
                    </div>
                  </div>
                  <div className="ass-sound-count">488</div>
                </div>
              </div>
            </div>

            {/* AGENT PERFORMANCE */}
            <div className="ass-card">
              <div className="ass-card-header">
                <div>
                  <h3>Agent Soundboard Activity</h3>
                  <p>Playback activity by agent</p>
                </div>
                <span className="ass-card-action">Top 5</span>
              </div>

              <div className="ass-agent-list">
                {liveAgents.map((ag: any, idx: number) => (
                  <div key={idx} className="ass-agent-row">
                    <div className="ass-agent-avatar">{ag.initials}</div>
                    <div>
                      <div className="ass-agent-name">{ag.name}</div>
                      <div className="ass-agent-role">{ag.role}</div>
                    </div>
                    <div className="ass-agent-bar">
                      <span style={{ width: ag.width || "75%" }}></span>
                    </div>
                    <div className="ass-agent-score">{ag.score}</div>
                  </div>
                ))}
                {liveAgents.length === 0 && (
                  <div style={{ textAlign: "center", padding: "16px", color: "#8a93a3", fontSize: "12px" }}>
                    No soundboard agent metrics recorded
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* STATUS + INSIGHTS */}
          <section className="ass-grid">
            {/* PLAYBACK STATUS */}
            <div className="ass-card">
              <div className="ass-card-header">
                <div>
                  <h3>Playback Status</h3>
                  <p>Soundboard execution results</p>
                </div>
              </div>

              <div className="ass-status-grid">
                <div className="ass-status-card">
                  <div className="ass-status-number">4,763</div>
                  <div className="ass-status-label">Successful</div>
                  <div className="ass-status-percent">98.7%</div>
                </div>

                <div className="ass-status-card">
                  <div className="ass-status-number">63</div>
                  <div className="ass-status-label">Failed</div>
                  <div className="ass-status-percent" style={{ color: "#d85a5a" }}>
                    1.3%
                  </div>
                </div>

                <div className="ass-status-card">
                  <div className="ass-status-number">4.2K</div>
                  <div className="ass-status-label">Delivered</div>
                  <div className="ass-status-percent">87.2%</div>
                </div>

                <div className="ass-status-card">
                  <div className="ass-status-number">562</div>
                  <div className="ass-status-label">Interrupted</div>
                  <div className="ass-status-percent" style={{ color: "#db922a" }}>
                    11.6%
                  </div>
                </div>
              </div>
            </div>

            {/* INSIGHTS */}
            <div className="ass-card">
              <div className="ass-card-header">
                <div>
                  <h3>Soundboard Insights</h3>
                  <p>Automated report observations</p>
                </div>
              </div>

              <div className="ass-insights">
                <div className="ass-insight">
                  <div className="ass-insight-icon">↑</div>
                  <strong>Usage Increased</strong>
                  <p>Playback activity increased by 12.8% compared with the previous period.</p>
                </div>

                <div className="ass-insight">
                  <div className="ass-insight-icon">★</div>
                  <strong>Top Message</strong>
                  <p>Welcome Greeting is the most frequently used soundboard message.</p>
                </div>

                <div className="ass-insight">
                  <div className="ass-insight-icon">✓</div>
                  <strong>High Reliability</strong>
                  <p>Soundboard playback success remains above 98% for the selected period.</p>
                </div>
              </div>
            </div>
          </section>

          {/* HOURLY HEATMAP */}
          <section className="ass-card" style={{ marginBottom: "18px" }}>
            <div className="ass-card-header">
              <div>
                <h3>Hourly Soundboard Activity</h3>
                <p>Playback concentration by hour and day</p>
              </div>
              <span className="ass-card-action">Usage Heatmap</span>
            </div>

            <div className="ass-heatmap">
              <div></div>
              <div className="ass-heat-head">8</div>
              <div className="ass-heat-head">9</div>
              <div className="ass-heat-head">10</div>
              <div className="ass-heat-head">11</div>
              <div className="ass-heat-head">12</div>
              <div className="ass-heat-head">1</div>
              <div className="ass-heat-head">2</div>
              <div className="ass-heat-head">3</div>
              <div className="ass-heat-head">4</div>
              <div className="ass-heat-head">5</div>
              <div className="ass-heat-head">6</div>
              <div className="ass-heat-head">7</div>

              <div className="ass-heat-label">Monday</div>
              <div className="ass-heat-cell ass-level1"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level1"></div>
              <div className="ass-heat-cell"></div>

              <div className="ass-heat-label">Tuesday</div>
              <div className="ass-heat-cell"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level1"></div>
              <div className="ass-heat-cell"></div>

              <div className="ass-heat-label">Wednesday</div>
              <div className="ass-heat-cell ass-level1"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level1"></div>
              <div className="ass-heat-cell"></div>

              <div className="ass-heat-label">Thursday</div>
              <div className="ass-heat-cell"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level1"></div>
              <div className="ass-heat-cell"></div>

              <div className="ass-heat-label">Friday</div>
              <div className="ass-heat-cell ass-level1"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level4"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level3"></div>
              <div className="ass-heat-cell ass-level2"></div>
              <div className="ass-heat-cell ass-level1"></div>
              <div className="ass-heat-cell"></div>
            </div>
          </section>

          {/* DETAIL TABLE */}
          <section className="ass-table-card">
            <div className="ass-table-header">
              <div>
                <h3>Agent Soundboard Activity Details</h3>
              </div>
              <span>42 Agents · 4,826 Playbacks</span>
            </div>

            <div className="ass-table-wrapper">
              <table id="reportTable">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Date</th>
                    <th>Audio Message</th>
                    <th>Category</th>
                    <th>Playbacks</th>
                    <th>Avg Duration</th>
                    <th>Success Rate</th>
                    <th>Interrupted</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {liveClips.map((c: any, idx: number) => (
                    <tr key={c.id || idx}>
                      <td>
                        <div className="ass-user">
                          <div className="ass-user-avatar">{c.agent_initials || "AG"}</div>
                          <div>
                            <div className="ass-user-name">{c.agent}</div>
                            <div className="ass-user-role">{c.role || "Agent"}</div>
                          </div>
                        </div>
                      </td>
                      <td>{c.date}</td>
                      <td>{c.clip}</td>
                      <td>
                        <span className={`ass-pill ${c.category_class || "blue"}`}>{c.category}</span>
                      </td>
                      <td>{c.playbacks}</td>
                      <td>{c.avg_duration}</td>
                      <td>{c.accuracy}</td>
                      <td>{c.errors}</td>
                      <td>
                        <span className="ass-pill green">{c.rating}</span>
                      </td>
                    </tr>
                  ))}
                  {liveClips.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "24px", color: "#8a93a3" }}>
                        No soundboard audio playback events found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ass-table-footer">
              <span style={{ fontSize: "9px", color: "#8b95a5" }}>Showing 1–{liveClips.length} of {liveClips.length} records</span>

              <div className="ass-pagination">
                <button className="ass-page">‹</button>
                {[1, 2, 3, 4].map((page) => (
                  <button
                    key={page}
                    className={`ass-page ${activePage === page ? "active" : ""}`}
                    onClick={() => setActivePage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button className="ass-page">›</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}
