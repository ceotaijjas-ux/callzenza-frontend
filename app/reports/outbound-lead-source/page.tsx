"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function OutboundLeadSourceReport() {
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedGroup, setSelectedGroup] = useState("Source ID");
  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-07");
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveReportData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("outbound-lead-source", {
        from_date: fromDate,
        to_date: toDate,
        campaign_id: selectedCampaign,
      });
      if (res && res.success) {
        if (res.lead_sources && res.lead_sources.length > 0) {
          setLeadSources(res.lead_sources);
        }
        if (res.kpis) {
          setKpis(res.kpis);
        }
      }
    } catch (err) {
      console.error("Failed loading report for outbound-lead-source:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLiveReportData();
  }, [fromDate, toDate, selectedCampaign]);

  const [applyBtnText, setApplyBtnText] = useState("Apply");
  const [isApplyDisabled, setIsApplyDisabled] = useState(false);
  const [refreshBtnText, setRefreshBtnText] = useState("↻ Refresh");
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const displaySources = leadSources;

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
    setRefreshBtnText("⟳ Refreshing...");
    setContainerOpacity(0.7);
    fetchLiveReportData().finally(() => {
      setContainerOpacity(1);
      setRefreshBtnText("↻ Refresh");
      showNotification("Outbound Lead Source Report refreshed successfully.");
    });
  };

  const exportCSV = () => {
    const headers = [
      "Source ID",
      "Vendor Lead Code",
      "Leads",
      "Calls",
      "Connected",
      "Conversion",
      "No Answer",
      "Busy",
      "Failed",
      "Avg Talk",
      "Connection Rate",
      "Status",
    ];

    const dataRows = displaySources.map((r) => [
      `${r.id || ""} ${r.sub ? `(${r.sub})` : ""}`.trim(),
      r.vendor || "—",
      r.leads || "0",
      r.calls || "0",
      r.conn || "0",
      r.conv || "0",
      r.na || "0",
      r.busy || "0",
      r.fail || "0",
      r.talk || "00:00",
      r.rate || "0.0%",
      r.status || "Stable",
    ]);

    const rows = [headers, ...dataRows];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Outbound_Lead_Source_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const headers = [
      "Source ID",
      "Vendor Lead Code",
      "Leads",
      "Calls",
      "Connected",
      "Conversion",
      "No Answer",
      "Busy",
      "Failed",
      "Avg Talk",
      "Connection Rate",
      "Status",
    ];

    const dataRows = displaySources.map((r) => [
      `${r.id || ""} ${r.sub ? `(${r.sub})` : ""}`.trim(),
      r.vendor || "—",
      r.leads || "0",
      r.calls || "0",
      r.conn || "0",
      r.conv || "0",
      r.na || "0",
      r.busy || "0",
      r.fail || "0",
      r.talk || "00:00",
      r.rate || "0.0%",
      r.status || "Stable",
    ]);

    const rows = [headers, ...dataRows];
    const htmlContent = `<html><head><meta charset="UTF-8"></head><body><table>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("")}</table></body></html>`;

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Outbound_Lead_Source_Report.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <style jsx global>{`
        .olsr-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Arial, sans-serif;
          background: #f4f6fa;
          color: #172033;
          border-radius: 12px;
        }

        /* PAGE */

        .olsr-container {
          max-width: 1700px;
          margin: auto;
          padding: 10px 10px 40px;
          transition: opacity 0.3s ease;
        }

        .olsr-page-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .olsr-page-head h1 {
          font-size: 25px;
          margin-bottom: 5px;
          font-weight: 800;
        }

        .olsr-page-head p {
          font-size: 12px;
          color: #7b8494;
        }

        .olsr-actions {
          display: flex;
          gap: 8px;
        }

        .olsr-btn {
          border: 1px solid #dce1e9;
          background: #fff;
          color: #374151;
          padding: 9px 13px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .olsr-btn:hover {
          background: #f8f9fc;
        }

        .olsr-btn.primary {
          background: #6d4aff;
          border-color: #6d4aff;
          color: #fff;
        }

        .olsr-system-status {
          padding: 7px 12px;
          border: 1px solid #c9efdf;
          background: #eafaf4;
          border-radius: 7px;
          color: #148566;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .olsr-status-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
        }

        /* FILTER */

        .olsr-filter-box {
          background: white;
          border: 1px solid #e3e7ee;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr auto;
          gap: 12px;
        }

        .olsr-field label {
          display: block;
          font-size: 10px;
          color: #6b7280;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .olsr-field select,
        .olsr-field input {
          width: 100%;
          height: 38px;
          border: 1px solid #d9dee7;
          border-radius: 7px;
          padding: 0 10px;
          background: white;
          color: #273244;
          font-size: 11px;
          outline: none;
        }

        .olsr-filter-btn {
          display: flex;
          align-items: flex-end;
        }

        .olsr-filter-btn button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* SUMMARY */

        .olsr-summary-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 13px;
          margin-bottom: 20px;
        }

        .olsr-summary-card {
          background: white;
          border: 1px solid #e3e7ee;
          border-radius: 11px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .olsr-summary-card:after {
          content: "";
          position: absolute;
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #f1efff;
          right: -25px;
          top: -25px;
        }

        .olsr-summary-label {
          font-size: 10px;
          color: #7b8494;
          font-weight: 700;
          text-transform: uppercase;
        }

        .olsr-summary-value {
          font-size: 24px;
          font-weight: 800;
          margin-top: 8px;
        }

        .olsr-summary-change {
          margin-top: 5px;
          color: #16a34a;
          font-size: 10px;
        }

        /* COMMON CARD */

        .olsr-card {
          background: white;
          border: 1px solid #e3e7ee;
          border-radius: 12px;
          padding: 18px;
        }

        .olsr-card-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 17px;
        }

        .olsr-card-title h3 {
          font-size: 14px;
          font-weight: 800;
        }

        .olsr-card-title span {
          color: #8a94a5;
          font-size: 10px;
        }

        /* MAIN GRID */

        .olsr-main-grid {
          display: grid;
          grid-template-columns: 1.55fr 0.9fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        /* SOURCE TREND */

        .olsr-trend {
          height: 260px;
          position: relative;
          padding-left: 38px;
          padding-bottom: 28px;
        }

        .olsr-grid-line {
          position: absolute;
          left: 38px;
          right: 5px;
          border-top: 1px dashed #e5e7eb;
        }

        .olsr-line1 { top: 18px; }
        .olsr-line2 { top: 65px; }
        .olsr-line3 { top: 112px; }
        .olsr-line4 { top: 159px; }
        .olsr-line5 { top: 206px; }

        .olsr-y {
          position: absolute;
          left: 0;
          font-size: 9px;
          color: #9ca3af;
        }

        .olsr-y1 { top: 14px; }
        .olsr-y2 { top: 61px; }
        .olsr-y3 { top: 108px; }
        .olsr-y4 { top: 155px; }
        .olsr-y5 { top: 202px; }

        .olsr-trend svg {
          position: absolute;
          left: 38px;
          right: 5px;
          top: 10px;
          width: calc(100% - 43px);
          height: 205px;
        }

        .olsr-x {
          position: absolute;
          left: 38px;
          right: 5px;
          bottom: 2px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #9ca3af;
        }

        /* SOURCE SCORE */

        .olsr-score-container {
          display: flex;
          justify-content: center;
          padding: 8px 0 20px;
        }

        .olsr-score-ring {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: conic-gradient(#6d4aff 0deg 281deg, #eceef3 281deg 360deg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .olsr-score-inner {
          width: 114px;
          height: 114px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .olsr-score-inner strong {
          font-size: 29px;
        }

        .olsr-score-inner span {
          font-size: 10px;
          color: #8a94a5;
        }

        .olsr-mini-stat {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #edf0f4;
          padding: 9px 0;
          font-size: 11px;
        }

        .olsr-mini-stat:last-child {
          border-bottom: 0;
        }

        .olsr-mini-stat span {
          color: #7b8494;
        }

        .olsr-mini-stat strong {
          color: #1f2937;
        }

        /* SOURCE PERFORMANCE */

        .olsr-source-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        /* RANKING */

        .olsr-source-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px 0;
          border-bottom: 1px solid #edf0f4;
        }

        .olsr-source-row:last-child {
          border-bottom: 0;
        }

        .olsr-rank {
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: #f0edff;
          color: #6d4aff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .olsr-source-info {
          flex: 1;
        }

        .olsr-source-name {
          font-size: 11px;
          font-weight: 700;
        }

        .olsr-source-id {
          display: block;
          color: #9ca3af;
          font-size: 9px;
          margin-top: 3px;
        }

        .olsr-source-progress {
          width: 125px;
        }

        .olsr-progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #7b8494;
          margin-bottom: 4px;
        }

        .olsr-progress {
          height: 6px;
          border-radius: 10px;
          background: #edf0f4;
          overflow: hidden;
        }

        .olsr-progress span {
          display: block;
          height: 100%;
          background: #6d4aff;
          border-radius: 10px;
        }

        .olsr-source-total {
          width: 65px;
          text-align: right;
          font-size: 11px;
          font-weight: 800;
        }

        /* FUNNEL */

        .olsr-funnel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .olsr-funnel-level {
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          color: white;
          font-size: 10px;
          font-weight: 700;
          border-radius: 5px;
        }

        .olsr-level1 { width: 100%; background: #6d4aff; }
        .olsr-level2 { width: 82%; background: #7c5cf2; }
        .olsr-level3 { width: 65%; background: #8b72ee; }
        .olsr-level4 { width: 48%; background: #9a86e8; }
        .olsr-level5 { width: 34%; background: #aaa0dc; }

        /* DISPOSITION */

        .olsr-disposition-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .olsr-disposition {
          padding: 13px;
          background: #f8f9fc;
          border-radius: 8px;
          text-align: center;
        }

        .olsr-disposition strong {
          display: block;
          font-size: 18px;
          margin-bottom: 4px;
        }

        .olsr-disposition span {
          font-size: 9px;
          color: #7b8494;
        }

        .olsr-disp-green strong { color: #16a34a; }
        .olsr-disp-blue strong { color: #2563eb; }
        .olsr-disp-orange strong { color: #d97706; }
        .olsr-disp-red strong { color: #dc2626; }
        .olsr-disp-purple strong { color: #7c3aed; }

        /* TABLE */

        .olsr-table-card {
          margin-bottom: 18px;
        }

        .olsr-table-wrapper {
          overflow: auto;
        }

        .olsr-table-wrapper table {
          width: 100%;
          min-width: 1200px;
          border-collapse: collapse;
        }

        .olsr-table-wrapper thead {
          background: #f8f9fc;
        }

        .olsr-table-wrapper th {
          padding: 12px 10px;
          text-align: left;
          color: #6b7280;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 1px solid #e4e7ed;
          white-space: nowrap;
        }

        .olsr-table-wrapper td {
          padding: 13px 10px;
          font-size: 10px;
          border-bottom: 1px solid #edf0f4;
          white-space: nowrap;
          cursor: pointer;
        }

        .olsr-table-wrapper tbody tr.selected-row td {
          background: #faf9ff;
        }

        .olsr-table-wrapper tbody tr:hover td {
          background: #faf9ff;
        }

        .olsr-source-cell {
          font-weight: 800;
        }

        .olsr-source-cell small {
          display: block;
          color: #9ca3af;
          font-size: 8px;
          margin-top: 3px;
        }

        .olsr-badge {
          display: inline-block;
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 800;
        }

        .olsr-badge-green {
          background: #dcfce7;
          color: #15803d;
        }

        .olsr-badge-yellow {
          background: #fef3c7;
          color: #b45309;
        }

        .olsr-badge-red {
          background: #fee2e2;
          color: #b91c1c;
        }

        .olsr-badge-purple {
          background: #ede9fe;
          color: #6d28d9;
        }

        /* SOURCE COMPARISON */

        .olsr-comparison {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
          margin-bottom: 18px;
        }

        .olsr-compare-card {
          border: 1px solid #e5e8ef;
          border-radius: 9px;
          padding: 14px;
        }

        .olsr-compare-head {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .olsr-compare-head strong {
          font-size: 12px;
        }

        .olsr-compare-score {
          color: #16a34a;
          font-size: 12px;
          font-weight: 800;
        }

        .olsr-metric {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 10px;
        }

        .olsr-metric span {
          color: #7b8494;
        }

        /* INSIGHTS */

        .olsr-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .olsr-insight {
          background: #fafbfe;
          border: 1px solid #e5e8ef;
          border-radius: 9px;
          padding: 14px;
        }

        .olsr-insight-icon {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .olsr-insight h4 {
          font-size: 11px;
          margin-bottom: 5px;
          font-weight: 750;
        }

        .olsr-insight p {
          color: #7b8494;
          font-size: 10px;
          line-height: 1.5;
        }

        /* EXPORT */

        .olsr-export-bar {
          background: #111827;
          color: white;
          padding: 17px 18px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 18px;
        }

        .olsr-export-bar h3 {
          font-size: 13px;
          margin-bottom: 4px;
          font-weight: 800;
        }

        .olsr-export-bar p {
          color: #9ca3af;
          font-size: 10px;
        }

        .olsr-export-actions {
          display: flex;
          gap: 8px;
        }

        .olsr-export-btn {
          background: #1f2937;
          border: 1px solid #374151;
          color: white;
          border-radius: 7px;
          padding: 9px 13px;
          font-size: 10px;
          cursor: pointer;
        }

        .olsr-export-btn:hover {
          background: #374151;
        }

        .olsr-footer {
          text-align: center;
          color: #9ca3af;
          font-size: 9px;
          padding: 20px;
        }

        /* RESPONSIVE */

        @media (max-width: 1200px) {
          .olsr-summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .olsr-filter-box {
            grid-template-columns: repeat(3, 1fr);
          }

          .olsr-main-grid,
          .olsr-source-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 750px) {
          .olsr-container {
            padding: 18px 14px;
          }

          .olsr-page-head {
            flex-direction: column;
            gap: 12px;
          }

          .olsr-summary-grid {
            grid-template-columns: 1fr 1fr;
          }

          .olsr-filter-box {
            grid-template-columns: 1fr;
          }

          .olsr-comparison,
          .olsr-insights {
            grid-template-columns: 1fr;
          }

          .olsr-disposition-grid {
            grid-template-columns: 1fr 1fr;
          }

          .olsr-export-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }

        @media print {
          .olsr-filter-box,
          .olsr-actions,
          .olsr-export-bar {
            display: none !important;
          }

          .olsr-container {
            max-width: none;
            padding: 12px;
          }

          .olsr-card,
          .olsr-summary-card {
            break-inside: avoid;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="olsr-root">
        <main className="olsr-container" style={{ opacity: containerOpacity }}>
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

          {/* PAGE HEADER */}
          <div className="olsr-page-head">
            <div>
              <h1>Outbound Lead Source Report</h1>
              <p>Compare outbound lead sources, call outcomes, connection performance and source-level conversion.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="olsr-system-status">
                <span className="olsr-status-dot"></span>
                Reporting System Online
              </div>

              <div className="olsr-actions">
                <button className="olsr-btn" onClick={() => window.print()}>
                  🖨 Print
                </button>
                <button className="olsr-btn primary" onClick={refreshReport}>
                  {refreshBtnText}
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <section className="olsr-filter-box">
            <div className="olsr-field">
              <label>Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
              >
                <option>All Campaigns</option>
                <option>Renewal Campaign</option>
                <option>Payment Reminder</option>
                <option>Lead Follow-up</option>
                <option>Customer Survey</option>
              </select>
            </div>

            <div className="olsr-field">
              <label>Lead Source Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option>Source ID</option>
                <option>Vendor Lead Code</option>
              </select>
            </div>

            <div className="olsr-field">
              <label>Lead Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
              >
                <option>All Sources</option>
                <option>WEB_LEADS</option>
                <option>PARTNER_01</option>
                <option>IMPORT_SEP</option>
                <option>REFERRAL_01</option>
              </select>
            </div>

            <div className="olsr-field">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="olsr-field">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="olsr-filter-btn">
              <button
                className="olsr-btn primary"
                onClick={applyFilters}
                disabled={isApplyDisabled}
              >
                {applyBtnText}
              </button>
            </div>
          </section>

          {/* SUMMARY CARDS */}
          <section className="olsr-summary-grid">
            <div className="olsr-summary-card">
              <div className="olsr-summary-label">Total Lead Sources</div>
              <div className="olsr-summary-value">{displaySources.length}</div>
              <div className="olsr-summary-change">↑ Active sources</div>
            </div>

            <div className="olsr-summary-card">
              <div className="olsr-summary-label">Total Leads</div>
              <div className="olsr-summary-value">{displaySources.reduce((acc, s) => acc + (parseInt(String(s.leads || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</div>
              <div className="olsr-summary-change">In database</div>
            </div>

            <div className="olsr-summary-card">
              <div className="olsr-summary-label">Total Calls</div>
              <div className="olsr-summary-value">{kpis?.calls_attempted || "31,842"}</div>
              <div className="olsr-summary-change">Live calls</div>
            </div>

            <div className="olsr-summary-card">
              <div className="olsr-summary-label">Connected</div>
              <div className="olsr-summary-value">{kpis?.calls_connected || "20,714"}</div>
              <div className="olsr-summary-change">{kpis?.connect_rate || "65.1%"} rate</div>
            </div>

            <div className="olsr-summary-card">
              <div className="olsr-summary-label">Conversions</div>
              <div className="olsr-summary-value">{kpis?.human_answered || "4,286"}</div>
              <div className="olsr-summary-change">Qualified</div>
            </div>

            <div className="olsr-summary-card">
              <div className="olsr-summary-label">Best Source</div>
              <div className="olsr-summary-value">{displaySources[0]?.vendor?.slice(0, 10) || "WEB"}</div>
              <div className="olsr-summary-change">{displaySources[0]?.rate || "18.7%"} connection</div>
            </div>
          </section>

          {/* TREND + SOURCE SCORE */}
          <section className="olsr-main-grid">
            <div className="olsr-card">
              <div className="olsr-card-title">
                <h3>Lead Source Activity Trend</h3>
                <span>Daily calls by source</span>
              </div>

              <div className="olsr-trend">
                <div className="olsr-grid-line olsr-line1"></div>
                <div className="olsr-grid-line olsr-line2"></div>
                <div className="olsr-grid-line olsr-line3"></div>
                <div className="olsr-grid-line olsr-line4"></div>
                <div className="olsr-grid-line olsr-line5"></div>

                <span className="olsr-y olsr-y1">6K</span>
                <span className="olsr-y olsr-y2">4.5K</span>
                <span className="olsr-y olsr-y3">3K</span>
                <span className="olsr-y olsr-y4">1.5K</span>
                <span className="olsr-y olsr-y5">0</span>

                <svg viewBox="0 0 760 205" preserveAspectRatio="none">
                  {/* WEB */}
                  <polyline
                    points="0,130 75,117 150,125 225,92 300,103 375,76 450,89 525,60 600,68 680,43 760,51"
                    fill="none"
                    stroke="#6d4aff"
                    strokeWidth="3"
                  />

                  {/* PARTNER */}
                  <polyline
                    points="0,170 75,160 150,166 225,143 300,151 375,131 450,140 525,118 600,126 680,103 760,110"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                  />

                  {/* IMPORT */}
                  <polyline
                    points="0,187 75,181 150,184 225,174 300,178 375,163 450,170 525,157 600,161 680,145 760,151"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                  />

                  <circle cx="680" cy="43" r="4" fill="#6d4aff" />
                  <circle cx="680" cy="103" r="4" fill="#22c55e" />
                </svg>

                <div className="olsr-x">
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

            <div className="olsr-card">
              <div className="olsr-card-title">
                <h3>Source Conversion Score</h3>
                <span>Best-performing source</span>
              </div>

              <div className="olsr-score-container">
                <div className="olsr-score-ring">
                  <div className="olsr-score-inner">
                    <strong>78%</strong>
                    <span>Source Quality</span>
                  </div>
                </div>
              </div>

              <div className="olsr-mini-stat">
                <span>Top Source</span>
                <strong>WEB_LEADS</strong>
              </div>

              <div className="olsr-mini-stat">
                <span>Connection Rate</span>
                <strong>78.4%</strong>
              </div>

              <div className="olsr-mini-stat">
                <span>Conversion Rate</span>
                <strong>18.7%</strong>
              </div>

              <div className="olsr-mini-stat">
                <span>Avg. Talk Time</span>
                <strong>04:38</strong>
              </div>
            </div>
          </section>

          {/* SOURCE RANKING + FUNNEL */}
          <section className="olsr-source-grid">
            <div className="olsr-card">
              <div className="olsr-card-title">
                <h3>Lead Source Ranking</h3>
                <span>Sorted by conversion rate</span>
              </div>

              {[
                { rank: "01", name: "WEB_LEADS", id: "Source ID: WEB-001", conv: "18.7%", width: "93%", total: "8,421" },
                { rank: "02", name: "PARTNER_01", id: "Source ID: PTR-001", conv: "16.4%", width: "82%", total: "6,734" },
                { rank: "03", name: "REFERRAL_01", id: "Source ID: REF-001", conv: "14.9%", width: "74%", total: "4,982" },
                { rank: "04", name: "IMPORT_SEP", id: "Source ID: IMP-009", conv: "11.2%", width: "56%", total: "5,611" },
                { rank: "05", name: "COLD_LIST", id: "Source ID: CL-007", conv: "7.6%", width: "38%", total: "3,842" },
              ].map((row, idx) => (
                <div key={idx} className="olsr-source-row">
                  <div className="olsr-rank">{row.rank}</div>
                  <div className="olsr-source-info">
                    <div className="olsr-source-name">{row.name}</div>
                    <span className="olsr-source-id">{row.id}</span>
                  </div>
                  <div className="olsr-source-progress">
                    <div className="olsr-progress-label">
                      <span>Conversion</span>
                      <strong>{row.conv}</strong>
                    </div>
                    <div className="olsr-progress">
                      <span style={{ width: row.width }}></span>
                    </div>
                  </div>
                  <div className="olsr-source-total">{row.total}</div>
                </div>
              ))}
            </div>

            <div className="olsr-card">
              <div className="olsr-card-title">
                <h3>Source Conversion Funnel</h3>
                <span>All sources</span>
              </div>

              {(() => {
                const totalLeads = leadSources.reduce((s, x) => s + (parseInt(String(x.leads || x.contacts || "0").replace(/\D/g, "")) || 0), 0);
                const totalCalls = leadSources.reduce((s, x) => s + (parseInt(String(x.calls || x.attempted || "0").replace(/\D/g, "")) || 0), 0);
                const totalConn = leadSources.reduce((s, x) => s + (parseInt(String(x.connected || x.conn || "0").replace(/\D/g, "")) || 0), 0);
                const totalConv = leadSources.reduce((s, x) => s + (parseInt(String(x.conv || x.converted || "0").replace(/\D/g, "")) || 0), 0);
                const totalQual = Math.round(totalConv * 1.5) || totalConv;
                return (
                  <div className="olsr-funnel">
                    <div className="olsr-funnel-level olsr-level1">
                      <span>Leads</span>
                      <span>{totalLeads.toLocaleString()}</span>
                    </div>
                    <div className="olsr-funnel-level olsr-level2">
                      <span>Attempted</span>
                      <span>{totalCalls.toLocaleString()}</span>
                    </div>
                    <div className="olsr-funnel-level olsr-level3">
                      <span>Connected</span>
                      <span>{totalConn.toLocaleString()}</span>
                    </div>
                    <div className="olsr-funnel-level olsr-level4">
                      <span>Qualified</span>
                      <span>{totalQual.toLocaleString()}</span>
                    </div>
                    <div className="olsr-funnel-level olsr-level5">
                      <span>Converted</span>
                      <span>{totalConv.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* DISPOSITION */}
          <section className="olsr-card" style={{ marginBottom: "18px" }}>
            {(() => {
              const totalCalls = leadSources.reduce((s, x) => s + (parseInt(String(x.calls || x.attempted || "0").replace(/\D/g, "")) || 0), 0);
              const totalConn = leadSources.reduce((s, x) => s + (parseInt(String(x.connected || x.conn || "0").replace(/\D/g, "")) || 0), 0);
              const totalConv = leadSources.reduce((s, x) => s + (parseInt(String(x.conv || x.converted || "0").replace(/\D/g, "")) || 0), 0);
              const noAnswer = Math.max(0, totalCalls - totalConn);
              return (
                <>
                  <div className="olsr-card-title">
                    <h3>Overall Source Disposition</h3>
                    <span>{totalCalls.toLocaleString()} outbound attempts</span>
                  </div>

                  <div className="olsr-disposition-grid">
                    <div className="olsr-disposition olsr-disp-green">
                      <strong>{totalConn.toLocaleString()}</strong>
                      <span>Connected</span>
                    </div>
                    <div className="olsr-disposition olsr-disp-blue">
                      <strong>{totalConv.toLocaleString()}</strong>
                      <span>Converted</span>
                    </div>
                    <div className="olsr-disposition olsr-disp-orange">
                      <strong>{noAnswer.toLocaleString()}</strong>
                      <span>No Answer</span>
                    </div>
                    <div className="olsr-disposition olsr-disp-red">
                      <strong>0</strong>
                      <span>Busy</span>
                    </div>
                    <div className="olsr-disposition olsr-disp-purple">
                      <strong>0</strong>
                      <span>Failed</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </section>

          {/* COMPARISON */}
          <section className="olsr-card" style={{ marginBottom: "18px" }}>
            <div className="olsr-card-title">
              <h3>Top Source Comparison</h3>
              <span>Performance comparison</span>
            </div>

            <div className="olsr-comparison">
              {[
                { name: "WEB_LEADS", score: "18.7%", leads: "11,248", calls: "8,421", conn: "6,603", conv: "1,575" },
                { name: "PARTNER_01", score: "16.4%", leads: "8,310", calls: "6,734", conn: "4,951", conv: "1,101" },
                { name: "REFERRAL_01", score: "14.9%", leads: "6,201", calls: "4,982", conn: "3,441", conv: "742" },
              ].map((c, idx) => (
                <div key={idx} className="olsr-compare-card">
                  <div className="olsr-compare-head">
                    <strong>{c.name}</strong>
                    <span className="olsr-compare-score">{c.score}</span>
                  </div>
                  <div className="olsr-metric">
                    <span>Leads</span>
                    <strong>{c.leads}</strong>
                  </div>
                  <div className="olsr-metric">
                    <span>Calls</span>
                    <strong>{c.calls}</strong>
                  </div>
                  <div className="olsr-metric">
                    <span>Connected</span>
                    <strong>{c.conn}</strong>
                  </div>
                  <div className="olsr-metric">
                    <span>Conversions</span>
                    <strong>{c.conv}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* DETAIL TABLE */}
          <section className="olsr-card olsr-table-card">
            <div className="olsr-card-title">
              <div>
                <h3>Outbound Lead Source Details</h3>
                <span style={{ display: "block", marginTop: "4px" }}>
                  Source-wise call and disposition breakdown
                </span>
              </div>

              <span className="olsr-badge olsr-badge-purple">24 Sources</span>
            </div>

            <div className="olsr-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Source ID</th>
                    <th>Vendor Lead Code</th>
                    <th>Leads</th>
                    <th>Calls</th>
                    <th>Connected</th>
                    <th>Conversion</th>
                    <th>No Answer</th>
                    <th>Busy</th>
                    <th>Failed</th>
                    <th>Avg Talk</th>
                    <th>Connection Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {displaySources.map((row, idx) => (
                    <tr
                      key={idx}
                      className={selectedRow === idx ? "selected-row" : ""}
                      onClick={() => setSelectedRow(idx)}
                    >
                      <td className="olsr-source-cell">
                        {row.id || row.sourceId}
                        <small>{row.sub || "VENDOR"}</small>
                      </td>
                      <td>{row.vendor}</td>
                      <td>{row.leads}</td>
                      <td>{row.calls}</td>
                      <td>{row.conn || row.connected}</td>
                      <td>{row.conv || row.conversion}</td>
                      <td>{row.na || row.noAnswer}</td>
                      <td>{row.busy}</td>
                      <td>{row.fail || row.failed}</td>
                      <td>{row.talk || row.avgTalk}</td>
                      <td>{row.rate || "65.0%"}</td>
                      <td>
                        <span className={`olsr-badge ${row.badgeClass || 'olsr-badge-green'}`}>{row.status || 'Active'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="olsr-card">
            <div className="olsr-card-title">
              <h3>Lead Source Insights</h3>
              <span>Source-level observations</span>
            </div>

            <div className="olsr-insights">
              <div className="olsr-insight">
                <div className="olsr-insight-icon">🏆</div>
                <h4>Best Performing Source</h4>
                <p>WEB_LEADS currently has the highest conversion rate and strongest connection performance among the displayed sources.</p>
              </div>

              <div className="olsr-insight">
                <div className="olsr-insight-icon">📞</div>
                <h4>High Contact Quality</h4>
                <p>Partner and referral sources are producing strong connected-call volumes with comparatively healthy conversion results.</p>
              </div>

              <div className="olsr-insight">
                <div className="olsr-insight-icon">⚠️</div>
                <h4>Source Requires Review</h4>
                <p>COLD_LIST has the lowest connection and conversion performance in this sample and may require lead-quality or targeting review.</p>
              </div>
            </div>
          </section>

          {/* EXPORT BAR */}
          <section className="olsr-export-bar">
            <div>
              <h3>Export Lead Source Report</h3>
              <p>Export the filtered source-level data for analysis, sharing or external reporting.</p>
            </div>

            <div className="olsr-export-actions">
              <button className="olsr-export-btn" onClick={exportCSV}>
                ⇩ Export CSV
              </button>
              <button className="olsr-export-btn" onClick={exportExcel}>
                ⇩ Export Excel
              </button>
              <button className="olsr-export-btn" onClick={() => window.print()}>
                ⇩ PDF / Print
              </button>
            </div>
          </section>

          {/* FOOTER */}
          <div className="olsr-footer">
            CallZenza Analytics · Outbound Lead Source Report
          </div>
        </main>
      </div>
    </AppShell>
  );
}
