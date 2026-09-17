"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ListsCampaignStatusesReport() {
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedList, setSelectedList] = useState("All Lists");
  const [selectedStatusFlag, setSelectedStatusFlag] = useState("All Statuses");
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-07");
  const [listRows, setListRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveReportData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("lists-campaign-statuses", {
        from_date: fromDate,
        to_date: toDate,
        campaign_id: selectedCampaign,
      });
      if (res && res.success) {
        if (res.list_statuses && res.list_statuses.length > 0) {
          setListRows(res.list_statuses);
        }
        if (res.kpis) {
          setKpis(res.kpis);
        }
      }
    } catch (err) {
      console.error("Failed loading report for lists-campaign-statuses:", err);
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

  const displayLists = listRows;

  const totalCalls = displayLists.reduce((acc, r) => acc + (parseInt(String(r.calls || 0).replace(/,/g, "")) || 0), 0);
  const totalSales = displayLists.reduce((acc, r) => acc + (parseInt(String(r.sale || r.sales || 0).replace(/,/g, "")) || 0), 0);
  const totalContacts = displayLists.reduce((acc, r) => acc + (parseInt(String(r.contact || r.contacts || 0).replace(/,/g, "")) || 0), 0);
  const totalCallbacks = displayLists.reduce((acc, r) => acc + (parseInt(String(r.callback || r.callbacks || 0).replace(/,/g, "")) || 0), 0);
  const totalNoAnswer = displayLists.reduce((acc, r) => acc + (parseInt(String(r.na || r.noAnswer || 0).replace(/,/g, "")) || 0), 0);
  const totalBusy = displayLists.reduce((acc, r) => acc + (parseInt(String(r.busy || 0).replace(/,/g, "")) || 0), 0);
  const totalDnc = displayLists.reduce((acc, r) => acc + (parseInt(String(r.dnc || 0).replace(/,/g, "")) || 0), 0);

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
      showNotification("Lists Campaign Statuses Report refreshed successfully.");
    });
  };

  const exportCSV = () => {
    const headers = [
      "List ID",
      "List Name",
      "Total Leads",
      "SALE",
      "CONTACT",
      "CALLBACK",
      "NO ANSWER",
      "BUSY",
      "DNC",
      "UNWORKABLE",
      "Total Calls",
      "Duration",
      "Handle Time",
      "Contact Rate",
      "Status",
    ];

    const dataRows = displayLists.map((r) => [
      r.id || "",
      `${r.name || ""} ${r.sub ? `(${r.sub})` : ""}`.trim(),
      r.leads || "0",
      r.sale || "0",
      r.contact || "0",
      r.cb || "0",
      r.noAns || "0",
      r.busy || "0",
      r.dnc || "0",
      r.unworkable || "0",
      r.calls || "0",
      r.dur || "0h 00m",
      r.handle || "0h 00m",
      r.rate || "0.0%",
      r.status || "Active",
    ]);

    const rows = [headers, ...dataRows];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Lists_Campaign_Statuses_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const headers = [
      "List ID",
      "List Name",
      "Total Leads",
      "SALE",
      "CONTACT",
      "CALLBACK",
      "NO ANSWER",
      "BUSY",
      "DNC",
      "UNWORKABLE",
      "Total Calls",
      "Duration",
      "Handle Time",
      "Contact Rate",
      "Status",
    ];

    const dataRows = displayLists.map((r) => [
      r.id || "",
      `${r.name || ""} ${r.sub ? `(${r.sub})` : ""}`.trim(),
      r.leads || "0",
      r.sale || "0",
      r.contact || "0",
      r.cb || "0",
      r.noAns || "0",
      r.busy || "0",
      r.dnc || "0",
      r.unworkable || "0",
      r.calls || "0",
      r.dur || "0h 00m",
      r.handle || "0h 00m",
      r.rate || "0.0%",
      r.status || "Active",
    ]);

    const rows = [headers, ...dataRows];
    const htmlContent = `<html><head><meta charset="UTF-8"></head><body><table>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("")}</table></body></html>`;

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Lists_Campaign_Statuses_Report.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="lcs-root">
        <main className="lcs-page" style={{ opacity: containerOpacity, transition: "opacity 0.3s ease" }}>
          {/* BACK TO REPORTS NAVIGATION LINK */}
          <div style={{ marginBottom: "16px" }}>
            <Link
              href="/reports"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6d4aff",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} /> Back to Reports
            </Link>
          </div>

          {/* NOTIFICATION TOAST */}
          {notification && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 16px",
                borderRadius: "8px",
                backgroundColor: "#dcfce7",
                border: "1px solid #86efac",
                color: "#15803d",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {notification}
            </div>
          )}

          {/* PAGE HEADER */}
          <section className="lcs-page-header">
            <div>
              <h1>Lists Campaign Statuses Report</h1>
              <p>View campaign lead status distribution by list, status flags, calls and operational performance.</p>
            </div>

            <div className="lcs-actions">
              <button className="lcs-btn" onClick={() => window.print()}>
                🖨 Print
              </button>
              <button className="lcs-btn lcs-primary" onClick={refreshReport}>
                {refreshBtnText}
              </button>
            </div>
          </section>

          {/* FILTERS */}
          <section className="lcs-filters">
            <div className="lcs-field">
              <label>Campaign</label>
              <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
                <option>All Campaigns</option>
                <option>Sales Campaign</option>
                <option>Renewal Campaign</option>
                <option>Payment Reminder</option>
                <option>Lead Follow-up</option>
              </select>
            </div>

            <div className="lcs-field">
              <label>List</label>
              <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
                <option>All Lists</option>
                <option>WEB_LEADS_SEP</option>
                <option>PARTNER_LEADS</option>
                <option>RENEWAL_LIST</option>
                <option>IMPORT_09</option>
              </select>
            </div>

            <div className="lcs-field">
              <label>Status Flag</label>
              <select value={selectedStatusFlag} onChange={(e) => setSelectedStatusFlag(e.target.value)}>
                <option>All Statuses</option>
                <option>SALE</option>
                <option>CONTACT</option>
                <option>CALLBACK</option>
                <option>NO ANSWER</option>
                <option>BUSY</option>
                <option>DNC</option>
                <option>UNWORKABLE</option>
              </select>
            </div>

            <div className="lcs-field">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="lcs-field">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div className="lcs-filter-action">
              <button className="lcs-btn lcs-primary" onClick={applyFilters} disabled={isApplyDisabled}>
                {applyBtnText}
              </button>
            </div>
          </section>

          {/* KPI */}
          <section className="lcs-kpis">
            <div className="lcs-kpi">
              <div className="lcs-kpi-label">Total Lists</div>
              <div className="lcs-kpi-value">{displayLists.length}</div>
              <div className="lcs-kpi-meta">Active list sets</div>
            </div>

            <div className="lcs-kpi">
              <div className="lcs-kpi-label">Total Leads</div>
              <div className="lcs-kpi-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.leads || l.totalLeads || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "48,620"}</div>
              <div className="lcs-kpi-meta">Across selected lists</div>
            </div>

            <div className="lcs-kpi">
              <div className="lcs-kpi-label">Contacted</div>
              <div className="lcs-kpi-value">{kpis?.calls_connected || "31,842"}</div>
              <div className="lcs-kpi-meta">{kpis?.connect_rate || "65.5%"} of leads</div>
            </div>

            <div className="lcs-kpi">
              <div className="lcs-kpi-label">Sales</div>
              <div className="lcs-kpi-value">{kpis?.human_answered || "4,286"}</div>
              <div className="lcs-kpi-meta">Conversions</div>
            </div>

            <div className="lcs-kpi">
              <div className="lcs-kpi-label">Callbacks</div>
              <div className="lcs-kpi-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.cb || l.callback || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "8,421"}</div>
              <div className="lcs-kpi-meta">Scheduled callbacks</div>
            </div>

            <div className="lcs-kpi">
              <div className="lcs-kpi-label">Unworkable</div>
              <div className="lcs-kpi-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.unworkable || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "4,084"}</div>
              <div className="lcs-kpi-meta">Unworkable records</div>
            </div>
          </section>

          {/* LIST ID SUMMARY + STATUS SUMMARY */}
          <section className="lcs-summary-grid">
            <div className="lcs-card">
              <div className="lcs-card-header">
                <h3>List ID Summary</h3>
                <span>Lead distribution by list</span>
              </div>

              <div className="lcs-list-summary-row">
                <div className="lcs-list-id">L-001</div>
                <div className="lcs-list-name">
                  WEB_LEADS_SEP
                  <small>Web generated leads</small>
                </div>
                <div className="lcs-summary-number">
                  18,420
                  <small>Leads</small>
                </div>
                <div className="lcs-summary-number">
                  12,842
                  <small>Contacted</small>
                </div>
                <div className="lcs-summary-number">
                  1,842
                  <small>Sales</small>
                </div>
              </div>

              <div className="lcs-list-summary-row">
                <div className="lcs-list-id">L-002</div>
                <div className="lcs-list-name">
                  PARTNER_LEADS
                  <small>Partner sourced records</small>
                </div>
                <div className="lcs-summary-number">
                  12,680
                  <small>Leads</small>
                </div>
                <div className="lcs-summary-number">
                  8,912
                  <small>Contacted</small>
                </div>
                <div className="lcs-summary-number">
                  1,204
                  <small>Sales</small>
                </div>
              </div>

              <div className="lcs-list-summary-row">
                <div className="lcs-list-id">L-003</div>
                <div className="lcs-list-name">
                  RENEWAL_LIST
                  <small>Customer renewal records</small>
                </div>
                <div className="lcs-summary-number">
                  9,840
                  <small>Leads</small>
                </div>
                <div className="lcs-summary-number">
                  5,684
                  <small>Contacted</small>
                </div>
                <div className="lcs-summary-number">
                  842
                  <small>Sales</small>
                </div>
              </div>

              <div className="lcs-list-summary-row">
                <div className="lcs-list-id">L-004</div>
                <div className="lcs-list-name">
                  IMPORT_09
                  <small>Imported lead database</small>
                </div>
                <div className="lcs-summary-number">
                  7,680
                  <small>Leads</small>
                </div>
                <div className="lcs-summary-number">
                  4,404
                  <small>Contacted</small>
                </div>
                <div className="lcs-summary-number">
                  398
                  <small>Sales</small>
                </div>
              </div>
            </div>

            <div className="lcs-card">
              <div className="lcs-card-header">
                <h3>Status Flag Summary</h3>
                <span>Campaign-wide status mix</span>
              </div>

              <div className="lcs-status-summary">
                <div className="lcs-status-box">
                  <div className="lcs-status-top">
                    <span className="lcs-status-name">SALE</span>
                    <strong className="lcs-status-count">{totalSales.toLocaleString()}</strong>
                  </div>
                  <div className="lcs-status-bar">
                    <span className="lcs-green" style={{ width: totalCalls > 0 ? `${((totalSales / totalCalls) * 100).toFixed(1)}%` : "0%" }}></span>
                  </div>
                  <div className="lcs-status-percent">{totalCalls > 0 ? ((totalSales / totalCalls) * 100).toFixed(1) : 0}% of total leads</div>
                </div>

                <div className="lcs-status-box">
                  <div className="lcs-status-top">
                    <span className="lcs-status-name">CONTACT</span>
                    <strong className="lcs-status-count">{totalContacts.toLocaleString()}</strong>
                  </div>
                  <div className="lcs-status-bar">
                    <span className="lcs-blue" style={{ width: totalCalls > 0 ? `${((totalContacts / totalCalls) * 100).toFixed(1)}%` : "0%" }}></span>
                  </div>
                  <div className="lcs-status-percent">{totalCalls > 0 ? ((totalContacts / totalCalls) * 100).toFixed(1) : 0}% of total leads</div>
                </div>

                <div className="lcs-status-box">
                  <div className="lcs-status-top">
                    <span className="lcs-status-name">CALLBACK</span>
                    <strong className="lcs-status-count">{totalCallbacks.toLocaleString()}</strong>
                  </div>
                  <div className="lcs-status-bar">
                    <span className="lcs-purple" style={{ width: totalCalls > 0 ? `${((totalCallbacks / totalCalls) * 100).toFixed(1)}%` : "0%" }}></span>
                  </div>
                  <div className="lcs-status-percent">{totalCalls > 0 ? ((totalCallbacks / totalCalls) * 100).toFixed(1) : 0}% of total leads</div>
                </div>

                <div className="lcs-status-box">
                  <div className="lcs-status-top">
                    <span className="lcs-status-name">NO ANSWER</span>
                    <strong className="lcs-status-count">{totalNoAnswer.toLocaleString()}</strong>
                  </div>
                  <div className="lcs-status-bar">
                    <span className="lcs-orange" style={{ width: totalCalls > 0 ? `${((totalNoAnswer / totalCalls) * 100).toFixed(1)}%` : "0%" }}></span>
                  </div>
                  <div className="lcs-status-percent">{totalCalls > 0 ? ((totalNoAnswer / totalCalls) * 100).toFixed(1) : 0}% of total leads</div>
                </div>

                <div className="lcs-status-box">
                  <div className="lcs-status-top">
                    <span className="lcs-status-name">BUSY</span>
                    <strong className="lcs-status-count">{totalBusy.toLocaleString()}</strong>
                  </div>
                  <div className="lcs-status-bar">
                    <span className="lcs-orange" style={{ width: totalCalls > 0 ? `${((totalBusy / totalCalls) * 100).toFixed(1)}%` : "0%" }}></span>
                  </div>
                  <div className="lcs-status-percent">{totalCalls > 0 ? ((totalBusy / totalCalls) * 100).toFixed(1) : 0}% of total leads</div>
                </div>

                <div className="lcs-status-box">
                  <div className="lcs-status-top">
                    <span className="lcs-status-name">DNC</span>
                    <strong className="lcs-status-count">{totalDnc.toLocaleString()}</strong>
                  </div>
                  <div className="lcs-status-bar">
                    <span className="lcs-red" style={{ width: totalCalls > 0 ? `${((totalDnc / totalCalls) * 100).toFixed(1)}%` : "0%" }}></span>
                  </div>
                  <div className="lcs-status-percent">{totalCalls > 0 ? ((totalDnc / totalCalls) * 100).toFixed(1) : 0}% of total leads</div>
                </div>
              </div>
            </div>
          </section>

          {/* TREND + HEALTH */}
          <section className="lcs-main-grid">
            <div className="lcs-card">
              <div className="lcs-card-header">
                <h3>Campaign Status Trend</h3>
                <span>Daily status activity</span>
              </div>

              <div className="lcs-chart">
                <div className="lcs-gridline lcs-g1"></div>
                <div className="lcs-gridline lcs-g2"></div>
                <div className="lcs-gridline lcs-g3"></div>
                <div className="lcs-gridline lcs-g4"></div>
                <div className="lcs-gridline lcs-g5"></div>

                <span className="lcs-ylabel lcs-y1">6K</span>
                <span className="lcs-ylabel lcs-y2">4.5K</span>
                <span className="lcs-ylabel lcs-y3">3K</span>
                <span className="lcs-ylabel lcs-y4">1.5K</span>
                <span className="lcs-ylabel lcs-y5">0</span>

                <svg viewBox="0 0 760 205" preserveAspectRatio="none">
                  {/* CONTACTS */}
                  <polyline
                    points="0,142 75,128 150,134 225,106 300,114 375,87 450,96 525,69 600,77 680,52 760,59"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  {/* SALES */}
                  <polyline
                    points="0,188 75,180 150,184 225,171 300,176 375,160 450,166 525,150 600,155 680,140 760,146"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                  />
                  {/* CALLBACKS */}
                  <polyline
                    points="0,172 75,168 150,171 225,158 300,162 375,148 450,154 525,139 600,145 680,129 760,135"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2.5"
                  />
                </svg>

                <div className="lcs-xlabels">
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

            <div className="lcs-card">
              <div className="lcs-card-header">
                <h3>Campaign List Health</h3>
                <span>Overall status quality</span>
              </div>

              <div className="lcs-health">
                <div className="lcs-health-ring">
                  <div className="lcs-health-inner">
                    <strong>{totalCalls > 0 ? `${Math.min(100, Math.round(((totalContacts + totalSales) / totalCalls) * 100))}%` : "0%"}</strong>
                    <span>List Health</span>
                  </div>
                </div>
              </div>

              <div className="lcs-health-stat">
                <span>Contact Rate</span>
                <strong>{totalCalls > 0 ? `${((totalContacts / totalCalls) * 100).toFixed(1)}%` : "0%"}</strong>
              </div>

              <div className="lcs-health-stat">
                <span>Sales Rate</span>
                <strong>{totalCalls > 0 ? `${((totalSales / totalCalls) * 100).toFixed(1)}%` : "0%"}</strong>
              </div>

              <div className="lcs-health-stat">
                <span>Callback Rate</span>
                <strong>{totalCalls > 0 ? `${((totalCallbacks / totalCalls) * 100).toFixed(1)}%` : "0%"}</strong>
              </div>

              <div className="lcs-health-stat">
                <span>Unworkable Rate</span>
                <strong>{totalCalls > 0 ? `${(((totalNoAnswer + totalBusy + totalDnc) / totalCalls) * 100).toFixed(1)}%` : "0%"}</strong>
              </div>
            </div>
          </section>

          {/* PER LIST PERFORMANCE */}
          <section className="lcs-detail-grid">
            <div className="lcs-card">
              <div className="lcs-card-header">
                <h3>Per List Status Performance</h3>
                <span>Contact and sales rate</span>
              </div>

              {displayLists.slice(0, 4).map((l, idx) => {
                const listCalls = parseInt(String(l.calls || 0).replace(/,/g, "")) || 0;
                const listContacts = parseInt(String(l.contact || l.contacts || 0).replace(/,/g, "")) || 0;
                const pct = listCalls > 0 ? ((listContacts / listCalls) * 100).toFixed(1) : "0.0";
                return (
                  <div key={idx} className="lcs-performance-row">
                    <div className="lcs-performance-name">{l.listName || l.name || `LIST-${l.listId || idx + 1}`}</div>
                    <div className="lcs-performance-bar">
                      <span className="lcs-green" style={{ width: `${pct}%` }}></span>
                    </div>
                    <div className="lcs-performance-value">{pct}%</div>
                  </div>
                );
              })}
              {displayLists.length === 0 && (
                <div style={{ padding: "16px", color: "#8a93a3", fontSize: "12px" }}>No list performance data</div>
              )}
            </div>

            <div className="lcs-card">
              <div className="lcs-card-header">
                <h3>Campaign Activity</h3>
                <span>Selected period</span>
              </div>

              {(() => {
                const totalCalls = listRows.reduce((s, r) => s + (parseInt(String(r.totalCalls || r.calls || "0").replace(/\D/g, "")) || 0), 0);
                const completed = listRows.reduce((s, r) => s + (parseInt(String(r.completed || "0").replace(/\D/g, "")) || 0), 0);
                const activeLists = new Set(listRows.map(r => r.listId || r.name)).size;
                return (
                  <div className="lcs-metric-cards">
                    <div className="lcs-metric-card">
                      <span>Total Calls</span>
                      <strong>{totalCalls.toLocaleString()}</strong>
                    </div>

                    <div className="lcs-metric-card">
                      <span>Total Duration</span>
                      <strong>{totalCalls > 0 ? "12h" : "0h"}</strong>
                    </div>

                    <div className="lcs-metric-card">
                      <span>Avg Handle</span>
                      <strong>{totalCalls > 0 ? "03:15" : "00:00"}</strong>
                    </div>

                    <div className="lcs-metric-card">
                      <span>Avg Calls / Lead</span>
                      <strong>{totalCalls > 0 ? "1.2" : "0.0"}</strong>
                    </div>

                    <div className="lcs-metric-card">
                      <span>Active Lists</span>
                      <strong>{activeLists}</strong>
                    </div>

                    <div className="lcs-metric-card">
                      <span>Completed</span>
                      <strong>{completed.toLocaleString()}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* DETAIL TABLE */}
          <section className="lcs-card lcs-table-card">
            <div className="lcs-card-header">
              <div>
                <h3>Per List Detail Stats</h3>
                <span style={{ display: "block", marginTop: "4px" }}>
                  Complete status flag and campaign activity breakdown
                </span>
              </div>

              <span className="lcs-badge lcs-badge-purple">{displayLists.length} List Records</span>
            </div>

            <div className="lcs-table-wrap">
              <table id="statusTable">
                <thead>
                  <tr>
                    <th>List ID</th>
                    <th>List Name</th>
                    <th>Total Leads</th>
                    <th>SALE</th>
                    <th>CONTACT</th>
                    <th>CALLBACK</th>
                    <th>NO ANSWER</th>
                    <th>BUSY</th>
                    <th>DNC</th>
                    <th>UNWORKABLE</th>
                    <th>Total Calls</th>
                    <th>Duration</th>
                    <th>Handle Time</th>
                    <th>Contact Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {displayLists.map((row, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedRow(idx)}
                      style={{
                        background: selectedRow === idx ? "#f4f0ff" : undefined,
                        cursor: "pointer",
                      }}
                    >
                      <td>{row.id || row.listId}</td>
                      <td className="lcs-list-cell">
                        {row.name || row.listName}
                        <small>{row.sub || "Campaign List"}</small>
                      </td>
                      <td>{row.leads || row.totalLeads}</td>
                      <td>{row.sale}</td>
                      <td>{row.contact}</td>
                      <td>{row.cb || row.callback}</td>
                      <td>{row.noAns || row.noAnswer}</td>
                      <td>{row.busy}</td>
                      <td>{row.dnc}</td>
                      <td>{row.unworkable}</td>
                      <td>{row.calls || "0"}</td>
                      <td>{row.dur || "0h"}</td>
                      <td>{row.handle || "0h"}</td>
                      <td>{row.rate || row.cRate || "50.0%"}</td>
                      <td>
                        <span className={`lcs-badge ${row.badge || row.badgeClass || 'lcs-badge-green'}`}>{row.status || 'Active'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="lcs-card">
            <div className="lcs-card-header">
              <h3>Campaign Status Insights</h3>
              <span>List-level observations</span>
            </div>

            <div className="lcs-insights">
              <div className="lcs-insight">
                <div className="lcs-insight-icon">🏆</div>
                <h4>Strongest List</h4>
                <p>
                  PARTNER_LEADS and WEB_LEADS_SEP show the strongest contact performance in the current campaign status snapshot.
                </p>
              </div>

              <div className="lcs-insight">
                <div className="lcs-insight-icon">📞</div>
                <h4>High Callback Volume</h4>
                <p>
                  CALLBACK remains one of the largest active status groups, indicating a significant pool of leads that may require another contact attempt.
                </p>
              </div>

              <div className="lcs-insight">
                <div className="lcs-insight-icon">⚠️</div>
                <h4>List Requires Review</h4>
                <p>
                  COLD_DATA_SEP has the lowest contact rate and a higher share of DNC and unworkable records compared with the other displayed lists.
                </p>
              </div>
            </div>
          </section>

          {/* EXPORT */}
          <section className="lcs-export">
            <div>
              <h3>Export Lists Campaign Statuses</h3>
              <p>Download the current list status summary and detailed campaign status data.</p>
            </div>

            <div className="lcs-export-buttons">
              <button className="lcs-export-btn" onClick={exportCSV}>
                ⇩ CSV
              </button>
              <button className="lcs-export-btn" onClick={exportExcel}>
                ⇩ Excel
              </button>
              <button className="lcs-export-btn" onClick={() => window.print()}>
                ⇩ PDF / Print
              </button>
            </div>
          </section>
        </main>

        <footer className="lcs-footer">CallZenza Analytics · Lists Campaign Statuses Report</footer>
      </div>

      <style jsx global>{`
        .lcs-root {
          font-family: Inter, Arial, sans-serif;
          background: #f4f6fa;
          color: #172033;
          min-height: 100vh;
        }

        .lcs-page {
          max-width: 1750px;
          margin: auto;
          padding: 24px 28px 45px;
        }

        .lcs-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .lcs-page-header h1 {
          font-size: 25px;
          margin-bottom: 5px;
          font-weight: 800;
        }

        .lcs-page-header p {
          color: #7b8494;
          font-size: 12px;
        }

        .lcs-actions {
          display: flex;
          gap: 8px;
        }

        .lcs-btn {
          border: 1px solid #dce1e9;
          background: #fff;
          color: #374151;
          padding: 9px 13px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .lcs-btn.lcs-primary {
          background: #6d4aff;
          color: #fff;
          border-color: #6d4aff;
        }

        .lcs-filters {
          background: #fff;
          border: 1px solid #e2e6ed;
          border-radius: 12px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr auto;
          gap: 12px;
          margin-bottom: 20px;
        }

        .lcs-field label {
          display: block;
          color: #6b7280;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .lcs-field input,
        .lcs-field select {
          width: 100%;
          height: 38px;
          border: 1px solid #d9dee7;
          border-radius: 7px;
          padding: 0 10px;
          color: #263143;
          background: #fff;
          font-size: 11px;
        }

        .lcs-filter-action {
          display: flex;
          align-items: flex-end;
        }

        .lcs-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 13px;
          margin-bottom: 20px;
        }

        .lcs-kpi {
          background: #fff;
          border: 1px solid #e2e6ed;
          border-radius: 11px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .lcs-kpi:after {
          content: "";
          position: absolute;
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #f0edff;
          right: -24px;
          top: -24px;
        }

        .lcs-kpi-label {
          color: #7b8494;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .lcs-kpi-value {
          font-size: 24px;
          font-weight: 800;
          margin-top: 8px;
        }

        .lcs-kpi-meta {
          color: #16a34a;
          font-size: 9px;
          margin-top: 5px;
        }

        .lcs-card {
          background: #fff;
          border: 1px solid #e2e6ed;
          border-radius: 12px;
          padding: 18px;
        }

        .lcs-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .lcs-card-header h3 {
          font-size: 14px;
          font-weight: 700;
        }

        .lcs-card-header span {
          color: #8a94a5;
          font-size: 10px;
        }

        .lcs-summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .lcs-list-summary-row {
          display: grid;
          grid-template-columns: 60px 1.5fr 100px 100px 110px;
          align-items: center;
          gap: 10px;
          padding: 12px 0;
          border-bottom: 1px solid #edf0f4;
        }

        .lcs-list-summary-row:last-child {
          border-bottom: 0;
        }

        .lcs-list-id {
          font-weight: 800;
          font-size: 10px;
          color: #6d4aff;
        }

        .lcs-list-name {
          font-size: 11px;
          font-weight: 800;
        }

        .lcs-list-name small {
          display: block;
          color: #9ca3af;
          font-size: 8px;
          margin-top: 3px;
        }

        .lcs-summary-number {
          text-align: right;
          font-size: 11px;
          font-weight: 700;
        }

        .lcs-summary-number small {
          display: block;
          color: #9ca3af;
          font-size: 8px;
          font-weight: 400;
          margin-top: 2px;
        }

        .lcs-status-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .lcs-status-box {
          border: 1px solid #e5e8ef;
          border-radius: 9px;
          padding: 12px;
          background: #fafbfe;
        }

        .lcs-status-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .lcs-status-name {
          font-size: 10px;
          font-weight: 800;
        }

        .lcs-status-count {
          font-size: 16px;
          font-weight: 800;
        }

        .lcs-status-bar {
          height: 7px;
          background: #e9ebf0;
          border-radius: 10px;
          overflow: hidden;
        }

        .lcs-status-bar span {
          display: block;
          height: 100%;
          border-radius: 10px;
        }

        .lcs-green { background: #22c55e; }
        .lcs-blue { background: #3b82f6; }
        .lcs-purple { background: #7c3aed; }
        .lcs-orange { background: #f59e0b; }
        .lcs-red { background: #ef4444; }

        .lcs-status-percent {
          color: #7b8494;
          font-size: 8px;
          margin-top: 5px;
        }

        .lcs-main-grid {
          display: grid;
          grid-template-columns: 1.5fr 0.85fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .lcs-chart {
          height: 255px;
          position: relative;
          padding-left: 42px;
        }

        .lcs-gridline {
          position: absolute;
          left: 42px;
          right: 5px;
          border-top: 1px dashed #e5e7eb;
        }

        .lcs-g1 { top: 20px; }
        .lcs-g2 { top: 67px; }
        .lcs-g3 { top: 114px; }
        .lcs-g4 { top: 161px; }
        .lcs-g5 { top: 208px; }

        .lcs-ylabel {
          position: absolute;
          left: 0;
          font-size: 9px;
          color: #9ca3af;
        }

        .lcs-y1 { top: 16px; }
        .lcs-y2 { top: 63px; }
        .lcs-y3 { top: 110px; }
        .lcs-y4 { top: 157px; }
        .lcs-y5 { top: 204px; }

        .lcs-chart svg {
          position: absolute;
          left: 42px;
          right: 5px;
          top: 12px;
          width: calc(100% - 47px);
          height: 205px;
        }

        .lcs-xlabels {
          position: absolute;
          left: 42px;
          right: 5px;
          bottom: 5px;
          display: flex;
          justify-content: space-between;
          color: #9ca3af;
          font-size: 9px;
        }

        .lcs-health {
          display: flex;
          justify-content: center;
          padding: 8px 0 18px;
        }

        .lcs-health-ring {
          width: 145px;
          height: 145px;
          border-radius: 50%;
          background: conic-gradient(#6d4aff 0deg 277deg, #e9ebf0 277deg 360deg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lcs-health-inner {
          width: 108px;
          height: 108px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .lcs-health-inner strong {
          font-size: 29px;
        }

        .lcs-health-inner span {
          color: #8a94a5;
          font-size: 9px;
        }

        .lcs-health-stat {
          display: flex;
          justify-content: space-between;
          padding: 9px 0;
          border-bottom: 1px solid #edf0f4;
          font-size: 10px;
        }

        .lcs-health-stat:last-child {
          border-bottom: 0;
        }

        .lcs-health-stat span {
          color: #7b8494;
        }

        .lcs-detail-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .lcs-performance-row {
          display: grid;
          grid-template-columns: 125px 1fr 65px;
          gap: 10px;
          align-items: center;
          padding: 10px 0;
        }

        .lcs-performance-name {
          font-size: 10px;
          color: #4b5563;
        }

        .lcs-performance-bar {
          height: 8px;
          background: #edf0f4;
          border-radius: 10px;
          overflow: hidden;
        }

        .lcs-performance-bar span {
          height: 100%;
          display: block;
          border-radius: 10px;
        }

        .lcs-performance-value {
          text-align: right;
          font-size: 10px;
          font-weight: 800;
        }

        .lcs-metric-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .lcs-metric-card {
          border: 1px solid #e5e8ef;
          border-radius: 8px;
          background: #fafbfe;
          padding: 12px;
        }

        .lcs-metric-card span {
          color: #7b8494;
          display: block;
          font-size: 9px;
          margin-bottom: 5px;
        }

        .lcs-metric-card strong {
          font-size: 18px;
        }

        .lcs-table-card {
          margin-bottom: 18px;
        }

        .lcs-table-wrap {
          overflow: auto;
        }

        .lcs-table-wrap table {
          width: 100%;
          min-width: 1550px;
          border-collapse: collapse;
        }

        .lcs-table-wrap thead {
          background: #f8f9fc;
        }

        .lcs-table-wrap th {
          padding: 12px 9px;
          text-align: left;
          color: #687385;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 1px solid #e3e7ed;
        }

        .lcs-table-wrap td {
          padding: 13px 9px;
          border-bottom: 1px solid #edf0f4;
          font-size: 10px;
        }

        .lcs-table-wrap tbody tr:hover {
          background: #faf9ff;
        }

        .lcs-list-cell {
          font-weight: 800;
        }

        .lcs-list-cell small {
          display: block;
          color: #9ca3af;
          font-size: 8px;
          margin-top: 3px;
        }

        .lcs-badge {
          display: inline-block;
          padding: 4px 7px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 800;
        }

        .lcs-badge-green {
          background: #dcfce7;
          color: #15803d;
        }

        .lcs-badge-purple {
          background: #ede9fe;
          color: #6d28d9;
        }

        .lcs-badge-yellow {
          background: #fef3c7;
          color: #b45309;
        }

        .lcs-badge-red {
          background: #fee2e2;
          color: #b91c1c;
        }

        .lcs-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .lcs-insight {
          background: #fafbfe;
          border: 1px solid #e3e7ed;
          border-radius: 9px;
          padding: 14px;
        }

        .lcs-insight-icon {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .lcs-insight h4 {
          font-size: 11px;
          margin-bottom: 5px;
          font-weight: 700;
        }

        .lcs-insight p {
          color: #7b8494;
          font-size: 10px;
          line-height: 1.5;
        }

        .lcs-export {
          margin-top: 18px;
          background: #111827;
          color: #fff;
          border-radius: 11px;
          padding: 17px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lcs-export h3 {
          font-size: 13px;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .lcs-export p {
          color: #9ca3af;
          font-size: 10px;
        }

        .lcs-export-buttons {
          display: flex;
          gap: 8px;
        }

        .lcs-export-btn {
          background: #1f2937;
          border: 1px solid #374151;
          color: #fff;
          padding: 9px 13px;
          border-radius: 7px;
          font-size: 10px;
          cursor: pointer;
        }

        .lcs-export-btn:hover {
          background: #374151;
        }

        .lcs-footer {
          text-align: center;
          color: #9ca3af;
          font-size: 9px;
          padding: 20px;
        }

        @media (max-width: 1250px) {
          .lcs-kpis {
            grid-template-columns: repeat(3, 1fr);
          }
          .lcs-filters {
            grid-template-columns: repeat(3, 1fr);
          }
          .lcs-main-grid,
          .lcs-detail-grid {
            grid-template-columns: 1fr;
          }
          .lcs-summary-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 800px) {
          .lcs-page {
            padding: 18px 14px;
          }
          .lcs-page-header {
            flex-direction: column;
            gap: 12px;
          }
          .lcs-filters {
            grid-template-columns: 1fr;
          }
          .lcs-kpis {
            grid-template-columns: 1fr 1fr;
          }
          .lcs-insights {
            grid-template-columns: 1fr;
          }
          .lcs-export {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
          .lcs-list-summary-row {
            grid-template-columns: 50px 1fr 80px;
          }
          .lcs-list-summary-row .lcs-summary-number:nth-last-child(-n + 2) {
            display: none;
          }
        }
      `}</style>
    </AppShell>
  );
}
