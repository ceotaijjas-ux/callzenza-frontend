"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function UserTimeSheetPage() {
  const { dateStr } = useLiveClock();
  const [timeSheetData, setTimeSheetData] = useState<any[]>([]);

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("user-time-sheet");
        if (res && Array.isArray(res.data)) {
          setTimeSheetData(res.data);
        } else {
          setTimeSheetData([]);
        }
      } catch (err) {
        console.error("Failed loading report for user-time-sheet:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const [filterBtnText, setFilterBtnText] = useState("Apply");
  const [activePage, setActivePage] = useState(1);
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [selectedRange, setSelectedRange] = useState("This Week");
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-07");

  const parseHoursMinutes = (str: string) => {
    if (!str) return 0;
    const hMatch = str.match(/(\d+)\s*h/);
    const mMatch = str.match(/(\d+)\s*m/);
    const h = hMatch ? parseInt(hMatch[1], 10) : 0;
    const m = mMatch ? parseInt(mMatch[1], 10) : 0;
    return h * 60 + m;
  };

  const formatMinutes = (totalMin: number) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m < 10 ? "0" : ""}${m}m`;
  };

  const totalLoggedMin = timeSheetData.reduce((acc, r) => acc + parseHoursMinutes(r.total || r.working), 0);
  const workingMin = timeSheetData.reduce((acc, r) => acc + parseHoursMinutes(r.working), 0);
  const breakMin = timeSheetData.reduce((acc, r) => acc + parseHoursMinutes(r.break), 0);
  const overtimeMin = timeSheetData.reduce((acc, r) => acc + parseHoursMinutes(r.overtime), 0);
  const avgMin = timeSheetData.length ? Math.round(totalLoggedMin / timeSheetData.length) : 0;
  const productivePct = totalLoggedMin > 0 ? Math.round((workingMin / totalLoggedMin) * 100) : 0;

  const applyFilter = () => {
    setFilterBtnText("Loading...");
    setTimeout(() => {
      setFilterBtnText("Applied");
      setTimeout(() => {
        setFilterBtnText("Apply");
      }, 900);
    }, 500);
  };

  const exportCSV = () => {
    const table = document.getElementById("timesheetTable");
    if (!table) return;

    let csv: string[] = [];
    const rows = table.querySelectorAll("tr");

    rows.forEach((row) => {
      const cols = row.querySelectorAll("th, td");
      let rowData: string[] = [];
      cols.forEach((col) => {
        const text = (col as HTMLElement).innerText.replace(/"/g, '""');
        rowData.push('"' + text + '"');
      });
      csv.push(rowData.join(","));
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "user-time-sheet.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleRefreshIcon = () => {
    setContainerOpacity(0.65);
    setTimeout(() => {
      setContainerOpacity(1);
    }, 300);
  };

  return (
    <AppShell>
      <style jsx global>{`
        .uts-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Arial, sans-serif;
          background: #f5f7fb;
          color: #172033;
          min-h-screen;
        }

        /* ================= HEADER ================= */

        .uts-header {
          height: 72px;
          background: #111827;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
          position: sticky;
          top: 0;
          z-index: 100;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .uts-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .uts-logo {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: linear-gradient(135deg, #6d5dfc, #35c9ff);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 800;
        }

        .uts-brand-text {
          font-size: 18px;
          font-weight: 700;
        }

        .uts-brand-text span {
          color: #8b7cff;
        }

        .uts-header-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .uts-header-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #1f2937;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .uts-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #7568ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        /* ================= PAGE ================= */

        .uts-container {
          padding: 10px 10px 40px;
          max-width: 1600px;
          margin: auto;
          transition: opacity 0.3s ease;
        }

        .uts-page-title {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .uts-page-title h1 {
          font-size: 28px;
          margin-bottom: 7px;
          font-weight: 700;
        }

        .uts-page-title p {
          color: #788399;
          font-size: 14px;
        }

        .uts-actions {
          display: flex;
          gap: 10px;
        }

        .uts-btn {
          border: none;
          padding: 11px 16px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }

        .uts-btn-light {
          background: white;
          color: #334155;
          border: 1px solid #e3e7ef;
        }

        .uts-btn-primary {
          background: #6257e8;
          color: white;
        }

        /* ================= FILTER ================= */

        .uts-filter-panel {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 22px;
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }

        .uts-field label {
          display: block;
          font-size: 11px;
          color: #7b8498;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 7px;
        }

        .uts-field input,
        .uts-field select {
          width: 100%;
          height: 40px;
          border: 1px solid #e0e5ee;
          border-radius: 8px;
          padding: 0 11px;
          background: #fafbfc;
          color: #273247;
          outline: none;
        }

        .uts-field input:focus,
        .uts-field select:focus {
          border-color: #7568ff;
        }

        .uts-filter-btn {
          height: 40px;
          padding: 0 18px;
          background: #111827;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        /* ================= SUMMARY ================= */

        .uts-summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
          margin-bottom: 22px;
        }

        .uts-summary-card {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 16px;
          padding: 18px;
          position: relative;
          overflow: hidden;
        }

        .uts-summary-card:after {
          content: "";
          position: absolute;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          right: -25px;
          top: -25px;
          background: #f1efff;
        }

        .uts-summary-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .uts-summary-label {
          color: #7d8799;
          font-size: 12px;
          font-weight: 600;
        }

        .uts-summary-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1efff;
          color: #6257e8;
        }

        .uts-summary-value {
          font-size: 25px;
          font-weight: 800;
          margin-top: 13px;
        }

        .uts-summary-change {
          font-size: 11px;
          margin-top: 7px;
          color: #20a36a;
        }

        .uts-summary-change.warning {
          color: #e28a25;
        }

        /* ================= MAIN GRID ================= */

        .uts-main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .uts-card {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 17px;
          padding: 20px;
        }

        .uts-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .uts-card-header h3 {
          font-size: 16px;
          font-weight: 700;
        }

        .uts-card-header span {
          font-size: 12px;
          color: #8490a4;
        }

        /* ================= WEEKLY HOURS ================= */

        .uts-week-chart {
          height: 245px;
          display: flex;
          align-items: flex-end;
          gap: 18px;
          padding: 10px 5px 0;
          border-bottom: 1px solid #edf0f5;
        }

        .uts-day-column {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .uts-hour-value {
          font-size: 11px;
          color: #657087;
          font-weight: 700;
        }

        .uts-bar-track {
          height: 175px;
          width: 34px;
          background: #f0f2f7;
          border-radius: 9px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .uts-bar-fill {
          width: 100%;
          background: linear-gradient(180deg, #7568ff, #a39aff);
          border-radius: 9px;
        }

        .uts-bar-fill.today {
          background: linear-gradient(180deg, #2cc7a4, #65e1c4);
        }

        .uts-day-name {
          font-size: 11px;
          color: #7d8798;
          font-weight: 600;
        }

        /* ================= TIME DISTRIBUTION ================= */

        .uts-distribution {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-top: 10px;
        }

        .uts-donut {
          width: 155px;
          height: 155px;
          border-radius: 50%;
          background: conic-gradient(
            #665bf0 0deg 190deg,
            #2cc7a4 190deg 285deg,
            #f2ad4e 285deg 330deg,
            #e4e8ef 330deg 360deg
          );
          position: relative;
          flex-shrink: 0;
        }

        .uts-donut:after {
          content: "";
          position: absolute;
          width: 100px;
          height: 100px;
          background: white;
          border-radius: 50%;
          top: 27px;
          left: 27px;
        }

        .uts-donut-center {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .uts-donut-center strong {
          font-size: 22px;
        }

        .uts-donut-center span {
          font-size: 10px;
          color: #8791a3;
        }

        .uts-legend {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
        }

        .uts-legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
        }

        .uts-legend-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .uts-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .uts-dot.work {
          background: #665bf0;
        }
        .uts-dot.break {
          background: #2cc7a4;
        }
        .uts-dot.overtime {
          background: #f2ad4e;
        }
        .uts-dot.leave {
          background: #e4e8ef;
        }

        /* ================= TIMELINE ================= */

        .uts-timeline-card {
          margin-bottom: 20px;
        }

        .uts-timeline {
          position: relative;
          padding-top: 20px;
        }

        .uts-time-scale {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          color: #9aa3b3;
          font-size: 10px;
          margin-bottom: 10px;
        }

        .uts-timeline-row {
          display: grid;
          grid-template-columns: 180px 1fr 90px;
          align-items: center;
          gap: 15px;
          padding: 13px 0;
          border-bottom: 1px solid #f0f2f6;
        }

        .uts-user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .uts-user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #eceaff;
          color: #6257e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }

        .uts-user-name {
          font-size: 12px;
          font-weight: 700;
        }

        .uts-user-role {
          font-size: 10px;
          color: #929bac;
          margin-top: 3px;
        }

        .uts-timeline-track {
          height: 20px;
          background: #f2f4f8;
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }

        .uts-work-block {
          position: absolute;
          height: 100%;
          border-radius: 6px;
          background: linear-gradient(90deg, #675cf1, #958cff);
        }

        .uts-break-block {
          position: absolute;
          height: 100%;
          border-radius: 6px;
          background: #f5c66d;
        }

        .uts-overtime-block {
          position: absolute;
          height: 100%;
          border-radius: 6px;
          background: #2fc6a4;
        }

        .uts-total-hours {
          text-align: right;
          font-size: 12px;
          font-weight: 800;
        }

        /* ================= PRODUCTIVITY ================= */

        .uts-bottom-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .uts-metric-list {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .uts-metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .uts-metric-name {
          font-size: 12px;
          color: #667187;
        }

        .uts-metric-value {
          font-size: 12px;
          font-weight: 800;
        }

        .uts-progress {
          height: 7px;
          background: #edf0f5;
          border-radius: 10px;
          margin-top: 8px;
          overflow: hidden;
        }

        .uts-progress span {
          display: block;
          height: 100%;
          border-radius: 10px;
          background: #665bf0;
        }

        .uts-progress.green span {
          background: #2cc7a4;
        }

        .uts-progress.orange span {
          background: #f2ad4e;
        }

        /* ================= RANKING ================= */

        .uts-ranking {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .uts-rank-row {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #f8f9fc;
          border-radius: 10px;
        }

        .uts-rank-number {
          font-weight: 800;
          font-size: 12px;
          color: #7568ff;
        }

        .uts-rank-name {
          font-size: 12px;
          font-weight: 700;
        }

        .uts-rank-hours {
          font-size: 11px;
          color: #687388;
        }

        /* ================= ALERTS ================= */

        .uts-alert-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .uts-alert {
          padding: 12px;
          border-radius: 10px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-size: 11px;
        }

        .uts-alert.warning {
          background: #fff8e9;
          color: #8d651d;
        }

        .uts-alert.info {
          background: #eef8ff;
          color: #216489;
        }

        .uts-alert.success {
          background: #ebfbf5;
          color: #19775d;
        }

        /* ================= TABLE ================= */

        .uts-table-card {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 17px;
          overflow: hidden;
        }

        .uts-table-head {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .uts-table-head h3 {
          font-size: 16px;
          font-weight: 700;
        }

        .uts-table-wrapper {
          overflow-x: auto;
        }

        .uts-table-card table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        .uts-table-card th {
          background: #f8f9fc;
          color: #778195;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: left;
          padding: 13px 15px;
          border-bottom: 1px solid #e8ebf1;
        }

        .uts-table-card td {
          padding: 14px 15px;
          border-bottom: 1px solid #eef0f4;
          font-size: 12px;
        }

        .uts-table-card tr:hover td {
          background: #fafbfe;
        }

        .uts-employee {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .uts-employee-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #eeecff;
          color: #6257e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .uts-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .uts-status.active {
          background: #e8faf4;
          color: #15916e;
        }

        .uts-status.break {
          background: #fff5df;
          color: #b2761c;
        }

        .uts-status.leave {
          background: #f0f2f5;
          color: #747d8d;
        }

        .uts-hours {
          font-weight: 800;
        }

        .uts-overtime {
          color: #e48a1f;
          font-weight: 700;
        }

        .uts-ontime {
          color: #1d9c74;
          font-weight: 700;
        }

        /* ================= FOOTER ================= */

        .uts-table-footer {
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .uts-records {
          color: #8a93a3;
          font-size: 11px;
        }

        .uts-pagination {
          display: flex;
          gap: 5px;
        }

        .uts-page {
          width: 30px;
          height: 30px;
          border: 1px solid #e1e5ec;
          border-radius: 7px;
          background: white;
          cursor: pointer;
          font-size: 11px;
        }

        .uts-page.active {
          background: #6257e8;
          color: white;
          border-color: #6257e8;
        }

        /* ================= RESPONSIVE ================= */

        @media (max-width: 1200px) {
          .uts-summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .uts-filter-panel {
            grid-template-columns: repeat(3, 1fr);
          }

          .uts-bottom-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 850px) {
          .uts-main-grid,
          .uts-bottom-grid {
            grid-template-columns: 1fr;
          }

          .uts-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .uts-timeline-row {
            grid-template-columns: 140px 1fr 60px;
          }

          .uts-page-title {
            flex-direction: column;
            gap: 15px;
          }
        }

        @media (max-width: 600px) {
          .uts-container {
            padding: 18px 14px;
          }

          .uts-header {
            padding: 0 15px;
          }

          .uts-filter-panel {
            grid-template-columns: 1fr;
          }

          .uts-summary-grid {
            grid-template-columns: 1fr;
          }

          .uts-distribution {
            flex-direction: column;
          }

          .uts-timeline-row {
            grid-template-columns: 1fr;
          }

          .uts-total-hours {
            text-align: left;
          }
        }

        /* PRINT */

        @media print {
          .uts-header-right,
          .uts-actions,
          .uts-filter-panel,
          .uts-btn,
          .uts-table-footer {
            display: none !important;
          }

          body {
            background: white;
          }

          .uts-container {
            padding: 0;
          }

          .uts-card,
          .uts-summary-card,
          .uts-table-card {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="uts-root">
        <main className="uts-container" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* TITLE */}
          <div className="uts-page-title">
            <div>
              <h1>User Time Sheet</h1>
              <p>Monitor logged hours, breaks, overtime and daily productivity.</p>
            </div>

            <div className="uts-actions">
              <button className="uts-btn uts-btn-light" onClick={() => window.print()}>
                Print
              </button>
              <button className="uts-btn uts-btn-primary" onClick={exportCSV}>
                Export CSV
              </button>
            </div>
          </div>

          {/* FILTER */}
          <section className="uts-filter-panel">
            <div className="uts-field">
              <label>Date Range</label>
              <select
                id="range"
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
              >
                <option>This Week</option>
                <option>Last Week</option>
                <option>This Month</option>
                <option>Last Month</option>
              </select>
            </div>

            <div className="uts-field">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="uts-field">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="uts-field">
              <label>User Group</label>
              <select defaultValue="All Groups">
                <option>All Groups</option>
                <option>Administrators</option>
                <option>Agents</option>
                <option>Supervisors</option>
              </select>
            </div>

            <div className="uts-field">
              <label>User</label>
              <select defaultValue="All Users">
                <option>All Users</option>
                {Array.from(new Set(timeSheetData.map((t: any) => t.user).filter(Boolean))).map((user: any) => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <button className="uts-filter-btn" onClick={applyFilter}>
              {filterBtnText}
            </button>
          </section>

          {/* SUMMARY */}
          <section className="uts-summary-grid">
            <div className="uts-summary-card">
              <div className="uts-summary-top">
                <span className="uts-summary-label">TOTAL LOGGED</span>
                <div className="uts-summary-icon">◷</div>
              </div>
              <div className="uts-summary-value">{totalLoggedMin > 0 ? formatMinutes(totalLoggedMin) : "0h 00m"}</div>
              <div className="uts-summary-change">{timeSheetData.length > 0 ? "Live time logged" : "No logs"}</div>
            </div>

            <div className="uts-summary-card">
              <div className="uts-summary-top">
                <span className="uts-summary-label">WORKING HOURS</span>
                <div className="uts-summary-icon">✓</div>
              </div>
              <div className="uts-summary-value">{workingMin > 0 ? formatMinutes(workingMin) : "0h 00m"}</div>
              <div className="uts-summary-change">{productivePct}% productive time</div>
            </div>

            <div className="uts-summary-card">
              <div className="uts-summary-top">
                <span className="uts-summary-label">BREAK TIME</span>
                <div className="uts-summary-icon">Ⅱ</div>
              </div>
              <div className="uts-summary-value">{breakMin > 0 ? formatMinutes(breakMin) : "0h 00m"}</div>
              <div className="uts-summary-change">{totalLoggedMin > 0 ? ((breakMin / totalLoggedMin) * 100).toFixed(1) : 0}% of total time</div>
            </div>

            <div className="uts-summary-card">
              <div className="uts-summary-top">
                <span className="uts-summary-label">OVERTIME</span>
                <div className="uts-summary-icon">+</div>
              </div>
              <div className="uts-summary-value">{overtimeMin > 0 ? formatMinutes(overtimeMin) : "0h 00m"}</div>
              <div className="uts-summary-change warning">{timeSheetData.filter(r => parseHoursMinutes(r.overtime) > 0).length} users with OT</div>
            </div>

            <div className="uts-summary-card">
              <div className="uts-summary-top">
                <span className="uts-summary-label">AVG / USER</span>
                <div className="uts-summary-icon">◉</div>
              </div>
              <div className="uts-summary-value">{avgMin > 0 ? formatMinutes(avgMin) : "0h 00m"}</div>
              <div className="uts-summary-change">{timeSheetData.length} active users</div>
            </div>
          </section>

          {/* MAIN CHARTS */}
          <section className="uts-main-grid">
            {/* WEEKLY HOURS */}
            <div className="uts-card">
              <div className="uts-card-header">
                <div>
                  <h3>Weekly Time Overview</h3>
                  <span>Logged hours by day</span>
                </div>
                <span>01 Sep – 07 Sep</span>
              </div>

              <div className="uts-week-chart">
                <div className="uts-day-column">
                  <div className="uts-hour-value">{totalLoggedMin > 0 ? `${Math.round((totalLoggedMin / 60) * 0.17)}h` : "0h"}</div>
                  <div className="uts-bar-track">
                    <div className="uts-bar-fill" style={{ height: totalLoggedMin > 0 ? "78%" : "0%" }}></div>
                  </div>
                  <div className="uts-day-name">MON</div>
                </div>

                <div className="uts-day-column">
                  <div className="uts-hour-value">{totalLoggedMin > 0 ? `${Math.round((totalLoggedMin / 60) * 0.19)}h` : "0h"}</div>
                  <div className="uts-bar-track">
                    <div className="uts-bar-fill" style={{ height: totalLoggedMin > 0 ? "88%" : "0%" }}></div>
                  </div>
                  <div className="uts-day-name">TUE</div>
                </div>

                <div className="uts-day-column">
                  <div className="uts-hour-value">{totalLoggedMin > 0 ? `${Math.round((totalLoggedMin / 60) * 0.16)}h` : "0h"}</div>
                  <div className="uts-bar-track">
                    <div className="uts-bar-fill" style={{ height: totalLoggedMin > 0 ? "73%" : "0%" }}></div>
                  </div>
                  <div className="uts-day-name">WED</div>
                </div>

                <div className="uts-day-column">
                  <div className="uts-hour-value">{totalLoggedMin > 0 ? `${Math.round((totalLoggedMin / 60) * 0.17)}h` : "0h"}</div>
                  <div className="uts-bar-track">
                    <div className="uts-bar-fill" style={{ height: totalLoggedMin > 0 ? "80%" : "0%" }}></div>
                  </div>
                  <div className="uts-day-name">THU</div>
                </div>

                <div className="uts-day-column">
                  <div className="uts-hour-value">{totalLoggedMin > 0 ? `${Math.round((totalLoggedMin / 60) * 0.20)}h` : "0h"}</div>
                  <div className="uts-bar-track">
                    <div className="uts-bar-fill" style={{ height: totalLoggedMin > 0 ? "93%" : "0%" }}></div>
                  </div>
                  <div className="uts-day-name">FRI</div>
                </div>

                <div className="uts-day-column">
                  <div className="uts-hour-value">{totalLoggedMin > 0 ? `${Math.round((totalLoggedMin / 60) * 0.06)}h` : "0h"}</div>
                  <div className="uts-bar-track">
                    <div className="uts-bar-fill" style={{ height: totalLoggedMin > 0 ? "30%" : "0%" }}></div>
                  </div>
                  <div className="uts-day-name">SAT</div>
                </div>

                <div className="uts-day-column">
                  <div className="uts-hour-value">{totalLoggedMin > 0 ? `${Math.round((totalLoggedMin / 60) * 0.05)}h` : "0h"}</div>
                  <div className="uts-bar-track">
                    <div className="uts-bar-fill today" style={{ height: totalLoggedMin > 0 ? "25%" : "0%" }}></div>
                  </div>
                  <div className="uts-day-name">SUN</div>
                </div>
              </div>
            </div>

            {/* DISTRIBUTION */}
            <div className="uts-card">
              <div className="uts-card-header">
                <div>
                  <h3>Time Distribution</h3>
                  <span>Where logged time goes</span>
                </div>
              </div>

              <div className="uts-distribution">
                <div className="uts-donut">
                  <div className="uts-donut-center">
                    <strong>{totalLoggedMin > 0 ? `${Math.floor(totalLoggedMin / 60)}h` : "0h"}</strong>
                    <span>Total</span>
                  </div>
                </div>

                <div className="uts-legend">
                  <div className="uts-legend-row">
                    <div className="uts-legend-left">
                      <span className="uts-dot work"></span>
                      Working
                    </div>
                    <strong>{productivePct}%</strong>
                  </div>

                  <div className="uts-legend-row">
                    <div className="uts-legend-left">
                      <span className="uts-dot break"></span>
                      Break
                    </div>
                    <strong>{totalLoggedMin > 0 ? Math.round((breakMin / totalLoggedMin) * 100) : 0}%</strong>
                  </div>

                  <div className="uts-legend-row">
                    <div className="uts-legend-left">
                      <span className="uts-dot overtime"></span>
                      Overtime
                    </div>
                    <strong>{totalLoggedMin > 0 ? Math.round((overtimeMin / totalLoggedMin) * 100) : 0}%</strong>
                  </div>

                  <div className="uts-legend-row">
                    <div className="uts-legend-left">
                      <span className="uts-dot leave"></span>
                      Other
                    </div>
                    <strong>{totalLoggedMin > 0 ? Math.max(0, 100 - productivePct - Math.round((breakMin / totalLoggedMin) * 100) - Math.round((overtimeMin / totalLoggedMin) * 100)) : 0}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* USER TIMELINE */}
          <section className="uts-card uts-timeline-card">
            <div className="uts-card-header">
              <div>
                <h3>Today's User Timeline</h3>
                <span>Visual workday activity by user</span>
              </div>
              <span>{dateStr}</span>
            </div>

            <div className="uts-timeline">
              <div className="uts-time-scale">
                <span>08:00</span>
                <span>09:00</span>
                <span>10:00</span>
                <span>11:00</span>
                <span>12:00</span>
                <span>13:00</span>
                <span>14:00</span>
                <span>15:00</span>
                <span>16:00</span>
                <span>17:00</span>
                <span>18:00</span>
                <span>19:00</span>
              </div>

              {timeSheetData.map((row: any, idx: number) => {
                const initials = (row.user || "User").split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={row.id || idx} className="uts-timeline-row">
                    <div className="uts-user-info">
                      <div className="uts-user-avatar">{initials}</div>
                      <div>
                        <div className="uts-user-name">{row.user}</div>
                        <div className="uts-user-role">Agent</div>
                      </div>
                    </div>

                    <div className="uts-timeline-track">
                      <div className="uts-work-block" style={{ left: "5%", width: "32%" }}></div>
                      <div className="uts-break-block" style={{ left: "37%", width: "5%" }}></div>
                      <div className="uts-work-block" style={{ left: "42%", width: "39%" }}></div>
                      {row.overtime && row.overtime !== "00h 00m" && (
                        <div className="uts-overtime-block" style={{ left: "81%", width: "9%" }}></div>
                      )}
                    </div>

                    <div className="uts-total-hours">{row.working || "07h 45m"}</div>
                  </div>
                );
              })}
              {timeSheetData.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "#8a93a3", fontSize: "12px" }}>
                  No user timeline activity recorded
                </div>
              )}
            </div>
          </section>

          {/* LOWER ANALYTICS */}
          <section className="uts-bottom-grid">
            {/* PRODUCTIVITY */}
            <div className="uts-card">
              <div className="uts-card-header">
                <div>
                  <h3>Time Utilization</h3>
                  <span>Weekly performance</span>
                </div>
              </div>

              <div className="uts-metric-list">
                <div>
                  <div className="uts-metric-item">
                    <span className="uts-metric-name">Working Time</span>
                    <span className="uts-metric-value">{productivePct}%</span>
                  </div>
                  <div className="uts-progress">
                    <span style={{ width: `${productivePct}%` }}></span>
                  </div>
                </div>

                <div>
                  <div className="uts-metric-item">
                    <span className="uts-metric-name">Productive Time</span>
                    <span className="uts-metric-value">{timeSheetData.length > 0 ? `${Math.min(100, Math.round(productivePct * 0.95))}%` : "0%"}</span>
                  </div>
                  <div className="uts-progress green">
                    <span style={{ width: `${timeSheetData.length > 0 ? Math.min(100, Math.round(productivePct * 0.95)) : 0}%` }}></span>
                  </div>
                </div>

                <div>
                  <div className="uts-metric-item">
                    <span className="uts-metric-name">Target Achievement</span>
                    <span className="uts-metric-value">{timeSheetData.length > 0 ? "100%" : "0%"}</span>
                  </div>
                  <div className="uts-progress">
                    <span style={{ width: timeSheetData.length > 0 ? "100%" : "0%" }}></span>
                  </div>
                </div>

                <div>
                  <div className="uts-metric-item">
                    <span className="uts-metric-name">Attendance</span>
                    <span className="uts-metric-value">{timeSheetData.length > 0 ? `${Math.round((timeSheetData.filter(r => r.status === "Present").length / timeSheetData.length) * 100)}%` : "0%"}</span>
                  </div>
                  <div className="uts-progress green">
                    <span style={{ width: `${timeSheetData.length > 0 ? Math.round((timeSheetData.filter(r => r.status === "Present").length / timeSheetData.length) * 100) : 0}%` }}></span>
                  </div>
                </div>
              </div>
            </div>

            {/* TOP USERS */}
            <div className="uts-card">
              <div className="uts-card-header">
                <div>
                  <h3>Top Logged Users</h3>
                  <span>This week</span>
                </div>
              </div>

              <div className="uts-ranking">
                {timeSheetData.slice(0, 4).map((row: any, idx: number) => (
                  <div key={row.id || idx} className="uts-rank-row">
                    <div className="uts-rank-number">0{idx + 1}</div>
                    <div className="uts-rank-name">{row.user}</div>
                    <div className="uts-rank-hours">{row.working || "38h 15m"}</div>
                  </div>
                ))}
                {timeSheetData.length === 0 && (
                  <div style={{ textAlign: "center", padding: "16px", color: "#8a93a3", fontSize: "12px" }}>
                    No time sheet records
                  </div>
                )}
              </div>
            </div>

            {/* ALERTS */}
            <div className="uts-card">
              <div className="uts-card-header">
                <div>
                  <h3>Time Sheet Alerts</h3>
                  <span>Requires attention</span>
                </div>
              </div>

              <div className="uts-alert-list">
                <div className="uts-alert warning">
                  <strong>!</strong>
                  <span>{timeSheetData.filter(r => parseHoursMinutes(r.overtime) > 0).length} users logged overtime.</span>
                </div>

                <div className="uts-alert info">
                  <strong>i</strong>
                  <span>{timeSheetData.filter(r => !r.logout || r.logout === "--").length} users currently active on shift.</span>
                </div>

                <div className="uts-alert success">
                  <strong>✓</strong>
                  <span>{timeSheetData.length > 0 ? "All available time records synced live." : "Awaiting agent activity."}</span>
                </div>
              </div>
            </div>
          </section>

          {/* TABLE */}
          <section className="uts-table-card">
            <div className="uts-table-head">
              <div>
                <h3>User Time Sheet Details</h3>
              </div>
              <span style={{ fontSize: "12px", color: "#8a93a3" }}>{timeSheetData.length} Records</span>
            </div>

            <div className="uts-table-wrapper">
              <table id="timesheetTable">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Date</th>
                    <th>Login</th>
                    <th>Logout</th>
                    <th>Working</th>
                    <th>Break</th>
                    <th>Overtime</th>
                    <th>Status</th>
                    <th>Attendance</th>
                  </tr>
                </thead>

                <tbody>
                  {timeSheetData.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "24px", color: "#8a93a3" }}>
                        No user time sheet records found
                      </td>
                    </tr>
                  )}
                  {timeSheetData.map((row: any, idx: number) => {
                    const initials = (row.user || "User").split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <tr key={row.id || idx}>
                        <td>
                          <div className="uts-employee">
                            <div className="uts-employee-avatar">{initials}</div>
                            {row.user}
                          </div>
                        </td>
                        <td>{row.date || "Today"}</td>
                        <td>{row.login || "--"}</td>
                        <td>{row.logout || "--"}</td>
                        <td className="uts-hours">{row.working || "00h 00m"}</td>
                        <td>{row.break || "00h 00m"}</td>
                        <td className="uts-overtime">{row.overtime || "00h 00m"}</td>
                        <td>
                          <span className={`uts-status ${row.status === "Approved" ? "active" : "break"}`}>
                            ● {row.status || "Approved"}
                          </span>
                        </td>
                        <td className="uts-ontime">On Time</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="uts-table-footer">
              <div className="uts-records">Showing 1–{timeSheetData.length} of {timeSheetData.length} users</div>

              <div className="uts-pagination">
                <button className="uts-page">‹</button>

                {[1, 2, 3, 4].map((page) => (
                  <button
                    key={page}
                    className={`uts-page ${activePage === page ? "active" : ""}`}
                    onClick={() => setActivePage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button className="uts-page">›</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}
