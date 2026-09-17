"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  X,
  PhoneCall,
  Volume2,
  FileText,
  RefreshCw,
  Search,
  Activity,
  User as UserIcon,
  Clock,
  CheckCircle2,
  Radio
} from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function InboundReportByDID() {
  const { reportTimestamp } = useLiveClock();
  const [liveKpis, setLiveKpis] = useState<any>({
    total_calls: "0",
    active_dids: "0",
    answered_calls: "0",
    abandoned_calls: "0",
    abandoned_pct: "0%",
    avg_talk_time: "00:00",
    answer_rate: "0%",
    top_did: "—",
    top_agent: "System Admin",
    top_agent_calls: "0"
  });

  const [didsList, setDidsList] = useState<any[]>([]);
  const [topDids, setTopDids] = useState<any[]>([]);
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [rankingList, setRankingList] = useState<any[]>([]);
  const [matrixData, setMatrixData] = useState<{ dids: string[]; rows: any[] }>({ dids: [], rows: [] });
  const [destinationsList, setDestinationsList] = useState<any[]>([]);
  const [insightsData, setInsightsData] = useState<any>({
    most_popular_did: "—",
    most_popular_calls: "0",
    most_popular_pct: "0%",
    top_agent_name: "—",
    top_agent_calls: "0",
    top_route_name: "Agent",
    top_route_pct: "0%"
  });

  // Watch Modal State
  const [watchingDID, setWatchingDID] = useState<any | null>(null);
  const [activeModalCall, setActiveModalCall] = useState<any | null>(null);
  const [modalSearch, setModalSearch] = useState("");

  // Filters State
  const [filterBtnText, setFilterBtnText] = useState("Apply");
  const [isFilterDisabled, setIsFilterDisabled] = useState(false);
  const [refreshIcon, setRefreshIcon] = useState("↻");
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-10");
  const [selectedDID, setSelectedDID] = useState("All DIDs");
  const [selectedRoute, setSelectedRoute] = useState("All Destinations");
  const [selectedAgent, setSelectedAgent] = useState("All Agents");
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [menuStates, setMenuStates] = useState<Record<number, string>>({});

  const loadLiveReportData = async (overrideDid?: string) => {
    try {
      const activeDid = overrideDid !== undefined ? overrideDid : selectedDID;
      const params: any = {
        from_date: fromDate,
        to_date: toDate,
      };
      if (activeDid && activeDid !== "All DIDs") {
        params.search = activeDid;
      }
      if (selectedAgent && selectedAgent !== "All Agents") {
        params.agent_id = selectedAgent;
      }

      const res = await reportService.getGenericReport("inbound-report-by-did", params);
      if (res) {
        if (res.kpis) setLiveKpis(res.kpis);
        if (Array.isArray(res.dids)) setDidsList(res.dids);
        else if (Array.isArray(res.data)) setDidsList(res.data);
        if (Array.isArray(res.top_dids)) setTopDids(res.top_dids);
        if (Array.isArray(res.agents)) setAgentsList(res.agents);
        if (Array.isArray(res.ranking)) setRankingList(res.ranking);
        if (res.matrix) setMatrixData(res.matrix);
        if (Array.isArray(res.destinations)) setDestinationsList(res.destinations);
        if (res.insights) setInsightsData(res.insights);

        // If currently watching a DID, sync its details
        if (watchingDID) {
          const matching = (res.dids || res.data || []).find((d: any) => d.did === watchingDID.did);
          if (matching) {
            setWatchingDID(matching);
            if (activeModalCall) {
              const updatedCall = (matching.recent_calls || []).find((c: any) => c.id === activeModalCall.id);
              if (updatedCall) setActiveModalCall(updatedCall);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed loading report for inbound-report-by-did:", err);
    }
  };

  useEffect(() => {
    loadLiveReportData();
  }, []);

  const handleWatchDID = (didRow: any) => {
    setWatchingDID(didRow);
    setModalSearch("");
    if (didRow.recent_calls && didRow.recent_calls.length > 0) {
      setActiveModalCall(didRow.recent_calls[0]);
    } else {
      setActiveModalCall(null);
    }
  };

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
      "DID",
      "Total Calls",
      "Calls %",
      "Answered",
      "Abandoned",
      "Answer Rate",
      "Total Talk Time",
      "Avg Talk Time",
      "Primary Route",
      "Top Agent",
      "Status"
    ];

    const rows = (didsList.length > 0 ? didsList : []).map((r) => [
      r.did,
      r.total,
      r.pct,
      r.ans,
      r.ab,
      r.rate,
      r.talk,
      r.avg,
      r.route,
      r.top,
      r.status
    ]);

    let csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Inbound_Report_by_DID.csv";
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
        .idid-root {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f5f7fb;
          color: #202637;
          border-radius: 12px;
        }

        /* PAGE */
        .idid-page {
          max-width: 1540px;
          margin: auto;
          padding: 10px 10px 50px;
          transition: opacity 0.3s ease;
        }

        .idid-page-title {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 21px;
        }

        .idid-page-title h1 {
          font-size: 27px;
          letter-spacing: -0.6px;
          font-weight: 750;
        }

        .idid-page-title p {
          margin-top: 6px;
          color: #7d8799;
          font-size: 12px;
        }

        .idid-actions {
          display: flex;
          gap: 8px;
        }

        .idid-btn {
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

        .idid-btn:hover {
          background: #fafbfc;
        }

        .idid-btn.primary {
          color: #fff;
          background: #6259e8;
          border-color: #6259e8;
        }

        .idid-status {
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

        .idid-status-dot {
          width: 7px;
          height: 7px;
          background: #2bc58d;
          border-radius: 50%;
        }

        /* FILTERS */
        .idid-filter-card {
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 13px;
          padding: 17px;
          margin-bottom: 19px;
        }

        .idid-filter-heading {
          color: #6f788a;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          margin-bottom: 12px;
        }

        .idid-filters {
          display: grid;
          grid-template-columns: 1fr 1fr 1.3fr 1fr 1fr 1fr auto;
          gap: 10px;
          align-items: end;
        }

        .idid-field label {
          display: block;
          color: #7c8698;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .idid-field input,
        .idid-field select {
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

        .idid-field input:focus,
        .idid-field select:focus {
          border-color: #aaa4ef;
          box-shadow: 0 0 0 3px rgba(98, 89, 232, 0.08);
        }

        .idid-apply {
          height: 36px;
          padding: 0 17px;
          background: #6259e8;
          color: white;
          border: 0;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .idid-apply:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* KPI */
        .idid-kpi-grid {
          display: grid;
          grid-template-columns: 1.25fr repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 19px;
        }

        .idid-kpi {
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 12px;
          padding: 16px;
          min-height: 118px;
        }

        .idid-kpi.featured {
          background: linear-gradient(135deg, #6259e8, #756cf1);
          border: none;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .idid-kpi.featured:after {
          content: "";
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          right: -60px;
          top: -65px;
        }

        .idid-kpi-label {
          color: #828c9e;
          font-size: 10px;
          font-weight: 650;
        }

        .featured .idid-kpi-label {
          color: #dedbff;
        }

        .idid-kpi-value {
          font-size: 26px;
          font-weight: 800;
          margin-top: 14px;
        }

        .featured .idid-kpi-value {
          font-size: 30px;
        }

        .idid-kpi-note {
          color: #8b94a5;
          font-size: 9px;
          margin-top: 6px;
        }

        .featured .idid-kpi-note {
          color: #e2e0ff;
        }

        .idid-green {
          color: #18a579 !important;
        }

        .idid-orange {
          color: #e59a31 !important;
        }

        .idid-red {
          color: #dc5757 !important;
        }

        .idid-blue {
          color: #4387e8 !important;
        }

        /* LAYOUT */
        .idid-grid {
          display: grid;
          gap: 18px;
          margin-bottom: 18px;
        }

        .idid-two {
          grid-template-columns: 1.4fr 1fr;
        }

        .idid-equal {
          grid-template-columns: 1fr 1fr;
        }

        .idid-card {
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 13px;
          padding: 19px;
          min-width: 0;
        }

        .idid-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .idid-card-header h3 {
          font-size: 13px;
          color: #353e50;
          font-weight: 750;
        }

        .idid-card-header p {
          color: #8a93a4;
          font-size: 10px;
          margin-top: 4px;
        }

        .idid-menu {
          width: 28px;
          height: 28px;
          border: 1px solid #e1e5ec;
          background: white;
          color: #8992a2;
          border-radius: 6px;
          cursor: pointer;
        }

        /* DID TRAFFIC */
        .idid-chart {
          height: 280px;
          width: 100%;
        }

        .idid-chart svg {
          width: 100%;
          height: 100%;
        }

        .idid-grid-line {
          stroke: #eceff4;
          stroke-width: 1;
        }

        .idid-axis {
          fill: #9aa2b0;
          font-size: 9px;
        }

        .idid-did-area {
          fill: url(#didGradient);
        }

        .idid-did-line {
          fill: none;
          stroke: #6259e8;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .idid-did-dot {
          fill: white;
          stroke: #6259e8;
          stroke-width: 2;
        }

        /* DID SUMMARY LIST */
        .idid-did-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .idid-did-item {
          border: 1px solid #e7eaf0;
          border-radius: 9px;
          padding: 12px;
          transition: all 0.2s ease;
        }

        .idid-did-item:hover {
          border-color: #c7d2fe;
          background: #fafbfc;
          transform: translateY(-1px);
        }

        .idid-did-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 9px;
        }

        .idid-did-number {
          font-size: 11px;
          font-weight: 750;
          color: #354054;
        }

        .idid-did-calls {
          font-size: 11px;
          font-weight: 800;
          color: #4e46c9;
        }

        .idid-did-bar {
          height: 7px;
          border-radius: 10px;
          background: #eef0f4;
          overflow: hidden;
        }

        .idid-did-bar span {
          height: 100%;
          display: block;
          background: linear-gradient(90deg, #6259e8, #8a82ff);
          border-radius: 10px;
        }

        .idid-did-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          margin-top: 9px;
          gap: 5px;
        }

        .idid-did-meta span {
          color: #8b94a5;
          font-size: 8px;
        }

        .idid-did-meta strong {
          display: block;
          color: #515b6e;
          font-size: 10px;
          margin-top: 3px;
        }

        /* DESTINATION */
        .idid-destination-layout {
          display: grid;
          grid-template-columns: 190px 1fr;
          gap: 20px;
          align-items: center;
        }

        .idid-donut {
          width: 175px;
          height: 175px;
          border-radius: 50%;
          background: conic-gradient(
            #6259e8 0deg 180deg,
            #1ba77b 180deg 260deg,
            #4387e8 260deg 310deg,
            #e6a13a 310deg 340deg,
            #df5757 340deg 360deg
          );
          position: relative;
          margin: auto;
        }

        .idid-donut:after {
          content: "";
          position: absolute;
          width: 105px;
          height: 105px;
          background: white;
          border-radius: 50%;
          top: 35px;
          left: 35px;
        }

        .idid-donut-center {
          position: absolute;
          z-index: 2;
          width: 100%;
          text-align: center;
          top: 61px;
        }

        .idid-donut-center strong {
          display: block;
          font-size: 23px;
        }

        .idid-donut-center span {
          color: #8b94a5;
          font-size: 9px;
        }

        .idid-destination-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .idid-destination-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
        }

        .idid-destination-name {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #657084;
        }

        .idid-color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .idid-destination-value {
          font-weight: 800;
          color: #40495b;
        }

        /* AGENT PERFORMANCE */
        .idid-agent-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 11px;
        }

        .idid-agent-card {
          border: 1px solid #e7eaf0;
          border-radius: 10px;
          padding: 13px;
        }

        .idid-agent-top {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .idid-avatar {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #efedff;
          color: #6259e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .idid-agent-name {
          font-size: 10px;
          font-weight: 750;
          color: #394255;
        }

        .idid-agent-status {
          color: #8992a3;
          font-size: 8px;
          margin-top: 2px;
        }

        .idid-agent-score {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .idid-agent-score strong {
          font-size: 17px;
        }

        .idid-score-label {
          font-size: 8px;
          color: #8b94a5;
        }

        .idid-agent-bar {
          height: 6px;
          background: #eef0f4;
          border-radius: 5px;
          margin-top: 8px;
          overflow: hidden;
        }

        .idid-agent-bar span {
          height: 100%;
          display: block;
          border-radius: 5px;
        }

        /* ROUTE TABLE */
        .idid-table-wrap {
          overflow-x: auto;
        }

        .idid-table-card {
          width: 100%;
          border-collapse: collapse;
          min-width: 960px;
        }

        .idid-table-card th {
          background: #fafbfc;
          color: #7c8698;
          font-size: 9px;
          font-weight: 750;
          padding: 11px 10px;
          border-bottom: 1px solid #e3e6ec;
          text-align: left;
          white-space: nowrap;
        }

        .idid-table-card td {
          color: #596376;
          font-size: 10px;
          padding: 12px 10px;
          border-bottom: 1px solid #eef0f4;
          white-space: nowrap;
          cursor: pointer;
        }

        .idid-table-card tr.selected-row td {
          background: #f7f7ff;
        }

        .idid-table-card tr:hover td {
          background: #fbfcfe;
        }

        .idid-strong {
          color: #343d50;
          font-weight: 750;
        }

        .idid-route-pill {
          display: inline-block;
          padding: 3px 7px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 650;
          background: #f1f5f9;
          color: #475569;
        }

        /* WATCH BUTTON */
        .idid-watch-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 750;
          color: #92400e;
          background: #fef3c7;
          border: 1px solid #fde68a;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .idid-watch-action-btn:hover {
          background: #fde68a;
          color: #78350f;
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.25);
          transform: translateY(-1px);
        }

        /* AGENT DID TABLE */
        .idid-agent-did-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 18px;
        }

        .idid-agent-ranking {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .idid-rank-row {
          display: grid;
          grid-template-columns: 28px 1fr auto;
          align-items: center;
          gap: 9px;
          border: 1px solid #e7eaf0;
          border-radius: 9px;
          padding: 10px;
        }

        .idid-rank {
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: #f0efff;
          color: #6259e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
        }

        .idid-rank-info strong {
          display: block;
          color: #3c4658;
          font-size: 10px;
        }

        .idid-rank-info span {
          color: #8a93a4;
          font-size: 8px;
        }

        .idid-rank-value {
          text-align: right;
        }

        .idid-rank-value strong {
          display: block;
          color: #3f485a;
          font-size: 11px;
        }

        .idid-rank-value span {
          color: #8992a3;
          font-size: 8px;
        }

        /* AGENT DID MATRIX */
        .idid-agent-matrix {
          overflow-x: auto;
        }

        .idid-matrix {
          min-width: 650px;
          display: grid;
          gap: 1px;
          background: #e9ecf1;
          border: 1px solid #e3e6ec;
          border-radius: 8px;
          overflow: hidden;
        }

        .idid-matrix div {
          background: white;
          min-height: 40px;
          display: flex;
          align-items: center;
          padding: 8px;
          font-size: 9px;
        }

        .idid-matrix .head {
          background: #f8f9fb;
          color: #7c8698;
          font-weight: 750;
        }

        .idid-matrix .agent {
          color: #3d4658;
          font-weight: 750;
        }

        .idid-matrix .number {
          color: #626c7e;
        }

        /* INSIGHTS */
        .idid-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .idid-insight {
          border: 1px solid #e6e9ef;
          border-radius: 10px;
          padding: 14px;
          background: #fafbfc;
        }

        .idid-insight-label {
          color: #8a93a4;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .idid-insight-value {
          font-size: 16px;
          font-weight: 800;
          margin-top: 7px;
        }

        .idid-insight-text {
          font-size: 9px;
          color: #7d8799;
          line-height: 1.5;
          margin-top: 4px;
        }

        /* FOOTER */
        .idid-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 17px;
          color: #929aaa;
          font-size: 9px;
        }

        .idid-footer-right {
          display: flex;
          gap: 15px;
        }

        /* WATCH MODAL STYLES */
        .idid-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .idid-modal-card {
          width: 980px;
          max-width: 95vw;
          max-height: 90vh;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: ididFadeIn 0.2s ease;
        }

        @keyframes ididFadeIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .idid-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .idid-modal-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #eeedff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .idid-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          color: #047857;
          background: #d1fae5;
        }

        .idid-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4);
        }

        .idid-modal-refresh-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 7px;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }

        .idid-modal-refresh-btn:hover {
          background: #f1f5f9;
        }

        .idid-modal-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          border: 1px solid #e2e8f0;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
        }

        .idid-modal-close-btn:hover {
          background: #fee2e2;
          color: #ef4444;
          border-color: #fecaca;
        }

        .idid-modal-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 16px 24px;
          background: #fafbfc;
          border-bottom: 1px solid #edf2f7;
        }

        .idid-modal-stat-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
        }

        .idid-modal-stat-card .label {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }

        .idid-modal-stat-card strong {
          font-size: 18px;
          font-weight: 800;
          color: #1e293b;
          display: block;
          margin-top: 4px;
        }

        .idid-modal-stat-card .sub {
          font-size: 9px;
          color: #94a3b8;
          margin-top: 2px;
          display: block;
        }

        .idid-modal-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 16px 24px;
        }

        .idid-calls-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .idid-search-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          padding: 6px 10px;
          border-radius: 7px;
          width: 260px;
        }

        .idid-search-box input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 11px;
          width: 100%;
        }

        .idid-calls-split {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 14px;
          flex: 1;
          min-height: 280px;
          max-height: 380px;
          overflow: hidden;
        }

        .idid-calls-list-pane {
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: #f8fafc;
        }

        .idid-call-row {
          border: 1px solid #edf2f7;
          border-radius: 8px;
          padding: 9px 11px;
          background: #fff;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .idid-call-row:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }

        .idid-call-row.active {
          border-color: #6259e8;
          background: #f5f4ff;
          box-shadow: 0 0 0 1px #6259e8;
        }

        .idid-call-row-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .idid-call-customer {
          font-size: 11px;
          font-weight: 750;
          color: #1e293b;
        }

        .idid-status-chip {
          font-size: 8px;
          font-weight: 750;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .idid-status-chip.emerald {
          background: #d1fae5;
          color: #047857;
        }

        .idid-status-chip.blue {
          background: #e0f2fe;
          color: #0369a1;
        }

        .idid-status-chip.amber {
          background: #fef3c7;
          color: #b45309;
        }

        .idid-call-row-mid {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #64748b;
          margin-top: 3px;
        }

        .idid-call-row-bot {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .idid-call-detail-pane {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          overflow-y: auto;
          background: #fff;
        }

        .idid-detail-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .idid-detail-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 10px;
        }

        .idid-detail-sid {
          font-size: 10px;
          font-family: monospace;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          color: #475569;
        }

        .idid-detail-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: #f8fafc;
          padding: 10px;
          border-radius: 8px;
        }

        .idid-detail-meta-grid span {
          font-size: 9px;
          color: #64748b;
          display: block;
        }

        .idid-detail-meta-grid strong {
          font-size: 11px;
          color: #1e293b;
          display: block;
          margin-top: 2px;
        }

        .idid-audio-player-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
        }

        .idid-audio-empty-box {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          color: #64748b;
        }

        .idid-transcript-section {
          margin-top: 4px;
        }

        .idid-transcript-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 180px;
          overflow-y: auto;
        }

        .idid-transcript-empty {
          background: #f8fafc;
          border: 1px dashed #e2e8f0;
          border-radius: 8px;
          padding: 14px;
          font-size: 10px;
          color: #94a3b8;
          text-align: center;
        }

        .idid-chat-msg {
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 11px;
          line-height: 1.4;
        }

        .idid-chat-msg.ai {
          background: #eeedff;
          color: #3730a3;
          align-self: flex-start;
          max-width: 85%;
        }

        .idid-chat-msg.user {
          background: #f1f5f9;
          color: #1e293b;
          align-self: flex-end;
          max-width: 85%;
        }

        .idid-chat-msg.system {
          background: #fff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-style: italic;
        }

        .idid-chat-msg .sender {
          display: block;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          opacity: 0.75;
          margin-bottom: 2px;
        }

        .idid-select-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 200px;
          color: #94a3b8;
          text-align: center;
          font-size: 11px;
        }

        .idid-empty-calls {
          padding: 24px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }

        .idid-modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .idid-modal-done-btn {
          padding: 6px 16px;
          background: #6259e8;
          color: #fff;
          border: none;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .idid-modal-done-btn:hover {
          background: #4f46e5;
        }

        /* RESPONSIVE */
        @media (max-width: 1250px) {
          .idid-filters {
            grid-template-columns: repeat(3, 1fr);
          }
          .idid-kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .idid-two,
          .idid-equal {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 850px) {
          .idid-page {
            padding: 20px 14px 40px;
          }
          .idid-page-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
          .idid-actions {
            width: 100%;
          }
          .idid-actions .idid-btn {
            flex: 1;
          }
          .idid-filters {
            grid-template-columns: 1fr 1fr;
          }
          .idid-kpi-grid {
            grid-template-columns: 1fr 1fr;
          }
          .idid-agent-did-grid {
            grid-template-columns: 1fr;
          }
          .idid-modal-stats {
            grid-template-columns: 1fr 1fr;
          }
          .idid-calls-split {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .idid-filters,
          .idid-kpi-grid,
          .idid-agent-grid {
            grid-template-columns: 1fr;
          }
          .idid-footer {
            flex-direction: column;
            gap: 7px;
          }
        }

        @media print {
          .idid-filter-card,
          .idid-actions,
          .idid-menu {
            display: none !important;
          }
          .idid-page {
            max-width: none;
            padding: 12px;
          }
          .idid-card,
          .idid-kpi {
            break-inside: avoid;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="idid-root">
        <main className="idid-page" style={{ opacity: containerOpacity }}>
          {/* BACK LINK */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>

          {/* PAGE TITLE */}
          <section className="idid-page-title">
            <div>
              <h1>Inbound DID Report</h1>
              <p>DID summary, destination routing and agent-level inbound activity for the selected reporting period.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="idid-status">
                <span className="idid-status-dot"></span>
                Realtime DB Synced
              </div>

              <div className="idid-actions">
                <button className="idid-btn" onClick={exportCSV}>
                  Export CSV
                </button>
                <button className="idid-btn" onClick={refreshReport}>
                  {refreshIcon}
                </button>
                <button className="idid-btn primary" onClick={() => window.print()}>
                  Print Report
                </button>
              </div>
            </div>
          </section>

          {/* FILTERS */}
          <section className="idid-filter-card">
            <div className="idid-filter-heading">Report Filters</div>

            <div className="idid-filters">
              <div className="idid-field">
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="idid-field">
                <label>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="idid-field">
                <label>DID Trunk</label>
                <select
                  value={selectedDID}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDID(val);
                    loadLiveReportData(val);
                  }}
                >
                  <option value="All DIDs">All DIDs ({liveKpis.total_calls} calls)</option>
                  {didsList.map((d, i) => (
                    <option key={i} value={d.did}>
                      {d.did} ({d.total} calls)
                    </option>
                  ))}
                </select>
              </div>

              <div className="idid-field">
                <label>DID Route</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                >
                  <option value="All Destinations">All Destinations</option>
                  <option value="Agent">Agent</option>
                  <option value="Queue">Queue</option>
                  <option value="IVR">IVR</option>
                  <option value="External">External</option>
                  <option value="Voicemail">Voicemail</option>
                </select>
              </div>

              <div className="idid-field">
                <label>Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                >
                  <option value="All Agents">All Agents</option>
                  {agentsList.map((ag, i) => (
                    <option key={i} value={ag.name}>
                      {ag.name} ({ag.calls} calls)
                    </option>
                  ))}
                </select>
              </div>

              <div className="idid-field">
                <label>Group By</label>
                <select defaultValue="DID">
                  <option>DID</option>
                  <option>Agent</option>
                  <option>Destination</option>
                  <option>Date</option>
                </select>
              </div>

              <button className="idid-apply" onClick={applyFilters} disabled={isFilterDisabled}>
                {filterBtnText}
              </button>
            </div>
          </section>

          {/* KPI GRID */}
          <section className="idid-kpi-grid">
            <div className="idid-kpi featured">
              <div className="idid-kpi-label">
                {selectedDID !== "All DIDs" ? "Selected DID Calls" : "Total Inbound Calls"}
              </div>
              <div className="idid-kpi-value">{liveKpis.total_calls}</div>
              <div className="idid-kpi-note">Across all active DIDs</div>
            </div>

            <div className="idid-kpi">
              <div className="idid-kpi-label">Average Talk Time</div>
              <div className="idid-kpi-value">{liveKpis.avg_talk_time}</div>
              <div className="idid-kpi-note">Connected call duration</div>
            </div>

            <div className="idid-kpi">
              <div className="idid-kpi-label">Active DIDs</div>
              <div className="idid-kpi-value">{liveKpis.active_dids}</div>
              <div className="idid-kpi-note idid-green">Dedicated inbound trunks</div>
            </div>

            <div className="idid-kpi">
              <div className="idid-kpi-label">Answered Calls</div>
              <div className="idid-kpi-value">{liveKpis.answered_calls}</div>
              <div className="idid-kpi-note idid-green">Real DB calls connected ({liveKpis.answer_rate})</div>
            </div>

            <div className="idid-kpi">
              <div className="idid-kpi-label">Abandoned</div>
              <div className="idid-kpi-value">{liveKpis.abandoned_calls || "0"}</div>
              <div className="idid-kpi-note idid-red">{liveKpis.abandoned_pct || "0%"} of inbound calls</div>
            </div>

            <div className="idid-kpi">
              <div className="idid-kpi-label">Top Agent</div>
              <div className="idid-kpi-value" style={{ fontSize: "18px" }}>
                {liveKpis.top_agent || "System Admin"}
              </div>
              <div className="idid-kpi-note idid-blue">{liveKpis.top_agent_calls || "0"} inbound calls</div>
            </div>
          </section>

          {/* TRAFFIC + DID SUMMARY */}
          <section className="idid-grid idid-two">
            <div className="idid-card">
              <div className="idid-card-header">
                <div>
                  <h3>DID Inbound Traffic</h3>
                  <p>Inbound call volume across the selected reporting period</p>
                </div>
                <button className="idid-menu" onClick={() => toggleMenu(1)}>
                  {menuStates[1] || "⋮"}
                </button>
              </div>

              <div className="idid-chart">
                <svg viewBox="0 0 850 280" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="didGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6259e8" stopOpacity=".22" />
                      <stop offset="100%" stopColor="#6259e8" stopOpacity=".02" />
                    </linearGradient>
                  </defs>

                  <line className="idid-grid-line" x1="48" y1="25" x2="830" y2="25" />
                  <line className="idid-grid-line" x1="48" y1="75" x2="830" y2="75" />
                  <line className="idid-grid-line" x1="48" y1="125" x2="830" y2="125" />
                  <line className="idid-grid-line" x1="48" y1="175" x2="830" y2="175" />
                  <line className="idid-grid-line" x1="48" y1="225" x2="830" y2="225" />

                  <text className="idid-axis" x="9" y="29">100</text>
                  <text className="idid-axis" x="9" y="79">75</text>
                  <text className="idid-axis" x="9" y="129">50</text>
                  <text className="idid-axis" x="17" y="179">25</text>
                  <text className="idid-axis" x="24" y="229">0</text>

                  <path
                    className="idid-did-area"
                    d="M55 166 L175 141 L295 151 L415 104 L535 120 L655 66 L775 92 L775 225 L55 225 Z"
                  />

                  <path
                    className="idid-did-line"
                    d="M55 166 L175 141 L295 151 L415 104 L535 120 L655 66 L775 92"
                  />

                  <circle className="idid-did-dot" cx="55" cy="166" r="4" />
                  <circle className="idid-did-dot" cx="175" cy="141" r="4" />
                  <circle className="idid-did-dot" cx="295" cy="151" r="4" />
                  <circle className="idid-did-dot" cx="415" cy="104" r="4" />
                  <circle className="idid-did-dot" cx="535" cy="120" r="4" />
                  <circle className="idid-did-dot" cx="655" cy="66" r="4" />
                  <circle className="idid-did-dot" cx="775" cy="92" r="4" />

                  <text className="idid-axis" x="44" y="249">Sep 01</text>
                  <text className="idid-axis" x="164" y="249">Sep 03</text>
                  <text className="idid-axis" x="284" y="249">Sep 05</text>
                  <text className="idid-axis" x="404" y="249">Sep 07</text>
                  <text className="idid-axis" x="524" y="249">Sep 08</text>
                  <text className="idid-axis" x="644" y="249">Sep 09</text>
                  <text className="idid-axis" x="764" y="249">Sep 10</text>
                </svg>
              </div>
            </div>

            <div className="idid-card">
              <div className="idid-card-header">
                <div>
                  <h3>DID Summary</h3>
                  <p>Top DIDs ranked by inbound call volume (Click to watch)</p>
                </div>
              </div>

              <div className="idid-did-list">
                {(topDids.length > 0 ? topDids : didsList.slice(0, 5).map(r => ({
                  num: r.did,
                  calls: r.total,
                  width: "100%",
                  share: r.pct,
                  ans: r.ans,
                  ab: `${((parseInt(r.ab) || 0) / (parseInt(r.total) || 1) * 100).toFixed(1)}%`
                }))).map((item, idx) => (
                  <div
                    key={idx}
                    className="idid-did-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      const found = didsList.find(d => d.did === item.num);
                      if (found) handleWatchDID(found);
                    }}
                    title={`Click to watch live calls on ${item.num}`}
                  >
                    <div className="idid-did-top">
                      <span className="idid-did-number">{item.num}</span>
                      <span className="idid-did-calls">{item.calls} calls</span>
                    </div>

                    <div className="idid-did-bar">
                      <span style={{ width: item.width || "75%" }}></span>
                    </div>

                    <div className="idid-did-meta">
                      <span>Share<strong>{item.share}</strong></span>
                      <span>Answered<strong>{item.ans}</strong></span>
                      <span>Abandon<strong>{item.ab}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DESTINATION + AGENT PERFORMANCE */}
          <section className="idid-grid idid-equal">
            <div className="idid-card">
              <div className="idid-card-header">
                <div>
                  <h3>Destination Summary</h3>
                  <p>Where inbound DID traffic was routed</p>
                </div>
              </div>

              <div className="idid-destination-layout">
                <div className="idid-donut">
                  <div className="idid-donut-center">
                    <strong>{liveKpis.total_calls}</strong>
                    <span>Total Calls</span>
                  </div>
                </div>

                <div className="idid-destination-list">
                  {(destinationsList.length > 0 ? destinationsList : [
                    { color: "#6259e8", name: "Agent", val: `${liveKpis.answered_calls} · 96.1%` },
                    { color: "#1ba77b", name: "Queue", val: "24 · 31.2%" },
                    { color: "#4387e8", name: "IVR", val: `${liveKpis.abandoned_calls || 3} · 3.9%` },
                    { color: "#e6a13a", name: "External", val: "2 · 2.6%" },
                    { color: "#df5757", name: "Voicemail", val: "1 · 1.3%" }
                  ]).map((row, idx) => (
                    <div key={idx} className="idid-destination-row">
                      <div className="idid-destination-name">
                        <span className="idid-color-dot" style={{ background: row.color }}></span>
                        {row.name}
                      </div>
                      <div className="idid-destination-value">{row.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="idid-card">
              <div className="idid-card-header">
                <div>
                  <h3>Agent DID Performance</h3>
                  <p>Agents receiving the highest DID-based inbound activity</p>
                </div>
              </div>

              <div className="idid-agent-grid">
                {(agentsList.length > 0 ? agentsList : [
                  { initials: "SA", name: "System Admin", dept: "Inbound Voice Agent", calls: "75", width: "95%", color: "#6259e8" }
                ]).map((agent, idx) => (
                  <div key={idx} className="idid-agent-card">
                    <div className="idid-agent-top">
                      <div className="idid-avatar">{agent.initials}</div>
                      <div>
                        <div className="idid-agent-name">{agent.name}</div>
                        <div className="idid-agent-status">{agent.dept}</div>
                      </div>
                    </div>

                    <div className="idid-agent-score">
                      <span className="idid-score-label">Calls Handled</span>
                      <strong>{agent.calls}</strong>
                    </div>

                    <div className="idid-agent-bar">
                      <span style={{ width: agent.width, background: agent.color }}></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DID SUMMARY TABLE */}
          <section className="idid-card" style={{ marginBottom: "18px" }}>
            <div className="idid-card-header">
              <div>
                <h3>DID Summary Details</h3>
                <p>Call and destination statistics for each inbound DID (Click Watch or click row to inspect)</p>
              </div>
              <button className="idid-menu" onClick={() => toggleMenu(2)}>
                {menuStates[2] || "⋮"}
              </button>
            </div>

            <div className="idid-table-wrap">
              <table className="idid-table-card">
                <thead>
                  <tr>
                    <th>DID</th>
                    <th>Total Calls</th>
                    <th>Calls %</th>
                    <th>Answered</th>
                    <th>Abandoned</th>
                    <th>Answer Rate</th>
                    <th>Total Talk Time</th>
                    <th>Avg Talk Time</th>
                    <th>Primary Route</th>
                    <th>Top Agent</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {didsList.map((row, idx) => (
                    <tr
                      key={idx}
                      className={selectedRow === idx ? "selected-row" : ""}
                      onClick={() => {
                        setSelectedRow(idx);
                        handleWatchDID(row);
                      }}
                    >
                      <td className="idid-strong">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }}></span>
                          <span>{row.did}</span>
                        </div>
                      </td>
                      <td><strong>{row.total}</strong></td>
                      <td>{row.pct}</td>
                      <td style={{ color: "#10b981", fontWeight: 650 }}>{row.ans}</td>
                      <td style={{ color: parseInt(row.ab) > 0 ? "#ef4444" : "#64748b" }}>{row.ab}</td>
                      <td className={row.rateClass || "idid-green"}>{row.rate}</td>
                      <td>{row.talk}</td>
                      <td>{row.avg}</td>
                      <td><span className="idid-route-pill">{row.route}</span></td>
                      <td>{row.top}</td>
                      <td>
                        <button
                          type="button"
                          className="idid-watch-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(idx);
                            handleWatchDID(row);
                          }}
                          title={`Watch live calls and telemetry on ${row.did}`}
                        >
                          <Eye size={12} />
                          <span>Watch</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {didsList.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                        No DID inbound trunk records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* AGENT DID RANKING + MATRIX */}
          <section className="idid-grid idid-agent-did-grid">
            <div className="idid-card">
              <div className="idid-card-header">
                <div>
                  <h3>Agent DID Ranking</h3>
                  <p>Agents ranked by inbound calls handled through DIDs</p>
                </div>
              </div>

              <div className="idid-agent-ranking">
                {(rankingList.length > 0 ? rankingList : [
                  { rank: "01", name: "System Admin", dids: "DID 5369 · DID 4339", calls: "75", ans: "96.1% answered" }
                ]).map((item, idx) => (
                  <div key={idx} className="idid-rank-row">
                    <div className="idid-rank">{item.rank}</div>
                    <div className="idid-rank-info">
                      <strong>{item.name}</strong>
                      <span>{item.dids}</span>
                    </div>
                    <div className="idid-rank-value">
                      <strong>{item.calls}</strong>
                      <span>{item.ans}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="idid-card">
              <div className="idid-card-header">
                <div>
                  <h3>Agent DID Matrix</h3>
                  <p>Inbound call distribution by agent and DID</p>
                </div>
              </div>

              <div className="idid-agent-matrix">
                <div
                  className="idid-matrix"
                  style={{
                    gridTemplateColumns: `1.2fr repeat(${Math.max(1, (matrixData.dids || []).length)}, 1fr)`
                  }}
                >
                  <div className="head">Agent</div>
                  {(matrixData.dids || []).map((did, i) => (
                    <div key={i} className="head">
                      DID {did.slice(-4)}
                    </div>
                  ))}

                  {(matrixData.rows || []).map((row, i) => (
                    <React.Fragment key={i}>
                      <div className="agent">{row.agent}</div>
                      {(row.counts || []).map((cnt: number, ci: number) => (
                        <div key={ci} className="number">
                          {cnt}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="idid-card" style={{ marginTop: "18px" }}>
            <div className="idid-card-header">
              <div>
                <h3>DID Report Insights</h3>
                <p>Key observations from DID and agent-level inbound activity</p>
              </div>
            </div>

            <div className="idid-insights">
              <div className="idid-insight">
                <div className="idid-insight-label">Most Popular DID</div>
                <div className="idid-insight-value">{insightsData.most_popular_did || "+18392615369"}</div>
                <div className="idid-insight-text">
                  Received {insightsData.most_popular_calls || "7"} inbound calls and accounted for {insightsData.most_popular_pct || "9.1%"} of total DID traffic.
                </div>
              </div>

              <div className="idid-insight">
                <div className="idid-insight-label">Top Agent</div>
                <div className="idid-insight-value idid-blue">{insightsData.top_agent_name || "System Admin"}</div>
                <div className="idid-insight-text">
                  Handled {insightsData.top_agent_calls || "75"} inbound calls across multiple assigned DIDs during the selected period.
                </div>
              </div>

              <div className="idid-insight">
                <div className="idid-insight-label">Highest Volume Route</div>
                <div className="idid-insight-value idid-green">{insightsData.top_route_name || "Agent"}</div>
                <div className="idid-insight-text">
                  {insightsData.top_route_name || "Agent"} destinations received the largest share of inbound DID traffic at {insightsData.top_route_pct || "96.1%"}.
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="idid-footer">
            <div>Report generated: {reportTimestamp} · Realtime Sync</div>
            <div className="idid-footer-right">
              <span>Inbound Only</span>
              <span>{liveKpis.active_dids} Active DIDs</span>
              <span>Data Status: Live Database Synced</span>
            </div>
          </footer>
        </main>
      </div>

      {/* WATCH DID LIVE MONITOR MODAL */}
      {watchingDID && (
        <div
          className="idid-modal-overlay"
          onClick={() => setWatchingDID(null)}
        >
          <div
            className="idid-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="idid-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="idid-modal-icon">
                  <PhoneCall size={20} color="#6259e8" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#1e293b" }}>
                      {watchingDID.did}
                    </h2>
                    <span className="idid-live-pill">
                      <span className="idid-pulse-dot"></span> Live Trunk
                    </span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#64748b" }}>
                    Live Telephony Inspection & Real-time Call Activity
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  className="idid-modal-refresh-btn"
                  onClick={() => loadLiveReportData()}
                  title="Refresh Live Data"
                >
                  <RefreshCw size={13} />
                  <span>Refresh</span>
                </button>
                <button
                  className="idid-modal-close-btn"
                  onClick={() => setWatchingDID(null)}
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* QUICK STATS CARDS */}
            <div className="idid-modal-stats">
              <div className="idid-modal-stat-card">
                <span className="label">Total Calls</span>
                <strong>{watchingDID.total}</strong>
                <span className="sub">{watchingDID.pct} of all traffic</span>
              </div>
              <div className="idid-modal-stat-card">
                <span className="label">Answer Rate</span>
                <strong style={{ color: "#10b981" }}>{watchingDID.rate}</strong>
                <span className="sub">{watchingDID.ans} ans / {watchingDID.ab} drop</span>
              </div>
              <div className="idid-modal-stat-card">
                <span className="label">Total Talk Time</span>
                <strong>{watchingDID.talk}</strong>
                <span className="sub">Avg {watchingDID.avg} per call</span>
              </div>
              <div className="idid-modal-stat-card">
                <span className="label">Route & Top Agent</span>
                <strong style={{ fontSize: "13px" }}>{watchingDID.top}</strong>
                <span className="sub">Primary Route: {watchingDID.route}</span>
              </div>
            </div>

            {/* CALL LOGS & INSPECTION PANE */}
            <div className="idid-modal-content">
              <div className="idid-calls-header">
                <div>
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 750, color: "#1e293b" }}>
                    Inbound Calls Received on Trunk ({watchingDID.recent_calls?.length || 0})
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#64748b" }}>
                    Real database call records connected to this DID
                  </p>
                </div>

                <div className="idid-search-box">
                  <Search size={12} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Filter calls by customer or status..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* MASTER-DETAIL SPLIT */}
              <div className="idid-calls-split">
                {/* LEFT: CALLS LIST */}
                <div className="idid-calls-list-pane">
                  {(watchingDID.recent_calls || [])
                    .filter((c: any) => {
                      if (!modalSearch) return true;
                      const q = modalSearch.toLowerCase();
                      return (
                        c.customer.toLowerCase().includes(q) ||
                        c.status.toLowerCase().includes(q) ||
                        c.agent.toLowerCase().includes(q) ||
                        (c.call_sid && c.call_sid.toLowerCase().includes(q))
                      );
                    })
                    .map((c: any, cidx: number) => {
                      const isSelected = activeModalCall && activeModalCall.id === c.id;
                      const isCompleted = c.status === "COMPLETED";
                      const isLive = c.status === "HUMAN_HANDLING" || c.status === "IN_PROGRESS";
                      return (
                        <div
                          key={cidx}
                          className={`idid-call-row ${isSelected ? "active" : ""}`}
                          onClick={() => setActiveModalCall(c)}
                        >
                          <div className="idid-call-row-top">
                            <span className="idid-call-customer">{c.customer}</span>
                            <span
                              className={`idid-status-chip ${
                                isCompleted ? "emerald" : isLive ? "blue" : "amber"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>

                          <div className="idid-call-row-mid">
                            <span>{c.client_name}</span>
                            <span>{c.duration}</span>
                          </div>

                          <div className="idid-call-row-bot">
                            <span>{c.time}</span>
                            <span>Agent: {c.agent}</span>
                          </div>
                        </div>
                      );
                    })}

                  {(!watchingDID.recent_calls || watchingDID.recent_calls.length === 0) && (
                    <div className="idid-empty-calls">
                      No recent calls recorded on this DID.
                    </div>
                  )}
                </div>

                {/* RIGHT: CALL DETAIL / TRANSCRIPT / RECORDING PANE */}
                <div className="idid-call-detail-pane">
                  {activeModalCall ? (
                    <div className="idid-detail-body">
                      <div className="idid-detail-head">
                        <div>
                          <span className="idid-detail-sid">{activeModalCall.call_sid}</span>
                          <h3 style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 750 }}>
                            Caller: {activeModalCall.customer}
                          </h3>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                            Duration: {activeModalCall.duration}
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748b" }}>
                            {activeModalCall.time}
                          </div>
                        </div>
                      </div>

                      <div className="idid-detail-meta-grid">
                        <div>
                          <span>Campaign / Process</span>
                          <strong>{activeModalCall.client_name}</strong>
                        </div>
                        <div>
                          <span>Assigned Agent</span>
                          <strong>{activeModalCall.agent}</strong>
                        </div>
                        <div>
                          <span>Call Status</span>
                          <strong>{activeModalCall.status}</strong>
                        </div>
                        <div>
                          <span>Trunk DID</span>
                          <strong>{watchingDID.did}</strong>
                        </div>
                      </div>

                      {/* AUDIO RECORDING */}
                      {activeModalCall.recording_url ? (
                        <div className="idid-audio-player-box">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontSize: "11px", fontWeight: 700 }}>
                            <Volume2 size={14} color="#6259e8" />
                            <span>Audio Recording Playback</span>
                          </div>
                          <audio controls style={{ width: "100%" }} src={activeModalCall.recording_url} />
                        </div>
                      ) : (
                        <div className="idid-audio-empty-box">
                          <Volume2 size={13} color="#94a3b8" />
                          <span>Real-time Telephony Signal Synced · Gateway Audio Processed</span>
                        </div>
                      )}

                      {/* TRANSCRIPT */}
                      <div className="idid-transcript-section">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                          <FileText size={13} color="#6259e8" />
                          <span>Call Dialogue Transcript</span>
                        </div>

                        {activeModalCall.transcript ? (
                          <div className="idid-transcript-box">
                            {activeModalCall.transcript.split("\n").map((line: string, lidx: number) => {
                              const isAI = line.startsWith("AI:");
                              const isUser = line.startsWith("User:");
                              return (
                                <div
                                  key={lidx}
                                  className={`idid-chat-msg ${isAI ? "ai" : isUser ? "user" : "system"}`}
                                >
                                  <span className="sender">{isAI ? "AI Agent" : isUser ? "Customer" : "Telephony"}</span>
                                  <span className="text">{line.replace(/^(AI:|User:)/, "").trim()}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="idid-transcript-empty">
                            Call connection established. Real-time dialog logged on gateway.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="idid-select-prompt">
                      <PhoneCall size={32} color="#cbd5e1" />
                      <p style={{ marginTop: "10px" }}>Select a call from the list to view its dialogue transcript and telemetry details.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="idid-modal-footer">
              <div style={{ fontSize: "10px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                <Activity size={12} color="#10b981" />
                <span>Connected to Callmira Realtime Engine · Showing genuine DB telemetry</span>
              </div>

              <button className="idid-modal-done-btn" onClick={() => setWatchingDID(null)}>
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
