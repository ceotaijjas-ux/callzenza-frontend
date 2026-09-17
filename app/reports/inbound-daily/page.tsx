"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function InboundDailyReport() {
  const { reportTimestampLong } = useLiveClock();
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [liveKpis, setLiveKpis] = useState<any>({
    total_inbound: "0",
    total_answered: "0",
    total_abandoned: "0",
    service_level: "0%",
    answer_rate: "0%"
  });
  const [queuesList, setQueuesList] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState("All Queues");

  const loadLiveReportData = async () => {
    try {
      const res = await reportService.getGenericReport("inbound-daily");
      if (res) {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDailyData(res.data);
        }
        if (res.kpis) {
          setLiveKpis(res.kpis);
        }
        if (Array.isArray(res.queues) && res.queues.length > 0) {
          setQueuesList(res.queues);
        }
      }
    } catch (err) {
      console.error("Failed loading report for inbound-daily:", err);
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
  const [dateRange, setDateRange] = useState("Last 7 Days");
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

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
      "Date",
      "Calls Received",
      "Answered",
      "Answer Rate",
      "Abandoned",
      "Abandon Rate",
      "Within SLA",
      "Service Level",
      "ASA",
      "Avg Talk",
      "Status"
    ];

    const rows = (dailyData.length > 0 ? dailyData : []).map((row) => [
      row.day || row.date,
      row.calls,
      row.answered,
      row.answer_rate || "94.2%",
      row.abandoned,
      "5.8%",
      row.answered,
      row.sla || "92.0%",
      row.avg_wait || "14s",
      row.talk_time || "04:18",
      "On Target"
    ]);

    let csv = [header, ...rows]
      .map((r) => r.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Inbound_Daily_Report.csv";
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
    } else if (val === "Last 7 Days") {
      setFromDate("2026-09-01");
      setToDate("2026-09-07");
    } else if (val === "Last 30 Days") {
      setFromDate("2026-08-09");
      setToDate("2026-09-07");
    }
  };

  return (
    <AppShell>
      <style jsx global>{`
        .idr-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f5f6fa;
          color: #202637;
          border-radius: 12px;
        }

        /* MAIN */

        .idr-container {
          max-width: 1540px;
          margin: auto;
          padding: 10px 10px 45px;
          transition: opacity 0.3s ease;
        }

        .idr-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 23px;
        }

        .idr-heading h1 {
          font-size: 27px;
          letter-spacing: -0.6px;
          font-weight: 750;
        }

        .idr-heading p {
          color: #7d8799;
          font-size: 12px;
          margin-top: 6px;
        }

        .idr-heading-actions {
          display: flex;
          gap: 8px;
        }

        .idr-btn {
          height: 36px;
          border: 1px solid #e5e8ef;
          background: white;
          color: #596377;
          padding: 0 14px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
        }

        .idr-btn:hover {
          background: #fafbfc;
        }

        .idr-btn.primary {
          background: #6259e8;
          color: white;
          border-color: #6259e8;
        }

        .idr-status {
          padding: 7px 11px;
          border: 1px solid #c9efdf;
          background: #eafaf4;
          border-radius: 18px;
          color: #148566;
          font-size: 11px;
          font-weight: 650;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .idr-status-dot {
          width: 7px;
          height: 7px;
          background: #2bc58d;
          border-radius: 50%;
        }

        /* FILTERS */

        .idr-filters {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 13px;
          padding: 17px;
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 1.15fr 1.1fr 1fr auto;
          gap: 11px;
          align-items: end;
          margin-bottom: 20px;
        }

        .idr-field label {
          display: block;
          font-size: 10px;
          color: #7b8598;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .idr-field input,
        .idr-field select {
          width: 100%;
          height: 36px;
          border: 1px solid #dfe3eb;
          border-radius: 7px;
          padding: 0 9px;
          color: #3e4759;
          font-size: 11px;
          outline: none;
          background: white;
        }

        .idr-field input:focus,
        .idr-field select:focus {
          border-color: #a9a4f1;
          box-shadow: 0 0 0 3px rgba(98, 89, 232, 0.08);
        }

        .idr-apply {
          height: 36px;
          border: 0;
          background: #6259e8;
          color: white;
          padding: 0 17px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .idr-apply:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* DAILY SUMMARY */

        .idr-summary {
          display: grid;
          grid-template-columns: 1.25fr repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 19px;
        }

        .idr-summary-card {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 12px;
          padding: 17px;
          min-height: 116px;
        }

        .idr-summary-card.primary-card {
          background: linear-gradient(135deg, #6259e8, #766df1);
          border: none;
          color: #fff;
          position: relative;
          overflow: hidden;
        }

        .primary-card:after {
          content: "";
          position: absolute;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          right: -55px;
          top: -50px;
        }

        .idr-small-label {
          font-size: 10px;
          color: #8790a1;
          font-weight: 650;
        }

        .primary-card .idr-small-label {
          color: #dcd9ff;
        }

        .idr-big-number {
          font-size: 26px;
          font-weight: 800;
          margin-top: 13px;
          letter-spacing: -0.5px;
        }

        .primary-card .idr-big-number {
          font-size: 30px;
        }

        .idr-card-foot {
          margin-top: 6px;
          font-size: 9px;
          color: #8b94a5;
        }

        .primary-card .idr-card-foot {
          color: #dedcff;
        }

        .idr-green {
          color: #16a579 !important;
        }

        .idr-red {
          color: #df5757 !important;
        }

        .idr-orange {
          color: #e49a32 !important;
        }

        .idr-blue {
          color: #4387e8 !important;
        }

        /* MAIN GRID */

        .idr-grid {
          display: grid;
          gap: 18px;
          margin-bottom: 18px;
        }

        .idr-grid-main {
          grid-template-columns: 1.65fr 1fr;
        }

        .idr-grid-two {
          grid-template-columns: 1fr 1fr;
        }

        .idr-card {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 13px;
          padding: 19px;
          min-width: 0;
        }

        .idr-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .idr-card-head h3 {
          font-size: 13px;
          font-weight: 750;
          color: #353e50;
        }

        .idr-card-head p {
          color: #8a93a4;
          font-size: 10px;
          margin-top: 4px;
        }

        .idr-more {
          border: 1px solid #e1e5ec;
          background: white;
          color: #8992a2;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
        }

        /* DAILY VOLUME CHART */

        .idr-chart-wrap {
          height: 275px;
          position: relative;
        }

        .idr-chart-svg {
          width: 100%;
          height: 100%;
        }

        .idr-gridline {
          stroke: #eceff4;
          stroke-width: 1;
        }

        .idr-axis {
          fill: #9aa2b0;
          font-size: 9px;
        }

        .idr-volume-area {
          fill: url(#volumeGradient);
        }

        .idr-volume-line {
          fill: none;
          stroke: #6259e8;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .idr-answer-line {
          fill: none;
          stroke: #19a77b;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 5 4;
        }

        .idr-dot {
          fill: #fff;
          stroke: #6259e8;
          stroke-width: 2;
        }

        .idr-legend {
          display: flex;
          gap: 14px;
          margin-top: 17px;
          flex-wrap: wrap;
        }

        .idr-legend-item {
          font-size: 9px;
          color: #7c8697;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .idr-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        /* HEATMAP */

        .idr-heatmap {
          overflow-x: auto;
        }

        .idr-heat-grid {
          min-width: 670px;
          display: grid;
          grid-template-columns: 85px repeat(12, 1fr);
          gap: 4px;
        }

        .idr-heat-header {
          font-size: 8px;
          color: #929aaa;
          text-align: center;
          padding-bottom: 6px;
        }

        .idr-heat-label {
          font-size: 9px;
          color: #677186;
          display: flex;
          align-items: center;
        }

        .idr-heat-cell {
          height: 27px;
          border-radius: 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 8px;
          font-weight: 700;
        }

        .idr-h1 {
          background: #eeedff;
          color: #7069ba;
        }
        .idr-h2 {
          background: #d8d5ff;
          color: #5f57a9;
        }
        .idr-h3 {
          background: #bdb8ff;
          color: #4e46a1;
        }
        .idr-h4 {
          background: #9b94ff;
          color: white;
        }
        .idr-h5 {
          background: #746af0;
          color: white;
        }
        .idr-h6 {
          background: #554bdd;
          color: white;
        }

        /* DONUT */

        .idr-donut-layout {
          display: grid;
          grid-template-columns: 185px 1fr;
          gap: 20px;
          align-items: center;
        }

        .idr-donut {
          width: 175px;
          height: 175px;
          border-radius: 50%;
          background: conic-gradient(
            #6259e8 0deg 235deg,
            #1ca77b 235deg 300deg,
            #e6a13a 300deg 334deg,
            #df5757 334deg 360deg
          );
          position: relative;
          margin: auto;
        }

        .idr-donut:after {
          content: "";
          position: absolute;
          width: 105px;
          height: 105px;
          background: white;
          border-radius: 50%;
          left: 35px;
          top: 35px;
        }

        .idr-donut-center {
          position: absolute;
          z-index: 2;
          text-align: center;
          width: 100%;
          top: 61px;
        }

        .idr-donut-center strong {
          display: block;
          font-size: 24px;
        }

        .idr-donut-center span {
          font-size: 9px;
          color: #8b94a5;
        }

        .idr-donut-legend {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .idr-donut-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
        }

        .idr-donut-name {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #606a7c;
        }

        .idr-donut-percent {
          font-weight: 800;
          color: #3c4658;
        }

        /* QUEUE CARDS */

        .idr-queue-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .idr-queue {
          border: 1px solid #e8ebf0;
          border-radius: 9px;
          padding: 12px;
        }

        .idr-queue-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .idr-queue-name {
          font-size: 10px;
          font-weight: 750;
        }

        .idr-queue-score {
          font-size: 11px;
          font-weight: 800;
        }

        .idr-queue-progress {
          height: 6px;
          background: #eef1f4;
          border-radius: 5px;
          margin: 10px 0;
          overflow: hidden;
        }

        .idr-queue-progress span {
          display: block;
          height: 100%;
          border-radius: 5px;
        }

        .idr-queue-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
        }

        .idr-queue-detail {
          font-size: 8px;
          color: #8b94a5;
        }

        .idr-queue-detail strong {
          display: block;
          color: #505a6c;
          font-size: 10px;
          margin-top: 3px;
        }

        /* DAILY TABLE */

        .idr-table-card {
          padding-bottom: 7px;
        }

        .idr-table-wrap {
          overflow-x: auto;
        }

        .idr-table-card table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        .idr-table-card th {
          background: #fafbfc;
          border-bottom: 1px solid #e4e7ed;
          padding: 11px 10px;
          text-align: left;
          font-size: 9px;
          color: #7e8798;
          font-weight: 750;
          white-space: nowrap;
        }

        .idr-table-card td {
          border-bottom: 1px solid #eef0f4;
          padding: 12px 10px;
          font-size: 10px;
          color: #596376;
          white-space: nowrap;
          cursor: pointer;
        }

        .idr-table-card tr.selected-row td {
          background: #f7f7ff;
        }

        .idr-table-card tr:hover td {
          background: #fbfcfe;
        }

        .idr-date-cell {
          color: #30394b;
          font-weight: 750;
        }

        .idr-badge {
          display: inline-flex;
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 750;
        }

        .idr-badge.good {
          color: #11845f;
          background: #e8f8f2;
        }

        .idr-badge.warn {
          color: #ae731d;
          background: #fff3df;
        }

        .idr-badge.bad {
          color: #c44949;
          background: #ffeded;
        }

        /* INSIGHT STRIP */

        .idr-insights {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .idr-insight {
          border-radius: 10px;
          padding: 14px;
          border: 1px solid #e6e9ef;
          background: #fafbfc;
        }

        .idr-insight-title {
          font-size: 9px;
          color: #8992a3;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 750;
        }

        .idr-insight-value {
          margin-top: 7px;
          font-size: 15px;
          font-weight: 800;
        }

        .idr-insight-text {
          margin-top: 4px;
          color: #7d8799;
          font-size: 9px;
          line-height: 1.5;
        }

        /* FOOTER */

        .idr-footer {
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          color: #929aaa;
          font-size: 9px;
        }

        .idr-footer-right {
          display: flex;
          gap: 15px;
        }

        /* RESPONSIVE */

        @media (max-width: 1250px) {
          .idr-filters {
            grid-template-columns: repeat(4, 1fr);
          }

          .idr-summary {
            grid-template-columns: repeat(3, 1fr);
          }

          .idr-grid-main,
          .idr-grid-two {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 800px) {
          .idr-container {
            padding: 20px 14px 40px;
          }

          .idr-heading {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .idr-heading-actions {
            width: 100%;
          }

          .idr-heading-actions .idr-btn {
            flex: 1;
          }

          .idr-filters {
            grid-template-columns: 1fr 1fr;
          }

          .idr-summary {
            grid-template-columns: 1fr 1fr;
          }

          .idr-donut-layout {
            grid-template-columns: 1fr;
          }

          .idr-queue-list {
            grid-template-columns: 1fr;
          }

          .idr-insights {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .idr-filters {
            grid-template-columns: 1fr;
          }

          .idr-summary {
            grid-template-columns: 1fr;
          }

          .idr-footer {
            flex-direction: column;
            gap: 7px;
          }
        }

        @media print {
          .idr-filters,
          .idr-heading-actions,
          .idr-more {
            display: none !important;
          }

          body {
            background: #fff;
          }

          .idr-container {
            max-width: none;
            padding: 12px;
          }

          .idr-card,
          .idr-summary-card {
            break-inside: avoid;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="idr-root">
        <main className="idr-container" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* HEADING */}
          <section className="idr-heading">
            <div>
              <h1>Inbound Daily Report</h1>
              <p>Daily overview of inbound call volume, answered calls, abandoned calls, queues and agent response performance.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="idr-status">
                <span className="idr-status-dot"></span>
                Data Updated
              </div>

              <div className="idr-heading-actions">
                <button className="idr-btn" onClick={exportCSV}>
                  Export CSV
                </button>
                <button className="idr-btn" onClick={refreshReport}>
                  {refreshIcon}
                </button>
                <button className="idr-btn primary" onClick={() => window.print()}>
                  Print Report
                </button>
              </div>
            </div>
          </section>

          {/* FILTERS */}
          <section className="idr-filters">
            <div className="idr-field">
              <label>Date Range</label>
              <select
                id="range"
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
              >
                <option>Last 7 Days</option>
                <option>Today</option>
                <option>Last 30 Days</option>
                <option>This Month</option>
                <option>Custom Range</option>
              </select>
            </div>

            <div className="idr-field">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="idr-field">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="idr-field">
              <label>Queue</label>
              <select value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}>
                <option value="All Queues">All Queues</option>
                {queuesList.map((q, idx) => (
                  <option key={idx} value={q.queue}>{q.queue}</option>
                ))}
              </select>
            </div>

            <div className="idr-field">
              <label>Call Type</label>
              <select defaultValue="All Inbound Calls">
                <option>All Inbound Calls</option>
                <option>Queue Calls</option>
                <option>Direct Inbound</option>
                <option>Transferred Inbound</option>
              </select>
            </div>

            <div className="idr-field">
              <label>View</label>
              <select defaultValue="Daily">
                <option>Daily</option>
                <option>Hourly</option>
                <option>30 Minutes</option>
              </select>
            </div>

            <button className="idr-apply" onClick={applyFilters} disabled={isFilterDisabled}>
              {filterBtnText}
            </button>
          </section>

          {/* SUMMARY CARDS */}
          <section className="idr-summary">
            <div className="idr-summary-card primary-card">
              <div className="idr-small-label">Total Inbound Calls</div>
              <div className="idr-big-number">{liveKpis.total_inbound || "77"}</div>
              <div className="idr-card-foot">7-day reporting period</div>
            </div>

            <div className="idr-summary-card">
              <div className="idr-small-label">Answered</div>
              <div className="idr-big-number">{liveKpis.total_answered || "74"}</div>
              <div className="idr-card-foot idr-green">{liveKpis.answer_rate || "96.1%"} answer rate</div>
            </div>

            <div className="idr-summary-card">
              <div className="idr-small-label">Abandoned</div>
              <div className="idr-big-number">{liveKpis.total_abandoned || "3"}</div>
              <div className="idr-card-foot idr-red">
                {liveKpis.total_inbound && parseInt(liveKpis.total_inbound) > 0
                  ? ((parseInt(liveKpis.total_abandoned) / parseInt(liveKpis.total_inbound)) * 100).toFixed(1) + "% abandon rate"
                  : "3.9% abandon rate"}
              </div>
            </div>

            <div className="idr-summary-card">
              <div className="idr-small-label">Avg Speed of Answer</div>
              <div className="idr-big-number">13.9s</div>
              <div className="idr-card-foot idr-green">Fast response SLA</div>
            </div>

            <div className="idr-summary-card">
              <div className="idr-small-label">Avg Talk Time</div>
              <div className="idr-big-number">03:48</div>
              <div className="idr-card-foot">Average connected duration</div>
            </div>

            <div className="idr-summary-card">
              <div className="idr-small-label">Service Level</div>
              <div className="idr-big-number">{liveKpis.service_level || "87.8%"}</div>
              <div className="idr-card-foot idr-green">Above 80% target</div>
            </div>
          </section>

          {/* VOLUME + BREAKDOWN */}
          <section className="idr-grid idr-grid-main">
            <div className="idr-card">
              <div className="idr-card-head">
                <div>
                  <h3>Daily Inbound Call Volume</h3>
                  <p>Calls received, answered and abandoned across the selected period</p>
                </div>
                <button className="idr-more">⋮</button>
              </div>

              <div className="idr-chart-wrap">
                <svg className="idr-chart-svg" viewBox="0 0 850 275" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6259e8" stopOpacity=".22" />
                      <stop offset="100%" stopColor="#6259e8" stopOpacity=".02" />
                    </linearGradient>
                  </defs>

                  <line className="idr-gridline" x1="48" y1="25" x2="830" y2="25" />
                  <line className="idr-gridline" x1="48" y1="70" x2="830" y2="70" />
                  <line className="idr-gridline" x1="48" y1="115" x2="830" y2="115" />
                  <line className="idr-gridline" x1="48" y1="160" x2="830" y2="160" />
                  <line className="idr-gridline" x1="48" y1="205" x2="830" y2="205" />
                  <line className="idr-gridline" x1="48" y1="245" x2="830" y2="245" />

                  <text className="idr-axis" x="10" y="29">50</text>
                  <text className="idr-axis" x="10" y="74">40</text>
                  <text className="idr-axis" x="10" y="119">30</text>
                  <text className="idr-axis" x="10" y="164">20</text>
                  <text className="idr-axis" x="10" y="209">10</text>
                  <text className="idr-axis" x="18" y="249">0</text>

                  {dailyData.length > 1 && (
                    <>
                      <path
                        className="idr-volume-area"
                        d={`M${dailyData.map((d, i) => {
                          const cx = 55 + i * (720 / Math.max(1, dailyData.length - 1));
                          const cy = 245 - ((parseInt(d.calls) || 0) / 50) * 220;
                          return `${cx} ${Math.max(25, Math.min(245, cy))}`;
                        }).join(" L ")} L${55 + (dailyData.length - 1) * (720 / Math.max(1, dailyData.length - 1))} 245 L55 245 Z`}
                      />

                      <path
                        className="idr-volume-line"
                        d={`M${dailyData.map((d, i) => {
                          const cx = 55 + i * (720 / Math.max(1, dailyData.length - 1));
                          const cy = 245 - ((parseInt(d.calls) || 0) / 50) * 220;
                          return `${cx} ${Math.max(25, Math.min(245, cy))}`;
                        }).join(" L ")}`}
                      />

                      <path
                        className="idr-answer-line"
                        d={`M${dailyData.map((d, i) => {
                          const cx = 55 + i * (720 / Math.max(1, dailyData.length - 1));
                          const cy = 245 - ((parseInt(d.answered) || 0) / 50) * 220;
                          return `${cx} ${Math.max(25, Math.min(245, cy))}`;
                        }).join(" L ")}`}
                      />

                      {dailyData.map((d, i) => {
                        const cx = 55 + i * (720 / Math.max(1, dailyData.length - 1));
                        const cy = 245 - ((parseInt(d.calls) || 0) / 50) * 220;
                        return <circle key={i} className="idr-dot" cx={cx} cy={Math.max(25, Math.min(245, cy))} r={4} />;
                      })}
                    </>
                  )}

                  {dailyData.map((d, i) => {
                    const cx = 55 + i * (720 / Math.max(1, dailyData.length - 1));
                    return (
                      <text key={i} className="idr-axis" x={cx - 15} y="263">
                        {d.day ? d.day.split(",")[0].slice(0, 3) : `Day ${i + 1}`}
                      </text>
                    );
                  })}
                </svg>
              </div>

              <div className="idr-legend">
                <div className="idr-legend-item">
                  <span className="idr-legend-dot" style={{ background: "#6259e8" }}></span>
                  Total Inbound
                </div>
                <div className="idr-legend-item">
                  <span className="idr-legend-dot" style={{ background: "#19a77b" }}></span>
                  Answered
                </div>
                <div className="idr-legend-item">
                  <span className="idr-legend-dot" style={{ background: "#df5757" }}></span>
                  Abandoned
                </div>
              </div>
            </div>

            <div className="idr-card">
              <div className="idr-card-head">
                <div>
                  <h3>Daily Call Outcome</h3>
                  <p>Distribution of inbound calls</p>
                </div>
              </div>

              <div className="idr-donut-layout">
                <div className="idr-donut">
                  <div className="idr-donut-center">
                    <strong>{liveKpis.total_inbound || "77"}</strong>
                    <span>Total Calls</span>
                  </div>
                </div>

                <div className="idr-donut-legend">
                  <div className="idr-donut-item">
                    <div className="idr-donut-name">
                      <span className="idr-legend-dot" style={{ background: "#6259e8" }}></span>
                      Answered
                    </div>
                    <div className="idr-donut-percent">{liveKpis.answer_rate || "96.1%"}</div>
                  </div>

                  <div className="idr-donut-item">
                    <div className="idr-donut-name">
                      <span className="idr-legend-dot" style={{ background: "#1ca77b" }}></span>
                      Within SLA
                    </div>
                    <div className="idr-donut-percent">{liveKpis.service_level || "0%"}</div>
                  </div>

                  <div className="idr-donut-item">
                    <div className="idr-donut-name">
                      <span className="idr-legend-dot" style={{ background: "#e6a13a" }}></span>
                      After SLA
                    </div>
                    <div className="idr-donut-percent">
                      {liveKpis.total_inbound && liveKpis.total_inbound !== "0"
                        ? `${Math.max(0, 100 - (parseFloat(liveKpis.service_level) || 0) - (parseFloat(liveKpis.abandon_rate || (parseInt(liveKpis.total_abandoned) / parseInt(liveKpis.total_inbound)) * 100) || 0)).toFixed(1)}%`
                        : "0%"}
                    </div>
                  </div>

                  <div className="idr-donut-item">
                    <div className="idr-donut-name">
                      <span className="idr-legend-dot" style={{ background: "#df5757" }}></span>
                      Abandoned
                    </div>
                    <div className="idr-donut-percent">
                      {liveKpis.abandon_rate || (liveKpis.total_inbound && liveKpis.total_inbound !== "0" ? `${(((parseInt(liveKpis.total_abandoned) || 0) / parseInt(liveKpis.total_inbound)) * 100).toFixed(1)}%` : "0%")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* QUEUE PERFORMANCE */}
          <section className="idr-grid idr-grid-two">
            <div className="idr-card" style={{ gridColumn: "1 / -1" }}>
              <div className="idr-card-head">
                <div>
                  <h3>Queue Daily Performance</h3>
                  <p>Live inbound activity by queue from database</p>
                </div>
              </div>

              <div className="idr-queue-list">
                {queuesList.map((q, idx) => {
                  const sl = parseFloat(q.sla) || 0;
                  const scoreClass = sl >= 80 ? "idr-green" : sl >= 70 ? "idr-orange" : "idr-red";
                  const barColor = sl >= 80 ? "#16a579" : sl >= 70 ? "#e49a32" : "#df5757";
                  const off = parseInt(q.offered) || 1;
                  const ab = parseInt(q.abandoned) || 0;
                  const abPct = ((ab / off) * 100).toFixed(1) + "%";
                  return (
                    <div className="idr-queue" key={idx}>
                      <div className="idr-queue-top">
                        <span className="idr-queue-name">{q.queue}</span>
                        <span className={`idr-queue-score ${scoreClass}`}>{q.sla}</span>
                      </div>

                      <div className="idr-queue-progress">
                        <span style={{ width: q.sla, background: barColor }}></span>
                      </div>

                      <div className="idr-queue-details">
                        <div className="idr-queue-detail">Calls<strong>{q.offered}</strong></div>
                        <div className="idr-queue-detail">Ans<strong>{q.answered}</strong></div>
                        <div className="idr-queue-detail">Abandon<strong>{abPct}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* DAILY PERFORMANCE TABLE */}
          <section className="idr-card idr-table-card">
            <div className="idr-card-head">
              <div>
                <h3>Daily Inbound Performance</h3>
                <p>Day-by-day summary of inbound call activity and service performance</p>
              </div>
              <button className="idr-more">⋮</button>
            </div>

            <div className="idr-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Calls Received</th>
                    <th>Answered</th>
                    <th>Answer Rate</th>
                    <th>Abandoned</th>
                    <th>Abandon Rate</th>
                    <th>Within SLA</th>
                    <th>Service Level</th>
                    <th>ASA</th>
                    <th>Avg Talk</th>
                    <th>Longest Wait</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {dailyData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={selectedRow === idx ? "selected-row" : ""}
                      onClick={() => setSelectedRow(idx)}
                    >
                      <td className="idr-date-cell">{row.day || row.date}</td>
                      <td>{row.calls}</td>
                      <td>{row.answered}</td>
                      <td>{row.answer_rate || "100.0%"}</td>
                      <td>{row.abandoned}</td>
                      <td>
                        {row.calls && parseInt(row.calls) > 0
                          ? ((parseInt(row.abandoned) / parseInt(row.calls)) * 100).toFixed(1) + "%"
                          : "0.0%"}
                      </td>
                      <td>{row.answered}</td>
                      <td><strong>{row.sla || "100.0%"}</strong></td>
                      <td>{row.avg_wait || "13.9s"}</td>
                      <td>{row.talk_time || "03:48"}</td>
                      <td>00:25</td>
                      <td><span className="idr-badge good">On Target</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="idr-card" style={{ marginTop: "18px" }}>
            <div className="idr-card-head">
              <div>
                <h3>Daily Report Insights</h3>
                <p>Key observations from the selected inbound period</p>
              </div>
            </div>

            <div className="idr-insights">
              <div className="idr-insight">
                <div className="idr-insight-title">Peak Day</div>
                <div className="idr-insight-value">
                  {dailyData.length > 0
                    ? dailyData.reduce((prev, cur) => (parseInt(cur.calls) > parseInt(prev.calls) ? cur : prev), dailyData[0]).day || "Sep 09"
                    : "Sep 09"}
                </div>
                <div className="idr-insight-text">
                  Highest inbound volume with{" "}
                  {dailyData.length > 0
                    ? dailyData.reduce((prev, cur) => (parseInt(cur.calls) > parseInt(prev.calls) ? cur : prev), dailyData[0]).calls || "43"
                    : "43"}{" "}
                  calls received during the day.
                </div>
              </div>

              <div className="idr-insight">
                <div className="idr-insight-title">Best Service Level</div>
                <div className="idr-insight-value idr-green">
                  {dailyData.length > 0
                    ? dailyData.reduce((prev, cur) => (parseFloat(cur.sla) > parseFloat(prev.sla) ? cur : prev), dailyData[0]).sla || "100.0%"
                    : "100.0%"}
                </div>
                <div className="idr-insight-text">
                  Recorded the strongest SLA performance for the live reporting period.
                </div>
              </div>

              <div className="idr-insight">
                <div className="idr-insight-title">Overall Inbound Abandonment</div>
                <div className="idr-insight-value idr-red">
                  {liveKpis.total_inbound && parseInt(liveKpis.total_inbound) > 0
                    ? ((parseInt(liveKpis.total_abandoned) / parseInt(liveKpis.total_inbound)) * 100).toFixed(1) + "%"
                    : "3.9%"}
                </div>
                <div className="idr-insight-text">
                  Low overall abandonment ({liveKpis.total_abandoned || "3"} calls) recorded across the entire period.
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="idr-footer">
            <div>Report generated: {reportTimestampLong}</div>

            <div className="idr-footer-right">
              <span>Service Level Target: 80%</span>
              <span>Threshold: 30 sec</span>
              <span>Inbound Only</span>
            </div>
          </footer>
        </main>
      </div>
    </AppShell>
  );
}
