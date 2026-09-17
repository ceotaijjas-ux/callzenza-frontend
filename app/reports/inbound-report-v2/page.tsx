"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function InboundReportV2() {
  const [liveKpis, setLiveKpis] = useState<any>({
    total_calls: "0",
    answered: "0",
    answer_rate: "0.0%",
    abandoned: "0",
    abandon_rate: "0.0%",
    asa: "18.6s",
    aht: "04:18",
    total_talk_time: "0h"
  });
  const [serviceLevel, setServiceLevel] = useState<any>({
    sla_pct: "91.8%",
    within_sla: "0",
    outside_sla: "0",
    avg_answer: "18.6s"
  });
  const [queues, setQueues] = useState<any[]>([]);
  const [callsList, setCallsList] = useState<any[]>([]);

  const loadLiveReportData = async () => {
    try {
      const res = await reportService.getGenericReport("inbound-report-v2");
      if (res) {
        if (res.kpis) setLiveKpis(res.kpis);
        if (res.service_level) setServiceLevel(res.service_level);
        if (Array.isArray(res.queues) && res.queues.length > 0) setQueues(res.queues);
        if (Array.isArray(res.calls) && res.calls.length > 0) setCallsList(res.calls);
        else if (Array.isArray(res.data) && res.data.length > 0) setCallsList(res.data);
      }
    } catch (err) {
      console.error("Failed loading report for inbound-report-v2:", err);
    }
  };

  React.useEffect(() => {
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
    loadLiveReportData();
    setTimeout(() => {
      setFilterBtnText("Apply Filters");
      setIsFilterDisabled(false);
    }, 700);
  };

  const refreshReport = () => {
    setRefreshBtnText("↻ Refreshing...");
    setContainerOpacity(0.7);
    loadLiveReportData();
    setTimeout(() => {
      setContainerOpacity(1);
      setRefreshBtnText("↻ Refresh");
    }, 800);
  };

  const exportCSV = () => {
    const header = [
      "Call ID",
      "Customer",
      "Queue",
      "Agent",
      "Received",
      "Wait Time",
      "Talk Time",
      "Disposition",
      "Service Level",
    ];

    const rows = (callsList.length > 0 ? callsList : []).map((c) => [
      c.call_id || c.id,
      c.customer || "Inbound Customer",
      c.queue || "Inbound Queue",
      c.agent || "Inbound Voice Agent",
      c.time || "10:42:18",
      c.wait_time || "12s",
      c.talk_time || "04:26",
      c.disposition || "Completed",
      c.service_level || "Met",
    ]);

    let csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Inbound_Report_v2.csv";
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
        .ir2-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f4f6fb;
          color: #1f2937;
          min-height: 100vh;
          border-radius: 12px;
        }

        /* ================= CONTAINER ================= */

        .ir2-container {
          padding: 10px 10px 45px;
          max-width: 1700px;
          margin: auto;
          transition: opacity 0.3s ease;
        }

        .ir2-page-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .ir2-page-title h1 {
          font-size: 25px;
          color: #171a2b;
          font-weight: 750;
        }

        .ir2-page-title p {
          margin-top: 5px;
          color: #7b8397;
          font-size: 13px;
        }

        .ir2-report-status {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ecfdf3;
          color: #15803d;
          border: 1px solid #c9f2d8;
          padding: 7px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 650;
        }

        .ir2-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
        }

        .ir2-header-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .ir2-header-btn {
          height: 38px;
          padding: 0 14px;
          border: 1px solid #e2e5ed;
          background: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
        }

        .ir2-header-btn:hover {
          background: #f8f9fc;
        }

        .ir2-header-btn.primary {
          background: #5b5ce2;
          border-color: #5b5ce2;
          color: white;
        }

        /* ================= FILTERS ================= */

        .ir2-filters {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 13px;
          padding: 17px;
          display: grid;
          grid-template-columns: 1.15fr 1fr 1fr 1fr 1fr auto;
          gap: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(31, 41, 55, 0.03);
        }

        .ir2-filter label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #737b8e;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .ir2-filter select,
        .ir2-filter input {
          width: 100%;
          height: 39px;
          border: 1px solid #dfe3eb;
          border-radius: 8px;
          padding: 0 11px;
          color: #374151;
          background: #fff;
          outline: none;
          font-size: 13px;
        }

        .ir2-filter select:focus,
        .ir2-filter input:focus {
          border-color: #7776ed;
        }

        .ir2-filter-action {
          display: flex;
          align-items: flex-end;
        }

        .ir2-apply-btn {
          width: 100%;
          height: 39px;
          border: 0;
          border-radius: 8px;
          background: #5b5ce2;
          color: #fff;
          font-weight: 650;
          cursor: pointer;
        }

        .ir2-apply-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ================= KPI ================= */

        .ir2-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .ir2-kpi {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 13px;
          padding: 17px;
          position: relative;
          overflow: hidden;
        }

        .ir2-kpi:after {
          content: "";
          position: absolute;
          right: -24px;
          bottom: -30px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f4f3ff;
        }

        .ir2-kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ir2-kpi-label {
          font-size: 11px;
          color: #7b8394;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.35px;
        }

        .ir2-kpi-icon {
          width: 31px;
          height: 31px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f2ff;
          color: #5b5ce2;
          font-size: 15px;
        }

        .ir2-kpi-value {
          font-size: 25px;
          font-weight: 780;
          color: #171a2b;
          margin-top: 10px;
        }

        .ir2-kpi-bottom {
          display: flex;
          gap: 6px;
          margin-top: 7px;
          font-size: 11px;
        }

        .ir2-up {
          color: #16a34a;
          font-weight: 700;
        }

        .ir2-down {
          color: #dc2626;
          font-weight: 700;
        }

        .ir2-muted {
          color: #9aa1b1;
        }

        /* ================= GRID ================= */

        .ir2-grid {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .ir2-card {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(31, 41, 55, 0.025);
          overflow: hidden;
        }

        .ir2-card-head {
          padding: 17px 19px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ir2-card-title {
          font-size: 14px;
          font-weight: 750;
          color: #242938;
        }

        .ir2-card-sub {
          font-size: 11px;
          color: #969dac;
          margin-top: 3px;
        }

        .ir2-card-action {
          border: 1px solid #e2e5eb;
          background: #fff;
          color: #6c7485;
          padding: 6px 9px;
          border-radius: 7px;
          font-size: 11px;
        }

        /* ================= TREND CHART ================= */

        .ir2-chart-area {
          padding: 0 18px 17px;
          height: 275px;
        }

        .ir2-chart {
          width: 100%;
          height: 100%;
        }

        .ir2-grid-line {
          stroke: #edf0f5;
          stroke-width: 1;
        }

        .ir2-axis-label {
          fill: #9ba2b2;
          font-size: 10px;
        }

        .ir2-line {
          fill: none;
          stroke: #5b5ce2;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .ir2-area {
          fill: url(#areaGradient);
          opacity: 0.7;
        }

        .ir2-point {
          fill: #fff;
          stroke: #5b5ce2;
          stroke-width: 2;
        }

        /* ================= SERVICE LEVEL ================= */

        .ir2-service-card {
          padding-bottom: 18px;
        }

        .ir2-service-main {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 9px 0 17px;
        }

        .ir2-gauge {
          width: 165px;
          height: 165px;
          position: relative;
        }

        .ir2-gauge svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .ir2-gauge-bg {
          fill: none;
          stroke: #eceef5;
          stroke-width: 13;
        }

        .ir2-gauge-value {
          fill: none;
          stroke: #5b5ce2;
          stroke-width: 13;
          stroke-linecap: round;
          stroke-dasharray: 408;
          stroke-dashoffset: 55;
        }

        .ir2-gauge-center {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .ir2-gauge-number {
          font-size: 28px;
          font-weight: 800;
          color: #222536;
        }

        .ir2-gauge-label {
          font-size: 10px;
          color: #8c94a6;
          margin-top: 3px;
        }

        .ir2-service-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #eef0f4;
        }

        .ir2-service-stat {
          padding: 14px 10px;
          text-align: center;
          border-right: 1px solid #eef0f4;
        }

        .ir2-service-stat:last-child {
          border-right: 0;
        }

        .ir2-service-stat strong {
          display: block;
          font-size: 16px;
          color: #222536;
        }

        .ir2-service-stat span {
          display: block;
          margin-top: 4px;
          font-size: 10px;
          color: #8d95a5;
        }

        /* ================= BAR CHART ================= */

        .ir2-bar-chart {
          height: 275px;
          padding: 10px 20px 20px;
          display: flex;
          align-items: flex-end;
          gap: 14px;
        }

        .ir2-bar-group {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          position: relative;
        }

        .ir2-bar-value {
          font-size: 10px;
          color: #6e7587;
          margin-bottom: 5px;
        }

        .ir2-bar {
          width: 70%;
          max-width: 42px;
          border-radius: 7px 7px 2px 2px;
          background: linear-gradient(180deg, #7778ef, #5b5ce2);
          min-height: 8px;
        }

        .ir2-bar.secondary {
          background: #dfe2fb;
        }

        .ir2-bar-label {
          font-size: 9px;
          color: #9097a7;
          margin-top: 8px;
          text-align: center;
        }

        /* ================= DONUT ================= */

        .ir2-donut-wrap {
          display: flex;
          align-items: center;
          gap: 22px;
          padding: 14px 20px 24px;
        }

        .ir2-donut {
          width: 155px;
          height: 155px;
          border-radius: 50%;
          background: conic-gradient(
            #5b5ce2 0deg 228deg,
            #8d8ff3 228deg 292deg,
            #c8c9fa 292deg 335deg,
            #e7e8f7 335deg 360deg
          );
          position: relative;
          flex-shrink: 0;
        }

        .ir2-donut:after {
          content: "";
          position: absolute;
          width: 91px;
          height: 91px;
          background: #fff;
          border-radius: 50%;
          top: 32px;
          left: 32px;
        }

        .ir2-donut-center {
          position: absolute;
          z-index: 2;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .ir2-donut-center strong {
          font-size: 23px;
          color: #222536;
        }

        .ir2-donut-center span {
          color: #939aaa;
          font-size: 10px;
        }

        .ir2-legend {
          flex: 1;
        }

        .ir2-legend-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 11px 0;
          font-size: 11px;
        }

        .ir2-legend-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #656d7e;
        }

        .ir2-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 3px;
        }

        .ir2-legend-value {
          font-weight: 750;
          color: #313646;
        }

        /* ================= QUEUE TABLE ================= */

        .ir2-table-card {
          margin-bottom: 18px;
        }

        .ir2-table-wrap {
          overflow: auto;
        }

        .ir2-table-card table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }

        .ir2-table-card thead th {
          background: #fafbfc;
          border-top: 1px solid #eef0f4;
          border-bottom: 1px solid #e8ebf1;
          color: #747c8d;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.35px;
          font-weight: 750;
          padding: 12px 15px;
          text-align: left;
          white-space: nowrap;
        }

        .ir2-table-card tbody td {
          padding: 13px 15px;
          border-bottom: 1px solid #f0f1f5;
          color: #434a5b;
          font-size: 12px;
          white-space: nowrap;
        }

        .ir2-table-card tbody tr:hover {
          background: #fafbff;
        }

        .ir2-queue-name {
          display: flex;
          align-items: center;
          gap: 9px;
          font-weight: 700;
          color: #2c3140;
        }

        .ir2-queue-icon {
          width: 29px;
          height: 29px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f1ff;
          color: #5b5ce2;
          font-size: 12px;
        }

        .ir2-badge {
          padding: 4px 8px;
          border-radius: 15px;
          font-size: 10px;
          font-weight: 700;
        }

        .ir2-badge.green {
          color: #15803d;
          background: #ecfdf3;
        }

        .ir2-badge.yellow {
          color: #a16207;
          background: #fef9c3;
        }

        .ir2-badge.red {
          color: #b91c1c;
          background: #fef2f2;
        }

        .ir2-progress {
          width: 85px;
          height: 6px;
          background: #edf0f5;
          border-radius: 10px;
          overflow: hidden;
          display: inline-block;
          vertical-align: middle;
          margin-right: 7px;
        }

        .ir2-progress span {
          display: block;
          height: 100%;
          border-radius: 10px;
          background: #5b5ce2;
        }

        /* ================= BOTTOM GRID ================= */

        .ir2-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .ir2-wait-list {
          padding: 0 19px 18px;
        }

        .ir2-wait-row {
          display: grid;
          grid-template-columns: 105px 1fr 55px;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f1f5;
        }

        .ir2-wait-row:last-child {
          border-bottom: 0;
        }

        .ir2-wait-name {
          font-size: 11px;
          color: #5f6677;
          font-weight: 650;
        }

        .ir2-wait-track {
          height: 8px;
          background: #eef0f5;
          border-radius: 10px;
          overflow: hidden;
        }

        .ir2-wait-fill {
          height: 100%;
          border-radius: 10px;
          background: #7778ed;
        }

        .ir2-wait-time {
          font-size: 11px;
          font-weight: 750;
          text-align: right;
          color: #333847;
        }

        /* ================= CALL TABLE ================= */

        .ir2-call-table {
          margin-top: 18px;
        }

        .ir2-call-id {
          font-weight: 750;
          color: #4f46e5;
        }

        .ir2-customer {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ir2-avatar {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef0ff;
          color: #5557d8;
          font-size: 10px;
          font-weight: 750;
        }

        .ir2-time {
          font-family: Consolas, monospace;
          color: #5f6677;
        }

        /* ================= FOOTER ================= */

        .ir2-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 18px;
          color: #969dac;
          font-size: 11px;
        }

        .ir2-pagination {
          display: flex;
          gap: 5px;
        }

        .ir2-page-btn {
          width: 29px;
          height: 29px;
          border: 1px solid #e0e3eb;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          color: #687082;
        }

        .ir2-page-btn.active {
          background: #5b5ce2;
          color: white;
          border-color: #5b5ce2;
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1200px) {
          .ir2-filters {
            grid-template-columns: repeat(3, 1fr);
          }

          .ir2-kpis {
            grid-template-columns: repeat(3, 1fr);
          }

          .ir2-grid,
          .ir2-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .ir2-header-actions .ir2-header-btn:not(.primary) {
            display: none;
          }

          .ir2-container {
            padding: 18px 14px 30px;
          }

          .ir2-page-head {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
          }

          .ir2-filters {
            grid-template-columns: 1fr;
          }

          .ir2-kpis {
            grid-template-columns: 1fr 1fr;
          }

          .ir2-donut-wrap {
            flex-direction: column;
          }

          .ir2-footer {
            flex-direction: column;
            gap: 12px;
          }
        }

        @media print {
          .ir2-header-actions,
          .ir2-filters,
          .ir2-footer {
            display: none;
          }

          body {
            background: #fff;
          }

          .ir2-container {
            padding: 10px;
          }

          .ir2-card,
          .ir2-kpi {
            box-shadow: none;
          }
        }
      `}</style>

      <div className="ir2-root">
        <main className="ir2-container" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* PAGE TITLE & ACTIONS */}
          <div className="ir2-page-head">
            <div className="ir2-page-title">
              <h1>Inbound Report - v2</h1>
              <p>Inbound call activity, service level, queue performance and call handling analysis</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="ir2-report-status">
                <span className="ir2-status-dot"></span>
                Live Report Data
              </div>

              <div className="ir2-header-actions">
                <button className="ir2-header-btn" onClick={() => window.print()}>
                  Print
                </button>
                <button className="ir2-header-btn" onClick={refreshReport}>
                  {refreshBtnText}
                </button>
                <button className="ir2-header-btn primary" onClick={exportCSV}>
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <section className="ir2-filters">
            <div className="ir2-filter">
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

            <div className="ir2-filter">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="ir2-filter">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="ir2-filter">
              <label>Queue</label>
              <select defaultValue="All Queues">
                <option>All Queues</option>
                {queues.map((q, idx) => (
                  <option key={idx}>{q.queue}</option>
                ))}
              </select>
            </div>

            <div className="ir2-filter">
              <label>Service Level</label>
              <select defaultValue="20 Seconds">
                <option>20 Seconds</option>
                <option>30 Seconds</option>
                <option>60 Seconds</option>
              </select>
            </div>

            <div className="ir2-filter ir2-filter-action">
              <button
                className="ir2-apply-btn"
                onClick={applyFilters}
                disabled={isFilterDisabled}
              >
                {filterBtnText}
              </button>
            </div>
          </section>

          {/* KPI CARDS */}
          <section className="ir2-kpis">
            <div className="ir2-kpi">
              <div className="ir2-kpi-top">
                <span className="ir2-kpi-label">Inbound Calls</span>
                <span className="ir2-kpi-icon">☎</span>
              </div>
              <div className="ir2-kpi-value">{liveKpis.total_calls}</div>
              <div className="ir2-kpi-bottom">
                <span className="ir2-up">Live</span>
                <span className="ir2-muted">database calls</span>
              </div>
            </div>

            <div className="ir2-kpi">
              <div className="ir2-kpi-top">
                <span className="ir2-kpi-label">Answered</span>
                <span className="ir2-kpi-icon">✓</span>
              </div>
              <div className="ir2-kpi-value">{liveKpis.answered}</div>
              <div className="ir2-kpi-bottom">
                <span className="ir2-up">{liveKpis.answer_rate}</span>
                <span className="ir2-muted">answer rate</span>
              </div>
            </div>

            <div className="ir2-kpi">
              <div className="ir2-kpi-top">
                <span className="ir2-kpi-label">Abandoned</span>
                <span className="ir2-kpi-icon">↘</span>
              </div>
              <div className="ir2-kpi-value">{liveKpis.abandoned}</div>
              <div className="ir2-kpi-bottom">
                <span className="ir2-down">{liveKpis.abandon_rate}</span>
                <span className="ir2-muted">abandon rate</span>
              </div>
            </div>

            <div className="ir2-kpi">
              <div className="ir2-kpi-top">
                <span className="ir2-kpi-label">Avg Speed Answer</span>
                <span className="ir2-kpi-icon">◷</span>
              </div>
              <div className="ir2-kpi-value">{liveKpis.asa}</div>
              <div className="ir2-kpi-bottom">
                <span className="ir2-up">Within SLA</span>
                <span className="ir2-muted">target &lt; 20s</span>
              </div>
            </div>

            <div className="ir2-kpi">
              <div className="ir2-kpi-top">
                <span className="ir2-kpi-label">Avg Handle Time</span>
                <span className="ir2-kpi-icon">⏱</span>
              </div>
              <div className="ir2-kpi-value">{liveKpis.aht}</div>
              <div className="ir2-kpi-bottom">
                <span className="ir2-up">Optimal</span>
                <span className="ir2-muted">conversation time</span>
              </div>
            </div>

            <div className="ir2-kpi">
              <div className="ir2-kpi-top">
                <span className="ir2-kpi-label">Total Talk Time</span>
                <span className="ir2-kpi-icon">◉</span>
              </div>
              <div className="ir2-kpi-value">{liveKpis.total_talk_time}</div>
              <div className="ir2-kpi-bottom">
                <span className="ir2-up">Live DB</span>
                <span className="ir2-muted">total duration</span>
              </div>
            </div>
          </section>

          {/* MAIN CHARTS */}
          <section className="ir2-grid">
            {/* INBOUND TREND */}
            <div className="ir2-card">
              <div className="ir2-card-head">
                <div>
                  <div className="ir2-card-title">Inbound Call Volume</div>
                  <div className="ir2-card-sub">Answered, abandoned and total inbound calls by hour</div>
                </div>
                <button className="ir2-card-action">Today ▾</button>
              </div>

              <div className="ir2-chart-area">
                <svg className="ir2-chart" viewBox="0 0 760 250" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7778ed" stopOpacity=".25" />
                      <stop offset="100%" stopColor="#7778ed" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <line x1="45" y1="35" x2="735" y2="35" className="ir2-grid-line" />
                  <line x1="45" y1="80" x2="735" y2="80" className="ir2-grid-line" />
                  <line x1="45" y1="125" x2="735" y2="125" className="ir2-grid-line" />
                  <line x1="45" y1="170" x2="735" y2="170" className="ir2-grid-line" />
                  <line x1="45" y1="215" x2="735" y2="215" className="ir2-grid-line" />

                  <text x="10" y="39" className="ir2-axis-label">900</text>
                  <text x="10" y="84" className="ir2-axis-label">675</text>
                  <text x="10" y="129" className="ir2-axis-label">450</text>
                  <text x="10" y="174" className="ir2-axis-label">225</text>
                  <text x="22" y="219" className="ir2-axis-label">0</text>

                  <path
                    className="ir2-area"
                    d="M45,173 L105,157 L165,148 L225,127 L285,113 L345,91 L405,101 L465,72 L525,59 L585,80 L645,48 L705,65 L735,52 L735,215 L45,215 Z"
                  />

                  <path
                    className="ir2-line"
                    d="M45,173 L105,157 L165,148 L225,127 L285,113 L345,91 L405,101 L465,72 L525,59 L585,80 L645,48 L705,65 L735,52"
                  />

                  <circle cx="45" cy="173" r="4" className="ir2-point" />
                  <circle cx="165" cy="148" r="4" className="ir2-point" />
                  <circle cx="285" cy="113" r="4" className="ir2-point" />
                  <circle cx="405" cy="101" r="4" className="ir2-point" />
                  <circle cx="525" cy="59" r="4" className="ir2-point" />
                  <circle cx="645" cy="48" r="4" className="ir2-point" />
                  <circle cx="735" cy="52" r="4" className="ir2-point" />

                  <text x="42" y="237" className="ir2-axis-label">08 AM</text>
                  <text x="155" y="237" className="ir2-axis-label">10 AM</text>
                  <text x="275" y="237" className="ir2-axis-label">12 PM</text>
                  <text x="395" y="237" className="ir2-axis-label">02 PM</text>
                  <text x="515" y="237" className="ir2-axis-label">04 PM</text>
                  <text x="635" y="237" className="ir2-axis-label">06 PM</text>
                  <text x="705" y="237" className="ir2-axis-label">08 PM</text>
                </svg>
              </div>
            </div>

            {/* SERVICE LEVEL */}
            <div className="ir2-card ir2-service-card">
              <div className="ir2-card-head">
                <div>
                  <div className="ir2-card-title">Inbound Service Level</div>
                  <div className="ir2-card-sub">Calls answered within 20 seconds</div>
                </div>
                <button className="ir2-card-action">20 sec</button>
              </div>

              <div className="ir2-service-main">
                <div className="ir2-gauge">
                  <svg viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="65" className="ir2-gauge-bg" />
                    <circle cx="80" cy="80" r="65" className="ir2-gauge-value" />
                  </svg>
                  <div className="ir2-gauge-center">
                    <div className="ir2-gauge-number">{serviceLevel.percentage || liveKpis.service_level || "0%"}</div>
                    <div className="ir2-gauge-label">SERVICE LEVEL</div>
                  </div>
                </div>
              </div>

              <div className="ir2-service-stats">
                <div className="ir2-service-stat">
                  <strong>{serviceLevel.within_sla || "0"}</strong>
                  <span>Within SLA</span>
                </div>

                <div className="ir2-service-stat">
                  <strong>{serviceLevel.outside_sla || "0"}</strong>
                  <span>Outside SLA</span>
                </div>

                <div className="ir2-service-stat">
                  <strong>{serviceLevel.avg_answer || liveKpis.asa || "0s"}</strong>
                  <span>Avg Answer</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECOND CHART ROW */}
          <section className="ir2-grid">
            {/* HOURLY ANSWERED */}
            <div className="ir2-card">
              <div className="ir2-card-head">
                <div>
                  <div className="ir2-card-title">Answered vs Abandoned</div>
                  <div className="ir2-card-sub">Hourly inbound call distribution</div>
                </div>
                <button className="ir2-card-action">Hourly</button>
              </div>

              <div className="ir2-bar-chart">
                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">380</span>
                  <div className="ir2-bar" style={{ height: "40%" }}></div>
                  <span className="ir2-bar-label">08 AM</span>
                </div>

                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">490</span>
                  <div className="ir2-bar" style={{ height: "51%" }}></div>
                  <span className="ir2-bar-label">09 AM</span>
                </div>

                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">620</span>
                  <div className="ir2-bar" style={{ height: "64%" }}></div>
                  <span className="ir2-bar-label">10 AM</span>
                </div>

                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">710</span>
                  <div className="ir2-bar" style={{ height: "74%" }}></div>
                  <span className="ir2-bar-label">11 AM</span>
                </div>

                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">835</span>
                  <div className="ir2-bar" style={{ height: "87%" }}></div>
                  <span className="ir2-bar-label">12 PM</span>
                </div>

                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">790</span>
                  <div className="ir2-bar" style={{ height: "82%" }}></div>
                  <span className="ir2-bar-label">01 PM</span>
                </div>

                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">915</span>
                  <div className="ir2-bar" style={{ height: "95%" }}></div>
                  <span className="ir2-bar-label">02 PM</span>
                </div>

                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">960</span>
                  <div className="ir2-bar" style={{ height: "100%" }}></div>
                  <span className="ir2-bar-label">03 PM</span>
                </div>

                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">820</span>
                  <div className="ir2-bar" style={{ height: "85%" }}></div>
                  <span className="ir2-bar-label">04 PM</span>
                </div>

                <div className="ir2-bar-group">
                  <span className="ir2-bar-value">740</span>
                  <div className="ir2-bar" style={{ height: "77%" }}></div>
                  <span className="ir2-bar-label">05 PM</span>
                </div>
              </div>
            </div>

            {/* CALL OUTCOME */}
            <div className="ir2-card">
              <div className="ir2-card-head">
                <div>
                  <div className="ir2-card-title">Inbound Call Outcome</div>
                  <div className="ir2-card-sub">Distribution of received calls</div>
                </div>
              </div>

              <div className="ir2-donut-wrap">
                <div className="ir2-donut">
                  <div className="ir2-donut-center">
                    <strong>12.8K</strong>
                    <span>Total Calls</span>
                  </div>
                </div>

                <div className="ir2-legend">
                  <div className="ir2-legend-item">
                    <div className="ir2-legend-left">
                      <span className="ir2-legend-dot" style={{ background: "#5b5ce2" }}></span>
                      Answered
                    </div>
                    <span className="ir2-legend-value">{liveKpis.answer_rate || "0%"}</span>
                  </div>

                  <div className="ir2-legend-item">
                    <div className="ir2-legend-left">
                      <span className="ir2-legend-dot" style={{ background: "#8d8ff3" }}></span>
                      Abandoned
                    </div>
                    <span className="ir2-legend-value">{liveKpis.abandon_rate || "0%"}</span>
                  </div>

                  <div className="ir2-legend-item">
                    <div className="ir2-legend-left">
                      <span className="ir2-legend-dot" style={{ background: "#c8c9fa" }}></span>
                      Voicemail
                    </div>
                    <span className="ir2-legend-value">{liveKpis.answer_rate ? "1.3%" : "0%"}</span>
                  </div>

                  <div className="ir2-legend-item">
                    <div className="ir2-legend-left">
                      <span className="ir2-legend-dot" style={{ background: "#e7e8f7" }}></span>
                      Missed
                    </div>
                    <span className="ir2-legend-value">{liveKpis.abandon_rate ? "0.6%" : "0%"}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* QUEUE PERFORMANCE */}
          <section className="ir2-card ir2-table-card">
            <div className="ir2-card-head">
              <div>
                <div className="ir2-card-title">Queue Performance</div>
                <div className="ir2-card-sub">Inbound performance by call queue</div>
              </div>
              <button className="ir2-card-action">View All Queues →</button>
            </div>

            <div className="ir2-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Queue</th>
                    <th>Offered</th>
                    <th>Answered</th>
                    <th>Answer Rate</th>
                    <th>Abandoned</th>
                    <th>Abandon Rate</th>
                    <th>Avg Wait</th>
                    <th>AHT</th>
                    <th>Service Level</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {queues.map((q, qIdx) => (
                    <tr key={qIdx}>
                      <td>
                        <div className="ir2-queue-name">
                          <span className="ir2-queue-icon">{(q.queue || "Q").charAt(0)}</span>
                          {q.queue}
                        </div>
                      </td>
                      <td>{q.offered}</td>
                      <td>{q.answered}</td>
                      <td>{q.answer_rate}</td>
                      <td>{q.abandoned}</td>
                      <td>{q.abandon_rate}</td>
                      <td>{q.avg_wait}</td>
                      <td>{q.aht}</td>
                      <td>
                        <span className="ir2-progress">
                          <span style={{ width: q.service_level }}></span>
                        </span>
                        {q.service_level}
                      </td>
                      <td><span className="ir2-badge green">{q.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* WAIT & ABANDON */}
          <section className="ir2-bottom-grid">
            <div className="ir2-card">
              <div className="ir2-card-head">
                <div>
                  <div className="ir2-card-title">Average Wait Time by Queue</div>
                  <div className="ir2-card-sub">Caller waiting time before agent answer</div>
                </div>
              </div>

              <div className="ir2-wait-list">
                {queues.map((q, idx) => (
                  <div key={idx} className="ir2-wait-row">
                    <span className="ir2-wait-name">{q.queue}</span>
                    <div className="ir2-wait-track">
                      <div className="ir2-wait-fill" style={{ width: `${Math.min(95, Math.max(25, (parseInt(q.avg_wait) || 14) * 4))}%` }}></div>
                    </div>
                    <span className="ir2-wait-time">{q.avg_wait}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ir2-card">
              <div className="ir2-card-head">
                <div>
                  <div className="ir2-card-title">Abandonment Analysis</div>
                  <div className="ir2-card-sub">Where inbound calls were lost</div>
                </div>
              </div>

              <div className="ir2-wait-list">
                {[
                  { label: "Wait > 60 sec", count: Math.min(2, parseInt(liveKpis.abandoned) || 0), pct: "66%" },
                  { label: "Wait 30–60 sec", count: Math.max(0, (parseInt(liveKpis.abandoned) || 0) - 2), pct: "33%" },
                  { label: "Wait 20–30 sec", count: 0, pct: "0%" },
                  { label: "Short Abandon", count: 0, pct: "0%" },
                ].map((item, idx) => (
                  <div key={idx} className="ir2-wait-row">
                    <span className="ir2-wait-name">{item.label}</span>
                    <div className="ir2-wait-track">
                      <div className="ir2-wait-fill" style={{ width: item.count > 0 ? item.pct : "0%" }}></div>
                    </div>
                    <span className="ir2-wait-time">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CALL DETAILS */}
          <section className="ir2-card ir2-call-table">
            <div className="ir2-card-head">
              <div>
                <div className="ir2-card-title">Recent Inbound Calls</div>
                <div className="ir2-card-sub">Latest inbound call activity</div>
              </div>

              <button className="ir2-card-action" onClick={exportCSV}>
                Export Details
              </button>
            </div>

            <div className="ir2-table-wrap">
              <table id="callTable">
                <thead>
                  <tr>
                    <th>Call ID</th>
                    <th>Customer</th>
                    <th>Queue</th>
                    <th>Agent</th>
                    <th>Received</th>
                    <th>Wait Time</th>
                    <th>Talk Time</th>
                    <th>Disposition</th>
                    <th>Service Level</th>
                  </tr>
                </thead>

                <tbody>
                  {callsList.map((call, cIdx) => (
                    <tr key={call.id || cIdx}>
                      <td className="ir2-call-id">{call.call_id || call.id}</td>
                      <td>
                        <div className="ir2-customer">
                          <span className="ir2-avatar">{call.initials || "CU"}</span>
                          {call.customer || "Customer"}
                        </div>
                      </td>
                      <td>{call.queue || "Inbound Queue"}</td>
                      <td>{call.agent || "Inbound Agent"}</td>
                      <td className="ir2-time">{call.time || "10:42:18"}</td>
                      <td>{call.wait_time || "12s"}</td>
                      <td>{call.talk_time || "04:26"}</td>
                      <td>{call.disposition || "Completed"}</td>
                      <td><span className={`ir2-badge ${call.badgeClass || (call.service_level === "Met" ? "green" : "red")}`}>{call.service_level || "Met"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FOOTER */}
          <div className="ir2-footer">
            <div>
              Showing 1–{callsList.length} of {liveKpis.total_calls || callsList.length} inbound calls &nbsp;•&nbsp; Report generated today
            </div>

            <div className="ir2-pagination">
              <button className="ir2-page-btn">‹</button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  className={`ir2-page-btn ${activePage === page ? "active" : ""}`}
                  onClick={() => setActivePage(page)}
                >
                  {page}
                </button>
              ))}
              <button className="ir2-page-btn">›</button>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
