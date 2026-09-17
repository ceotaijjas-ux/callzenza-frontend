"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function OutboundCallingReport() {
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-07");
  const [liveData, setLiveData] = useState<any[]>([]);
  const [agentRows, setAgentRows] = useState<any[]>([]);
  const [campaignRows, setCampaignRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveReportData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("outbound-calling", {
        from_date: fromDate,
        to_date: toDate,
      });
      if (res && res.success) {
        setLiveData(res.data || []);
        setAgentRows(res.agent_performance || []);
        setCampaignRows(res.campaign_performance || []);
        setKpis(res.kpis || null);
      }
    } catch (err) {
      console.error("Failed loading report for outbound-calling:", err);
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

  const [selectedAgentRow, setSelectedAgentRow] = useState<number | null>(null);
  const [selectedCampaignRow, setSelectedCampaignRow] = useState<number | null>(null);

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

  const exportCSV = () => {
    const headers = ["Campaign", "Attempts", "Connected", "Connect Rate", "Talk Time", "Callbacks", "Conversions", "Status"];
    const rows = campaignRows.map((c) => [c.name, c.att, c.conn, c.rate, c.talk, c.cb, c.conv, c.status]);

    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Outbound_Calling_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalCallsPlaced = parseInt(String(kpis?.calls_attempted || liveData.length || 0), 10) || 0;
  const totalConnectedCalls = parseInt(String(kpis?.calls_connected || liveData.length || 0), 10) || 0;
  const answeredCount = parseInt(String(kpis?.human_answered || totalConnectedCalls || 0), 10) || 0;
  const ringingCount = Math.round(totalCallsPlaced * 0.74);
  const conversationCount = Math.round(totalConnectedCalls * 0.65);

  return (
    <AppShell>
      <style jsx global>{`
        .ocr-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Arial, sans-serif;
          background: #f5f7fb;
          color: #172033;
          border-radius: 12px;
        }

        /* PAGE */

        .ocr-container {
          max-width: 1550px;
          margin: auto;
          padding: 10px 10px 45px;
          transition: opacity 0.3s ease;
        }

        .ocr-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 19px;
        }

        .ocr-title-row h1 {
          font-size: 23px;
          font-weight: 800;
        }

        .ocr-title-row p {
          color: #8a94a5;
          font-size: 11px;
          margin-top: 5px;
        }

        .ocr-live-status {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #e9f8f1;
          border: 1px solid #caeddf;
          color: #168263;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .ocr-live-dot {
          width: 7px;
          height: 7px;
          background: #1aa77e;
          border-radius: 50%;
        }

        .ocr-header-actions {
          display: flex;
          gap: 8px;
        }

        .ocr-header-btn {
          height: 34px;
          border: 1px solid #dfe3ea;
          background: #fff;
          color: #374151;
          border-radius: 7px;
          padding: 0 13px;
          font-size: 10px;
          font-weight: 650;
          cursor: pointer;
        }

        .ocr-header-btn:hover {
          background: #f8f9fc;
        }

        .ocr-header-btn.primary {
          background: #6259e5;
          border-color: #6259e5;
          color: #fff;
        }

        /* FILTERS */

        .ocr-filters {
          background: #fff;
          border: 1px solid #e3e7ed;
          border-radius: 12px;
          padding: 15px;
          display: grid;
          grid-template-columns: 1.1fr 1.1fr 1fr 1fr 1fr 1fr auto;
          gap: 10px;
          margin-bottom: 18px;
        }

        .ocr-field label {
          display: block;
          color: #8993a4;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 5px;
        }

        .ocr-field input,
        .ocr-field select {
          width: 100%;
          height: 35px;
          border: 1px solid #dfe3e9;
          border-radius: 7px;
          padding: 0 9px;
          color: #3e485a;
          background: #fff;
          outline: none;
          font-size: 10px;
        }

        .ocr-apply-wrap {
          display: flex;
          align-items: flex-end;
        }

        .ocr-apply-btn {
          height: 35px;
          border: 0;
          border-radius: 7px;
          background: #6259e5;
          color: #fff;
          padding: 0 17px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .ocr-apply-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* KPI CARDS */

        .ocr-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .ocr-kpi {
          background: #fff;
          border: 1px solid #e3e7ed;
          border-radius: 12px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .ocr-kpi:after {
          content: "";
          width: 70px;
          height: 70px;
          border-radius: 50%;
          position: absolute;
          right: -34px;
          top: -34px;
          background: #f0efff;
        }

        .ocr-kpi-label {
          color: #8d96a7;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ocr-kpi-value {
          margin-top: 10px;
          font-size: 24px;
          font-weight: 850;
        }

        .ocr-kpi-info {
          margin-top: 5px;
          color: #919aaa;
          font-size: 9px;
        }

        .ocr-green {
          color: #16916d !important;
        }
        .ocr-red {
          color: #d05252 !important;
        }
        .ocr-orange {
          color: #d18c2b !important;
        }
        .ocr-blue {
          color: #4384dc !important;
        }
        .ocr-purple {
          color: #6259df !important;
        }

        /* GRID */

        .ocr-grid {
          display: grid;
          grid-template-columns: 1.55fr 0.95fr;
          gap: 17px;
          margin-bottom: 17px;
        }

        .ocr-card {
          background: #fff;
          border: 1px solid #e2e6ed;
          border-radius: 13px;
          padding: 18px;
        }

        .ocr-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .ocr-card-head h2 {
          font-size: 14px;
          font-weight: 800;
        }

        .ocr-card-head p {
          color: #929bab;
          font-size: 9px;
          margin-top: 4px;
        }

        .ocr-card-select {
          height: 29px;
          border: 1px solid #dfe3e9;
          background: #fff;
          border-radius: 6px;
          color: #667082;
          font-size: 9px;
          padding: 0 7px;
          cursor: pointer;
        }

        /* CALL TREND */

        .ocr-trend {
          height: 270px;
        }

        .ocr-trend svg {
          width: 100%;
          height: 100%;
        }

        .ocr-gridline {
          stroke: #edf0f4;
          stroke-width: 1;
        }

        .ocr-axis {
          fill: #9aa2b0;
          font-size: 9px;
        }

        .ocr-attempt-line {
          fill: none;
          stroke: #6259e5;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .ocr-connected-line {
          fill: none;
          stroke: #1aa77e;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .ocr-attempt-dot {
          fill: #fff;
          stroke: #6259e5;
          stroke-width: 2;
        }

        .ocr-connected-dot {
          fill: #fff;
          stroke: #1aa77e;
          stroke-width: 2;
        }

        .ocr-chart-legend {
          display: flex;
          gap: 17px;
          font-size: 9px;
          color: #858e9d;
          margin-top: 3px;
        }

        .ocr-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ocr-legend-line {
          width: 19px;
          height: 3px;
          border-radius: 3px;
        }

        /* CONNECTION FUNNEL */

        .ocr-funnel {
          height: 270px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
        }

        .ocr-funnel-row {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .ocr-funnel-label {
          width: 90px;
          font-size: 9px;
          color: #697386;
        }

        .ocr-funnel-track {
          flex: 1;
          height: 25px;
          background: #eef0f4;
          border-radius: 5px;
          overflow: hidden;
        }

        .ocr-funnel-fill {
          height: 100%;
          border-radius: 5px;
          display: flex;
          align-items: center;
          padding-left: 9px;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
        }

        .ocr-funnel-number {
          width: 45px;
          text-align: right;
          font-size: 9px;
          font-weight: 800;
        }

        /* DIALER SUMMARY */

        .ocr-dialer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .ocr-dialer {
          border: 1px solid #e5e8ee;
          border-radius: 10px;
          padding: 14px;
        }

        .ocr-dialer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ocr-dialer-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #efeeff;
          color: #6259e5;
          font-size: 14px;
        }

        .ocr-dialer-rate {
          font-size: 9px;
          font-weight: 700;
          color: #18916d;
        }

        .ocr-dialer h3 {
          font-size: 12px;
          margin-top: 11px;
          font-weight: 750;
        }

        .ocr-dialer-number {
          font-size: 21px;
          font-weight: 800;
          margin-top: 5px;
        }

        .ocr-dialer small {
          color: #929baa;
          font-size: 8px;
        }

        /* HOURLY PERFORMANCE */

        .ocr-hour-chart {
          height: 240px;
        }

        .ocr-hour-chart svg {
          width: 100%;
          height: 100%;
        }

        .ocr-bar {
          fill: #6259e5;
        }

        .ocr-bar:hover {
          opacity: 0.8;
        }

        .ocr-hour-label {
          fill: #9098a8;
          font-size: 8px;
        }

        /* DISPOSITION */

        .ocr-disposition-layout {
          display: grid;
          grid-template-columns: 190px 1fr;
          align-items: center;
          gap: 15px;
        }

        .ocr-donut {
          width: 170px;
          height: 170px;
          border-radius: 50%;
          background: conic-gradient(
            #6259e5 0deg 118deg,
            #19a77c 118deg 210deg,
            #e29a32 210deg 270deg,
            #db5a5a 270deg 322deg,
            #8a94a7 322deg 360deg
          );
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .ocr-donut-inner {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .ocr-donut-inner strong {
          font-size: 24px;
        }

        .ocr-donut-inner span {
          font-size: 8px;
          color: #929baa;
          margin-top: 3px;
        }

        .ocr-disposition-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .ocr-disposition-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
        }

        .ocr-disposition-name {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .ocr-color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .ocr-disposition-count {
          font-weight: 800;
        }

        /* AGENT LEADERBOARD */

        .ocr-agent-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ocr-agent-table th {
          background: #fafbfc;
          color: #8992a2;
          text-transform: uppercase;
          font-size: 8px;
          letter-spacing: 0.5px;
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e7eaf0;
        }

        .ocr-agent-table td {
          padding: 11px 10px;
          border-bottom: 1px solid #edf0f4;
          font-size: 10px;
          cursor: pointer;
        }

        .ocr-agent-table tr.selected-row td {
          background: #f5f3ff;
        }

        .ocr-agent-table tr:hover td {
          background: #fafbff;
        }

        .ocr-agent {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ocr-avatar {
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: #eeecff;
          color: #6259e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
        }

        .ocr-agent strong {
          font-size: 10px;
        }

        .ocr-agent small {
          display: block;
          color: #929aaa;
          font-size: 8px;
          margin-top: 2px;
        }

        .ocr-rate {
          font-weight: 800;
        }

        .ocr-progress {
          width: 75px;
          height: 6px;
          border-radius: 5px;
          background: #edf0f4;
          overflow: hidden;
        }

        .ocr-progress-fill {
          height: 100%;
          border-radius: 5px;
          background: #6259e5;
        }

        /* CAMPAIGN TABLE */

        .ocr-table-wrap {
          overflow-x: auto;
        }

        .ocr-campaign-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ocr-campaign-table th {
          text-align: left;
          background: #fafbfc;
          color: #8992a2;
          text-transform: uppercase;
          font-size: 8px;
          letter-spacing: 0.5px;
          padding: 11px;
          border-bottom: 1px solid #e7eaf0;
        }

        .ocr-campaign-table td {
          padding: 12px 11px;
          border-bottom: 1px solid #edf0f4;
          font-size: 10px;
          cursor: pointer;
        }

        .ocr-campaign-table tr.selected-row td {
          background: #f5f3ff;
        }

        .ocr-campaign-table tr:hover td {
          background: #fafbff;
        }

        .ocr-campaign-name {
          font-weight: 800;
        }

        .ocr-status {
          display: inline-flex;
          border-radius: 20px;
          padding: 4px 8px;
          font-size: 8px;
          font-weight: 800;
        }

        .ocr-status.active {
          color: #168361;
          background: #e8f8f1;
        }

        .ocr-status.warning {
          color: #ad731e;
          background: #fff2db;
        }

        .ocr-status.paused {
          color: #b64e4e;
          background: #fdeaea;
        }

        /* PERFORMANCE CARDS */

        .ocr-performance-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .ocr-performance {
          border: 1px solid #e4e8ee;
          border-radius: 9px;
          padding: 14px;
        }

        .ocr-performance-title {
          color: #8b94a4;
          font-size: 8px;
          text-transform: uppercase;
          font-weight: 800;
        }

        .ocr-performance-value {
          font-size: 21px;
          font-weight: 800;
          margin-top: 7px;
        }

        .ocr-performance-note {
          font-size: 8px;
          color: #929baa;
          margin-top: 4px;
        }

        /* INSIGHTS */

        .ocr-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 11px;
        }

        .ocr-insight {
          border: 1px solid #e4e8ee;
          background: #fafbfc;
          border-radius: 9px;
          padding: 14px;
        }

        .ocr-insight-head {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
        }

        .ocr-insight-icon {
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: #eeecff;
          color: #6259e5;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .ocr-insight p {
          color: #808a9a;
          font-size: 9px;
          line-height: 1.55;
          margin-top: 8px;
        }

        /* FOOTER */

        .ocr-footer {
          text-align: right;
          color: #a0a7b4;
          font-size: 8px;
          margin-top: 20px;
        }

        /* RESPONSIVE */

        @media (max-width: 1250px) {
          .ocr-filters {
            grid-template-columns: repeat(4, 1fr);
          }

          .ocr-kpis {
            grid-template-columns: repeat(3, 1fr);
          }

          .ocr-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 850px) {
          .ocr-container {
            padding: 16px;
          }

          .ocr-filters {
            grid-template-columns: repeat(2, 1fr);
          }

          .ocr-kpis {
            grid-template-columns: repeat(2, 1fr);
          }

          .ocr-performance-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .ocr-insights {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 550px) {
          .ocr-filters,
          .ocr-kpis,
          .ocr-dialer-grid,
          .ocr-performance-grid {
            grid-template-columns: 1fr;
          }

          .ocr-title-row {
            display: block;
          }

          .ocr-live-status {
            display: inline-flex;
            margin-top: 10px;
          }

          .ocr-disposition-layout {
            grid-template-columns: 1fr;
            justify-items: center;
          }
        }

        @media print {
          .ocr-filters,
          .ocr-header-actions {
            display: none !important;
          }

          .ocr-container {
            max-width: none;
            padding: 12px;
          }

          .ocr-card,
          .ocr-kpi {
            break-inside: avoid;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="ocr-root">
        <main className="ocr-container" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* TITLE */}
          <div className="ocr-title-row">
            <div>
              <h1>Outbound Calling Report</h1>
              <p>Outbound activity, connection performance, agent productivity and campaign outcomes</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="ocr-live-status">
                <span className="ocr-live-dot"></span>
                Reporting Data Updated
              </div>

              <div className="ocr-header-actions">
                <button className="ocr-header-btn" onClick={refreshReport}>
                  {refreshBtnText}
                </button>
                <button className="ocr-header-btn" onClick={() => window.print()}>
                  ▣ Print
                </button>
                <button className="ocr-header-btn primary" onClick={exportCSV}>
                  ↓ Export
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <section className="ocr-filters">
            <div className="ocr-field">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="ocr-field">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="ocr-field">
              <label>Campaign</label>
              <select defaultValue="All Campaigns">
                <option>All Campaigns</option>
                <option>Sales Campaign</option>
                <option>Renewal Campaign</option>
                <option>Follow-up Campaign</option>
                <option>Customer Winback</option>
              </select>
            </div>

            <div className="ocr-field">
              <label>Team</label>
              <select defaultValue="All Teams">
                <option>All Teams</option>
                <option>Sales Team</option>
                <option>Support Team</option>
                <option>Retention Team</option>
              </select>
            </div>

            <div className="ocr-field">
              <label>Dialer Type</label>
              <select defaultValue="All Dialers">
                <option>All Dialers</option>
                <option>Predictive</option>
                <option>Progressive</option>
                <option>Preview</option>
                <option>Manual</option>
              </select>
            </div>

            <div className="ocr-field">
              <label>Disposition</label>
              <select defaultValue="All Dispositions">
                <option>All Dispositions</option>
                <option>Interested</option>
                <option>Callback</option>
                <option>Not Interested</option>
                <option>Sale</option>
                <option>No Answer</option>
              </select>
            </div>

            <div className="ocr-apply-wrap">
              <button className="ocr-apply-btn" onClick={applyFilters} disabled={isApplyDisabled}>
                {applyBtnText}
              </button>
            </div>
          </section>

          {/* KPIS */}
          <section className="ocr-kpis">
            <div className="ocr-kpi">
              <div className="ocr-kpi-label">Calls Attempted</div>
              <div className="ocr-kpi-value">{kpis?.calls_attempted || (loading ? "..." : String(liveData.length || "0"))}</div>
              <div className="ocr-kpi-info">
                <span className="ocr-purple">Live</span> Database records
              </div>
            </div>

            <div className="ocr-kpi">
              <div className="ocr-kpi-label">Calls Connected</div>
              <div className="ocr-kpi-value">{kpis?.calls_connected || (loading ? "..." : String(liveData.length || "0"))}</div>
              <div className="ocr-kpi-info">
                <span className="ocr-green">{kpis?.connect_rate || "100%"}</span> connect rate
              </div>
            </div>

            <div className="ocr-kpi">
              <div className="ocr-kpi-label">Human Answered</div>
              <div className="ocr-kpi-value">{kpis?.human_answered || (loading ? "..." : String(liveData.length || "0"))}</div>
              <div className="ocr-kpi-info">
                <span className="ocr-blue">Answered</span> live calls
              </div>
            </div>

            <div className="ocr-kpi">
              <div className="ocr-kpi-label">Not Connected</div>
              <div className="ocr-kpi-value">{kpis?.not_connected || "0"}</div>
              <div className="ocr-kpi-info">
                <span className="ocr-red">Unanswered</span> calls
              </div>
            </div>

            <div className="ocr-kpi">
              <div className="ocr-kpi-label">Avg Talk Time</div>
              <div className="ocr-kpi-value">{kpis?.avg_talk_time || "00:00"}</div>
              <div className="ocr-kpi-info">
                <span className="ocr-green">Calculated</span> duration
              </div>
            </div>

            <div className="ocr-kpi">
              <div className="ocr-kpi-label">Avg Handle Time</div>
              <div className="ocr-kpi-value">{kpis?.avg_handle_time || "00:00"}</div>
              <div className="ocr-kpi-info">
                <span className="ocr-orange">AHT</span> overall
              </div>
            </div>
          </section>

          {/* TREND + FUNNEL */}
          <section className="ocr-grid">
            <div className="ocr-card">
              <div className="ocr-card-head">
                <div>
                  <h2>Outbound Calling Trend</h2>
                  <p>Daily attempts and connected calls</p>
                </div>

                <select className="ocr-card-select" defaultValue="Last 7 Days">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>

              <div className="ocr-trend">
                <svg viewBox="0 0 820 270" preserveAspectRatio="none">
                  <line x1="45" y1="25" x2="795" y2="25" className="ocr-gridline" />
                  <line x1="45" y1="75" x2="795" y2="75" className="ocr-gridline" />
                  <line x1="45" y1="125" x2="795" y2="125" className="ocr-gridline" />
                  <line x1="45" y1="175" x2="795" y2="175" className="ocr-gridline" />
                  <line x1="45" y1="225" x2="795" y2="225" className="ocr-gridline" />

                  <text x="8" y="28" className="ocr-axis">8K</text>
                  <text x="8" y="78" className="ocr-axis">6K</text>
                  <text x="8" y="128" className="ocr-axis">4K</text>
                  <text x="8" y="178" className="ocr-axis">2K</text>
                  <text x="20" y="228" className="ocr-axis">0</text>

                  {/* Attempts */}
                  <path
                    className="ocr-attempt-line"
                    d="M45 151 L160 125 L275 139 L390 99 L505 111 L620 72 L735 88 L795 59"
                  />

                  {/* Connected */}
                  <path
                    className="ocr-connected-line"
                    d="M45 194 L160 181 L275 186 L390 164 L505 171 L620 151 L735 159 L795 145"
                  />

                  <circle cx="45" cy="151" r="4" className="ocr-attempt-dot" />
                  <circle cx="160" cy="125" r="4" className="ocr-attempt-dot" />
                  <circle cx="275" cy="139" r="4" className="ocr-attempt-dot" />
                  <circle cx="390" cy="99" r="4" className="ocr-attempt-dot" />
                  <circle cx="505" cy="111" r="4" className="ocr-attempt-dot" />
                  <circle cx="620" cy="72" r="4" className="ocr-attempt-dot" />
                  <circle cx="735" cy="88" r="4" className="ocr-attempt-dot" />
                  <circle cx="795" cy="59" r="4" className="ocr-attempt-dot" />

                  <circle cx="45" cy="194" r="4" className="ocr-connected-dot" />
                  <circle cx="160" cy="181" r="4" className="ocr-connected-dot" />
                  <circle cx="275" cy="186" r="4" className="ocr-connected-dot" />
                  <circle cx="390" cy="164" r="4" className="ocr-connected-dot" />
                  <circle cx="505" cy="171" r="4" className="ocr-connected-dot" />
                  <circle cx="620" cy="151" r="4" className="ocr-connected-dot" />
                  <circle cx="735" cy="159" r="4" className="ocr-connected-dot" />
                  <circle cx="795" cy="145" r="4" className="ocr-connected-dot" />

                  <text x="38" y="247" className="ocr-axis">Sep 1</text>
                  <text x="153" y="247" className="ocr-axis">Sep 2</text>
                  <text x="268" y="247" className="ocr-axis">Sep 3</text>
                  <text x="383" y="247" className="ocr-axis">Sep 4</text>
                  <text x="498" y="247" className="ocr-axis">Sep 5</text>
                  <text x="613" y="247" className="ocr-axis">Sep 6</text>
                  <text x="735" y="247" className="ocr-axis">Sep 7</text>
                </svg>
              </div>

              <div className="ocr-chart-legend">
                <div className="ocr-legend-item">
                  <span className="ocr-legend-line" style={{ background: "#6259e5" }}></span>
                  Attempts
                </div>

                <div className="ocr-legend-item">
                  <span className="ocr-legend-line" style={{ background: "#19a77c" }}></span>
                  Connected
                </div>
              </div>
            </div>

            {/* FUNNEL */}
            <div className="ocr-card">
              <div className="ocr-card-head">
                <div>
                  <h2>Outbound Connection Funnel</h2>
                  <p>Call progression from dial to conversation</p>
                </div>
              </div>

              <div className="ocr-funnel">
                <div className="ocr-funnel-row">
                  <div className="ocr-funnel-label">Attempted</div>
                  <div className="ocr-funnel-track">
                    <div className="ocr-funnel-fill" style={{ width: "100%", background: "#6259e5" }}>
                      {totalCallsPlaced.toLocaleString()}
                    </div>
                  </div>
                  <div className="ocr-funnel-number">100%</div>
                </div>

                <div className="ocr-funnel-row">
                  <div className="ocr-funnel-label">Ringing</div>
                  <div className="ocr-funnel-track">
                    <div className="ocr-funnel-fill" style={{ width: totalCallsPlaced > 0 ? "74%" : "0%", background: "#746bea" }}>
                      {ringingCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="ocr-funnel-number">{totalCallsPlaced > 0 ? "74%" : "0%"}</div>
                </div>

                <div className="ocr-funnel-row">
                  <div className="ocr-funnel-label">Answered</div>
                  <div className="ocr-funnel-track">
                    <div className="ocr-funnel-fill" style={{ width: totalCallsPlaced > 0 ? "38%" : "0%", background: "#4387df" }}>
                      {answeredCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="ocr-funnel-number">{totalCallsPlaced > 0 ? "37.9%" : "0%"}</div>
                </div>

                <div className="ocr-funnel-row">
                  <div className="ocr-funnel-label">Connected</div>
                  <div className="ocr-funnel-track">
                    <div className="ocr-funnel-fill" style={{ width: `${totalCallsPlaced > 0 ? ((totalConnectedCalls / totalCallsPlaced) * 100).toFixed(1) : 0}%`, background: "#19a77c" }}>
                      {totalConnectedCalls.toLocaleString()}
                    </div>
                  </div>
                  <div className="ocr-funnel-number">{totalCallsPlaced > 0 ? `${((totalConnectedCalls / totalCallsPlaced) * 100).toFixed(1)}%` : "0%"}</div>
                </div>

                <div className="ocr-funnel-row">
                  <div className="ocr-funnel-label">Conversation</div>
                  <div className="ocr-funnel-track">
                    <div className="ocr-funnel-fill" style={{ width: totalCallsPlaced > 0 ? "25%" : "0%", background: "#2aa98a" }}>
                      {conversationCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="ocr-funnel-number">{totalCallsPlaced > 0 ? "25.0%" : "0%"}</div>
                </div>
              </div>
            </div>
          </section>

          {/* DIALER TYPES */}
          <section className="ocr-card" style={{ marginBottom: "17px" }}>
            <div className="ocr-card-head">
              <div>
                <h2>Dialer Performance</h2>
                <p>Outbound calls grouped by dialing method</p>
              </div>
            </div>

            <div className="ocr-dialer-grid">
              <div className="ocr-dialer">
                <div className="ocr-dialer-top">
                  <div className="ocr-dialer-icon">⚡</div>
                  <div className="ocr-dialer-rate">{totalCallsPlaced > 0 ? "41.8%" : "0%"} Connect</div>
                </div>
                <h3>Predictive Dialer</h3>
                <div className="ocr-dialer-number">{Math.round(totalCallsPlaced * 0.48).toLocaleString()}</div>
                <small>{Math.round(totalConnectedCalls * 0.52).toLocaleString()} connected calls</small>
              </div>

              <div className="ocr-dialer">
                <div className="ocr-dialer-top">
                  <div className="ocr-dialer-icon">▶</div>
                  <div className="ocr-dialer-rate">{totalCallsPlaced > 0 ? "36.4%" : "0%"} Connect</div>
                </div>
                <h3>Progressive Dialer</h3>
                <div className="ocr-dialer-number">{Math.round(totalCallsPlaced * 0.31).toLocaleString()}</div>
                <small>{Math.round(totalConnectedCalls * 0.3).toLocaleString()} connected calls</small>
              </div>

              <div className="ocr-dialer">
                <div className="ocr-dialer-top">
                  <div className="ocr-dialer-icon">◷</div>
                  <div className="ocr-dialer-rate">{totalCallsPlaced > 0 ? "29.2%" : "0%"} Connect</div>
                </div>
                <h3>Preview / Manual</h3>
                <div className="ocr-dialer-number">{Math.max(0, totalCallsPlaced - Math.round(totalCallsPlaced * 0.48) - Math.round(totalCallsPlaced * 0.31)).toLocaleString()}</div>
                <small>{Math.max(0, totalConnectedCalls - Math.round(totalConnectedCalls * 0.52) - Math.round(totalConnectedCalls * 0.3)).toLocaleString()} connected calls</small>
              </div>
            </div>
          </section>

          {/* HOURLY + DISPOSITION */}
          <section className="ocr-grid">
            <div className="ocr-card">
              <div className="ocr-card-head">
                <div>
                  <h2>Connection Rate by Time</h2>
                  <p>Identify the strongest calling windows</p>
                </div>
              </div>

              <div className="ocr-hour-chart">
                <svg viewBox="0 0 760 240" preserveAspectRatio="none">
                  <line x1="35" y1="25" x2="735" y2="25" className="ocr-gridline" />
                  <line x1="35" y1="70" x2="735" y2="70" className="ocr-gridline" />
                  <line x1="35" y1="115" x2="735" y2="115" className="ocr-gridline" />
                  <line x1="35" y1="160" x2="735" y2="160" className="ocr-gridline" />

                  <text x="6" y="28" className="ocr-axis">50%</text>
                  <text x="6" y="73" className="ocr-axis">40%</text>
                  <text x="6" y="118" className="ocr-axis">30%</text>
                  <text x="6" y="163" className="ocr-axis">20%</text>

                  <rect x="55" y="128" width="40" height="32" rx="4" className="ocr-bar" />
                  <rect x="125" y="112" width="40" height="48" rx="4" className="ocr-bar" />
                  <rect x="195" y="89" width="40" height="71" rx="4" className="ocr-bar" />
                  <rect x="265" y="72" width="40" height="88" rx="4" className="ocr-bar" />
                  <rect x="335" y="54" width="40" height="106" rx="4" className="ocr-bar" />
                  <rect x="405" y="65" width="40" height="95" rx="4" className="ocr-bar" />
                  <rect x="475" y="81" width="40" height="79" rx="4" className="ocr-bar" />
                  <rect x="545" y="102" width="40" height="58" rx="4" className="ocr-bar" />
                  <rect x="615" y="121" width="40" height="39" rx="4" className="ocr-bar" />
                  <rect x="685" y="138" width="40" height="22" rx="4" className="ocr-bar" />

                  <text x="57" y="181" className="ocr-hour-label">9AM</text>
                  <text x="127" y="181" className="ocr-hour-label">10</text>
                  <text x="197" y="181" className="ocr-hour-label">11</text>
                  <text x="267" y="181" className="ocr-hour-label">12</text>
                  <text x="337" y="181" className="ocr-hour-label">1PM</text>
                  <text x="407" y="181" className="ocr-hour-label">2</text>
                  <text x="477" y="181" className="ocr-hour-label">3</text>
                  <text x="547" y="181" className="ocr-hour-label">4</text>
                  <text x="617" y="181" className="ocr-hour-label">5</text>
                  <text x="687" y="181" className="ocr-hour-label">6</text>
                </svg>
              </div>
            </div>

            <div className="ocr-card">
              <div className="ocr-card-head">
                <div>
                  <h2>Call Disposition Split</h2>
                  <p>Outcome distribution for outbound calls</p>
                </div>
              </div>

              <div className="ocr-disposition-layout">
                <div className="ocr-donut">
                  <div className="ocr-donut-inner">
                    <strong>14.6K</strong>
                    <span>Connected</span>
                  </div>
                </div>

                <div className="ocr-disposition-list">
                  {[
                    { color: "#6259e5", name: "Interested", count: "3,824" },
                    { color: "#19a77c", name: "Callback", count: "2,986" },
                    { color: "#e29a32", name: "Not Interested", count: "2,240" },
                    { color: "#db5a5a", name: "No Answer", count: "3,912" },
                    { color: "#8a94a7", name: "Other", count: "1,720" },
                  ].map((item, idx) => (
                    <div key={idx} className="ocr-disposition-item">
                      <div className="ocr-disposition-name">
                        <span className="ocr-color-dot" style={{ background: item.color }}></span>
                        {item.name}
                      </div>
                      <div className="ocr-disposition-count">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* AGENT PERFORMANCE */}
          <section className="ocr-card" style={{ marginBottom: "17px" }}>
            <div className="ocr-card-head">
              <div>
                <h2>Agent Outbound Performance</h2>
                <p>Calling productivity, connections and average handle time</p>
              </div>

              <select className="ocr-card-select" defaultValue="Top Performers">
                <option>Top Performers</option>
                <option>All Agents</option>
              </select>
            </div>

            <div className="ocr-table-wrap">
              <table className="ocr-agent-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Attempts</th>
                    <th>Connected</th>
                    <th>Connect Rate</th>
                    <th>Talk Time</th>
                    <th>AHT</th>
                    <th>Productivity</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && agentRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "18px", color: "#64748b" }}>
                        Loading live agent records...
                      </td>
                    </tr>
                  ) : agentRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "18px", color: "#64748b" }}>
                        No agent records found for this period.
                      </td>
                    </tr>
                  ) : (
                    agentRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={selectedAgentRow === idx ? "selected-row" : ""}
                        onClick={() => setSelectedAgentRow(idx)}
                      >
                        <td>
                          <div className="ocr-agent">
                            <div className="ocr-avatar">{row.initials}</div>
                            <div>
                              <strong>{row.name}</strong>
                              <small>{row.team}</small>
                            </div>
                          </div>
                        </td>
                        <td>{row.att}</td>
                        <td>{row.conn}</td>
                        <td className={`ocr-rate ${row.rateClass}`}>{row.rate}</td>
                        <td>{row.talk}</td>
                        <td>{row.aht}</td>
                        <td>
                          <div className="ocr-progress">
                            <div className="ocr-progress-fill" style={{ width: row.width }}></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* CAMPAIGN PERFORMANCE */}
          <section className="ocr-card" style={{ marginBottom: "17px" }}>
            <div className="ocr-card-head">
              <div>
                <h2>Outbound Campaign Performance</h2>
                <p>Campaign-level calling and conversion performance</p>
              </div>

              <button className="ocr-card-select" onClick={exportCSV}>
                Export CSV
              </button>
            </div>

            <div className="ocr-table-wrap">
              <table className="ocr-campaign-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Attempts</th>
                    <th>Connected</th>
                    <th>Connect Rate</th>
                    <th>Talk Time</th>
                    <th>Callbacks</th>
                    <th>Conversions</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && campaignRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "18px", color: "#64748b" }}>
                        Loading live campaign records...
                      </td>
                    </tr>
                  ) : campaignRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "18px", color: "#64748b" }}>
                        No campaign records found for this period.
                      </td>
                    </tr>
                  ) : (
                    campaignRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={selectedCampaignRow === idx ? "selected-row" : ""}
                        onClick={() => setSelectedCampaignRow(idx)}
                      >
                        <td className="ocr-campaign-name">{row.name}</td>
                        <td>{row.att}</td>
                        <td>{row.conn}</td>
                        <td className={row.rateClass}>{row.rate}</td>
                        <td>{row.talk}</td>
                        <td>{row.cb}</td>
                        <td>{row.conv}</td>
                        <td>
                          <span className={`ocr-status ${row.statusClass}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* OPERATIONAL METRICS */}
          <section className="ocr-card" style={{ marginBottom: "17px" }}>
            <div className="ocr-card-head">
              <div>
                <h2>Outbound Operational Metrics</h2>
                <p>Detailed time and productivity measurements</p>
              </div>
            </div>

            <div className="ocr-performance-grid">
              <div className="ocr-performance">
                <div className="ocr-performance-title">Avg Ring Time</div>
                <div className="ocr-performance-value">00:19</div>
                <div className="ocr-performance-note">Average customer ring duration</div>
              </div>

              <div className="ocr-performance">
                <div className="ocr-performance-title">Avg Hold Time</div>
                <div className="ocr-performance-value">00:24</div>
                <div className="ocr-performance-note">Per connected interaction</div>
              </div>

              <div className="ocr-performance">
                <div className="ocr-performance-title">Avg Wrap Time</div>
                <div className="ocr-performance-value">00:36</div>
                <div className="ocr-performance-note">Post-call processing</div>
              </div>

              <div className="ocr-performance">
                <div className="ocr-performance-title">Calls / Agent</div>
                <div className="ocr-performance-value">286</div>
                <div className="ocr-performance-note">Average attempts per agent</div>
              </div>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="ocr-card">
            <div className="ocr-card-head">
              <div>
                <h2>Outbound Calling Insights</h2>
                <p>Key observations from the selected reporting period</p>
              </div>
            </div>

            <div className="ocr-insights">
              <div className="ocr-insight">
                <div className="ocr-insight-head">
                  <div className="ocr-insight-icon">↗</div>
                  Strongest Connect Window
                </div>
                <p>
                  The strongest connection performance is concentrated around the late-morning and early-afternoon calling windows.
                </p>
              </div>

              <div className="ocr-insight">
                <div className="ocr-insight-head">
                  <div className="ocr-insight-icon">★</div>
                  Top Campaign
                </div>
                <p>
                  Customer Renewal currently produces one of the strongest connection rates and conversion volumes among the active campaigns.
                </p>
              </div>

              <div className="ocr-insight">
                <div className="ocr-insight-head">
                  <div className="ocr-insight-icon">!</div>
                  Campaign Review
                </div>
                <p>
                  Premium Outreach has a lower connection rate and should be reviewed for list quality, timing, dialing strategy or campaign configuration.
                </p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <div className="ocr-footer">
            CallZenza Reports · Outbound Calling Report · Analytics Dashboard
          </div>
        </main>
      </div>
    </AppShell>
  );
}
