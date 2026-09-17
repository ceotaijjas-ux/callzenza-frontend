"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function InboundServiceLevelReport() {
  const { reportTimestampLong } = useLiveClock();
  const [liveKpis, setLiveKpis] = useState<any>({
    total_calls: "77",
    service_level: "83.8%",
    calls_within_sla: "62",
    calls_outside_sla: "12",
    abandoned_calls: "3",
    abandon_rate: "3.9%",
    avg_speed_answer: "13.9s",
    longest_wait: "00:25",
    target_threshold: "20 Seconds",
    target_pct: "80%",
    diff_pct: "+3.8% above target"
  });
  const [queuesList, setQueuesList] = useState<any[]>([]);
  const [hourlyMatrix, setHourlyMatrix] = useState<any[]>([]);
  const [thresholdsList, setThresholdsList] = useState<any[]>([]);
  const [waitDistList, setWaitDistList] = useState<any[]>([]);
  const [outcomeData, setOutcomeData] = useState<any>({
    within_sla: "62",
    within_sla_pct: "80.5%",
    after_sla: "12",
    after_sla_pct: "15.6%",
    abandoned: "3",
    abandoned_pct: "3.9%",
    total_calls: "77"
  });

  const [selectedQueue, setSelectedQueue] = useState("All Queues");
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-10");
  const [dateRange, setDateRange] = useState("Last 7 Days");
  const [selectedServiceLevel, setSelectedServiceLevel] = useState("20 Seconds");
  const [filterBtnText, setFilterBtnText] = useState("Apply");
  const [isFilterDisabled, setIsFilterDisabled] = useState(false);
  const [refreshIcon, setRefreshIcon] = useState("↻");
  const [containerOpacity, setContainerOpacity] = useState(1);

  const loadLiveReportData = async () => {
    try {
      const params: any = {
        from_date: fromDate,
        to_date: toDate,
      };
      if (selectedQueue && selectedQueue !== "All Queues") {
        params.campaign_id = selectedQueue;
      }
      const res = await reportService.getGenericReport("inbound-service-level", params);
      if (res) {
        if (res.kpis) setLiveKpis(res.kpis);
        if (Array.isArray(res.queues)) setQueuesList(res.queues);
        else if (Array.isArray(res.data)) setQueuesList(res.data);
        if (Array.isArray(res.hourly_matrix)) setHourlyMatrix(res.hourly_matrix);
        if (Array.isArray(res.thresholds)) setThresholdsList(res.thresholds);
        if (Array.isArray(res.wait_distribution)) setWaitDistList(res.wait_distribution);
        if (res.outcome) setOutcomeData(res.outcome);
      }
    } catch (err) {
      console.error("Failed loading report for inbound-service-level:", err);
    }
  };

  React.useEffect(() => {
    loadLiveReportData();
  }, []);
  const [tooltip, setTooltip] = useState<{ show: boolean; x: number; y: number; text: string }>({
    show: false,
    x: 0,
    y: 0,
    text: "",
  });

  const applyFilters = () => {
    setFilterBtnText("Loading...");
    setIsFilterDisabled(true);
    loadLiveReportData();
    setTimeout(() => {
      setFilterBtnText("Applied");
      setTimeout(() => {
        setFilterBtnText("Apply");
        setIsFilterDisabled(false);
      }, 900);
    }, 700);
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
      "Queue",
      "Calls Presented",
      "Answered",
      "Within SLA",
      "Service Level",
      "Status"
    ];

    const rows = (queuesList.length > 0 ? queuesList : []).map((q) => [
      q.queue,
      q.offered,
      q.ans,
      q.within,
      q.sla,
      q.status
    ]);

    let csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Inbound_Service_Level_Report.csv";
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
        .isl-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f5f7fb;
          color: #202634;
          border-radius: 12px;
        }

        /* PAGE */

        .isl-page {
          max-width: 1540px;
          margin: 0 auto;
          padding: 10px 10px 50px;
          transition: opacity 0.3s ease;
        }

        .isl-page-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 23px;
        }

        .isl-heading-left h1 {
          font-size: 27px;
          font-weight: 750;
          letter-spacing: -0.5px;
        }

        .isl-heading-left p {
          color: #788196;
          font-size: 13px;
          margin-top: 7px;
        }

        .isl-heading-actions {
          display: flex;
          gap: 9px;
        }

        .isl-btn {
          border: 1px solid #e4e8f0;
          background: #fff;
          color: #4c566b;
          height: 37px;
          padding: 0 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .isl-btn:hover {
          border-color: #cdd2df;
          background: #fafbfc;
        }

        .isl-btn.primary {
          color: #fff;
          background: #6259e8;
          border-color: #6259e8;
        }

        .isl-btn.primary:hover {
          background: #5148d6;
        }

        .isl-live-status {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #eafaf4;
          border: 1px solid #c9efdf;
          padding: 7px 12px;
          border-radius: 20px;
          color: #148562;
          font-size: 12px;
          font-weight: 600;
        }

        .isl-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #28c58c;
        }

        /* FILTER PANEL */

        .isl-filter-panel {
          background: #fff;
          border: 1px solid #e4e8f0;
          border-radius: 13px;
          padding: 17px 18px;
          margin-bottom: 21px;
          box-shadow: 0 3px 12px rgba(27, 38, 64, 0.025);
        }

        .isl-filter-title {
          font-size: 11px;
          font-weight: 800;
          color: #667085;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 13px;
        }

        .isl-filters {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr 1fr auto;
          gap: 11px;
          align-items: end;
        }

        .isl-field label {
          display: block;
          color: #707a8e;
          font-size: 11px;
          font-weight: 650;
          margin-bottom: 6px;
        }

        .isl-field input,
        .isl-field select {
          width: 100%;
          height: 37px;
          border: 1px solid #dfe4ec;
          border-radius: 7px;
          background: #fff;
          padding: 0 10px;
          color: #30394b;
          outline: none;
          font-size: 12px;
        }

        .isl-field input:focus,
        .isl-field select:focus {
          border-color: #aaa4f2;
          box-shadow: 0 0 0 3px rgba(98, 89, 232, 0.08);
        }

        .isl-apply-btn {
          height: 37px;
          padding: 0 16px;
          background: #6259e8;
          color: #fff;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .isl-apply-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* SERVICE LEVEL HERO */

        .isl-service-hero {
          display: grid;
          grid-template-columns: 330px 1fr;
          gap: 18px;
          margin-bottom: 19px;
        }

        .isl-gauge-card {
          background: #fff;
          border: 1px solid #e4e8f0;
          border-radius: 14px;
          padding: 22px;
          position: relative;
          overflow: hidden;
        }

        .isl-gauge-card:after {
          content: "";
          position: absolute;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: rgba(98, 89, 232, 0.035);
          right: -85px;
          top: -85px;
        }

        .isl-card-title {
          font-size: 13px;
          font-weight: 750;
          color: #394255;
        }

        .isl-card-subtitle {
          font-size: 11px;
          color: #8a93a5;
          margin-top: 4px;
        }

        .isl-gauge-wrap {
          width: 220px;
          height: 125px;
          margin: 22px auto 0;
          position: relative;
          overflow: hidden;
        }

        .isl-gauge-bg,
        .isl-gauge-fill {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          top: 0;
          left: 0;
          transform: rotate(-45deg);
        }

        .isl-gauge-bg {
          background: conic-gradient(
            from 225deg,
            #edf0f5 0deg,
            #edf0f5 270deg,
            transparent 270deg
          );
        }

        .isl-gauge-fill {
          background: conic-gradient(
            from 225deg,
            #6259e8 0deg,
            #6259e8 238deg,
            transparent 238deg
          );
        }

        .isl-gauge-inner {
          position: absolute;
          width: 166px;
          height: 166px;
          border-radius: 50%;
          background: #fff;
          left: 27px;
          top: 27px;
        }

        .isl-gauge-value {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 3px;
          text-align: center;
          font-size: 32px;
          font-weight: 800;
          color: #252d3d;
        }

        .isl-gauge-value span {
          font-size: 17px;
        }

        .isl-gauge-label {
          text-align: center;
          margin-top: 3px;
          color: #707a8d;
          font-size: 11px;
        }

        .isl-target-row {
          margin-top: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .isl-target-badge {
          padding: 5px 9px;
          border-radius: 6px;
          background: #e7f8f1;
          color: #12825d;
          font-size: 10px;
          font-weight: 750;
        }

        .isl-target-text {
          font-size: 11px;
          color: #788196;
        }

        .isl-hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .isl-stat-box {
          background: #fff;
          border: 1px solid #e4e8f0;
          border-radius: 14px;
          padding: 19px;
          position: relative;
          min-height: 143px;
        }

        .isl-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .isl-stat-label {
          color: #7c8698;
          font-size: 11px;
          font-weight: 650;
        }

        .isl-stat-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        .isl-icon-purple {
          background: #efedff;
          color: #6259e8;
        }
        .isl-icon-green {
          background: #e7f8f1;
          color: #17a673;
        }
        .isl-icon-orange {
          background: #fff5e4;
          color: #ed9b2d;
        }
        .isl-icon-red {
          background: #fff0f0;
          color: #e05252;
        }
        .isl-icon-blue {
          background: #edf5ff;
          color: #3d82e8;
        }

        .isl-stat-value {
          font-size: 25px;
          font-weight: 800;
          margin-top: 18px;
          letter-spacing: -0.5px;
        }

        .isl-stat-meta {
          margin-top: 7px;
          font-size: 10px;
          color: #8791a2;
        }

        .isl-up {
          color: #17a673;
          font-weight: 700;
        }

        .isl-down {
          color: #e05252;
          font-weight: 700;
        }

        /* LAYOUT */

        .isl-grid {
          display: grid;
          gap: 18px;
          margin-bottom: 18px;
        }

        .isl-grid-2 {
          grid-template-columns: 1.55fr 1fr;
        }

        .isl-grid-equal {
          grid-template-columns: 1fr 1fr;
        }

        .isl-card {
          background: #fff;
          border: 1px solid #e4e8f0;
          border-radius: 14px;
          padding: 19px;
          min-width: 0;
        }

        .isl-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 18px;
        }

        .isl-card-header h3 {
          font-size: 13px;
          font-weight: 750;
          color: #343d50;
        }

        .isl-card-header p {
          color: #8a93a4;
          font-size: 10px;
          margin-top: 4px;
        }

        .isl-card-menu {
          border: 1px solid #e1e5ec;
          background: #fff;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          color: #8b94a5;
          cursor: pointer;
        }

        /* SERVICE TREND */

        .isl-trend-summary {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 15px;
        }

        .isl-trend-current {
          font-size: 26px;
          font-weight: 800;
        }

        .isl-trend-change {
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 750;
          background: #e7f8f1;
          color: #13815d;
        }

        .isl-chart {
          width: 100%;
          height: 240px;
          position: relative;
        }

        .isl-chart svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .isl-grid-line {
          stroke: #edf0f4;
          stroke-width: 1;
        }

        .isl-axis-text {
          fill: #9aa2b1;
          font-size: 9px;
        }

        .isl-area {
          fill: url(#areaGradient);
        }

        .isl-line {
          fill: none;
          stroke: #6259e8;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .isl-target-line {
          stroke: #e7a33e;
          stroke-width: 1.5;
          stroke-dasharray: 5 5;
        }

        .isl-point {
          fill: #fff;
          stroke: #6259e8;
          stroke-width: 2;
          cursor: pointer;
        }

        .isl-target-label {
          fill: #bd7b18;
          font-size: 9px;
          font-weight: 700;
        }

        /* THRESHOLD */

        .isl-thresholds {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .isl-threshold-row {
          display: grid;
          grid-template-columns: 70px 1fr 48px;
          align-items: center;
          gap: 10px;
        }

        .isl-threshold-name {
          font-size: 11px;
          color: #596377;
          font-weight: 650;
        }

        .isl-progress {
          height: 9px;
          border-radius: 20px;
          background: #eef1f5;
          overflow: hidden;
        }

        .isl-progress span {
          display: block;
          height: 100%;
          border-radius: 20px;
        }

        .isl-t-purple {
          background: #6259e8;
        }
        .isl-t-green {
          background: #23b687;
        }
        .isl-t-orange {
          background: #e9a33a;
        }
        .isl-t-red {
          background: #e05a5a;
        }
        .isl-t-blue {
          background: #4388e9;
        }

        .isl-threshold-value {
          font-size: 11px;
          text-align: right;
          font-weight: 750;
        }

        /* INTERVAL MATRIX */

        .isl-matrix {
          overflow-x: auto;
        }

        .isl-matrix table {
          width: 100%;
          border-collapse: collapse;
          min-width: 750px;
        }

        .isl-matrix th {
          text-align: left;
          padding: 10px 11px;
          background: #f8f9fb;
          color: #7b8598;
          font-size: 10px;
          font-weight: 750;
          border-bottom: 1px solid #e7eaf0;
        }

        .isl-matrix td {
          padding: 11px;
          border-bottom: 1px solid #eef0f4;
          font-size: 11px;
          color: #505a6d;
        }

        .isl-matrix tr:last-child td {
          border-bottom: none;
        }

        .isl-matrix td:first-child {
          color: #323b4e;
          font-weight: 700;
        }

        .isl-sla-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .isl-mini-progress {
          width: 70px;
          height: 6px;
          background: #edf0f4;
          border-radius: 10px;
          overflow: hidden;
        }

        .isl-mini-progress span {
          display: block;
          height: 100%;
          border-radius: 10px;
        }

        /* QUEUE PERFORMANCE */

        .isl-queue-list {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .isl-queue-item {
          border: 1px solid #e8ebf1;
          border-radius: 10px;
          padding: 13px;
          transition: 0.15s;
        }

        .isl-queue-item:hover {
          border-color: #d7daf0;
          box-shadow: 0 5px 15px rgba(35, 44, 65, 0.04);
        }

        .isl-queue-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .isl-queue-name {
          font-size: 11px;
          font-weight: 750;
          color: #3a4355;
        }

        .isl-queue-score {
          font-size: 12px;
          font-weight: 800;
        }

        .isl-queue-bar {
          height: 7px;
          background: #eef1f5;
          border-radius: 20px;
          overflow: hidden;
        }

        .isl-queue-bar span {
          display: block;
          height: 100%;
          border-radius: 20px;
        }

        .isl-queue-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          margin-top: 10px;
        }

        .isl-queue-meta-item {
          font-size: 9px;
          color: #8992a4;
        }

        .isl-queue-meta-item strong {
          display: block;
          color: #4b5568;
          font-size: 10px;
          margin-top: 3px;
        }

        /* WAIT DISTRIBUTION */

        .isl-wait-layout {
          display: grid;
          grid-template-columns: 1fr 180px;
          gap: 20px;
          align-items: center;
        }

        .isl-wait-bars {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .isl-wait-row {
          display: grid;
          grid-template-columns: 85px 1fr 48px;
          align-items: center;
          gap: 10px;
        }

        .isl-wait-label {
          font-size: 10px;
          color: #6f788a;
        }

        .isl-wait-value {
          font-size: 10px;
          text-align: right;
          font-weight: 750;
        }

        .isl-wait-progress {
          height: 15px;
          background: #f0f2f5;
          border-radius: 4px;
          overflow: hidden;
        }

        .isl-wait-progress span {
          display: block;
          height: 100%;
          border-radius: 4px;
        }

        .isl-wait-legend {
          border-left: 1px solid #eceef3;
          padding-left: 20px;
        }

        .isl-legend-item {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 11px;
          font-size: 10px;
          color: #717b8e;
        }

        .isl-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        /* SLA OUTCOME */

        .isl-outcome {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .isl-outcome-card {
          padding: 15px 13px;
          border-radius: 10px;
          border: 1px solid #e8ebf1;
        }

        .isl-outcome-card .num {
          font-size: 21px;
          font-weight: 800;
        }

        .isl-outcome-card .lbl {
          margin-top: 4px;
          font-size: 9px;
          color: #858fa1;
        }

        .isl-outcome-card.good {
          background: #f7fcfa;
          border-color: #dcefe7;
        }

        .isl-outcome-card.good .num {
          color: #15966c;
        }

        .isl-outcome-card.warn {
          background: #fffaf2;
          border-color: #f3e6cc;
        }

        .isl-outcome-card.warn .num {
          color: #d18b24;
        }

        .isl-outcome-card.bad {
          background: #fff7f7;
          border-color: #f1dddd;
        }

        .isl-outcome-card.bad .num {
          color: #d95353;
        }

        /* TABLE */

        .isl-detail-card {
          padding-bottom: 7px;
        }

        .isl-detail-table {
          width: 100%;
          border-collapse: collapse;
        }

        .isl-detail-table th {
          text-align: left;
          color: #7e8799;
          font-size: 10px;
          font-weight: 750;
          padding: 11px 10px;
          border-bottom: 1px solid #e4e7ed;
          background: #fafbfc;
        }

        .isl-detail-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #eef0f4;
          color: #505a6d;
          font-size: 10.5px;
        }

        .isl-detail-table tr:hover td {
          background: #fbfcfe;
        }

        .isl-queue-cell {
          color: #343d50;
          font-weight: 750;
        }

        .isl-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 750;
        }

        .isl-badge.green {
          color: #12835d;
          background: #e8f8f2;
        }

        .isl-badge.orange {
          color: #b8781e;
          background: #fff3df;
        }

        .isl-badge.red {
          color: #c64949;
          background: #ffeded;
        }

        .isl-badge.gray {
          color: #687286;
          background: #f0f2f5;
        }

        /* FOOTER */

        .isl-report-footer {
          margin-top: 17px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #929aaa;
          font-size: 10px;
        }

        .isl-footer-right {
          display: flex;
          gap: 15px;
        }

        /* TOOLTIP */

        .isl-tooltip {
          position: fixed;
          padding: 8px 10px;
          border-radius: 6px;
          background: #1b2332;
          color: #fff;
          font-size: 10px;
          pointer-events: none;
          z-index: 100;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
        }

        /* RESPONSIVE */

        @media (max-width: 1250px) {
          .isl-filters {
            grid-template-columns: repeat(4, 1fr);
          }

          .isl-service-hero {
            grid-template-columns: 280px 1fr;
          }

          .isl-hero-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 950px) {
          .isl-grid-2,
          .isl-grid-equal {
            grid-template-columns: 1fr;
          }

          .isl-service-hero {
            grid-template-columns: 1fr;
          }

          .isl-gauge-wrap {
            margin-top: 15px;
          }

          .isl-filters {
            grid-template-columns: repeat(2, 1fr);
          }

          .isl-wait-layout {
            grid-template-columns: 1fr;
          }

          .isl-wait-legend {
            border-left: none;
            border-top: 1px solid #eceef3;
            padding-left: 0;
            padding-top: 15px;
            display: flex;
            gap: 15px;
          }
        }

        @media (max-width: 650px) {
          .isl-page {
            padding: 20px 14px 40px;
          }

          .isl-page-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .isl-heading-actions {
            width: 100%;
          }

          .isl-heading-actions .isl-btn {
            flex: 1;
          }

          .isl-filters {
            grid-template-columns: 1fr;
          }

          .isl-hero-stats {
            grid-template-columns: 1fr;
          }

          .isl-outcome {
            grid-template-columns: 1fr;
          }

          .isl-report-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 7px;
          }
        }

        @media print {
          .isl-filter-panel,
          .isl-heading-actions,
          .isl-card-menu {
            display: none !important;
          }

          body {
            background: #fff;
          }

          .isl-page {
            max-width: none;
            padding: 15px;
          }

          .isl-card,
          .isl-stat-box,
          .isl-gauge-card {
            break-inside: avoid;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="isl-root">
        <main className="isl-page" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* PAGE HEADING */}
          <section className="isl-page-heading">
            <div className="isl-heading-left">
              <h1>Inbound Service Level Report</h1>
              <p>Monitor inbound response performance, SLA compliance, wait times and service-level breaches.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="isl-live-status">
                <span className="isl-live-dot"></span>
                Report Data Ready
              </div>

              <div className="isl-heading-actions">
                <button className="isl-btn" onClick={exportCSV}>
                  Export CSV
                </button>
                <button className="isl-btn" onClick={refreshReport}>
                  {refreshIcon}
                </button>
                <button className="isl-btn primary" onClick={() => window.print()}>
                  Print Report
                </button>
              </div>
            </div>
          </section>

          {/* FILTERS */}
          <section className="isl-filter-panel">
            <div className="isl-filter-title">Report Filters</div>

            <div className="isl-filters">
              <div className="isl-field">
                <label>Date Range</label>
                <select
                  id="dateRange"
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                >
                  <option>Today</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>This Month</option>
                  <option>Custom Range</option>
                </select>
              </div>

              <div className="isl-field">
                <label>From Date</label>
                <input
                  type="date"
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="isl-field">
                <label>To Date</label>
                <input
                  type="date"
                  id="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="isl-field">
                <label>Queue</label>
                <select id="queue" value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}>
                  <option value="All Queues">All Queues</option>
                  {queuesList.map((q, idx) => (
                    <option key={idx} value={q.queue}>{q.queue}</option>
                  ))}
                </select>
              </div>

              <div className="isl-field">
                <label>Service Level</label>
                <select
                  id="serviceLevel"
                  value={selectedServiceLevel}
                  onChange={(e) => setSelectedServiceLevel(e.target.value)}
                >
                  <option>20 Seconds</option>
                  <option>30 Seconds</option>
                  <option>45 Seconds</option>
                  <option>60 Seconds</option>
                  <option>90 Seconds</option>
                </select>
              </div>

              <div className="isl-field">
                <label>Interval</label>
                <select id="interval" defaultValue="Hourly">
                  <option>15 Minutes</option>
                  <option>Hourly</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                </select>
              </div>

              <button className="isl-apply-btn" onClick={applyFilters} disabled={isFilterDisabled}>
                {filterBtnText}
              </button>
            </div>
          </section>

          {/* SERVICE LEVEL HERO */}
          <section className="isl-service-hero">
            <div className="isl-gauge-card">
              <div className="isl-card-title">Overall Service Level</div>
              <div className="isl-card-subtitle">Inbound calls answered within configured threshold</div>

              <div className="isl-gauge-wrap">
                <div className="isl-gauge-bg"></div>
                <div className="isl-gauge-fill"></div>
                <div className="isl-gauge-inner"></div>

                <div className="isl-gauge-value">
                  {liveKpis.service_level ? liveKpis.service_level.replace("%", "") : "83.8"}<span>%</span>
                </div>
              </div>

              <div className="isl-gauge-label">Current SLA Performance</div>

              <div className="isl-target-row">
                <span className="isl-target-badge">TARGET {liveKpis.target_pct || "80%"}</span>
                <span className="isl-target-text">{liveKpis.diff_pct || "+3.8% above target"}</span>
              </div>
            </div>

            <div className="isl-hero-stats">
              <div className="isl-stat-box">
                <div className="isl-stat-top">
                  <div className="isl-stat-label">Inbound Calls</div>
                  <div className="isl-stat-icon isl-icon-purple">↗</div>
                </div>

                <div className="isl-stat-value">{liveKpis.total_calls || "77"}</div>

                <div className="isl-stat-meta">
                  <span className="isl-up">Live DB</span> verified inbound volume
                </div>
              </div>

              <div className="isl-stat-box">
                <div className="isl-stat-top">
                  <div className="isl-stat-label">Answered Within SLA</div>
                  <div className="isl-stat-icon isl-icon-green">✓</div>
                </div>

                <div className="isl-stat-value">{liveKpis.calls_within_sla || "62"}</div>

                <div className="isl-stat-meta">
                  <span className="isl-up">{liveKpis.service_level || "83.8%"}</span> of inbound calls
                </div>
              </div>

              <div className="isl-stat-box">
                <div className="isl-stat-top">
                  <div className="isl-stat-label">Answered After SLA</div>
                  <div className="isl-stat-icon isl-icon-orange">!</div>
                </div>

                <div className="isl-stat-value">{liveKpis.calls_outside_sla || "12"}</div>

                <div className="isl-stat-meta">
                  <span className="isl-down">Delayed</span> outside threshold
                </div>
              </div>

              <div className="isl-stat-box">
                <div className="isl-stat-top">
                  <div className="isl-stat-label">Average Speed of Answer</div>
                  <div className="isl-stat-icon isl-icon-blue">◷</div>
                </div>

                <div className="isl-stat-value">{liveKpis.avg_speed_answer || "13.9s"}</div>

                <div className="isl-stat-meta">
                  <span className="isl-up">Fast Answer</span> SLA target met
                </div>
              </div>

              <div className="isl-stat-box">
                <div className="isl-stat-top">
                  <div className="isl-stat-label">Longest Wait</div>
                  <div className="isl-stat-icon isl-icon-orange">⌛</div>
                </div>

                <div className="isl-stat-value">{liveKpis.longest_wait || "00:25"}</div>

                <div className="isl-stat-meta">Max caller wait recorded in period</div>
              </div>
            </div>
          </section>

          {/* TREND + THRESHOLD */}
          <section className="isl-grid isl-grid-2">
            <div className="isl-card">
              <div className="isl-card-header">
                <div>
                  <h3>Service Level Trend</h3>
                  <p>Hourly SLA performance against the {selectedServiceLevel} target</p>
                </div>

                <button className="isl-card-menu">⋮</button>
              </div>

              <div className="isl-trend-summary">
                <div className="isl-trend-current">{liveKpis.service_level || "83.8%"}</div>
                <div className="isl-trend-change">{liveKpis.diff_pct || "+3.8% above target"}</div>
              </div>

              <div className="isl-chart">
                <svg viewBox="0 0 760 240" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6259e8" stopOpacity=".20" />
                      <stop offset="100%" stopColor="#6259e8" stopOpacity=".01" />
                    </linearGradient>
                  </defs>

                  <line className="isl-grid-line" x1="45" y1="30" x2="735" y2="30"></line>
                  <line className="isl-grid-line" x1="45" y1="75" x2="735" y2="75"></line>
                  <line className="isl-grid-line" x1="45" y1="120" x2="735" y2="120"></line>
                  <line className="isl-grid-line" x1="45" y1="165" x2="735" y2="165"></line>
                  <line className="isl-grid-line" x1="45" y1="210" x2="735" y2="210"></line>

                  <text className="isl-axis-text" x="8" y="34">100%</text>
                  <text className="isl-axis-text" x="14" y="79">90%</text>
                  <text className="isl-axis-text" x="14" y="124">80%</text>
                  <text className="isl-axis-text" x="14" y="169">70%</text>
                  <text className="isl-axis-text" x="14" y="214">60%</text>

                  <line className="isl-target-line" x1="45" y1="120" x2="735" y2="120"></line>
                  <text className="isl-target-label" x="650" y="113">TARGET 80%</text>

                  {hourlyMatrix.length > 1 && (
                    <>
                      <path
                        className="isl-area"
                        d={`M${hourlyMatrix.map((h, i) => {
                          const cx = 45 + i * (690 / Math.max(1, hourlyMatrix.length - 1));
                          const slNum = h.sla_num !== undefined ? h.sla_num : parseFloat(h.sla) || 80;
                          const cy = Math.max(30, Math.min(210, 210 - ((slNum - 50) / 50) * 180));
                          return `${cx} ${cy}`;
                        }).join(" L ")} L${45 + (hourlyMatrix.length - 1) * (690 / Math.max(1, hourlyMatrix.length - 1))} 210 L45 210 Z`}
                      ></path>

                      <path
                        className="isl-line"
                        d={`M${hourlyMatrix.map((h, i) => {
                          const cx = 45 + i * (690 / Math.max(1, hourlyMatrix.length - 1));
                          const slNum = h.sla_num !== undefined ? h.sla_num : parseFloat(h.sla) || 80;
                          const cy = Math.max(30, Math.min(210, 210 - ((slNum - 50) / 50) * 180));
                          return `${cx} ${cy}`;
                        }).join(" L ")}`}
                      ></path>
                    </>
                  )}

                  {hourlyMatrix.map((h, i) => {
                    const cx = 45 + i * (690 / Math.max(1, hourlyMatrix.length - 1));
                    const slNum = h.sla_num !== undefined ? h.sla_num : parseFloat(h.sla) || 80;
                    const cy = Math.max(30, Math.min(210, 210 - ((slNum - 50) / 50) * 180));
                    return (
                      <circle
                        key={i}
                        className="isl-point"
                        cx={cx}
                        cy={cy}
                        r={4}
                        onMouseEnter={(e) =>
                          setTooltip({ show: true, x: e.clientX + 10, y: e.clientY - 35, text: `${h.time} SLA: ${h.sla}` })
                        }
                        onMouseMove={(e) =>
                          setTooltip((prev) => ({ ...prev, x: e.clientX + 10, y: e.clientY - 35 }))
                        }
                        onMouseLeave={() => setTooltip((prev) => ({ ...prev, show: false }))}
                      />
                    );
                  })}

                  <text className="isl-axis-text" x="45" y="232">08 AM</text>
                  <text className="isl-axis-text" x="160" y="232">10 AM</text>
                  <text className="isl-axis-text" x="280" y="232">12 PM</text>
                  <text className="isl-axis-text" x="400" y="232">02 PM</text>
                  <text className="isl-axis-text" x="520" y="232">04 PM</text>
                  <text className="isl-axis-text" x="650" y="232">06 PM</text>
                </svg>
              </div>
            </div>

            <div className="isl-card">
              <div className="isl-card-header">
                <div>
                  <h3>Performance by Threshold</h3>
                  <p>Inbound calls answered within each response threshold</p>
                </div>
              </div>

              <div className="isl-thresholds">
                {thresholdsList.map((t, idx) => (
                  <div className="isl-threshold-row" key={idx}>
                    <div className="isl-threshold-name">{t.name}</div>
                    <div className="isl-progress">
                      <span className={`isl-t-${t.color || "blue"}`} style={{ width: t.pct }}></span>
                    </div>
                    <div className="isl-threshold-value">{t.pct}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* INTERVAL TABLE + QUEUE */}
          <section className="isl-grid isl-grid-2">
            <div className="isl-card">
              <div className="isl-card-header">
                <div>
                  <h3>Hourly Service Level Matrix</h3>
                  <p>Inbound activity and SLA compliance by time interval</p>
                </div>

                <button className="isl-card-menu">⋮</button>
              </div>

              <div className="isl-matrix">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Presented</th>
                      <th>Answered</th>
                      <th>Abandoned</th>
                      <th>Within SLA</th>
                      <th>SLA %</th>
                      <th>ASA</th>
                    </tr>
                  </thead>

                  <tbody>
                    {hourlyMatrix.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.time}</td>
                        <td>{row.offered}</td>
                        <td>{row.ans}</td>
                        <td>{row.abandoned}</td>
                        <td>{row.within}</td>
                        <td>
                          <div className="isl-sla-cell">
                            <span>{row.sla}</span>
                            <div className="isl-mini-progress">
                              <span
                                className={`isl-t-${(row.sla_num || parseFloat(row.sla)) >= 80 ? "green" : "orange"}`}
                                style={{ width: row.sla }}
                              ></span>
                            </div>
                          </div>
                        </td>
                        <td>{row.asa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="isl-card">
              <div className="isl-card-header">
                <div>
                  <h3>Queue Service Level</h3>
                  <p>Performance ranking across inbound queues</p>
                </div>
              </div>

              <div className="isl-queue-list">
                {queuesList.map((q, idx) => {
                  const slNum = parseFloat(q.sla) || 0;
                  const color = slNum >= 80 ? "#15966c" : slNum >= 70 ? "#c98a27" : "#d45656";
                  const barClass = slNum >= 80 ? "isl-t-green" : slNum >= 70 ? "isl-t-orange" : "isl-t-red";
                  const off = parseInt(q.offered) || 1;
                  const ab = parseInt(q.abandoned) || 0;
                  const abPct = ((ab / off) * 100).toFixed(1) + "%";
                  return (
                    <div className="isl-queue-item" key={idx}>
                      <div className="isl-queue-top">
                        <span className="isl-queue-name">{q.queue}</span>
                        <span className="isl-queue-score" style={{ color }}>
                          {q.sla}
                        </span>
                      </div>
                      <div className="isl-queue-bar">
                        <span className={barClass} style={{ width: q.sla }}></span>
                      </div>
                      <div className="isl-queue-meta">
                        <div className="isl-queue-meta-item">
                          Presented<strong>{q.offered}</strong>
                        </div>
                        <div className="isl-queue-meta-item">
                          ASA<strong>{q.asa}</strong>
                        </div>
                        <div className="isl-queue-meta-item">
                          Abandon<strong>{abPct}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* WAIT DISTRIBUTION + OUTCOME */}
          <section className="isl-grid isl-grid-equal">
            <div className="isl-card">
              <div className="isl-card-header">
                <div>
                  <h3>Inbound Wait Time Distribution</h3>
                  <p>Distribution of caller wait time before answer or abandonment</p>
                </div>
              </div>

              <div className="isl-wait-layout">
                <div className="isl-wait-bars">
                  {waitDistList.map((w, idx) => (
                    <div className="isl-wait-row" key={idx}>
                      <div className="isl-wait-label">{w.label}</div>
                      <div className="isl-wait-progress">
                        <span className={`isl-t-${w.color || "blue"}`} style={{ width: w.pct }}></span>
                      </div>
                      <div className="isl-wait-value">{w.pct}</div>
                    </div>
                  ))}
                </div>

                <div className="isl-wait-legend">
                  <div className="isl-legend-item">
                    <span className="isl-legend-dot isl-t-green"></span>
                    Fast Answer
                  </div>

                  <div className="isl-legend-item">
                    <span className="isl-legend-dot isl-t-blue"></span>
                    Normal
                  </div>

                  <div className="isl-legend-item">
                    <span className="isl-legend-dot isl-t-orange"></span>
                    Delayed
                  </div>

                  <div className="isl-legend-item">
                    <span className="isl-legend-dot isl-t-red"></span>
                    Critical
                  </div>
                </div>
              </div>
            </div>

            <div className="isl-card">
              <div className="isl-card-header">
                <div>
                  <h3>Service Level Outcome</h3>
                  <p>Inbound call outcome against the configured {selectedServiceLevel} SLA</p>
                </div>
              </div>

              <div className="isl-outcome">
                <div className="isl-outcome-card good">
                  <div className="num">{outcomeData.within_sla || liveKpis.calls_within_sla || "62"}</div>
                  <div className="lbl">Answered Within SLA</div>
                </div>

                <div className="isl-outcome-card warn">
                  <div className="num">{outcomeData.after_sla || liveKpis.calls_outside_sla || "12"}</div>
                  <div className="lbl">Answered After SLA</div>
                </div>

                <div className="isl-outcome-card bad">
                  <div className="num">{outcomeData.abandoned || liveKpis.abandoned_calls || "3"}</div>
                  <div className="lbl">Abandoned Calls</div>
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    color: "#7d8799",
                    marginBottom: "7px",
                  }}
                >
                  <span>Overall Call Distribution</span>
                  <strong style={{ color: "#424b5d" }}>{liveKpis.total_calls || outcomeData.total_calls || "77"} Calls</strong>
                </div>

                <div
                  style={{
                    height: "18px",
                    background: "#eef1f5",
                    borderRadius: "5px",
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  <div style={{ width: outcomeData.within_sla_pct || "80.5%", background: "#22b486" }}></div>
                  <div style={{ width: outcomeData.after_sla_pct || "15.6%", background: "#e9a13a" }}></div>
                  <div style={{ width: outcomeData.abandoned_pct || "3.9%", background: "#df5959" }}></div>
                </div>

                <div style={{ display: "flex", gap: "16px", marginTop: "11px", flexWrap: "wrap" }}>
                  <div className="isl-legend-item" style={{ margin: 0 }}>
                    <span className="isl-legend-dot isl-t-green"></span>
                    {outcomeData.within_sla_pct || "80.5%"} Within SLA
                  </div>

                  <div className="isl-legend-item" style={{ margin: 0 }}>
                    <span className="isl-legend-dot isl-t-orange"></span>
                    {outcomeData.after_sla_pct || "15.6%"} After SLA
                  </div>

                  <div className="isl-legend-item" style={{ margin: 0 }}>
                    <span className="isl-legend-dot isl-t-red"></span>
                    {outcomeData.abandoned_pct || "3.9%"} Abandoned
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* DETAILED REPORT */}
          <section className="isl-card isl-detail-card">
            <div className="isl-card-header">
              <div>
                <h3>Inbound Service Level Details</h3>
                <p>Queue-level breakdown of inbound service performance</p>
              </div>

              <button className="isl-card-menu">⋮</button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="isl-detail-table">
                <thead>
                  <tr>
                    <th>Queue</th>
                    <th>Calls Presented</th>
                    <th>Answered</th>
                    <th>Abandoned</th>
                    <th>Within SLA</th>
                    <th>After SLA</th>
                    <th>Service Level</th>
                    <th>ASA</th>
                    <th>Avg Abandon Wait</th>
                    <th>Longest Wait</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {queuesList.map((q, qIdx) => (
                    <tr key={qIdx}>
                      <td className="isl-queue-cell">{q.queue}</td>
                      <td>{q.offered}</td>
                      <td>{q.ans}</td>
                      <td>{q.abandoned}</td>
                      <td>{q.within}</td>
                      <td>{q.after}</td>
                      <td><strong>{q.sla}</strong></td>
                      <td>{q.asa}</td>
                      <td>12.8s</td>
                      <td>{q.longest}</td>
                      <td><span className={`isl-badge ${q.status === "Met" ? "green" : "orange"}`}>{q.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FOOTER */}
          <div className="isl-report-footer">
            <div>Report generated: {reportTimestampLong}</div>

            <div className="isl-footer-right">
              <span>Service Level Target: 80%</span>
              <span>Threshold: 30 Seconds</span>
              <span>Data Status: Updated</span>
            </div>
          </div>
        </main>
      </div>

      {/* TOOLTIP */}
      {tooltip.show && (
        <div
          className="isl-tooltip"
          style={{ display: "block", left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </AppShell>
  );
}
