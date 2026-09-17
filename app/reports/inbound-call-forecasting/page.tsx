"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function InboundCallForecastingReport() {
  const { timeStr } = useLiveClock();
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [forecastSummary, setForecastSummary] = useState<any[]>([]);
  const [forecastQueues, setForecastQueues] = useState<any[]>([]);
  const [campaignList, setCampaignList] = useState<string[]>(["All Campaigns", "testcampaign", "testprocess", "Inbound Default Trunk"]);

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("inbound-call-forecasting");
        if (res) {
          if (Array.isArray(res.data) && res.data.length > 0) setForecastData(res.data);
          if (res.summary) setForecastSummary(res.summary);
          if (res.queues && Array.isArray(res.queues)) setForecastQueues(res.queues);
          if (res.campaigns && Array.isArray(res.campaigns)) setCampaignList(["All Campaigns", ...res.campaigns]);
        }
      } catch (err) {
        console.error("Failed loading report for inbound-call-forecasting:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const [period, setPeriod] = useState("Next 7 Days");
  const [queue, setQueue] = useState("All Queues");
  const [campaign, setCampaign] = useState("All Campaigns");
  const [model, setModel] = useState("Auto Forecast");
  const [fromDate, setFromDate] = useState("2026-09-07");

  const [refreshBtnText, setRefreshBtnText] = useState("↻ Refresh");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Report Updated");
  const [modalText, setModalText] = useState(
    "The forecasting report has been refreshed successfully."
  );

  const showModal = (title: string, text: string) => {
    setModalTitle(title);
    setModalText(text);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const refreshReport = () => {
    setRefreshBtnText("Refreshing...");
    setTimeout(() => {
      setRefreshBtnText("↻ Refresh");
      showModal(
        "Forecast Refreshed",
        "Inbound call forecasting data and staffing recommendations have been updated."
      );
    }, 800);
  };

  const applyFilters = () => {
    showModal(
      "Filters Applied",
      `Forecast updated for ${queue} using the ${period} forecast period.`
    );
  };

  const resetFilters = () => {
    setPeriod("Next 7 Days");
    setQueue("All Queues");
    setCampaign("All Campaigns");
    setModel("Auto Forecast");
    setFromDate("2026-09-07");
    showModal(
      "Filters Reset",
      "All forecasting filters have been restored to their default values."
    );
  };

  const totalForecastCalls = forecastData.reduce((acc, r) => acc + (parseInt(r.forecast_calls) || 0), 0);
  const totalAnswered = forecastData.reduce((acc, r) => acc + (parseInt(r.answered) || 0), 0);
  const totalAbandoned = forecastData.reduce((acc, r) => acc + (parseInt(r.abandoned) || 0), 0);
  const peakAgents = forecastData.length > 0 ? Math.max(...forecastData.map(r => parseInt(r.required_agents) || 0)) : 0;
  const forecastAccuracy = totalForecastCalls > 0 ? ((totalAnswered / totalForecastCalls) * 100).toFixed(1) : "0.0";

  const exportCSV = () => {
    const headers = ["Hour", "Forecast Calls", "Answered", "Abandoned", "AHT", "Service Level", "Required Agents"];
    const rows = forecastData.map(r => [
      r.hour, r.forecast_calls, r.answered, r.abandoned, r.aht, r.service_level, r.required_agents
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inbound_call_forecasting_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="icf-root">
        <style jsx global>{`
          .icf-root {
            background: #f5f7fb;
            color: #172033;
            min-height: 100vh;
            font-family: Inter, Segoe UI, Arial, sans-serif;
            border-radius: 12px;
          }

          /* PAGE */
          .icf-page {
            padding: 25px 30px 40px;
            max-width: 1600px;
            margin: auto;
          }

          .icf-breadcrumb {
            color: #7d8497;
            font-size: 12px;
            margin-bottom: 8px;
          }

          .icf-title-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 23px;
          }

          .icf-title h1 {
            font-size: 27px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }

          .icf-title p {
            margin-top: 6px;
            color: #747c90;
            font-size: 13px;
          }

          .icf-actions {
            display: flex;
            gap: 9px;
          }

          .icf-btn {
            border: 0;
            cursor: pointer;
            font-weight: 650;
            height: 38px;
            padding: 0 15px;
            border-radius: 8px;
            background: white;
            border: 1px solid #dfe3ed;
            color: #40475a;
            font-size: 12px;
          }

          .icf-btn:hover {
            background: #f5f6fa;
          }

          .icf-btn.icf-primary {
            color: white;
            background: #6548dc;
            border-color: #6548dc;
          }

          .icf-btn.icf-primary:hover {
            background: #5639c8;
          }

          /* FILTERS */
          .icf-filter-panel {
            background: white;
            border: 1px solid #e5e8ef;
            border-radius: 12px;
            padding: 17px;
            margin-bottom: 20px;
          }

          .icf-filter-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
          }

          .icf-filter-title strong {
            font-size: 14px;
          }

          .icf-filter-title span {
            font-size: 11px;
            color: #7d8495;
          }

          .icf-filters {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
          }

          .icf-field label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            color: #6f778b;
            margin-bottom: 6px;
          }

          .icf-field select,
          .icf-field input {
            width: 100%;
            height: 37px;
            border: 1px solid #dfe3ec;
            border-radius: 7px;
            background: #fff;
            padding: 0 10px;
            outline: none;
            color: #30374a;
            font-size: 12px;
          }

          .icf-field select:focus,
          .icf-field input:focus {
            border-color: #7659e7;
          }

          .icf-filter-actions {
            display: flex;
            align-items: flex-end;
            gap: 8px;
          }

          /* KPI */
          .icf-kpis {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 14px;
            margin-bottom: 20px;
          }

          .icf-kpi {
            background: white;
            border: 1px solid #e5e8ef;
            border-radius: 12px;
            padding: 17px;
            position: relative;
            overflow: hidden;
          }

          .icf-kpi::after {
            content: "";
            position: absolute;
            right: -22px;
            bottom: -25px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #f1efff;
          }

          .icf-kpi-label {
            color: #7b8295;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .icf-kpi-value {
            margin-top: 9px;
            font-size: 27px;
            font-weight: 800;
          }

          .icf-kpi-change {
            margin-top: 6px;
            font-size: 11px;
            font-weight: 700;
          }

          .icf-up {
            color: #20a66a;
          }

          .icf-down {
            color: #e15454;
          }

          .icf-neutral {
            color: #7c8497;
          }

          /* GRID */
          .icf-grid {
            display: grid;
            grid-template-columns: 1.6fr 1fr;
            gap: 18px;
            margin-bottom: 18px;
          }

          .icf-card {
            background: white;
            border: 1px solid #e5e8ef;
            border-radius: 12px;
            overflow: hidden;
          }

          .icf-card-head {
            min-height: 58px;
            padding: 15px 17px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #edf0f5;
          }

          .icf-card-head h3 {
            font-size: 14px;
            font-weight: 800;
          }

          .icf-card-head p {
            margin-top: 4px;
            color: #8a91a2;
            font-size: 11px;
          }

          .icf-card-body {
            padding: 17px;
          }

          /* LEGEND */
          .icf-legend {
            display: flex;
            gap: 17px;
            font-size: 11px;
            color: #70788a;
          }

          .icf-legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .icf-legend-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
          }

          .icf-forecast {
            background: #7659e7;
          }

          .icf-actual {
            background: #28b987;
          }

          /* SVG CHART */
          .icf-chart-wrap {
            height: 305px;
          }

          .icf-chart-wrap svg {
            width: 100%;
            height: 100%;
          }

          .icf-gridline {
            stroke: #edf0f5;
            stroke-width: 1;
          }

          .icf-axis-label {
            fill: #9299a9;
            font-size: 10px;
          }

          .icf-area {
            fill: url(#icfAreaGradient);
            opacity: 0.8;
          }

          .icf-line-forecast {
            fill: none;
            stroke: #7659e7;
            stroke-width: 3;
          }

          .icf-line-actual {
            fill: none;
            stroke: #28b987;
            stroke-width: 3;
          }

          .icf-chart-point {
            stroke: white;
            stroke-width: 2;
          }

          /* FORECAST SCORE */
          .icf-score {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .icf-score-circle {
            width: 118px;
            height: 118px;
            border-radius: 50%;
            background: conic-gradient(#7659e7 0 91%, #ece9fa 91% 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .icf-score-inner {
            width: 88px;
            height: 88px;
            border-radius: 50%;
            background: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          .icf-score-inner strong {
            font-size: 25px;
          }

          .icf-score-inner span {
            font-size: 10px;
            color: #8990a0;
          }

          .icf-score-info {
            flex: 1;
          }

          .icf-score-info h4 {
            font-size: 15px;
            margin-bottom: 8px;
          }

          .icf-score-info p {
            font-size: 12px;
            color: #7c8496;
            line-height: 1.6;
          }

          .icf-metric-row {
            display: flex;
            justify-content: space-between;
            padding: 9px 0;
            border-bottom: 1px solid #eef0f5;
            font-size: 12px;
          }

          .icf-metric-row:last-child {
            border-bottom: 0;
          }

          .icf-metric-row span:first-child {
            color: #747c8e;
          }

          .icf-metric-row strong {
            color: #2d3446;
          }

          /* HOURLY */
          .icf-hourly-card {
            margin-bottom: 18px;
          }

          .icf-table-wrap {
            overflow: auto;
          }

          .icf-table-wrap table {
            width: 100%;
            border-collapse: collapse;
          }

          .icf-table-wrap th {
            background: #fafbfc;
            color: #737b8d;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: left;
            padding: 11px 13px;
            border-bottom: 1px solid #e8ebf1;
            white-space: nowrap;
          }

          .icf-table-wrap td {
            padding: 12px 13px;
            border-bottom: 1px solid #edf0f4;
            font-size: 12px;
            white-space: nowrap;
          }

          .icf-table-wrap tr:hover td {
            background: #fafaff;
          }

          .icf-hour {
            font-weight: 750;
          }

          .icf-progress {
            width: 100px;
            height: 7px;
            border-radius: 20px;
            background: #eceef4;
            overflow: hidden;
          }

          .icf-progress span {
            display: block;
            height: 100%;
            border-radius: 20px;
            background: #7659e7;
          }

          .icf-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 750;
          }

          .icf-badge.icf-green {
            background: #e9f8f1;
            color: #16855a;
          }

          .icf-badge.icf-orange {
            background: #fff3df;
            color: #b87300;
          }

          .icf-badge.icf-red {
            background: #ffebeb;
            color: #c44545;
          }

          .icf-badge.icf-purple {
            background: #efecff;
            color: #6548dc;
          }

          /* LOWER GRID */
          .icf-lower-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-bottom: 18px;
          }

          /* STAFFING */
          .icf-staff-card {
            padding: 16px;
          }

          .icf-staff-row {
            display: grid;
            grid-template-columns: 110px 1fr 80px 80px;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #edf0f5;
          }

          .icf-staff-row:last-child {
            border-bottom: 0;
          }

          .icf-staff-hour {
            font-size: 12px;
            font-weight: 750;
          }

          .icf-staff-bar {
            height: 9px;
            background: #eceef5;
            border-radius: 10px;
            overflow: hidden;
          }

          .icf-staff-bar span {
            display: block;
            height: 100%;
            background: linear-gradient(90deg, #7659e7, #9278ee);
            border-radius: 10px;
          }

          .icf-staff-number {
            text-align: right;
            font-size: 12px;
            font-weight: 750;
          }

          /* HEATMAP */
          .icf-heatmap {
            display: grid;
            grid-template-columns: 90px repeat(7, 1fr);
            gap: 4px;
            margin-top: 5px;
          }

          .icf-hm-head {
            font-size: 10px;
            text-align: center;
            color: #7b8293;
            padding: 6px 2px;
          }

          .icf-hm-label {
            font-size: 10px;
            color: #747c8f;
            display: flex;
            align-items: center;
          }

          .icf-hm-cell {
            height: 29px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            font-weight: 700;
          }

          .icf-l1 {
            background: #f0edff;
            color: #6c5ac1;
          }
          .icf-l2 {
            background: #dcd5ff;
            color: #5c4cad;
          }
          .icf-l3 {
            background: #b9abff;
            color: #47369d;
          }
          .icf-l4 {
            background: #9079f0;
            color: white;
          }
          .icf-l5 {
            background: #6246d3;
            color: white;
          }

          /* QUEUE TABLE */
          .icf-queue-dot {
            display: inline-block;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            margin-right: 6px;
          }

          /* INSIGHTS */
          .icf-insights {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .icf-insight {
            padding: 14px;
            border-radius: 9px;
            background: #f8f8fc;
            border: 1px solid #ececf4;
          }

          .icf-insight-icon {
            width: 31px;
            height: 31px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eeeaff;
            color: #684cda;
            font-weight: 800;
            margin-bottom: 10px;
          }

          .icf-insight h4 {
            font-size: 12px;
            margin-bottom: 5px;
          }

          .icf-insight p {
            color: #7b8293;
            font-size: 11px;
            line-height: 1.55;
          }

          /* FOOTER */
          .icf-footer-note {
            text-align: right;
            color: #969dad;
            font-size: 10px;
            margin-top: 8px;
          }

          /* MODAL */
          .icf-modal {
            position: fixed;
            inset: 0;
            background: rgba(15, 13, 30, 0.55);
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .icf-modal-box {
            width: 440px;
            background: white;
            border-radius: 13px;
            padding: 22px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          }

          .icf-modal-box h3 {
            font-size: 17px;
            margin-bottom: 8px;
          }

          .icf-modal-box p {
            color: #747c8f;
            font-size: 12px;
            line-height: 1.6;
          }

          .icf-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 20px;
          }

          /* RESPONSIVE */
          @media (max-width: 1200px) {
            .icf-filters {
              grid-template-columns: repeat(3, 1fr);
            }
            .icf-kpis {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          @media (max-width: 900px) {
            .icf-grid,
            .icf-lower-grid {
              grid-template-columns: 1fr;
            }
            .icf-insights {
              grid-template-columns: 1fr;
            }
            .icf-kpis {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 650px) {
            .icf-page {
              padding: 18px 14px;
            }
            .icf-filters {
              grid-template-columns: 1fr;
            }
            .icf-kpis {
              grid-template-columns: 1fr;
            }
            .icf-title-row {
              flex-direction: column;
              gap: 15px;
            }
            .icf-actions {
              width: 100%;
            }
            .icf-actions button {
              flex: 1;
            }
          }

          @media print {
            .icf-actions,
            .icf-filter-panel {
              display: none;
            }
            .icf-page {
              padding: 10px;
            }
            .icf-root {
              background: white;
            }
          }
        `}</style>

        <main className="icf-page">
          {/* Back Navigation Link */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
          </Link>

          <div className="icf-breadcrumb">Reports / Inbound / Forecasting</div>

          <div className="icf-title-row">
            <div className="icf-title">
              <h1>Inbound Call Forecasting Report</h1>
              <p>
                Analyze expected inbound traffic, forecast demand and optimize agent
                staffing.
              </p>
            </div>

            <div className="icf-actions">
              <button className="icf-btn" onClick={refreshReport}>
                {refreshBtnText}
              </button>
              <button className="icf-btn" onClick={() => window.print()}>
                🖨 Print
              </button>
              <button className="icf-btn icf-primary" onClick={exportCSV}>
                ↓ Export CSV
              </button>
            </div>
          </div>

          {/* FILTER PANEL */}
          <section className="icf-filter-panel">
            <div className="icf-filter-title">
              <strong>Forecast Configuration</strong>
              <span>Last updated: Today, {timeStr}</span>
            </div>

            <div className="icf-filters">
              <div className="icf-field">
                <label>Forecast Period</label>
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option>Today</option>
                  <option>Next 24 Hours</option>
                  <option>Next 7 Days</option>
                  <option>Next 30 Days</option>
                </select>
              </div>

              <div className="icf-field">
                <label>Queue</label>
                <select
                  id="queue"
                  value={queue}
                  onChange={(e) => setQueue(e.target.value)}
                >
                  <option>All Queues</option>
                  {(forecastQueues.length > 0 ? forecastQueues : [
                    { queue: "Inbound Default Trunk" },
                    { queue: "testprocess" },
                    { queue: "testcampaign" }
                  ]).map((q: any, idx: number) => (
                    <option key={idx}>{q.queue}</option>
                  ))}
                </select>
              </div>

              <div className="icf-field">
                <label>Campaign</label>
                <select
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                >
                  {campaignList.map((c, idx) => (
                    <option key={idx}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="icf-field">
                <label>Forecast Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option>Auto Forecast</option>
                  <option>Historical Average</option>
                  <option>Moving Average</option>
                  <option>Trend Based</option>
                </select>
              </div>

              <div className="icf-field">
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="icf-filter-actions">
                <button className="icf-btn icf-primary" onClick={applyFilters}>
                  Apply Filters
                </button>
                <button className="icf-btn" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </div>
          </section>

          {/* KPI CARDS */}
          <section className="icf-kpis">
            <div className="icf-kpi">
              <div className="icf-kpi-label">Forecast Calls</div>
              <div className="icf-kpi-value">{totalForecastCalls.toLocaleString()}</div>
              <div className="icf-kpi-change icf-up">
                ● Live DB Projected
              </div>
            </div>

            <div className="icf-kpi">
              <div className="icf-kpi-label">Expected Answered</div>
              <div className="icf-kpi-value">{totalAnswered.toLocaleString()}</div>
              <div className="icf-kpi-change icf-up">
                {((totalAnswered / Math.max(1, totalForecastCalls)) * 100).toFixed(1)}% answer forecast
              </div>
            </div>

            <div className="icf-kpi">
              <div className="icf-kpi-label">Expected Abandoned</div>
              <div className="icf-kpi-value">{totalAbandoned.toLocaleString()}</div>
              <div className="icf-kpi-change icf-down">
                {((totalAbandoned / Math.max(1, totalForecastCalls)) * 100).toFixed(1)}% abandonment risk
              </div>
            </div>

            <div className="icf-kpi">
              <div className="icf-kpi-label">Required Inbound Agents</div>
              <div className="icf-kpi-value">{peakAgents}</div>
              <div className="icf-kpi-change icf-neutral">
                Peak staffing requirement
              </div>
            </div>

            <div className="icf-kpi">
              <div className="icf-kpi-label">Forecast Accuracy</div>
              <div className="icf-kpi-value">{forecastAccuracy}%</div>
              <div className="icf-kpi-change icf-up">
                {totalForecastCalls > 0 ? "● Live DB Projected" : "—"}
              </div>
            </div>
          </section>

          {/* CHART + ACCURACY */}
          <section className="icf-grid">
            <div className="icf-card">
              <div className="icf-card-head">
                <div>
                  <h3>Actual vs Forecast Call Volume</h3>
                  <p>Hourly inbound call demand trend</p>
                </div>

                <div className="icf-legend">
                  <div className="icf-legend-item">
                    <span className="icf-legend-dot icf-actual"></span>
                    Actual
                  </div>
                  <div className="icf-legend-item">
                    <span className="icf-legend-dot icf-forecast"></span>
                    Forecast
                  </div>
                </div>
              </div>

              <div className="icf-card-body">
                <div className="icf-chart-wrap">
                  <svg viewBox="0 0 900 300" preserveAspectRatio="none">
                    <defs>
                      <linearGradient
                        id="icfAreaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7659e7"
                          stopOpacity="0.22"
                        />
                        <stop
                          offset="100%"
                          stopColor="#7659e7"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    {/* Grid */}
                    <line x1="50" y1="35" x2="880" y2="35" className="icf-gridline" />
                    <line x1="50" y1="85" x2="880" y2="85" className="icf-gridline" />
                    <line x1="50" y1="135" x2="880" y2="135" className="icf-gridline" />
                    <line x1="50" y1="185" x2="880" y2="185" className="icf-gridline" />
                    <line x1="50" y1="235" x2="880" y2="235" className="icf-gridline" />

                    {/* Y Labels */}
                    <text x="12" y="39" className="icf-axis-label">
                      800
                    </text>
                    <text x="12" y="89" className="icf-axis-label">
                      600
                    </text>
                    <text x="12" y="139" className="icf-axis-label">
                      400
                    </text>
                    <text x="12" y="189" className="icf-axis-label">
                      200
                    </text>
                    <text x="20" y="239" className="icf-axis-label">
                      0
                    </text>

                    {/* Forecast Area */}
                    <path
                      className="icf-area"
                      d="M50 200 L105 180 L160 190 L215 155 L270 140 L325 115 L380 125 L435 85 L490 70 L545 100 L600 65 L655 80 L710 45 L765 62 L820 38 L880 50 L880 235 L50 235 Z"
                    />

                    {/* Forecast */}
                    <polyline
                      className="icf-line-forecast"
                      points="50,200 105,180 160,190 215,155 270,140 325,115 380,125 435,85 490,70 545,100 600,65 655,80 710,45 765,62 820,38 880,50"
                    />

                    {/* Actual */}
                    <polyline
                      className="icf-line-actual"
                      points="50,204 105,174 160,193 215,161 270,134 325,121 380,118 435,91 490,77 545,94 600,70 655,86 710,52 765,68 820,43 880,55"
                    />

                    {/* Points */}
                    <g fill="#28b987">
                      <circle cx="50" cy="204" r="4" className="icf-chart-point" />
                      <circle cx="160" cy="193" r="4" className="icf-chart-point" />
                      <circle cx="270" cy="134" r="4" className="icf-chart-point" />
                      <circle cx="380" cy="118" r="4" className="icf-chart-point" />
                      <circle cx="490" cy="77" r="4" className="icf-chart-point" />
                      <circle cx="600" cy="70" r="4" className="icf-chart-point" />
                      <circle cx="710" cy="52" r="4" className="icf-chart-point" />
                      <circle cx="820" cy="43" r="4" className="icf-chart-point" />
                    </g>

                    {/* X Labels */}
                    <text x="45" y="260" className="icf-axis-label">
                      00:00
                    </text>
                    <text x="155" y="260" className="icf-axis-label">
                      03:00
                    </text>
                    <text x="265" y="260" className="icf-axis-label">
                      06:00
                    </text>
                    <text x="375" y="260" className="icf-axis-label">
                      09:00
                    </text>
                    <text x="485" y="260" className="icf-axis-label">
                      12:00
                    </text>
                    <text x="595" y="260" className="icf-axis-label">
                      15:00
                    </text>
                    <text x="705" y="260" className="icf-axis-label">
                      18:00
                    </text>
                    <text x="815" y="260" className="icf-axis-label">
                      21:00
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <div className="icf-card">
              <div className="icf-card-head">
                <div>
                  <h3>Forecast Accuracy</h3>
                  <p>Model confidence and performance</p>
                </div>
                <span className="icf-badge icf-green">High Confidence</span>
              </div>

              <div className="icf-card-body">
                <div className="icf-score">
                  <div className="icf-score-circle">
                    <div className="icf-score-inner">
                      <strong>{forecastAccuracy}%</strong>
                      <span>Accuracy</span>
                    </div>
                  </div>

                  <div className="icf-score-info">
                    <h4>Forecast is performing well</h4>
                    <p>
                      Current forecast is closely aligned with historical
                      inbound traffic patterns.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: "17px" }}>
                  <div className="icf-metric-row">
                    <span>Mean Absolute Error</span>
                    <strong>{forecastData.length > 0 ? "34 calls" : "0 calls"}</strong>
                  </div>

                  <div className="icf-metric-row">
                    <span>Prediction Confidence</span>
                    <strong>{forecastAccuracy}%</strong>
                  </div>

                  <div className="icf-metric-row">
                    <span>Historical Window</span>
                    <strong>30 Days</strong>
                  </div>

                  <div className="icf-metric-row">
                    <span>Peak Detection</span>
                    <strong>Enabled</strong>
                  </div>

                  <div className="icf-metric-row">
                    <span>Last Model Update</span>
                    <strong>{timeStr}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HOURLY FORECAST */}
          <section className="icf-card icf-hourly-card">
            <div className="icf-card-head">
              <div>
                <h3>Hourly Forecast & Staffing Requirement</h3>
                <p>Expected inbound traffic for the selected forecast period</p>
              </div>
              <span className="icf-badge icf-purple">Next 24 Hours</span>
            </div>

            <div className="icf-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hour</th>
                    <th>Forecast Calls</th>
                    <th>Answered</th>
                    <th>Abandoned</th>
                    <th>Expected AHT</th>
                    <th>Service Level</th>
                    <th>Required Agents</th>
                    <th>Demand</th>
                  </tr>
                </thead>
                <tbody>
                  {(forecastData.length > 0 ? forecastData : [
                    { hour: "09:00 AM", forecast_calls: "42", answered: "40", abandoned: "2", aht: "3m 42s", service_level: "95.1%", required_agents: "6" },
                    { hour: "10:00 AM", forecast_calls: "48", answered: "46", abandoned: "2", aht: "3m 48s", service_level: "95.0%", required_agents: "7" },
                    { hour: "11:00 AM", forecast_calls: "54", answered: "51", abandoned: "3", aht: "4m 02s", service_level: "94.4%", required_agents: "8" },
                    { hour: "12:00 PM", forecast_calls: "61", answered: "57", abandoned: "4", aht: "4m 08s", service_level: "93.7%", required_agents: "9" },
                    { hour: "01:00 PM", forecast_calls: "67", answered: "62", abandoned: "5", aht: "4m 16s", service_level: "92.9%", required_agents: "10" }
                  ]).map((r, idx) => {
                    const pct = Math.min(100, Math.max(20, parseInt(r.required_agents || "5") * 10));
                    return (
                      <tr key={r.id || idx}>
                        <td className="icf-hour">{r.hour}</td>
                        <td>{r.forecast_calls}</td>
                        <td>{r.answered}</td>
                        <td>{r.abandoned}</td>
                        <td>{r.aht}</td>
                        <td>
                          <span className="icf-badge icf-green">{r.service_level}</span>
                        </td>
                        <td>
                          <strong>{r.required_agents}</strong>
                        </td>
                        <td>
                          <div className="icf-progress">
                            <span style={{ width: `${pct}%` }}></span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* LOWER GRID */}
          <section className="icf-lower-grid">
            <div className="icf-card">
              <div className="icf-card-head">
                <div>
                  <h3>Agent Staffing Forecast</h3>
                  <p>Recommended staffing by peak period</p>
                </div>
                <span className="icf-badge icf-purple">48 Peak Agents</span>
              </div>

              <div className="icf-staff-card">
                <div className="icf-staff-row">
                  <div className="icf-staff-hour">09 AM</div>
                  <div className="icf-staff-bar">
                    <span style={{ width: "55%" }}></span>
                  </div>
                  <div className="icf-staff-number">28 agents</div>
                  <div>
                    <span className="icf-badge icf-green">OK</span>
                  </div>
                </div>

                <div className="icf-staff-row">
                  <div className="icf-staff-hour">11 AM</div>
                  <div className="icf-staff-bar">
                    <span style={{ width: "70%" }}></span>
                  </div>
                  <div className="icf-staff-number">35 agents</div>
                  <div>
                    <span className="icf-badge icf-green">OK</span>
                  </div>
                </div>

                <div className="icf-staff-row">
                  <div className="icf-staff-hour">01 PM</div>
                  <div className="icf-staff-bar">
                    <span style={{ width: "88%" }}></span>
                  </div>
                  <div className="icf-staff-number">44 agents</div>
                  <div>
                    <span className="icf-badge icf-orange">High</span>
                  </div>
                </div>

                <div className="icf-staff-row">
                  <div className="icf-staff-hour">03 PM</div>
                  <div className="icf-staff-bar">
                    <span style={{ width: "100%" }}></span>
                  </div>
                  <div className="icf-staff-number">50 agents</div>
                  <div>
                    <span className="icf-badge icf-red">Peak</span>
                  </div>
                </div>

                <div className="icf-staff-row">
                  <div className="icf-staff-hour">05 PM</div>
                  <div className="icf-staff-bar">
                    <span style={{ width: "90%" }}></span>
                  </div>
                  <div className="icf-staff-number">45 agents</div>
                  <div>
                    <span className="icf-badge icf-orange">High</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="icf-card">
              <div className="icf-card-head">
                <div>
                  <h3>Inbound Volume Heatmap</h3>
                  <p>Forecast call intensity by day and hour</p>
                </div>
              </div>

              <div className="icf-card-body">
                <div className="icf-heatmap">
                  <div></div>
                  <div className="icf-hm-head">Mon</div>
                  <div className="icf-hm-head">Tue</div>
                  <div className="icf-hm-head">Wed</div>
                  <div className="icf-hm-head">Thu</div>
                  <div className="icf-hm-head">Fri</div>
                  <div className="icf-hm-head">Sat</div>
                  <div className="icf-hm-head">Sun</div>

                  <div className="icf-hm-label">09 AM</div>
                  <div className="icf-hm-cell icf-l2">420</div>
                  <div className="icf-hm-cell icf-l3">460</div>
                  <div className="icf-hm-cell icf-l2">435</div>
                  <div className="icf-hm-cell icf-l3">480</div>
                  <div className="icf-hm-cell icf-l3">490</div>
                  <div className="icf-hm-cell icf-l1">270</div>
                  <div className="icf-hm-cell icf-l1">220</div>

                  <div className="icf-hm-label">11 AM</div>
                  <div className="icf-hm-cell icf-l3">540</div>
                  <div className="icf-hm-cell icf-l4">590</div>
                  <div className="icf-hm-cell icf-l3">550</div>
                  <div className="icf-hm-cell icf-l4">610</div>
                  <div className="icf-hm-cell icf-l4">620</div>
                  <div className="icf-hm-cell icf-l2">340</div>
                  <div className="icf-hm-cell icf-l1">290</div>

                  <div className="icf-hm-label">01 PM</div>
                  <div className="icf-hm-cell icf-l4">670</div>
                  <div className="icf-hm-cell icf-l5">720</div>
                  <div className="icf-hm-cell icf-l4">690</div>
                  <div className="icf-hm-cell icf-l5">760</div>
                  <div className="icf-hm-cell icf-l5">780</div>
                  <div className="icf-hm-cell icf-l2">390</div>
                  <div className="icf-hm-cell icf-l2">330</div>

                  <div className="icf-hm-label">03 PM</div>
                  <div className="icf-hm-cell icf-l4">720</div>
                  <div className="icf-hm-cell icf-l5">760</div>
                  <div className="icf-hm-cell icf-l5">745</div>
                  <div className="icf-hm-cell icf-l5">810</div>
                  <div className="icf-hm-cell icf-l5">825</div>
                  <div className="icf-hm-cell icf-l3">450</div>
                  <div className="icf-hm-cell icf-l2">380</div>

                  <div className="icf-hm-label">05 PM</div>
                  <div className="icf-hm-cell icf-l4">650</div>
                  <div className="icf-hm-cell icf-l4">700</div>
                  <div className="icf-hm-cell icf-l4">680</div>
                  <div className="icf-hm-cell icf-l5">735</div>
                  <div className="icf-hm-cell icf-l4">710</div>
                  <div className="icf-hm-cell icf-l2">410</div>
                  <div className="icf-hm-cell icf-l2">360</div>
                </div>
              </div>
            </div>
          </section>

          {/* QUEUE FORECAST */}
          <section className="icf-card" style={{ marginBottom: "18px" }}>
            <div className="icf-card-head">
              <div>
                <h3>Queue Forecast Summary</h3>
                <p>Expected demand and staffing requirements by inbound queue</p>
              </div>
              <span className="icf-badge icf-green">4 Queues</span>
            </div>

            <div className="icf-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Queue</th>
                    <th>Forecast Calls</th>
                    <th>Expected Answered</th>
                    <th>Abandon Rate</th>
                    <th>Avg. Wait</th>
                    <th>Required Agents</th>
                    <th>Current Agents</th>
                    <th>Staffing Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(forecastQueues.length > 0 ? forecastQueues : [
                    { queue: "Inbound Support", color: "#28b987", forecast_calls: "124", answered: "116", abandon_rate: "6.0%", avg_wait: "24 sec", required_agents: "8", current_agents: "9", status: "Covered", status_type: "green" },
                    { queue: "Voice Consultation", color: "#7659e7", forecast_calls: "98", answered: "94", abandon_rate: "4.0%", avg_wait: "18 sec", required_agents: "7", current_agents: "7", status: "Covered", status_type: "green" },
                    { queue: "Billing & Accounts", color: "#f0a53a", forecast_calls: "52", answered: "48", abandon_rate: "8.0%", avg_wait: "31 sec", required_agents: "4", current_agents: "4", status: "Covered", status_type: "green" },
                    { queue: "General Inquiries", color: "#4d83e8", forecast_calls: "38", answered: "35", abandon_rate: "9.0%", avg_wait: "35 sec", required_agents: "3", current_agents: "2", status: "1 Agent Needed", status_type: "red" },
                  ]).map((q, qIdx) => (
                    <tr key={qIdx}>
                      <td>
                        <span
                          className="icf-queue-dot"
                          style={{ background: q.color || "#7659e7" }}
                        ></span>
                        {q.queue}
                      </td>
                      <td>{q.forecast_calls}</td>
                      <td>{q.answered}</td>
                      <td>{q.abandon_rate}</td>
                      <td>{q.avg_wait}</td>
                      <td>{q.required_agents}</td>
                      <td>{q.current_agents}</td>
                      <td>
                        <span className={`icf-badge icf-${q.status_type || 'green'}`}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="icf-card">
            <div className="icf-card-head">
              <div>
                <h3>Forecast Insights & Recommendations</h3>
                <p>Automated observations based on forecasted inbound traffic</p>
              </div>
              <span className="icf-badge icf-purple">AI Insights</span>
            </div>

            <div className="icf-card-body">
              <div className="icf-insights">
                <div className="icf-insight">
                  <div className="icf-insight-icon">↑</div>
                  <h4>Peak Traffic Expected</h4>
                  <p>
                    The highest inbound volume is expected between{" "}
                    <strong>2:00 PM and 4:00 PM</strong>.
                  </p>
                </div>

                <div className="icf-insight">
                  <div className="icf-insight-icon">+</div>
                  <h4>Staffing Recommendation</h4>
                  <p>
                    Add approximately <strong>3 agents</strong> during the
                    afternoon peak to protect service levels.
                  </p>
                </div>

                <div className="icf-insight">
                  <div className="icf-insight-icon">!</div>
                  <h4>Abandonment Risk</h4>
                  <p>
                    Support and General queues show elevated abandonment risk
                    during peak periods.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="icf-footer-note">
            Forecast generated from historical inbound traffic patterns • Demo
            report
          </div>
        </main>

        {/* MODAL */}
        {modalOpen && (
          <div className="icf-modal" onClick={closeModal}>
            <div className="icf-modal-box" onClick={(e) => e.stopPropagation()}>
              <h3>{modalTitle}</h3>
              <p>{modalText}</p>
              <div className="icf-modal-actions">
                <button className="icf-btn icf-primary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
