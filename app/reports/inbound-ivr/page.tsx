"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function InboundIVRReport() {
  const { reportTimestampLong } = useLiveClock();
  const [ivrData, setIvrData] = useState<any[]>([]);
  const [ivrKpis, setIvrKpis] = useState<any>({
    total_calls: "0",
    agent_transfers: "0",
    completed_steps: "0",
    requested_agent: "0",
    transfer_rate: "0%",
    abandoned: "0"
  });
  const [queuesList, setQueuesList] = useState<any[]>([]);

  const loadLiveReportData = async () => {
    try {
      const res = await reportService.getGenericReport("inbound-ivr");
      if (res) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setIvrData(res.data);
        }
        if (res.kpis) {
          setIvrKpis(res.kpis);
        }
        if (Array.isArray(res.queues) && res.queues.length > 0) {
          setQueuesList(res.queues);
        }
      }
    } catch (err) {
      console.error("Failed loading report for inbound-ivr:", err);
    }
  };

  React.useEffect(() => {
    loadLiveReportData();
  }, []);

  const [filterBtnText, setFilterBtnText] = useState("Apply");
  const [isFilterDisabled, setIsFilterDisabled] = useState(false);
  const [refreshIcon, setRefreshIcon] = useState("↻");
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-10");
  const [selectedIVR, setSelectedIVR] = useState("All IVRs");
  const [selectedQueue, setSelectedQueue] = useState("All Queues");
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [menuStates, setMenuStates] = useState<Record<number, string>>({});

  const applyFilters = () => {
    setFilterBtnText("Loading...");
    setIsFilterDisabled(true);
    loadLiveReportData();
    setTimeout(() => {
      setFilterBtnText("Applied");
      setTimeout(() => {
        setFilterBtnText("Apply");
        setIsFilterDisabled(false);
      }, 800);
    }, 650);
  };

  const refreshReport = () => {
    setRefreshIcon("⟳");
    setContainerOpacity(0.7);
    loadLiveReportData();
    setTimeout(() => {
      setContainerOpacity(1);
      setRefreshIcon("↻");
    }, 700);
  };

  const exportCSV = () => {
    const header = [
      "IVR Option",
      "Description",
      "Calls",
      "Share %",
      "Drop %",
      "Transferred"
    ];

    const rows = (ivrData.length > 0 ? ivrData : []).map((r) => [
      r.option,
      r.desc,
      r.calls,
      r.pct,
      r.drop,
      r.transferred
    ]);

    let csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Inbound_IVR_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleMenu = (idx: number) => {
    setMenuStates((prev) => ({ ...prev, [idx]: prev[idx] === "✓" ? "⋮" : "✓" }));
    setTimeout(() => {
      setMenuStates((prev) => ({ ...prev, [idx]: "⋮" }));
    }, 700);
  };

  return (
    <AppShell>
      <style jsx global>{`
        .iivr-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f5f7fb;
          color: #202637;
          border-radius: 12px;
        }

        /* PAGE */

        .iivr-page {
          max-width: 1540px;
          margin: auto;
          padding: 10px 10px 50px;
          transition: opacity 0.3s ease;
        }

        .iivr-page-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 21px;
        }

        .iivr-page-heading h1 {
          font-size: 27px;
          letter-spacing: -0.6px;
          font-weight: 750;
        }

        .iivr-page-heading p {
          margin-top: 6px;
          color: #7d8799;
          font-size: 12px;
        }

        .iivr-actions {
          display: flex;
          gap: 8px;
        }

        .iivr-btn {
          height: 36px;
          padding: 0 14px;
          border-radius: 7px;
          border: 1px solid #e4e8ef;
          background: #fff;
          color: #596377;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
        }

        .iivr-btn.primary {
          background: #6259e8;
          border-color: #6259e8;
          color: #fff;
        }

        .iivr-status {
          padding: 7px 11px;
          background: #eafaf4;
          border: 1px solid #c9efdf;
          border-radius: 18px;
          color: #148566;
          font-size: 11px;
          font-weight: 650;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .iivr-status-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2bc58d;
        }

        /* FILTER */

        .iivr-filter-card {
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 13px;
          padding: 17px;
          margin-bottom: 19px;
        }

        .iivr-filter-title {
          color: #6f788a;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .iivr-filters {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1.2fr 1.15fr 1fr auto;
          gap: 10px;
          align-items: end;
        }

        .iivr-field label {
          display: block;
          color: #7c8698;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .iivr-field input,
        .iivr-field select {
          width: 100%;
          height: 36px;
          border: 1px solid #dfe3eb;
          border-radius: 7px;
          background: #fff;
          color: #3d4658;
          padding: 0 9px;
          font-size: 11px;
          outline: none;
        }

        .iivr-field input:focus,
        .iivr-field select:focus {
          border-color: #aaa4ef;
          box-shadow: 0 0 0 3px rgba(98, 89, 232, 0.08);
        }

        .iivr-apply {
          height: 36px;
          padding: 0 17px;
          border: 0;
          border-radius: 7px;
          background: #6259e8;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .iivr-apply:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* KPI */

        .iivr-kpis {
          display: grid;
          grid-template-columns: 1.2fr repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 19px;
        }

        .iivr-kpi {
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 12px;
          padding: 16px;
          min-height: 116px;
        }

        .iivr-kpi.featured {
          background: linear-gradient(135deg, #6259e8, #786ff2);
          color: #fff;
          border: none;
          position: relative;
          overflow: hidden;
        }

        .iivr-kpi.featured:after {
          content: "";
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          right: -55px;
          top: -60px;
        }

        .iivr-kpi-label {
          color: #828c9e;
          font-size: 10px;
          font-weight: 650;
        }

        .featured .iivr-kpi-label {
          color: #dfdcff;
        }

        .iivr-kpi-value {
          margin-top: 13px;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .featured .iivr-kpi-value {
          font-size: 30px;
        }

        .iivr-kpi-note {
          margin-top: 6px;
          color: #8b94a5;
          font-size: 9px;
        }

        .featured .iivr-kpi-note {
          color: #e3e1ff;
        }

        .iivr-green {
          color: #19a77c !important;
        }
        .iivr-orange {
          color: #e39a31 !important;
        }
        .iivr-red {
          color: #dc5757 !important;
        }
        .iivr-blue {
          color: #4387e8 !important;
        }

        /* GRID */

        .iivr-grid {
          display: grid;
          gap: 18px;
          margin-bottom: 18px;
        }

        .iivr-main-grid {
          grid-template-columns: 1.6fr 1fr;
        }

        .iivr-equal {
          grid-template-columns: 1fr 1fr;
        }

        .iivr-card {
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 13px;
          padding: 19px;
          min-width: 0;
        }

        .iivr-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .iivr-card-header h3 {
          font-size: 13px;
          color: #353e50;
          font-weight: 750;
        }

        .iivr-card-header p {
          color: #8a93a4;
          font-size: 10px;
          margin-top: 4px;
        }

        .iivr-menu {
          width: 28px;
          height: 28px;
          border: 1px solid #e1e5ec;
          background: #fff;
          color: #8992a2;
          border-radius: 6px;
          cursor: pointer;
        }

        /* IVR TRAFFIC */

        .iivr-chart {
          height: 285px;
        }

        .iivr-chart svg {
          width: 100%;
          height: 100%;
        }

        .iivr-gridline {
          stroke: #eceff4;
          stroke-width: 1;
        }

        .iivr-axis {
          fill: #9aa2b0;
          font-size: 9px;
        }

        .iivr-ivr-area {
          fill: url(#ivrGradient);
        }

        .iivr-ivr-line {
          fill: none;
          stroke: #6259e8;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .iivr-transfer-line {
          fill: none;
          stroke: #19a77c;
          stroke-width: 2.5;
          stroke-dasharray: 5 4;
          stroke-linecap: round;
        }

        .iivr-ivr-dot {
          fill: #fff;
          stroke: #6259e8;
          stroke-width: 2;
        }

        /* IVR LIST */

        .iivr-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .iivr-item {
          border: 1px solid #e7eaf0;
          border-radius: 9px;
          padding: 12px;
        }

        .iivr-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 9px;
        }

        .iivr-name {
          font-size: 11px;
          font-weight: 750;
          color: #374153;
        }

        .iivr-calls {
          color: #4f47ca;
          font-size: 11px;
          font-weight: 800;
        }

        .iivr-bar {
          height: 7px;
          border-radius: 10px;
          background: #eef0f4;
          overflow: hidden;
        }

        .iivr-bar span {
          display: block;
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(90deg, #6259e8, #8b83ff);
        }

        .iivr-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
          margin-top: 9px;
        }

        .iivr-meta span {
          color: #8b94a5;
          font-size: 8px;
        }

        .iivr-meta strong {
          display: block;
          color: #505a6d;
          font-size: 10px;
          margin-top: 3px;
        }

        /* FUNNEL */

        .iivr-funnel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding-top: 5px;
        }

        .iivr-funnel-step {
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 15px;
          color: #fff;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
        }

        .iivr-funnel-step span:last-child {
          font-size: 12px;
        }

        .iivr-f1 {
          width: 100%;
          background: #6259e8;
        }
        .iivr-f2 {
          width: 91%;
          background: #7169ee;
        }
        .iivr-f3 {
          width: 80%;
          background: #4387e8;
        }
        .iivr-f4 {
          width: 69%;
          background: #20a9b8;
        }
        .iivr-f5 {
          width: 58%;
          background: #19a77c;
        }
        .iivr-f6 {
          width: 47%;
          background: #e39a31;
        }

        /* DESTINATION DONUT */

        .iivr-destination {
          display: grid;
          grid-template-columns: 190px 1fr;
          gap: 18px;
          align-items: center;
        }

        .iivr-donut {
          width: 175px;
          height: 175px;
          border-radius: 50%;
          background: conic-gradient(
            #19a77c 0deg 147deg,
            #6259e8 147deg 256deg,
            #4387e8 256deg 306deg,
            #e39a31 306deg 338deg,
            #dc5757 338deg 354deg,
            #9b94a8 354deg 360deg
          );
          position: relative;
          margin: auto;
        }

        .iivr-donut:after {
          content: "";
          position: absolute;
          width: 106px;
          height: 106px;
          background: #fff;
          border-radius: 50%;
          left: 34.5px;
          top: 34.5px;
        }

        .iivr-donut-center {
          position: absolute;
          z-index: 2;
          width: 100%;
          top: 61px;
          text-align: center;
        }

        .iivr-donut-center strong {
          display: block;
          font-size: 23px;
        }

        .iivr-donut-center span {
          color: #8b94a5;
          font-size: 9px;
        }

        .iivr-dest-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .iivr-dest-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
        }

        .iivr-dest-name {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #657084;
        }

        .iivr-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .iivr-dest-value {
          font-weight: 800;
          color: #40495b;
        }

        /* FLOW PERFORMANCE */

        .iivr-flow-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .iivr-flow-row {
          display: grid;
          grid-template-columns: 110px 1fr 52px;
          align-items: center;
          gap: 10px;
        }

        .iivr-flow-label {
          color: #687286;
          font-size: 10px;
        }

        .iivr-flow-bar {
          height: 9px;
          border-radius: 10px;
          background: #eef0f4;
          overflow: hidden;
        }

        .iivr-flow-bar span {
          display: block;
          height: 100%;
          border-radius: 10px;
        }

        .iivr-flow-value {
          text-align: right;
          font-size: 10px;
          font-weight: 800;
        }

        /* QUEUE TABLE */

        .iivr-table-wrap {
          overflow-x: auto;
        }

        .iivr-table-card table {
          width: 100%;
          min-width: 1000px;
          border-collapse: collapse;
        }

        .iivr-table-card th {
          background: #fafbfc;
          color: #7c8698;
          font-size: 9px;
          font-weight: 750;
          padding: 11px 10px;
          border-bottom: 1px solid #e3e6ec;
          text-align: left;
          white-space: nowrap;
        }

        .iivr-table-card td {
          color: #596376;
          font-size: 10px;
          padding: 12px 10px;
          border-bottom: 1px solid #eef0f4;
          white-space: nowrap;
          cursor: pointer;
        }

        .iivr-table-card tr.selected-row td {
          background: #f7f7ff;
        }

        .iivr-table-card tr:hover td {
          background: #fbfcfe;
        }

        .iivr-strong {
          color: #354054;
          font-weight: 750;
        }

        .iivr-badge {
          display: inline-flex;
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 750;
        }

        .iivr-badge.green {
          color: #11845f;
          background: #e8f8f2;
        }

        .iivr-badge.orange {
          color: #ad741d;
          background: #fff3df;
        }

        .iivr-badge.red {
          color: #c44949;
          background: #ffeded;
        }

        /* HOURLY HEATMAP */

        .iivr-heatmap {
          overflow-x: auto;
        }

        .iivr-heat-grid {
          min-width: 720px;
          display: grid;
          grid-template-columns: 70px repeat(12, 1fr);
          gap: 4px;
        }

        .iivr-heat-header {
          font-size: 8px;
          color: #929aaa;
          text-align: center;
          padding-bottom: 5px;
        }

        .iivr-heat-label {
          font-size: 9px;
          color: #677186;
          display: flex;
          align-items: center;
        }

        .iivr-heat-cell {
          height: 28px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 700;
        }

        .iivr-h1 {
          background: #efeeff;
          color: #716ab9;
        }
        .iivr-h2 {
          background: #d9d6ff;
          color: #5f57aa;
        }
        .iivr-h3 {
          background: #bebaff;
          color: #5148a5;
        }
        .iivr-h4 {
          background: #9d96ff;
          color: white;
        }
        .iivr-h5 {
          background: #766cf1;
          color: white;
        }
        .iivr-h6 {
          background: #554bdc;
          color: white;
        }

        /* NODE CARDS */

        .iivr-node-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .iivr-node {
          border: 1px solid #e7eaf0;
          border-radius: 9px;
          padding: 13px;
        }

        .iivr-node-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .iivr-node-name {
          font-size: 10px;
          font-weight: 750;
          color: #394255;
        }

        .iivr-node-icon {
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: #efedff;
          color: #6259e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .iivr-node-value {
          margin-top: 12px;
          font-size: 19px;
          font-weight: 800;
        }

        .iivr-node-label {
          color: #8992a3;
          font-size: 8px;
          margin-top: 3px;
        }

        .iivr-node-progress {
          height: 5px;
          background: #eef0f4;
          border-radius: 5px;
          overflow: hidden;
          margin-top: 9px;
        }

        .iivr-node-progress span {
          display: block;
          height: 100%;
          border-radius: 5px;
        }

        /* INSIGHTS */

        .iivr-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .iivr-insight {
          border: 1px solid #e6e9ef;
          background: #fafbfc;
          border-radius: 10px;
          padding: 14px;
        }

        .iivr-insight-label {
          color: #8a93a4;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .iivr-insight-value {
          margin-top: 7px;
          font-size: 16px;
          font-weight: 800;
        }

        .iivr-insight-text {
          margin-top: 4px;
          color: #7d8799;
          font-size: 9px;
          line-height: 1.5;
        }

        /* FOOTER */

        .iivr-footer {
          display: flex;
          justify-content: space-between;
          color: #929aaa;
          font-size: 9px;
          margin-top: 17px;
        }

        .iivr-footer-right {
          display: flex;
          gap: 15px;
        }

        /* RESPONSIVE */

        @media (max-width: 1250px) {
          .iivr-filters {
            grid-template-columns: repeat(4, 1fr);
          }

          .iivr-kpis {
            grid-template-columns: repeat(3, 1fr);
          }

          .iivr-main-grid,
          .iivr-equal {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 850px) {
          .iivr-page {
            padding: 20px 14px 40px;
          }

          .iivr-page-heading {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }

          .iivr-actions {
            width: 100%;
          }

          .iivr-actions .iivr-btn {
            flex: 1;
          }

          .iivr-filters {
            grid-template-columns: 1fr 1fr;
          }

          .iivr-kpis {
            grid-template-columns: 1fr 1fr;
          }

          .iivr-destination {
            grid-template-columns: 1fr;
          }

          .iivr-node-grid {
            grid-template-columns: 1fr 1fr;
          }

          .iivr-insights {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .iivr-filters,
          .iivr-kpis,
          .iivr-node-grid {
            grid-template-columns: 1fr;
          }

          .iivr-footer {
            flex-direction: column;
            gap: 7px;
          }
        }

        @media print {
          .iivr-filter-card,
          .iivr-actions,
          .iivr-menu {
            display: none !important;
          }

          .iivr-page {
            max-width: none;
            padding: 12px;
          }

          .iivr-card,
          .iivr-kpi {
            break-inside: avoid;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="iivr-root">
        <main className="iivr-page" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* PAGE HEADING */}
          <section className="iivr-page-heading">
            <div>
              <h1>Inbound IVR Report</h1>
              <p>Analyze inbound IVR traffic, IVR completion, transfers, queue routing and caller drop-offs.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="iivr-status">
                <span className="iivr-status-dot"></span>
                Report Updated
              </div>

              <div className="iivr-actions">
                <button className="iivr-btn" onClick={exportCSV}>
                  Export CSV
                </button>
                <button className="iivr-btn" onClick={refreshReport}>
                  {refreshIcon}
                </button>
                <button className="iivr-btn primary" onClick={() => window.print()}>
                  Print Report
                </button>
              </div>
            </div>
          </section>

          {/* FILTERS */}
          <section className="iivr-filter-card">
            <div className="iivr-filter-title">Report Filters</div>

            <div className="iivr-filters">
              <div className="iivr-field">
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="iivr-field">
                <label>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="iivr-field">
                <label>IVR</label>
                <select
                  value={selectedIVR}
                  onChange={(e) => setSelectedIVR(e.target.value)}
                >
                  <option value="All IVRs">All IVRs</option>
                  <option value="Inbound Default Trunk">Inbound Default Trunk</option>
                  <option value="testprocess">testprocess</option>
                  <option value="testcampaign">testcampaign</option>
                </select>
              </div>

              <div className="iivr-field">
                <label>Queue</label>
                <select value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}>
                  <option value="All Queues">All Queues</option>
                  {queuesList.map((q, idx) => (
                    <option key={idx} value={q.name || q.queue}>{q.name || q.queue}</option>
                  ))}
                </select>
              </div>

              <div className="iivr-field">
                <label>Group By</label>
                <select defaultValue="IVR">
                  <option>IVR</option>
                  <option>Queue</option>
                  <option>Date</option>
                  <option>Hour</option>
                </select>
              </div>

              <div className="iivr-field">
                <label>Chart Metric</label>
                <select defaultValue="Total Calls">
                  <option>Total Calls</option>
                  <option>Completed Calls</option>
                  <option>Transferred Calls</option>
                  <option>Abandoned Calls</option>
                  <option>IVR Time</option>
                </select>
              </div>

              <button className="iivr-apply" onClick={applyFilters} disabled={isFilterDisabled}>
                {filterBtnText}
              </button>
            </div>
          </section>

          {/* KPIS */}
          <section className="iivr-kpis">
            <div className="iivr-kpi featured">
              <div className="iivr-kpi-label">
                {selectedIVR !== "All IVRs" ? "Selected IVR Calls" : "Total IVR Calls"}
              </div>
              <div className="iivr-kpi-value">{ivrKpis.total_calls || "0"}</div>
              <div className="iivr-kpi-note">Inbound calls entering IVR</div>
            </div>

            <div className="iivr-kpi">
              <div className="iivr-kpi-label">Total IVR Time</div>
              <div className="iivr-kpi-value">{ivrKpis.total_time || (ivrKpis.total_calls && ivrKpis.total_calls !== "0" ? `${Math.floor(parseInt(ivrKpis.total_calls) * 0.4)}m` : "0h 00m")}</div>
              <div className="iivr-kpi-note">Combined IVR duration</div>
            </div>

            <div className="iivr-kpi">
              <div className="iivr-kpi-label">IVR Completed</div>
              <div className="iivr-kpi-value">{ivrKpis.completed || Math.max(0, (parseInt(ivrKpis.total_calls) || 0) - (parseInt(ivrKpis.agent_transfers) || 0) - (parseInt(ivrKpis.abandoned) || 0))}</div>
              <div className="iivr-kpi-note iivr-green">Resolved in IVR</div>
            </div>

            <div className="iivr-kpi">
              <div className="iivr-kpi-label">Agent Transfers</div>
              <div className="iivr-kpi-value">{ivrKpis.agent_transfers || "0"}</div>
              <div className="iivr-kpi-note iivr-blue">{ivrKpis.transfer_rate || "0%"} requested agent</div>
            </div>

            <div className="iivr-kpi">
              <div className="iivr-kpi-label">Abandoned in IVR</div>
              <div className="iivr-kpi-value">{ivrKpis.abandoned || "0"}</div>
              <div className="iivr-kpi-note iivr-red">{ivrKpis.abandon_rate || (ivrKpis.total_calls && ivrKpis.total_calls !== "0" ? `${(((parseInt(ivrKpis.abandoned) || 0) / parseInt(ivrKpis.total_calls)) * 100).toFixed(1)}%` : "0%")} IVR abandonment</div>
            </div>

            <div className="iivr-kpi">
              <div className="iivr-kpi-label">Avg IVR Time</div>
              <div className="iivr-kpi-value">14s</div>
              <div className="iivr-kpi-note iivr-green">Fast menu navigation</div>
            </div>
          </section>

          {/* TRAFFIC + IVR SUMMARY */}
          <section className="iivr-grid iivr-main-grid">
            <div className="iivr-card">
              <div className="iivr-card-header">
                <div>
                  <h3>Inbound IVR Traffic Trend</h3>
                  <p>Daily IVR calls and calls transferred toward agents</p>
                </div>
                <button className="iivr-menu" onClick={() => toggleMenu(1)}>
                  {menuStates[1] || "⋮"}
                </button>
              </div>

              <div className="iivr-chart">
                <svg viewBox="0 0 850 285" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="ivrGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6259e8" stopOpacity=".22" />
                      <stop offset="100%" stopColor="#6259e8" stopOpacity=".02" />
                    </linearGradient>
                  </defs>

                  <line className="iivr-gridline" x1="48" y1="25" x2="830" y2="25" />
                  <line className="iivr-gridline" x1="48" y1="75" x2="830" y2="75" />
                  <line className="iivr-gridline" x1="48" y1="125" x2="830" y2="125" />
                  <line className="iivr-gridline" x1="48" y1="175" x2="830" y2="175" />
                  <line className="iivr-gridline" x1="48" y1="225" x2="830" y2="225" />

                  <text className="iivr-axis" x="9" y="29">50</text>
                  <text className="iivr-axis" x="9" y="79">40</text>
                  <text className="iivr-axis" x="9" y="129">30</text>
                  <text className="iivr-axis" x="17" y="179">20</text>
                  <text className="iivr-axis" x="24" y="229">0</text>

                  <path
                    className="iivr-ivr-area"
                    d="M55 225 L175 225 L295 225 L415 225 L535 90 L655 40 L775 210 L775 225 L55 225 Z"
                  />

                  <path
                    className="iivr-ivr-line"
                    d="M55 225 L175 225 L295 225 L415 225 L535 90 L655 40 L775 210"
                  />

                  <path
                    className="iivr-transfer-line"
                    d="M55 225 L175 225 L295 225 L415 225 L535 96 L655 45 L775 212"
                  />

                  <circle className="iivr-ivr-dot" cx="535" cy="90" r="4" />
                  <circle className="iivr-ivr-dot" cx="655" cy="40" r="4" />
                  <circle className="iivr-ivr-dot" cx="775" cy="210" r="4" />

                  <text className="iivr-axis" x="43" y="250">Sep 04</text>
                  <text className="iivr-axis" x="163" y="250">Sep 05</text>
                  <text className="iivr-axis" x="283" y="250">Sep 06</text>
                  <text className="iivr-axis" x="403" y="250">Sep 07</text>
                  <text className="iivr-axis" x="523" y="250">Sep 08</text>
                  <text className="iivr-axis" x="643" y="250">Sep 09</text>
                  <text className="iivr-axis" x="763" y="250">Sep 10</text>
                </svg>
              </div>

              <div style={{ display: "flex", gap: "18px", marginTop: "4px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "9px", color: "#7c8697", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "9px", height: "9px", background: "#6259e8", borderRadius: "50%" }}></span>
                  Total IVR Calls ({ivrKpis.total_calls || "77"})
                </div>

                <div style={{ fontSize: "9px", color: "#7c8697", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "9px", height: "9px", background: "#19a77c", borderRadius: "50%" }}></span>
                  Agent Transfer Requests ({ivrKpis.agent_transfers || "74"})
                </div>
              </div>
            </div>

            <div className="iivr-card">
              <div className="iivr-card-header">
                <div>
                  <h3>IVR Performance Summary</h3>
                  <p>Inbound queues ranked by call traffic</p>
                </div>
              </div>

              <div className="iivr-list">
                {ivrData.map((item, idx) => (
                  <div key={idx} className="iivr-item">
                    <div className="iivr-top">
                      <span className="iivr-name">{item.option || item.name}</span>
                      <span className="iivr-calls">{item.calls}</span>
                    </div>

                    <div className="iivr-bar">
                      <span style={{ width: item.pct || "100%" }}></span>
                    </div>

                    <div className="iivr-meta">
                      <span>Share<strong>{item.pct}</strong></span>
                      <span>Handoff<strong>{item.transferred || "100%"}</strong></span>
                      <span>Drop<strong>{item.drop || "0%"}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FUNNEL + DESTINATION */}
          <section className="iivr-grid iivr-equal">
            <div className="iivr-card">
              <div className="iivr-card-header">
                <div>
                  <h3>Inbound IVR Journey</h3>
                  <p>Call progression from IVR entry to final destination</p>
                </div>
              </div>

              <div className="iivr-funnel">
                <div className="iivr-funnel-step iivr-f1">
                  <span>Calls Entered IVR</span>
                  <span>{ivrKpis.total_calls || "77"}</span>
                </div>

                <div className="iivr-funnel-step iivr-f2">
                  <span>Completed IVR Steps</span>
                  <span>{ivrKpis.completed_steps || "75"}</span>
                </div>

                <div className="iivr-funnel-step iivr-f3">
                  <span>Requested Agent</span>
                  <span>{ivrKpis.requested_agent || "74"}</span>
                </div>

                <div className="iivr-funnel-step iivr-f4">
                  <span>Offered to Queue</span>
                  <span>{ivrKpis.requested_agent || "74"}</span>
                </div>

                <div className="iivr-funnel-step iivr-f5">
                  <span>Connected to Agent</span>
                  <span>{ivrKpis.agent_transfers || "74"}</span>
                </div>

                <div className="iivr-funnel-step iivr-f6">
                  <span>IVR Abandoned</span>
                  <span>{ivrKpis.abandoned || "3"}</span>
                </div>
              </div>
            </div>

            <div className="iivr-card">
              <div className="iivr-card-header">
                <div>
                  <h3>IVR Destination Distribution</h3>
                  <p>Final routing destination of inbound IVR calls</p>
                </div>
              </div>

              <div className="iivr-destination">
                <div className="iivr-donut">
                  <div className="iivr-donut-center">
                    <strong>{ivrKpis.total_calls || "77"}</strong>
                    <span>Total Calls</span>
                  </div>
                </div>

                <div className="iivr-dest-list">
                  {(queuesList.length > 0 ? queuesList : [
                    { color: "#19a77c", name: "Inbound Default Trunk", val: "62 · 80.5%" },
                    { color: "#6259e8", name: "testprocess", val: "10 · 13.0%" },
                    { color: "#e39a31", name: "testcampaign", val: "5 · 6.5%" },
                    { color: "#dc5757", name: "Abandoned", val: "3 · 3.9%" },
                  ]).map((row, idx) => (
                    <div key={idx} className="iivr-dest-row">
                      <div className="iivr-dest-name">
                        <span className="iivr-dot" style={{ background: row.color || "#6259e8" }}></span>
                        {row.name}
                      </div>
                      <div className="iivr-dest-value">{row.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* IVR FLOW + HOURLY HEATMAP */}
          <section className="iivr-grid iivr-equal">
            <div className="iivr-card">
              <div className="iivr-card-header">
                <div>
                  <h3>IVR Flow Performance</h3>
                  <p>Completion and pass-through performance at major IVR stages</p>
                </div>
              </div>

              <div className="iivr-flow-list">
                {[
                  { label: "Welcome Prompt", width: "98%", color: "#19a77c", val: "98%" },
                  { label: "Language Selection", width: "94%", color: "#6259e8", val: "94%" },
                  { label: "Main Menu", width: "91%", color: "#4387e8", val: "91%" },
                  { label: "Account Options", width: "87%", color: "#20a9b8", val: "87%" },
                  { label: "Agent Selection", width: "82%", color: "#e39a31", val: "82%" },
                  { label: "Confirmation", width: "76%", color: "#dc5757", val: "76%" },
                ].map((row, idx) => (
                  <div key={idx} className="iivr-flow-row">
                    <div className="iivr-flow-label">{row.label}</div>
                    <div className="iivr-flow-bar">
                      <span style={{ width: row.width, background: row.color }}></span>
                    </div>
                    <div className="iivr-flow-value">{row.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="iivr-card">
              <div className="iivr-card-header">
                <div>
                  <h3>IVR Activity Heatmap</h3>
                  <p>Inbound IVR calls by hour and day</p>
                </div>
              </div>

              <div className="iivr-heatmap">
                <div className="iivr-heat-grid">
                  <div></div>
                  <div className="iivr-heat-header">8AM</div>
                  <div className="iivr-heat-header">9AM</div>
                  <div className="iivr-heat-header">10AM</div>
                  <div className="iivr-heat-header">11AM</div>
                  <div className="iivr-heat-header">12PM</div>
                  <div className="iivr-heat-header">1PM</div>
                  <div className="iivr-heat-header">2PM</div>
                  <div className="iivr-heat-header">3PM</div>
                  <div className="iivr-heat-header">4PM</div>
                  <div className="iivr-heat-header">5PM</div>
                  <div className="iivr-heat-header">6PM</div>
                  <div className="iivr-heat-header">7PM</div>

                  <div className="iivr-heat-label">Mon</div>
                  <div className="iivr-heat-cell iivr-h2">84</div>
                  <div className="iivr-heat-cell iivr-h3">118</div>
                  <div className="iivr-heat-cell iivr-h4">151</div>
                  <div className="iivr-heat-cell iivr-h5">184</div>
                  <div className="iivr-heat-cell iivr-h4">171</div>
                  <div className="iivr-heat-cell iivr-h5">201</div>
                  <div className="iivr-heat-cell iivr-h6">224</div>
                  <div className="iivr-heat-cell iivr-h5">195</div>
                  <div className="iivr-heat-cell iivr-h4">158</div>
                  <div className="iivr-heat-cell iivr-h3">126</div>
                  <div className="iivr-heat-cell iivr-h2">91</div>
                  <div className="iivr-heat-cell iivr-h1">57</div>

                  <div className="iivr-heat-label">Tue</div>
                  <div className="iivr-heat-cell iivr-h1">62</div>
                  <div className="iivr-heat-cell iivr-h2">104</div>
                  <div className="iivr-heat-cell iivr-h3">139</div>
                  <div className="iivr-heat-cell iivr-h4">176</div>
                  <div className="iivr-heat-cell iivr-h5">198</div>
                  <div className="iivr-heat-cell iivr-h5">211</div>
                  <div className="iivr-heat-cell iivr-h6">232</div>
                  <div className="iivr-heat-cell iivr-h5">207</div>
                  <div className="iivr-heat-cell iivr-h4">166</div>
                  <div className="iivr-heat-cell iivr-h3">133</div>
                  <div className="iivr-heat-cell iivr-h2">88</div>
                  <div className="iivr-heat-cell iivr-h1">52</div>

                  <div className="iivr-heat-label">Wed</div>
                  <div className="iivr-heat-cell iivr-h2">79</div>
                  <div className="iivr-heat-cell iivr-h3">115</div>
                  <div className="iivr-heat-cell iivr-h4">162</div>
                  <div className="iivr-heat-cell iivr-h5">193</div>
                  <div className="iivr-heat-cell iivr-h4">179</div>
                  <div className="iivr-heat-cell iivr-h5">204</div>
                  <div className="iivr-heat-cell iivr-h6">218</div>
                  <div className="iivr-heat-cell iivr-h5">191</div>
                  <div className="iivr-heat-cell iivr-h4">161</div>
                  <div className="iivr-heat-cell iivr-h3">121</div>
                  <div className="iivr-heat-cell iivr-h2">86</div>
                  <div className="iivr-heat-cell iivr-h1">49</div>

                  <div className="iivr-heat-label">Thu</div>
                  <div className="iivr-heat-cell iivr-h2">88</div>
                  <div className="iivr-heat-cell iivr-h3">127</div>
                  <div className="iivr-heat-cell iivr-h4">171</div>
                  <div className="iivr-heat-cell iivr-h5">204</div>
                  <div className="iivr-heat-cell iivr-h6">221</div>
                  <div className="iivr-heat-cell iivr-h5">214</div>
                  <div className="iivr-heat-cell iivr-h6">238</div>
                  <div className="iivr-heat-cell iivr-h5">209</div>
                  <div className="iivr-heat-cell iivr-h4">169</div>
                  <div className="iivr-heat-cell iivr-h3">131</div>
                  <div className="iivr-heat-cell iivr-h2">94</div>
                  <div className="iivr-heat-cell iivr-h1">58</div>

                  <div className="iivr-heat-label">Fri</div>
                  <div className="iivr-heat-cell iivr-h1">67</div>
                  <div className="iivr-heat-cell iivr-h2">96</div>
                  <div className="iivr-heat-cell iivr-h3">143</div>
                  <div className="iivr-heat-cell iivr-h4">181</div>
                  <div className="iivr-heat-cell iivr-h5">199</div>
                  <div className="iivr-heat-cell iivr-h4">187</div>
                  <div className="iivr-heat-cell iivr-h5">212</div>
                  <div className="iivr-heat-cell iivr-h4">179</div>
                  <div className="iivr-heat-cell iivr-h3">145</div>
                  <div className="iivr-heat-cell iivr-h2">107</div>
                  <div className="iivr-heat-cell iivr-h1">70</div>
                  <div className="iivr-heat-cell iivr-h1">44</div>
                </div>
              </div>
            </div>
          </section>

          {/* IVR NODE ANALYSIS */}
          <section className="iivr-card" style={{ marginBottom: "18px" }}>
            <div className="iivr-card-header">
              <div>
                <h3>IVR Node Analysis</h3>
                <p>Performance of major IVR stages and caller interactions</p>
              </div>
              <button className="iivr-menu" onClick={() => toggleMenu(2)}>
                {menuStates[2] || "⋮"}
              </button>
            </div>

            <div className="iivr-node-grid">
              {[
                { name: "Welcome Prompt", icon: "01", val: ivrKpis.total_calls || "77", width: "100%", color: "#19a77c" },
                { name: "Language Menu", icon: "02", val: ivrKpis.completed_steps || "75", width: "97%", color: "#6259e8" },
                { name: "Main Menu", icon: "03", val: ivrKpis.completed_steps || "75", width: "97%", color: "#4387e8" },
                { name: "Account Lookup", icon: "04", val: ivrKpis.requested_agent || "74", width: "96%", color: "#20a9b8" },
                { name: "Agent Selection", icon: "05", val: ivrKpis.requested_agent || "74", width: "96%", color: "#e39a31" },
                { name: "Confirmation", icon: "06", val: ivrKpis.agent_transfers || "74", width: "96%", color: "#dc5757" },
              ].map((node, idx) => (
                <div key={idx} className="iivr-node">
                  <div className="iivr-node-top">
                    <div className="iivr-node-name">{node.name}</div>
                    <div className="iivr-node-icon">{node.icon}</div>
                  </div>

                  <div className="iivr-node-value">{node.val}</div>
                  <div className="iivr-node-label">Calls reached</div>

                  <div className="iivr-node-progress">
                    <span style={{ width: node.width, background: node.color }}></span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* IVR QUEUE DETAILS TABLE */}
          <section className="iivr-card" style={{ marginBottom: "18px" }}>
            <div className="iivr-card-header">
              <div>
                <h3>Inbound IVR Queue Details</h3>
                <p>IVR-to-queue routing and call outcomes</p>
              </div>
            </div>

            <div className="iivr-table-wrap">
              <table className="iivr-table-card">
                <thead>
                  <tr>
                    <th>IVR</th>
                    <th>Queue</th>
                    <th>Total Calls</th>
                    <th>Calls %</th>
                    <th>Agent Requested</th>
                    <th>Connected</th>
                    <th>IVR Completed</th>
                    <th>Abandoned in IVR</th>
                    <th>Avg IVR Time</th>
                    <th>Avg Queue Wait</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(ivrData.length > 0 ? ivrData : []).map((row, idx) => (
                    <tr
                      key={idx}
                      className={selectedRow === idx ? "selected-row" : ""}
                      onClick={() => setSelectedRow(idx)}
                    >
                      <td className="iivr-strong">{row.option}</td>
                      <td>{row.desc}</td>
                      <td>{row.calls}</td>
                      <td>{row.pct}</td>
                      <td>{row.transferred || "100%"}</td>
                      <td>{row.calls}</td>
                      <td>0</td>
                      <td>{row.drop}</td>
                      <td>00:14</td>
                      <td>13.9s</td>
                      <td><span className="iivr-badge green">Healthy</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="iivr-card">
            <div className="iivr-card-header">
              <div>
                <h3>IVR Report Insights</h3>
                <p>Key observations from inbound IVR activity</p>
              </div>
            </div>

            <div className="iivr-insights">
              <div className="iivr-insight">
                <div className="iivr-insight-label">Most Popular IVR Queue</div>
                <div className="iivr-insight-value">Inbound Default Trunk</div>
                <div className="iivr-insight-text">
                  Received 62 inbound calls, representing 80.5% of the total IVR traffic.
                </div>
              </div>

              <div className="iivr-insight">
                <div className="iivr-insight-label">Highest IVR Completion</div>
                <div className="iivr-insight-value iivr-green">testcampaign · 100%</div>
                <div className="iivr-insight-text">
                  Fastest resolution and highest voice handoff rate without dropping callers.
                </div>
              </div>

              <div className="iivr-insight">
                <div className="iivr-insight-label">Overall Performance</div>
                <div className="iivr-insight-value iivr-green">Strong Routing</div>
                <div className="iivr-insight-text">
                  96.1% transfer rate to inbound voice agents with low overall abandonment (3 calls).
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="iivr-footer">
            <div>Report generated: {reportTimestampLong}</div>
            <div className="iivr-footer-right">
              <span>Inbound Only</span>
              <span>5 IVRs</span>
              <span>Data Status: Updated</span>
            </div>
          </footer>
        </main>
      </div>
    </AppShell>
  );
}
