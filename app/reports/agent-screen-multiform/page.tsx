"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AgentScreenMultiForm() {
  const [liveCalls, setLiveCalls] = useState<any[]>([]);
  const [liveAgents, setLiveAgents] = useState<any[]>([]);
  const [liveActivity, setLiveActivity] = useState<any[]>([]);

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("agent-screen-multiform");
        if (res) {
          if (Array.isArray(res.calls)) setLiveCalls(res.calls);
          else if (Array.isArray(res.data)) setLiveCalls(res.data);
          if (Array.isArray(res.agents)) setLiveAgents(res.agents);
          if (Array.isArray(res.activity)) setLiveActivity(res.activity);
        }
      } catch (err) {
        console.error("Failed loading report for agent-screen-multiform:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const [filterBtnText, setFilterBtnText] = useState("Apply Filters");
  const [isFilterDisabled, setIsFilterDisabled] = useState(false);
  const [refreshBtnText, setRefreshBtnText] = useState("↻ Refresh");
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [fromDate, setFromDate] = useState("2026-09-07");
  const [toDate, setToDate] = useState("2026-09-07");
  const [dateRange, setDateRange] = useState("Today");

  const applyFilters = () => {
    setFilterBtnText("Loading...");
    setIsFilterDisabled(true);
    setTimeout(() => {
      setFilterBtnText("Applied ✓");
      setTimeout(() => {
        setFilterBtnText("Apply Filters");
        setIsFilterDisabled(false);
      }, 900);
    }, 700);
  };

  const refreshReport = () => {
    setRefreshBtnText("↻ Refreshing...");
    setContainerOpacity(0.7);
    setTimeout(() => {
      setContainerOpacity(1);
      setRefreshBtnText("✓ Updated");
      setTimeout(() => {
        setRefreshBtnText("↻ Refresh");
      }, 900);
    }, 800);
  };

  const exportCSV = () => {
    const headers = [
      "Call ID",
      "Customer",
      "Agent",
      "Forms Used",
      "Completed",
      "Avg Form Time",
      "Auto Save",
      "Follow-up",
      "Last Form",
      "Status",
    ];
    const rows = liveCalls.map((c: any) => [
      c.call_id || c.id,
      c.customer,
      c.agent,
      c.forms_used,
      c.completed,
      c.avg_time,
      c.auto_save,
      c.follow_up,
      c.last_form,
      c.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Agent_Screen_Multi_Form_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDateRangeChange = (val: string) => {
    setDateRange(val);
    if (val === "Today") {
      setFromDate("2026-09-07");
      setToDate("2026-09-07");
    } else if (val === "Yesterday") {
      setFromDate("2026-09-06");
      setToDate("2026-09-06");
    }
  };

  return (
    <AppShell>
      <style jsx global>{`
        .asmr-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f4f6fa;
          color: #202638;
          border-radius: 12px;
        }

        /* ================= CONTAINER ================= */

        .asmr-container {
          max-width: 1650px;
          margin: auto;
          padding: 10px 10px 45px;
          transition: opacity 0.3s ease;
        }

        .asmr-page-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .asmr-page-heading h1 {
          font-size: 25px;
          font-weight: 800;
          color: #171c2b;
        }

        .asmr-page-heading p {
          font-size: 12px;
          color: #858e9f;
          margin-top: 5px;
        }

        .asmr-live-status {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 12px;
          border-radius: 18px;
          background: #eafaf4;
          border: 1px solid #c9efdf;
          color: #148566;
          font-size: 10px;
          font-weight: 700;
        }

        .asmr-live-dot {
          width: 7px;
          height: 7px;
          background: #24b987;
          border-radius: 50%;
        }

        .asmr-header-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .asmr-header-btn {
          height: 36px;
          padding: 0 13px;
          border: 1px solid #dfe4eb;
          background: white;
          color: #374151;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        }

        .asmr-header-btn:hover {
          background: #f8f9fc;
        }

        .asmr-header-btn.primary {
          background: #6259e8;
          border-color: #6259e8;
          color: white;
        }

        /* ================= FILTERS ================= */

        .asmr-filters {
          background: white;
          border: 1px solid #e4e8ef;
          border-radius: 13px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr auto;
          gap: 11px;
          margin-bottom: 20px;
        }

        .asmr-filter label {
          display: block;
          font-size: 10px;
          color: #778194;
          font-weight: 800;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .asmr-filter input,
        .asmr-filter select {
          width: 100%;
          height: 39px;
          border: 1px solid #dfe4eb;
          background: #fafbfd;
          border-radius: 8px;
          padding: 0 10px;
          color: #374151;
          font-size: 11px;
          outline: none;
        }

        .asmr-filter input:focus,
        .asmr-filter select:focus {
          border-color: #6b61eb;
          background: white;
        }

        .asmr-apply {
          height: 39px;
          padding: 0 18px;
          border: 0;
          background: #6259e8;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .asmr-apply:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ================= KPI ================= */

        .asmr-kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 13px;
          margin-bottom: 20px;
        }

        .asmr-kpi {
          background: white;
          border: 1px solid #e4e8ef;
          border-radius: 13px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .asmr-kpi:after {
          content: "";
          position: absolute;
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #f3f2ff;
          right: -25px;
          bottom: -28px;
        }

        .asmr-kpi-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .asmr-kpi-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          font-weight: 800;
          color: #7f8899;
        }

        .asmr-kpi-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #f0efff;
          color: #6057df;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .asmr-kpi-value {
          font-size: 25px;
          font-weight: 800;
          margin-top: 10px;
          color: #202536;
        }

        .asmr-kpi-change {
          font-size: 10px;
          margin-top: 5px;
        }

        .asmr-positive {
          color: #169567;
          font-weight: 700;
        }

        .asmr-negative {
          color: #d94c57;
          font-weight: 700;
        }

        .asmr-neutral {
          color: #8992a3;
        }

        /* ================= LAYOUT ================= */

        .asmr-row {
          display: grid;
          grid-template-columns: 1.65fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .asmr-card {
          background: white;
          border: 1px solid #e4e8ef;
          border-radius: 14px;
          overflow: hidden;
        }

        .asmr-card-header {
          padding: 17px 19px 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .asmr-card-title {
          font-size: 14px;
          font-weight: 800;
          color: #252b3a;
        }

        .asmr-card-subtitle {
          color: #9199a8;
          font-size: 10px;
          margin-top: 4px;
        }

        .asmr-card-action {
          border: 1px solid #e1e5ec;
          background: white;
          border-radius: 7px;
          padding: 6px 9px;
          color: #687284;
          font-size: 10px;
          cursor: pointer;
        }

        /* ================= CHART ================= */

        .asmr-chart-box {
          height: 280px;
          padding: 5px 18px 18px;
        }

        .asmr-chart-box svg {
          width: 100%;
          height: 100%;
        }

        .asmr-grid-line {
          stroke: #edf0f4;
          stroke-width: 1;
        }

        .asmr-axis {
          fill: #98a0af;
          font-size: 10px;
        }

        .asmr-chart-line {
          fill: none;
          stroke: #6259e8;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .asmr-chart-line-two {
          fill: none;
          stroke: #2abda2;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .asmr-chart-point {
          fill: white;
          stroke: #6259e8;
          stroke-width: 2;
        }

        /* ================= DONUT ================= */

        .asmr-donut-area {
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 25px;
          padding: 20px;
        }

        .asmr-donut {
          width: 165px;
          height: 165px;
          border-radius: 50%;
          background: conic-gradient(
            #6259e8 0deg 106deg,
            #8178f2 106deg 191deg,
            #a6a1f7 191deg 253deg,
            #c9c7fa 253deg 309deg,
            #e5e4fa 309deg 360deg
          );
          position: relative;
          flex-shrink: 0;
        }

        .asmr-donut:after {
          content: "";
          position: absolute;
          width: 95px;
          height: 95px;
          background: white;
          border-radius: 50%;
          top: 35px;
          left: 35px;
        }

        .asmr-donut-center {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .asmr-donut-center strong {
          font-size: 25px;
          color: #202536;
        }

        .asmr-donut-center span {
          font-size: 9px;
          color: #9098a7;
          margin-top: 3px;
        }

        .asmr-legend {
          width: 170px;
        }

        .asmr-legend-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 13px 0;
          font-size: 10px;
        }

        .asmr-legend-left {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #687183;
        }

        .asmr-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 3px;
        }

        .asmr-legend-row strong {
          color: #303646;
        }

        /* ================= MULTI FORM SCORECARDS ================= */

        .asmr-form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
          padding: 0 18px 19px;
        }

        .asmr-form-card {
          border: 1px solid #e7eaf0;
          border-radius: 11px;
          padding: 14px;
          background: #fcfcfe;
        }

        .asmr-form-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 13px;
        }

        .asmr-form-name {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 800;
          color: #303646;
        }

        .asmr-form-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #eeecff;
          color: #6158e1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .asmr-form-percent {
          font-size: 15px;
          font-weight: 800;
          color: #292f40;
        }

        .asmr-form-progress {
          height: 7px;
          border-radius: 10px;
          background: #eceef3;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .asmr-form-progress span {
          display: block;
          height: 100%;
          background: #6259e8;
          border-radius: 10px;
        }

        .asmr-form-meta {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #8a93a3;
        }

        /* ================= FUNNEL ================= */

        .asmr-funnel {
          padding: 8px 20px 22px;
        }

        .asmr-funnel-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0;
        }

        .asmr-funnel-label {
          width: 125px;
          font-size: 10px;
          color: #687183;
        }

        .asmr-funnel-track {
          flex: 1;
          height: 27px;
          background: #f0f1f5;
          border-radius: 6px;
          overflow: hidden;
        }

        .asmr-funnel-fill {
          height: 100%;
          display: flex;
          align-items: center;
          padding-left: 10px;
          color: white;
          font-size: 9px;
          font-weight: 700;
          background: #6259e8;
          border-radius: 6px;
        }

        .asmr-funnel-value {
          width: 55px;
          text-align: right;
          font-size: 10px;
          font-weight: 800;
          color: #313747;
        }

        /* ================= AGENT TABLE ================= */

        .asmr-table-card {
          margin-bottom: 18px;
        }

        .asmr-table-wrap {
          overflow-x: auto;
        }

        .asmr-table-card table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }

        .asmr-table-card thead th {
          background: #fafbfc;
          border-top: 1px solid #edf0f4;
          border-bottom: 1px solid #e6e9ef;
          padding: 12px 14px;
          text-align: left;
          font-size: 9px;
          color: #788193;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.35px;
          white-space: nowrap;
        }

        .asmr-table-card tbody td {
          padding: 13px 14px;
          border-bottom: 1px solid #f0f2f5;
          font-size: 11px;
          color: #4c5567;
          white-space: nowrap;
        }

        .asmr-table-card tbody tr:hover {
          background: #fafaff;
        }

        .asmr-agent {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .asmr-agent-mini {
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: #eeecff;
          color: #5e55df;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
        }

        .asmr-agent-name {
          font-weight: 750;
          color: #303646;
        }

        .asmr-progress-small {
          width: 75px;
          height: 6px;
          display: inline-block;
          background: #eceef3;
          border-radius: 10px;
          overflow: hidden;
          vertical-align: middle;
          margin-right: 6px;
        }

        .asmr-progress-small span {
          display: block;
          height: 100%;
          background: #6259e8;
          border-radius: 10px;
        }

        .asmr-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 800;
        }

        .asmr-badge.green {
          color: #16845e;
          background: #e9faf4;
        }

        .asmr-badge.yellow {
          color: #a87816;
          background: #fff7e6;
        }

        .asmr-badge.red {
          color: #c3464e;
          background: #fff0f1;
        }

        /* ================= SECONDARY GRID ================= */

        .asmr-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        /* ================= TIME ANALYSIS ================= */

        .asmr-time-list {
          padding: 5px 20px 20px;
        }

        .asmr-time-row {
          display: grid;
          grid-template-columns: 145px 1fr 55px;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #f0f2f5;
        }

        .asmr-time-row:last-child {
          border-bottom: 0;
        }

        .asmr-time-label {
          font-size: 10px;
          color: #687183;
        }

        .asmr-time-track {
          height: 8px;
          background: #edf0f4;
          border-radius: 10px;
          overflow: hidden;
        }

        .asmr-time-fill {
          height: 100%;
          background: #6259e8;
          border-radius: 10px;
        }

        .asmr-time-value {
          font-size: 10px;
          font-weight: 800;
          text-align: right;
        }

        /* ================= FORM ACTIVITY ================= */

        .asmr-activity {
          padding: 4px 20px 20px;
        }

        .asmr-activity-row {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f2f5;
        }

        .asmr-activity-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #efedff;
          color: #6259e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .asmr-activity-text strong {
          display: block;
          font-size: 10px;
          color: #343a49;
        }

        .asmr-activity-text span {
          display: block;
          font-size: 9px;
          color: #9199a8;
          margin-top: 3px;
        }

        .asmr-activity-time {
          color: #8c95a5;
          font-size: 9px;
        }

        /* ================= DETAIL TABLE ================= */

        .asmr-detail-table {
          margin-bottom: 18px;
        }

        .asmr-call-id {
          color: #5b52dd;
          font-weight: 800;
        }

        .asmr-customer {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .asmr-customer-avatar {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          background: #eeecff;
          color: #6259e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 800;
        }

        .asmr-form-status {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .asmr-form-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #27b58a;
        }

        /* ================= FOOTER ================= */

        .asmr-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #9098a7;
          font-size: 10px;
        }

        .asmr-pagination {
          display: flex;
          gap: 5px;
        }

        .asmr-page {
          width: 28px;
          height: 28px;
          border: 1px solid #dfe3ea;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 10px;
          color: #687183;
        }

        .asmr-page.active {
          background: #6259e8;
          border-color: #6259e8;
          color: white;
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1250px) {
          .asmr-kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .asmr-filters {
            grid-template-columns: repeat(3, 1fr);
          }

          .asmr-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 850px) {
          .asmr-container {
            padding: 18px 14px 30px;
          }

          .asmr-page-heading {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .asmr-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .asmr-form-grid {
            grid-template-columns: 1fr;
          }

          .asmr-bottom-grid {
            grid-template-columns: 1fr;
          }

          .asmr-filters {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .asmr-kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          .asmr-filters,
          .asmr-pagination {
            display: none;
          }

          body {
            background: white;
          }

          .asmr-container {
            padding: 10px;
          }
        }
      `}</style>

      <div className="asmr-root">
        <main className="asmr-container" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* PAGE HEADING & ACTIONS */}
          <div className="asmr-page-heading">
            <div>
              <h1>Agent Screen — Multi-Form Report</h1>
              <p>Multi-form usage, completion, agent productivity and interaction analysis</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="asmr-live-status">
                <span className="asmr-live-dot"></span>
                Report Updated
              </div>

              <div className="asmr-header-actions">
                <button className="asmr-header-btn" onClick={() => window.print()}>
                  Print
                </button>
                <button className="asmr-header-btn" onClick={refreshReport}>
                  {refreshBtnText}
                </button>
                <button className="asmr-header-btn primary" onClick={exportCSV}>
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <section className="asmr-filters">
            <div className="asmr-filter">
              <label>Date Range</label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
              >
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Month</option>
                <option>Custom Range</option>
              </select>
            </div>

            <div className="asmr-filter">
              <label>From Date</label>
              <input
                type="date"
                id="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="asmr-filter">
              <label>To Date</label>
              <input
                type="date"
                id="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="asmr-filter">
              <label>Agent</label>
              <select defaultValue="All Agents">
                <option>All Agents</option>
                {Array.from(new Set(liveAgents.map((a: any) => a.name).filter(Boolean))).map((name: any) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="asmr-filter">
              <label>Form</label>
              <select defaultValue="All Forms">
                <option>All Forms</option>
                <option>Customer Details</option>
                <option>Qualification</option>
                <option>Requirement</option>
                <option>Call Script</option>
                <option>Notes</option>
                <option>Call History</option>
              </select>
            </div>

            <div className="asmr-filter">
              <label>&nbsp;</label>
              <button
                className="asmr-apply"
                onClick={applyFilters}
                disabled={isFilterDisabled}
              >
                {filterBtnText}
              </button>
            </div>
          </section>

          {/* KPI GRID */}
          <section className="asmr-kpi-grid">
            <div className="asmr-kpi">
              <div className="asmr-kpi-top">
                <span className="asmr-kpi-label">Total Interactions</span>
                <span className="asmr-kpi-icon">☎</span>
              </div>
              <div className="asmr-kpi-value">{liveCalls.length.toLocaleString()}</div>
              <div className="asmr-kpi-change">
                <span className="asmr-positive">↑ 9.4%</span>
                <span className="asmr-neutral"> vs previous</span>
              </div>
            </div>

            <div className="asmr-kpi">
              <div className="asmr-kpi-top">
                <span className="asmr-kpi-label">Forms Completed</span>
                <span className="asmr-kpi-icon">✓</span>
              </div>
              <div className="asmr-kpi-value">{(liveCalls.length * 5).toLocaleString()}</div>
              <div className="asmr-kpi-change">
                <span className="asmr-positive">93.9%</span>
                <span className="asmr-neutral"> completion rate</span>
              </div>
            </div>

            <div className="asmr-kpi">
              <div className="asmr-kpi-top">
                <span className="asmr-kpi-label">Avg Forms / Call</span>
                <span className="asmr-kpi-icon">▦</span>
              </div>
              <div className="asmr-kpi-value">4.8</div>
              <div className="asmr-kpi-change">
                <span className="asmr-positive">↑ 0.6</span>
                <span className="asmr-neutral"> vs previous</span>
              </div>
            </div>

            <div className="asmr-kpi">
              <div className="asmr-kpi-top">
                <span className="asmr-kpi-label">Avg Form Time</span>
                <span className="asmr-kpi-icon">◷</span>
              </div>
              <div className="asmr-kpi-value">02:14</div>
              <div className="asmr-kpi-change">
                <span className="asmr-positive">↓ 8.2%</span>
                <span className="asmr-neutral"> faster</span>
              </div>
            </div>

            <div className="asmr-kpi">
              <div className="asmr-kpi-top">
                <span className="asmr-kpi-label">Auto Save Success</span>
                <span className="asmr-kpi-icon">⟳</span>
              </div>
              <div className="asmr-kpi-value">99.2%</div>
              <div className="asmr-kpi-change">
                <span className="asmr-positive">↑ 1.1%</span>
                <span className="asmr-neutral"> reliability</span>
              </div>
            </div>

            <div className="asmr-kpi">
              <div className="asmr-kpi-top">
                <span className="asmr-kpi-label">Follow-ups</span>
                <span className="asmr-kpi-icon">↗</span>
              </div>
              <div className="asmr-kpi-value">{liveCalls.filter((c: any) => c.follow_up === "Required").length.toLocaleString()}</div>
              <div className="asmr-kpi-change">
                <span className="asmr-negative">↑ 4.8%</span>
                <span className="asmr-neutral"> pending action</span>
              </div>
            </div>
          </section>

          {/* TREND + FORM DISTRIBUTION */}
          <section className="asmr-row">
            <div className="asmr-card">
              <div className="asmr-card-header">
                <div>
                  <div className="asmr-card-title">Multi-Form Activity Trend</div>
                  <div className="asmr-card-subtitle">
                    Forms opened and successfully completed over the selected period
                  </div>
                </div>
                <button className="asmr-card-action">Daily ▾</button>
              </div>

              <div className="asmr-chart-box">
                <svg viewBox="0 0 760 250" preserveAspectRatio="none">
                  <line x1="45" y1="30" x2="735" y2="30" className="asmr-grid-line" />
                  <line x1="45" y1="75" x2="735" y2="75" className="asmr-grid-line" />
                  <line x1="45" y1="120" x2="735" y2="120" className="asmr-grid-line" />
                  <line x1="45" y1="165" x2="735" y2="165" className="asmr-grid-line" />
                  <line x1="45" y1="210" x2="735" y2="210" className="asmr-grid-line" />

                  <text x="12" y="34" className="asmr-axis">1200</text>
                  <text x="15" y="79" className="asmr-axis">900</text>
                  <text x="15" y="124" className="asmr-axis">600</text>
                  <text x="15" y="169" className="asmr-axis">300</text>
                  <text x="25" y="214" className="asmr-axis">0</text>

                  <path
                    className="asmr-chart-line"
                    d="M45 166 L115 151 L185 137 L255 124 L325 106 L395 117 L465 91 L535 75 L605 60 L675 72 L735 48"
                  />

                  <path
                    className="asmr-chart-line-two"
                    d="M45 188 L115 177 L185 165 L255 153 L325 135 L395 144 L465 121 L535 104 L605 92 L675 105 L735 79"
                  />

                  <circle cx="45" cy="166" r="4" className="asmr-chart-point" />
                  <circle cx="185" cy="137" r="4" className="asmr-chart-point" />
                  <circle cx="325" cy="106" r="4" className="asmr-chart-point" />
                  <circle cx="465" cy="91" r="4" className="asmr-chart-point" />
                  <circle cx="605" cy="60" r="4" className="asmr-chart-point" />
                  <circle cx="735" cy="48" r="4" className="asmr-chart-point" />

                  <text x="40" y="233" className="asmr-axis">01 Sep</text>
                  <text x="175" y="233" className="asmr-axis">02 Sep</text>
                  <text x="310" y="233" className="asmr-axis">03 Sep</text>
                  <text x="445" y="233" className="asmr-axis">04 Sep</text>
                  <text x="580" y="233" className="asmr-axis">05 Sep</text>
                  <text x="690" y="233" className="asmr-axis">06 Sep</text>
                </svg>
              </div>
            </div>

            <div className="asmr-card">
              <div className="asmr-card-header">
                <div>
                  <div className="asmr-card-title">Form Usage Distribution</div>
                  <div className="asmr-card-subtitle">Percentage of total form interactions</div>
                </div>
              </div>

              <div className="asmr-donut-area">
                <div className="asmr-donut">
                  <div className="asmr-donut-center">
                    <strong>38.4K</strong>
                    <span>Form Actions</span>
                  </div>
                </div>

                <div className="asmr-legend">
                  <div className="asmr-legend-row">
                    <div className="asmr-legend-left">
                      <span className="asmr-legend-dot" style={{ background: "#6259e8" }}></span>
                      Customer Details
                    </div>
                    <strong>29%</strong>
                  </div>

                  <div className="asmr-legend-row">
                    <div className="asmr-legend-left">
                      <span className="asmr-legend-dot" style={{ background: "#8178f2" }}></span>
                      Qualification
                    </div>
                    <strong>23%</strong>
                  </div>

                  <div className="asmr-legend-row">
                    <div className="asmr-legend-left">
                      <span className="asmr-legend-dot" style={{ background: "#a6a1f7" }}></span>
                      Requirement
                    </div>
                    <strong>17%</strong>
                  </div>

                  <div className="asmr-legend-row">
                    <div className="asmr-legend-left">
                      <span className="asmr-legend-dot" style={{ background: "#c9c7fa" }}></span>
                      Notes
                    </div>
                    <strong>16%</strong>
                  </div>

                  <div className="asmr-legend-row">
                    <div className="asmr-legend-left">
                      <span className="asmr-legend-dot" style={{ background: "#e5e4fa" }}></span>
                      Other Forms
                    </div>
                    <strong>15%</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FORM PERFORMANCE */}
          <section className="asmr-card" style={{ marginBottom: "18px" }}>
            <div className="asmr-card-header">
              <div>
                <div className="asmr-card-title">Multi-Form Completion Performance</div>
                <div className="asmr-card-subtitle">Completion rate and interaction volume by form</div>
              </div>
              <button className="asmr-card-action">View Details →</button>
            </div>

            <div className="asmr-form-grid">
              <div className="asmr-form-card">
                <div className="asmr-form-card-head">
                  <div className="asmr-form-name">
                    <div className="asmr-form-icon">01</div>
                    Customer Details
                  </div>
                  <div className="asmr-form-percent">98%</div>
                </div>
                <div className="asmr-form-progress">
                  <span style={{ width: "98%" }}></span>
                </div>
                <div className="asmr-form-meta">
                  <span>8,212 opened</span>
                  <span>8,048 completed</span>
                </div>
              </div>

              <div className="asmr-form-card">
                <div className="asmr-form-card-head">
                  <div className="asmr-form-name">
                    <div className="asmr-form-icon">02</div>
                    Qualification
                  </div>
                  <div className="asmr-form-percent">94%</div>
                </div>
                <div className="asmr-form-progress">
                  <span style={{ width: "94%" }}></span>
                </div>
                <div className="asmr-form-meta">
                  <span>7,486 opened</span>
                  <span>7,036 completed</span>
                </div>
              </div>

              <div className="asmr-form-card">
                <div className="asmr-form-card-head">
                  <div className="asmr-form-name">
                    <div className="asmr-form-icon">03</div>
                    Requirement
                  </div>
                  <div className="asmr-form-percent">91%</div>
                </div>
                <div className="asmr-form-progress">
                  <span style={{ width: "91%" }}></span>
                </div>
                <div className="asmr-form-meta">
                  <span>6,942 opened</span>
                  <span>6,318 completed</span>
                </div>
              </div>

              <div className="asmr-form-card">
                <div className="asmr-form-card-head">
                  <div className="asmr-form-name">
                    <div className="asmr-form-icon">04</div>
                    Call Script
                  </div>
                  <div className="asmr-form-percent">96%</div>
                </div>
                <div className="asmr-form-progress">
                  <span style={{ width: "96%" }}></span>
                </div>
                <div className="asmr-form-meta">
                  <span>7,120 opened</span>
                  <span>6,835 completed</span>
                </div>
              </div>

              <div className="asmr-form-card">
                <div className="asmr-form-card-head">
                  <div className="asmr-form-name">
                    <div className="asmr-form-icon">05</div>
                    Notes
                  </div>
                  <div className="asmr-form-percent">89%</div>
                </div>
                <div className="asmr-form-progress">
                  <span style={{ width: "89%" }}></span>
                </div>
                <div className="asmr-form-meta">
                  <span>6,804 opened</span>
                  <span>6,055 completed</span>
                </div>
              </div>

              <div className="asmr-form-card">
                <div className="asmr-form-card-head">
                  <div className="asmr-form-name">
                    <div className="asmr-form-icon">06</div>
                    Call History
                  </div>
                  <div className="asmr-form-percent">97%</div>
                </div>
                <div className="asmr-form-progress">
                  <span style={{ width: "97%" }}></span>
                </div>
                <div className="asmr-form-meta">
                  <span>7,212 opened</span>
                  <span>7,004 completed</span>
                </div>
              </div>
            </div>
          </section>

          {/* FUNNEL + TIME */}
          <section className="asmr-row">
            <div className="asmr-card">
              <div className="asmr-card-header">
                <div>
                  <div className="asmr-card-title">Multi-Form Completion Funnel</div>
                  <div className="asmr-card-subtitle">
                    Customer interaction progress through the agent forms
                  </div>
                </div>
              </div>

              <div className="asmr-funnel">
                <div className="asmr-funnel-row">
                  <div className="asmr-funnel-label">Call Connected</div>
                  <div className="asmr-funnel-track">
                    <div className="asmr-funnel-fill" style={{ width: "100%" }}>
                      8,426
                    </div>
                  </div>
                  <div className="asmr-funnel-value">100%</div>
                </div>

                <div className="asmr-funnel-row">
                  <div className="asmr-funnel-label">Customer Details</div>
                  <div className="asmr-funnel-track">
                    <div className="asmr-funnel-fill" style={{ width: "96%" }}>
                      8,048
                    </div>
                  </div>
                  <div className="asmr-funnel-value">95.5%</div>
                </div>

                <div className="asmr-funnel-row">
                  <div className="asmr-funnel-label">Qualification</div>
                  <div className="asmr-funnel-track">
                    <div className="asmr-funnel-fill" style={{ width: "84%" }}>
                      7,036
                    </div>
                  </div>
                  <div className="asmr-funnel-value">83.5%</div>
                </div>

                <div className="asmr-funnel-row">
                  <div className="asmr-funnel-label">Requirement</div>
                  <div className="asmr-funnel-track">
                    <div className="asmr-funnel-fill" style={{ width: "75%" }}>
                      6,318
                    </div>
                  </div>
                  <div className="asmr-funnel-value">75.0%</div>
                </div>

                <div className="asmr-funnel-row">
                  <div className="asmr-funnel-label">Final Submission</div>
                  <div className="asmr-funnel-track">
                    <div className="asmr-funnel-fill" style={{ width: "68%" }}>
                      5,734
                    </div>
                  </div>
                  <div className="asmr-funnel-value">68.1%</div>
                </div>
              </div>
            </div>

            <div className="asmr-card">
              <div className="asmr-card-header">
                <div>
                  <div className="asmr-card-title">Average Time by Form</div>
                  <div className="asmr-card-subtitle">
                    Average agent time spent completing each form
                  </div>
                </div>
              </div>

              <div className="asmr-time-list">
                <div className="asmr-time-row">
                  <div className="asmr-time-label">Customer Details</div>
                  <div className="asmr-time-track">
                    <div className="asmr-time-fill" style={{ width: "42%" }}></div>
                  </div>
                  <div className="asmr-time-value">01:18</div>
                </div>

                <div className="asmr-time-row">
                  <div className="asmr-time-label">Qualification</div>
                  <div className="asmr-time-track">
                    <div className="asmr-time-fill" style={{ width: "74%" }}></div>
                  </div>
                  <div className="asmr-time-value">02:41</div>
                </div>

                <div className="asmr-time-row">
                  <div className="asmr-time-label">Requirement</div>
                  <div className="asmr-time-track">
                    <div className="asmr-time-fill" style={{ width: "64%" }}></div>
                  </div>
                  <div className="asmr-time-value">02:18</div>
                </div>

                <div className="asmr-time-row">
                  <div className="asmr-time-label">Call Script</div>
                  <div className="asmr-time-track">
                    <div className="asmr-time-fill" style={{ width: "29%" }}></div>
                  </div>
                  <div className="asmr-time-value">00:52</div>
                </div>

                <div className="asmr-time-row">
                  <div className="asmr-time-label">Notes</div>
                  <div className="asmr-time-track">
                    <div className="asmr-time-fill" style={{ width: "48%" }}></div>
                  </div>
                  <div className="asmr-time-value">01:42</div>
                </div>
              </div>
            </div>
          </section>

          {/* AGENT PERFORMANCE */}
          <section className="asmr-card asmr-table-card">
            <div className="asmr-card-header">
              <div>
                <div className="asmr-card-title">Agent Multi-Form Performance</div>
                <div className="asmr-card-subtitle">Agent-level form completion and productivity</div>
              </div>
              <button className="asmr-card-action">Export Agents</button>
            </div>

            <div className="asmr-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Calls</th>
                    <th>Forms Completed</th>
                    <th>Completion Rate</th>
                    <th>Avg Forms / Call</th>
                    <th>Avg Form Time</th>
                    <th>Auto Save</th>
                    <th>Follow-ups</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {liveAgents.map((ag: any, idx: number) => (
                    <tr key={idx}>
                      <td>
                        <div className="asmr-agent">
                          <div className="asmr-agent-mini">{ag.initials}</div>
                          <span className="asmr-agent-name">{ag.name}</span>
                        </div>
                      </td>
                      <td>{ag.calls}</td>
                      <td>{ag.forms_completed}</td>
                      <td>
                        <span className="asmr-progress-small">
                          <span style={{ width: ag.rate }}></span>
                        </span>
                        {ag.rate}
                      </td>
                      <td>{ag.avg_forms}</td>
                      <td>{ag.avg_time}</td>
                      <td>{ag.auto_save}</td>
                      <td>{ag.follow_ups}</td>
                      <td><span className="asmr-badge green">{ag.status}</span></td>
                    </tr>
                  ))}
                  {liveAgents.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "20px", color: "#8a93a3" }}>
                        No agent multi-form records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ACTIVITY + INSIGHTS */}
          <section className="asmr-bottom-grid">
            <div className="asmr-card">
              <div className="asmr-card-header">
                <div>
                  <div className="asmr-card-title">Recent Multi-Form Activity</div>
                  <div className="asmr-card-subtitle">Latest agent form events</div>
                </div>
              </div>

              <div className="asmr-activity">
                {liveActivity.map((act: any, idx: number) => (
                  <div key={idx} className="asmr-activity-row">
                    <div className="asmr-activity-icon">{act.icon}</div>
                    <div className="asmr-activity-text">
                      <strong>{act.title}</strong>
                      <span>{act.detail}</span>
                    </div>
                    <div className="asmr-activity-time">{act.time}</div>
                  </div>
                ))}
                {liveActivity.length === 0 && (
                  <div style={{ textAlign: "center", padding: "16px", color: "#8a93a3", fontSize: "12px" }}>
                    No recent multi-form activity
                  </div>
                )}
              </div>
            </div>

            <div className="asmr-card">
              <div className="asmr-card-header">
                <div>
                  <div className="asmr-card-title">Multi-Form Report Insights</div>
                  <div className="asmr-card-subtitle">Automated performance observations</div>
                </div>
              </div>

              <div className="asmr-activity">
                <div className="asmr-activity-row">
                  <div className="asmr-activity-icon">↑</div>
                  <div className="asmr-activity-text">
                    <strong>Qualification completion improved</strong>
                    <span>Completion increased by 6.8% compared with previous period.</span>
                  </div>
                  <div className="asmr-activity-time">+6.8%</div>
                </div>

                <div className="asmr-activity-row">
                  <div className="asmr-activity-icon">◷</div>
                  <div className="asmr-activity-text">
                    <strong>Requirement takes the longest</strong>
                    <span>Average completion time is currently 02:18.</span>
                  </div>
                  <div className="asmr-activity-time">02:18</div>
                </div>

                <div className="asmr-activity-row">
                  <div className="asmr-activity-icon">!</div>
                  <div className="asmr-activity-text">
                    <strong>Notes completion needs attention</strong>
                    <span>Notes completion is currently below the overall average.</span>
                  </div>
                  <div className="asmr-activity-time">89%</div>
                </div>

                <div className="asmr-activity-row">
                  <div className="asmr-activity-icon">✓</div>
                  <div className="asmr-activity-text">
                    <strong>Auto-save reliability is strong</strong>
                    <span>Multi-form data is being successfully saved in most interactions.</span>
                  </div>
                  <div className="asmr-activity-time">99.2%</div>
                </div>
              </div>
            </div>
          </section>

          {/* DETAILED INTERACTION REPORT */}
          <section className="asmr-card asmr-detail-table">
            <div className="asmr-card-header">
              <div>
                <div className="asmr-card-title">Multi-Form Interaction Details</div>
                <div className="asmr-card-subtitle">
                  Detailed form activity for individual customer interactions
                </div>
              </div>
              <button className="asmr-card-action" onClick={exportCSV}>
                Export Details
              </button>
            </div>

            <div className="asmr-table-wrap">
              <table id="detailTable">
                <thead>
                  <tr>
                    <th>Call ID</th>
                    <th>Customer</th>
                    <th>Agent</th>
                    <th>Forms Used</th>
                    <th>Completed</th>
                    <th>Avg Form Time</th>
                    <th>Auto Save</th>
                    <th>Follow-up</th>
                    <th>Last Form</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {liveCalls.map((c: any, idx: number) => (
                    <tr key={c.id || idx}>
                      <td className="asmr-call-id">{c.call_id || c.id}</td>
                      <td>
                        <div className="asmr-customer">
                          <div className="asmr-customer-avatar">{c.customer_initials || "CU"}</div>
                          {c.customer}
                        </div>
                      </td>
                      <td>{c.agent}</td>
                      <td>{c.forms_used}</td>
                      <td>{c.completed}</td>
                      <td>{c.avg_time}</td>
                      <td>{c.auto_save}</td>
                      <td>{c.follow_up}</td>
                      <td>{c.last_form}</td>
                      <td>
                        <div className="asmr-form-status">
                          <span className="asmr-form-status-dot"></span>
                          {c.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {liveCalls.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "24px", color: "#8a93a3" }}>
                        No call multi-form records available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* FOOTER */}
          <div className="asmr-footer">
            <div>
              Showing 1–{liveCalls.length} of {liveCalls.length} multi-form interactions &nbsp; • &nbsp; Report generated today
            </div>

            <div className="asmr-pagination">
              <button className="asmr-page">‹</button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  className={`asmr-page ${activePage === page ? "active" : ""}`}
                  onClick={() => setActivePage(page)}
                >
                  {page}
                </button>
              ))}
              <button className="asmr-page">›</button>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
