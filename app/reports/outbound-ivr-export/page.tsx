"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function OutboundIVRExportReport() {
  const [selectedIVR, setSelectedIVR] = useState("All IVRs");
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [dateRange, setDateRange] = useState("2026-09-01");
  const [ivrRows, setIvrRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveReportData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("outbound-ivr-export", {
        from_date: dateRange,
        campaign_id: selectedCampaign,
      });
      if (res && res.success) {
        if (res.ivr_rows && res.ivr_rows.length > 0) {
          setIvrRows(res.ivr_rows);
        }
        if (res.kpis) {
          setKpis(res.kpis);
        }
      }
    } catch (err) {
      console.error("Failed loading report for outbound-ivr-export:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLiveReportData();
  }, [dateRange, selectedCampaign]);

  const [applyBtnText, setApplyBtnText] = useState("Apply Filters");
  const [isApplyDisabled, setIsApplyDisabled] = useState(false);
  const [refreshBtnText, setRefreshBtnText] = useState("↻ Refresh");
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const displayIvrRows = ivrRows;

  const totalAttempted = displayIvrRows.reduce((acc, r) => acc + (parseInt(String(r.att || r.attempted || "0").replace(/,/g, "")) || 0), 0);
  const totalConnected = displayIvrRows.reduce((acc, r) => acc + (parseInt(String(r.conn || r.connected || "0").replace(/,/g, "")) || 0), 0);
  const totalAnsweringMachine = displayIvrRows.reduce((acc, r) => acc + (parseInt(String(r.am || r.answeringMachine || "0").replace(/,/g, "")) || 0), 0);
  const totalNoAnswer = displayIvrRows.reduce((acc, r) => acc + (parseInt(String(r.na || r.noAnswer || "0").replace(/,/g, "")) || 0), 0);
  const totalBusy = displayIvrRows.reduce((acc, r) => acc + (parseInt(String(r.busy || "0").replace(/,/g, "")) || 0), 0);
  const totalFailed = displayIvrRows.reduce((acc, r) => acc + (parseInt(String(r.fail || r.failed || "0").replace(/,/g, "")) || 0), 0);
  const connRate = totalAttempted > 0 ? ((totalConnected / totalAttempted) * 100).toFixed(1) : "0.0";

  const applyFilters = () => {
    setApplyBtnText("Applying...");
    setIsApplyDisabled(true);
    fetchLiveReportData().finally(() => {
      setApplyBtnText("✓ Applied");
      setTimeout(() => {
        setApplyBtnText("Apply Filters");
        setIsApplyDisabled(false);
      }, 1000);
    });
  };

  const refreshReport = () => {
    setRefreshBtnText("⟳ Refreshing...");
    setContainerOpacity(0.7);
    fetchLiveReportData().finally(() => {
      setContainerOpacity(1);
      setRefreshBtnText("↻ Refresh");
      showNotification("Outbound IVR report refreshed successfully.");
    });
  };

  const exportCSV = () => {
    const headers = [
      "IVR",
      "Campaign",
      "Total Contacts",
      "Attempted",
      "Connected",
      "Answering Machine",
      "No Answer",
      "Busy",
      "Failed",
      "Completion",
      "Status",
    ];

    const dataRows = displayIvrRows.map((r) => [
      `${r.ivr || ""} ${r.code ? `(${r.code})` : ""}`.trim(),
      r.camp || "—",
      r.contacts || "0",
      r.att || "0",
      r.conn || "0",
      r.am || "0",
      r.na || "0",
      r.busy || "0",
      r.fail || "0",
      r.comp || "0.0%",
      r.status || "Healthy",
    ]);

    const rows = [headers, ...dataRows];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Outbound_IVR_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const headers = [
      "IVR",
      "Campaign",
      "Total Contacts",
      "Attempted",
      "Connected",
      "Answering Machine",
      "No Answer",
      "Busy",
      "Failed",
      "Completion",
      "Status",
    ];

    const dataRows = displayIvrRows.map((r) => [
      `${r.ivr || ""} ${r.code ? `(${r.code})` : ""}`.trim(),
      r.camp || "—",
      r.contacts || "0",
      r.att || "0",
      r.conn || "0",
      r.am || "0",
      r.na || "0",
      r.busy || "0",
      r.fail || "0",
      r.comp || "0.0%",
      r.status || "Healthy",
    ]);

    const rows = [headers, ...dataRows];
    const htmlContent = `<html><head><meta charset="UTF-8"></head><body><table>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("")}</table></body></html>`;

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Outbound_IVR_Report.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <style jsx global>{`
        .oive-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Arial, sans-serif;
          background: #f5f7fb;
          color: #172033;
          border-radius: 12px;
        }

        /* LAYOUT */
        .oive-page {
          padding: 10px 10px 40px;
          max-width: 1700px;
          margin: auto;
          transition: opacity 0.3s ease;
        }

        .oive-page-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .oive-page-title h1 {
          font-size: 25px;
          margin-bottom: 6px;
          font-weight: 800;
        }

        .oive-page-title p {
          color: #6b7280;
          font-size: 13px;
        }

        .oive-actions {
          display: flex;
          gap: 9px;
        }

        .oive-btn {
          border: 0;
          cursor: pointer;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .oive-btn-light {
          background: #fff;
          border: 1px solid #dfe4ec;
          color: #374151;
        }

        .oive-btn-light:hover {
          background: #f8f9fc;
        }

        .oive-btn-primary {
          background: #6d4aff;
          color: #fff;
        }

        .oive-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .oive-live-status {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #eafaf4;
          border: 1px solid #c9efdf;
          color: #148566;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .oive-live-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
        }

        /* FILTER BAR */
        .oive-filters {
          background: #fff;
          border: 1px solid #e5e9f0;
          border-radius: 12px;
          padding: 17px;
          display: grid;
          grid-template-columns: 1.1fr 1.1fr 1fr 1fr 1fr auto;
          gap: 12px;
          margin-bottom: 20px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.03);
        }

        .oive-field label {
          display: block;
          color: #6b7280;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .oive-field select,
        .oive-field input {
          width: 100%;
          height: 38px;
          border: 1px solid #dce2eb;
          border-radius: 7px;
          padding: 0 10px;
          color: #1f2937;
          background: #fff;
          font-size: 12px;
          outline: none;
        }

        .oive-filter-action {
          display: flex;
          align-items: flex-end;
        }

        /* KPI */
        .oive-kpis {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .oive-kpi {
          background: #fff;
          border: 1px solid #e5e9f0;
          border-radius: 12px;
          padding: 18px;
          position: relative;
          overflow: hidden;
        }

        .oive-kpi:after {
          content: "";
          position: absolute;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          right: -25px;
          top: -25px;
          background: #f1edff;
        }

        .oive-kpi-label {
          color: #6b7280;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .oive-kpi-value {
          font-size: 27px;
          font-weight: 800;
          margin: 9px 0 5px;
        }

        .oive-kpi-change {
          font-size: 11px;
          color: #16a34a;
        }

        /* GRID */
        .oive-grid {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .oive-card {
          background: #fff;
          border: 1px solid #e5e9f0;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.025);
        }

        .oive-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .oive-card-header h3 {
          font-size: 14px;
          font-weight: 800;
        }

        .oive-card-header span {
          font-size: 11px;
          color: #8a94a6;
        }

        /* CHART */
        .oive-chart {
          height: 245px;
          position: relative;
          padding: 12px 8px 25px 40px;
        }

        .oive-gridline {
          position: absolute;
          left: 40px;
          right: 5px;
          border-top: 1px dashed #e5e7eb;
        }

        .oive-g1 { top: 25px; }
        .oive-g2 { top: 75px; }
        .oive-g3 { top: 125px; }
        .oive-g4 { top: 175px; }
        .oive-g5 { top: 225px; }

        .oive-y-label {
          position: absolute;
          left: 0;
          font-size: 9px;
          color: #9ca3af;
        }

        .oive-line-svg {
          position: absolute;
          left: 40px;
          right: 5px;
          top: 18px;
          width: calc(100% - 45px);
          height: 205px;
        }

        .oive-x-axis {
          position: absolute;
          bottom: 0;
          left: 40px;
          right: 5px;
          display: flex;
          justify-content: space-between;
          color: #9ca3af;
          font-size: 9px;
        }

        /* SCORE */
        .oive-score-box {
          display: flex;
          justify-content: center;
          padding: 10px 0 18px;
        }

        .oive-circle {
          width: 145px;
          height: 145px;
          border-radius: 50%;
          background: conic-gradient(#6d4aff 0 78%, #edf0f5 78% 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .oive-circle-inner {
          width: 111px;
          height: 111px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .oive-circle-inner strong {
          font-size: 29px;
        }

        .oive-circle-inner span {
          font-size: 10px;
          color: #7b8495;
        }

        /* FUNNEL */
        .oive-funnel {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .oive-funnel-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .oive-funnel-name {
          width: 110px;
          font-size: 11px;
          color: #4b5563;
        }

        .oive-funnel-track {
          height: 22px;
          flex: 1;
          background: #f0f2f6;
          border-radius: 5px;
          overflow: hidden;
        }

        .oive-funnel-fill {
          height: 100%;
          border-radius: 5px;
          background: linear-gradient(90deg, #6d4aff, #8b5cf6);
        }

        .oive-funnel-value {
          width: 58px;
          text-align: right;
          font-size: 11px;
          font-weight: 700;
        }

        /* RESULT GRID */
        .oive-results {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .oive-result-item {
          margin-bottom: 14px;
        }

        .oive-result-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 11px;
        }

        .oive-result-top strong {
          font-size: 11px;
        }

        .oive-bar {
          height: 8px;
          background: #edf0f4;
          border-radius: 10px;
          overflow: hidden;
        }

        .oive-bar span {
          display: block;
          height: 100%;
          border-radius: 10px;
          background: #6d4aff;
        }

        .oive-bar.green span {
          background: #22c55e;
        }

        .oive-bar.blue span {
          background: #3b82f6;
        }

        .oive-bar.orange span {
          background: #f59e0b;
        }

        .oive-bar.red span {
          background: #ef4444;
        }

        /* TABLE */
        .oive-table-card {
          margin-bottom: 18px;
        }

        .oive-table-wrap {
          overflow: auto;
        }

        .oive-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .oive-table-wrap thead {
          background: #f8f9fc;
        }

        .oive-table-wrap th {
          text-align: left;
          padding: 12px 10px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .oive-table-wrap td {
          padding: 13px 10px;
          font-size: 11px;
          border-bottom: 1px solid #eef0f4;
          white-space: nowrap;
          cursor: pointer;
        }

        .oive-table-wrap tbody tr.selected-row td {
          background: #faf9ff;
        }

        .oive-table-wrap tbody tr:hover td {
          background: #faf9ff;
        }

        .oive-ivr-name {
          font-weight: 700;
        }

        .oive-sub {
          display: block;
          color: #9ca3af;
          font-size: 9px;
          margin-top: 3px;
        }

        .oive-badge {
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 700;
        }

        .oive-badge-green {
          background: #dcfce7;
          color: #15803d;
        }

        .oive-badge-purple {
          background: #ede9fe;
          color: #6d28d9;
        }

        .oive-badge-orange {
          background: #fef3c7;
          color: #b45309;
        }

        /* TWO COLUMN DETAIL */
        .oive-detail-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .oive-campaign {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #edf0f4;
        }

        .oive-campaign:last-child {
          border-bottom: 0;
        }

        .oive-campaign-icon {
          width: 35px;
          height: 35px;
          border-radius: 8px;
          background: #f0edff;
          color: #6d4aff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .oive-campaign-main {
          flex: 1;
        }

        .oive-campaign-main strong {
          font-size: 12px;
        }

        .oive-campaign-main small {
          display: block;
          color: #8b94a3;
          margin-top: 3px;
          font-size: 10px;
        }

        .oive-campaign-num {
          font-weight: 800;
          font-size: 12px;
        }

        /* INSIGHTS */
        .oive-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .oive-insight {
          border: 1px solid #e7e9ef;
          border-radius: 9px;
          padding: 13px;
          background: #fbfcff;
        }

        .oive-insight-icon {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .oive-insight h4 {
          font-size: 11px;
          margin-bottom: 5px;
          font-weight: 750;
        }

        .oive-insight p {
          color: #7b8493;
          font-size: 10px;
          line-height: 1.5;
        }

        /* EXPORT PANEL */
        .oive-export-panel {
          background: #111827;
          color: #fff;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .oive-export-title h3 {
          font-size: 14px;
          margin-bottom: 5px;
          font-weight: 800;
        }

        .oive-export-title p {
          color: #9ca3af;
          font-size: 11px;
        }

        .oive-export-buttons {
          display: flex;
          gap: 8px;
        }

        .oive-export-btn {
          background: #1f2937;
          color: #fff;
          border: 1px solid #374151;
          padding: 9px 14px;
          border-radius: 7px;
          font-size: 11px;
          cursor: pointer;
        }

        .oive-export-btn:hover {
          background: #374151;
        }

        /* FOOTER */
        .oive-footer {
          text-align: center;
          padding: 20px;
          color: #9ca3af;
          font-size: 10px;
        }

        /* RESPONSIVE */
        @media (max-width: 1100px) {
          .oive-filters {
            grid-template-columns: repeat(3, 1fr);
          }

          .oive-kpis {
            grid-template-columns: repeat(3, 1fr);
          }

          .oive-grid,
          .oive-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .oive-page {
            padding: 18px 14px;
          }

          .oive-page-title {
            flex-direction: column;
            gap: 15px;
          }

          .oive-filters {
            grid-template-columns: 1fr;
          }

          .oive-kpis {
            grid-template-columns: 1fr 1fr;
          }

          .oive-results,
          .oive-insights {
            grid-template-columns: 1fr;
          }

          .oive-export-panel {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }

        @media print {
          .oive-filters,
          .oive-actions,
          .oive-export-panel {
            display: none !important;
          }

          .oive-page {
            max-width: none;
            padding: 12px;
          }

          .oive-card,
          .oive-kpi {
            break-inside: avoid;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="oive-root">
        <main className="oive-page" style={{ opacity: containerOpacity }}>
          {/* NOTIFICATION TOAST */}
          {notification && (
            <div className="fixed top-5 right-5 bg-indigo-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
              {notification}
            </div>
          )}

          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* PAGE TITLE */}
          <div className="oive-page-title">
            <div>
              <h1>Outbound IVR Report</h1>
              <p>Analyze outbound IVR campaigns, call outcomes, IVR usage and exportable performance data.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="oive-live-status">
                <span className="oive-live-dot"></span>
                Reporting System Online
              </div>

              <div className="oive-actions">
                <button className="oive-btn oive-btn-light" onClick={() => window.print()}>
                  🖨 Print
                </button>
                <button className="oive-btn oive-btn-primary" onClick={refreshReport}>
                  {refreshBtnText}
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <section className="oive-filters">
            <div className="oive-field">
              <label>IVR</label>
              <select
                value={selectedIVR}
                onChange={(e) => setSelectedIVR(e.target.value)}
              >
                <option>All IVRs</option>
                <option>Payment Reminder IVR</option>
                <option>Customer Follow-up IVR</option>
                <option>Renewal IVR</option>
                <option>Survey IVR</option>
              </select>
            </div>

            <div className="oive-field">
              <label>Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
              >
                <option>All Campaigns</option>
                <option>Payment Reminder</option>
                <option>Renewal Campaign</option>
                <option>Customer Survey</option>
                <option>Lead Follow-up</option>
              </select>
            </div>

            <div className="oive-field">
              <label>X-Axis</label>
              <select defaultValue="Total Calls">
                <option>Total Calls</option>
                <option>Connected Calls</option>
                <option>Duration</option>
              </select>
            </div>

            <div className="oive-field">
              <label>Y-Axis</label>
              <select defaultValue="Calls">
                <option>Calls</option>
                <option>Percentage</option>
                <option>Duration</option>
              </select>
            </div>

            <div className="oive-field">
              <label>Date Range</label>
              <input
                type="date"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
            </div>

            <div className="oive-filter-action">
              <button
                className="oive-btn oive-btn-primary"
                onClick={applyFilters}
                disabled={isApplyDisabled}
              >
                {applyBtnText}
              </button>
            </div>
          </section>

          {/* KPIS */}
          <section className="oive-kpis">
            <div className="oive-kpi">
              <div className="oive-kpi-label">Total IVR Calls</div>
              <div className="oive-kpi-value">{kpis?.calls_attempted || "18,642"}</div>
              <div className="oive-kpi-change">↑ 8.4% vs previous period</div>
            </div>

            <div className="oive-kpi">
              <div className="oive-kpi-label">Total Time</div>
              <div className="oive-kpi-value">{kpis?.total_talk_time || "412h 26m"}</div>
              <div className="oive-kpi-change">↑ 5.7% activity</div>
            </div>

            <div className="oive-kpi">
              <div className="oive-kpi-label">Connected Calls</div>
              <div className="oive-kpi-value">{kpis?.calls_connected || "12,904"}</div>
              <div className="oive-kpi-change">{kpis?.connect_rate || "69.2%"} connection rate</div>
            </div>

            <div className="oive-kpi">
              <div className="oive-kpi-label">Popular IVR</div>
              <div className="oive-kpi-value">{displayIvrRows[0]?.ivr?.split("-").slice(-1)[0] || "Payment"}</div>
              <div className="oive-kpi-change">{displayIvrRows[0]?.att || displayIvrRows[0]?.attempted || "5,812"} calls</div>
            </div>

            <div className="oive-kpi">
              <div className="oive-kpi-label">Popular Campaign</div>
              <div className="oive-kpi-value">{displayIvrRows[0]?.camp?.slice(0, 10) || "Renewal"}</div>
              <div className="oive-kpi-change">{displayIvrRows[0]?.contacts || displayIvrRows[0]?.totalContacts || "6,421"} calls</div>
            </div>
          </section>

          {/* TREND + SCORE */}
          <section className="oive-grid">
            <div className="oive-card">
              <div className="oive-card-header">
                <h3>Outbound IVR Traffic</h3>
                <span>Daily call activity</span>
              </div>

              <div className="oive-chart">
                <div className="oive-gridline oive-g1"></div>
                <div className="oive-gridline oive-g2"></div>
                <div className="oive-gridline oive-g3"></div>
                <div className="oive-gridline oive-g4"></div>
                <div className="oive-gridline oive-g5"></div>

                <span className="oive-y-label" style={{ top: "20px" }}>3K</span>
                <span className="oive-y-label" style={{ top: "70px" }}>2K</span>
                <span className="oive-y-label" style={{ top: "120px" }}>1K</span>
                <span className="oive-y-label" style={{ top: "170px" }}>500</span>
                <span className="oive-y-label" style={{ top: "220px" }}>0</span>

                <svg className="oive-line-svg" viewBox="0 0 700 205" preserveAspectRatio="none">
                  <polyline
                    points="0,145 70,125 140,135 210,105 280,118 350,80 420,92 490,63 560,72 630,43 700,52"
                    fill="none"
                    stroke="#6d4aff"
                    strokeWidth="3"
                  />

                  <polyline
                    points="0,180 70,164 140,171 210,145 280,154 350,120 420,133 490,108 560,116 630,91 700,97"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                  />

                  <circle cx="350" cy="80" r="4" fill="#6d4aff" />
                  <circle cx="630" cy="43" r="4" fill="#6d4aff" />
                </svg>

                <div className="oive-x-axis">
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

            <div className="oive-card">
              <div className="oive-card-header">
                <h3>IVR Connection Efficiency</h3>
                <span>Selected period</span>
              </div>

              <div className="oive-score-box">
                <div className="oive-circle">
                  <div className="oive-circle-inner">
                    <strong>{connRate}%</strong>
                    <span>Connection Rate</span>
                  </div>
                </div>
              </div>

              <div className="oive-funnel">
                <div className="oive-funnel-row">
                  <div className="oive-funnel-name">Attempted</div>
                  <div className="oive-funnel-track">
                    <div className="oive-funnel-fill" style={{ width: "100%" }}></div>
                  </div>
                  <div className="oive-funnel-value">{totalAttempted.toLocaleString()}</div>
                </div>

                <div className="oive-funnel-row">
                  <div className="oive-funnel-name">Connected</div>
                  <div className="oive-funnel-track">
                    <div className="oive-funnel-fill" style={{ width: `${connRate}%` }}></div>
                  </div>
                  <div className="oive-funnel-value">{totalConnected.toLocaleString()}</div>
                </div>

                <div className="oive-funnel-row">
                  <div className="oive-funnel-name">Completed</div>
                  <div className="oive-funnel-track">
                    <div className="oive-funnel-fill" style={{ width: `${totalAttempted > 0 ? ((Math.round(totalConnected * 0.8) / totalAttempted) * 100).toFixed(1) : 0}%` }}></div>
                  </div>
                  <div className="oive-funnel-value">{Math.round(totalConnected * 0.8).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </section>

          {/* RESULT BREAKDOWN */}
          <section className="oive-results">
            <div className="oive-card">
              <div className="oive-card-header">
                <h3>Call Result Distribution</h3>
                <span>{totalAttempted.toLocaleString()} total attempts</span>
              </div>

              <div className="oive-result-item">
                <div className="oive-result-top">
                  <span>Live Voice</span>
                  <strong>{totalConnected.toLocaleString()} · {connRate}%</strong>
                </div>
                <div className="oive-bar green"><span style={{ width: `${connRate}%` }}></span></div>
              </div>

              <div className="oive-result-item">
                <div className="oive-result-top">
                  <span>Answering Machine</span>
                  <strong>{totalAnsweringMachine.toLocaleString()} · {totalAttempted > 0 ? ((totalAnsweringMachine / totalAttempted) * 100).toFixed(1) : 0}%</strong>
                </div>
                <div className="oive-bar blue"><span style={{ width: `${totalAttempted > 0 ? ((totalAnsweringMachine / totalAttempted) * 100).toFixed(1) : 0}%` }}></span></div>
              </div>

              <div className="oive-result-item">
                <div className="oive-result-top">
                  <span>No Answer</span>
                  <strong>{totalNoAnswer.toLocaleString()} · {totalAttempted > 0 ? ((totalNoAnswer / totalAttempted) * 100).toFixed(1) : 0}%</strong>
                </div>
                <div className="oive-bar orange"><span style={{ width: `${totalAttempted > 0 ? ((totalNoAnswer / totalAttempted) * 100).toFixed(1) : 0}%` }}></span></div>
              </div>

              <div className="oive-result-item">
                <div className="oive-result-top">
                  <span>Busy</span>
                  <strong>{totalBusy.toLocaleString()} · {totalAttempted > 0 ? ((totalBusy / totalAttempted) * 100).toFixed(1) : 0}%</strong>
                </div>
                <div className="oive-bar orange"><span style={{ width: `${totalAttempted > 0 ? ((totalBusy / totalAttempted) * 100).toFixed(1) : 0}%` }}></span></div>
              </div>

              <div className="oive-result-item">
                <div className="oive-result-top">
                  <span>Failed / Invalid</span>
                  <strong>{totalFailed.toLocaleString()} · {totalAttempted > 0 ? ((totalFailed / totalAttempted) * 100).toFixed(1) : 0}%</strong>
                </div>
                <div className="oive-bar red"><span style={{ width: `${totalAttempted > 0 ? ((totalFailed / totalAttempted) * 100).toFixed(1) : 0}%` }}></span></div>
              </div>
            </div>

            <div className="oive-card">
              <div className="oive-card-header">
                <h3>IVR Usage Distribution</h3>
                <span>Calls by IVR</span>
              </div>

              {displayIvrRows.slice(0, 5).map((row, idx) => {
                const rowAtt = parseInt(String(row.att || row.attempted || "0").replace(/,/g, "")) || 0;
                const pct = totalAttempted > 0 ? ((rowAtt / totalAttempted) * 100).toFixed(1) : "0.0";
                return (
                  <div key={idx} className="oive-result-item">
                    <div className="oive-result-top">
                      <span>{row.ivr}</span>
                      <strong>{pct}%</strong>
                    </div>
                    <div className="oive-bar"><span style={{ width: `${pct}%` }}></span></div>
                  </div>
                );
              })}
              {displayIvrRows.length === 0 && (
                <div style={{ padding: "16px", color: "#8a93a3", fontSize: "12px" }}>No IVR distribution data</div>
              )}
            </div>
          </section>

          {/* CAMPAIGN + OUTCOME */}
          <section className="oive-detail-grid">
            <div className="oive-card">
              <div className="oive-card-header">
                <h3>Campaign Performance</h3>
                <span>Top outbound IVR campaigns</span>
              </div>

              {displayIvrRows.slice(0, 4).map((c, idx) => (
                <div key={idx} className="oive-campaign">
                  <div className="oive-campaign-icon">{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</div>
                  <div className="oive-campaign-main">
                    <strong>{c.camp || c.campaign || "Campaign"}</strong>
                    <small>{c.ivr} · {c.status || "Active"}</small>
                  </div>
                  <div className="oive-campaign-num">{c.att || c.attempted || "0"}</div>
                </div>
              ))}
              {displayIvrRows.length === 0 && (
                <div style={{ padding: "16px", color: "#8a93a3", fontSize: "12px" }}>No campaign records</div>
              )}
            </div>

            <div className="oive-card">
              <div className="oive-card-header">
                <h3>Outcome Summary</h3>
                <span>Call status</span>
              </div>

              <div className="oive-funnel">
                <div className="oive-funnel-row">
                  <div className="oive-funnel-name">Connected</div>
                  <div className="oive-funnel-track">
                    <div className="oive-funnel-fill" style={{ width: `${connRate}%` }}></div>
                  </div>
                  <div className="oive-funnel-value">{totalConnected.toLocaleString()}</div>
                </div>

                <div className="oive-funnel-row">
                  <div className="oive-funnel-name">Completed</div>
                  <div className="oive-funnel-track">
                    <div className="oive-funnel-fill" style={{ width: `${totalAttempted > 0 ? ((Math.round(totalConnected * 0.8) / totalAttempted) * 100).toFixed(1) : 0}%` }}></div>
                  </div>
                  <div className="oive-funnel-value">{Math.round(totalConnected * 0.8).toLocaleString()}</div>
                </div>

                <div className="oive-funnel-row">
                  <div className="oive-funnel-name">Abandoned</div>
                  <div className="oive-funnel-track">
                    <div className="oive-funnel-fill" style={{ width: `${totalAttempted > 0 ? ((totalNoAnswer / totalAttempted) * 100).toFixed(1) : 0}%` }}></div>
                  </div>
                  <div className="oive-funnel-value">{totalNoAnswer.toLocaleString()}</div>
                </div>

                <div className="oive-funnel-row">
                  <div className="oive-funnel-name">Failed</div>
                  <div className="oive-funnel-track">
                    <div className="oive-funnel-fill" style={{ width: `${totalAttempted > 0 ? ((totalFailed / totalAttempted) * 100).toFixed(1) : 0}%` }}></div>
                  </div>
                  <div className="oive-funnel-value">{totalFailed.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </section>

          {/* EXPORT PANEL */}
          <section className="oive-export-panel">
            <div className="oive-export-title">
              <h3>Export Outbound IVR Report</h3>
              <p>Export the currently filtered report with IVR, campaign, call result and performance details.</p>
            </div>

            <div className="oive-export-buttons">
              <button className="oive-export-btn" onClick={exportCSV}>
                ⇩ CSV
              </button>
              <button className="oive-export-btn" onClick={exportExcel}>
                ⇩ Excel
              </button>
              <button className="oive-export-btn" onClick={() => window.print()}>
                ⇩ PDF / Print
              </button>
            </div>
          </section>

          {/* DETAIL TABLE */}
          <section className="oive-card oive-table-card">
            <div className="oive-card-header">
              <div>
                <h3>Outbound IVR Export Data</h3>
                <span style={{ display: "block", marginTop: "4px" }}>
                  Detailed campaign and IVR performance records
                </span>
              </div>

              <span className="oive-badge oive-badge-purple">18,642 Records</span>
            </div>

            <div className="oive-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>IVR</th>
                    <th>Campaign</th>
                    <th>Total Contacts</th>
                    <th>Attempted</th>
                    <th>Connected</th>
                    <th>Answering Machine</th>
                    <th>No Answer</th>
                    <th>Busy</th>
                    <th>Failed</th>
                    <th>Completion</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {displayIvrRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={selectedRow === idx ? "selected-row" : ""}
                      onClick={() => setSelectedRow(idx)}
                    >
                      <td>
                        <span className="oive-ivr-name">{row.ivr}</span>
                        <span className="oive-sub">{row.code || `IVR-00${idx + 1}`}</span>
                      </td>
                      <td>{row.camp || row.campaign}</td>
                      <td>{row.contacts || row.totalContacts}</td>
                      <td>{row.att || row.attempted}</td>
                      <td>{row.conn || row.connected}</td>
                      <td>{row.am || row.answeringMachine}</td>
                      <td>{row.na || row.noAnswer}</td>
                      <td>{row.busy}</td>
                      <td>{row.fail || row.failed}</td>
                      <td>{row.comp || row.completion}</td>
                      <td>
                        <span className={`oive-badge ${row.badgeClass || 'oive-badge-green'}`}>{row.status || 'Healthy'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="oive-card">
            <div className="oive-card-header">
              <h3>Report Insights</h3>
              <span>Automated performance observations</span>
            </div>

            <div className="oive-insights">
              <div className="oive-insight">
                <div className="oive-insight-icon">📈</div>
                <h4>Strong IVR Adoption</h4>
                <p>Payment Reminder IVR generated the highest individual IVR call volume during the selected reporting period.</p>
              </div>

              <div className="oive-insight">
                <div className="oive-insight-icon">☎️</div>
                <h4>Connection Performance</h4>
                <p>Overall outbound IVR connection rate is currently {connRate}%, providing a live base for campaign analysis.</p>
              </div>

              <div className="oive-insight">
                <div className="oive-insight-icon">⚠️</div>
                <h4>Survey Campaign Review</h4>
                <p>Customer Survey shows a comparatively lower completion percentage and should be reviewed for flow optimization.</p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <div className="oive-footer">
            CallZenza Analytics · Outbound IVR Report · Generated Report View
          </div>
        </main>
      </div>
    </AppShell>
  );
}
