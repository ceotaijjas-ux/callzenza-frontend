"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DialerInventoryReport() {
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedList, setSelectedList] = useState("All Lists");
  const [selectedInventoryStatus, setSelectedInventoryStatus] = useState("All Inventory");
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-07");
  const [listRows, setListRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveReportData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("dialer-inventory", {
        from_date: fromDate,
        to_date: toDate,
        campaign_id: selectedCampaign,
      });
      if (res && res.success) {
        if (res.dialer_inventory && res.dialer_inventory.length > 0) {
          setListRows(res.dialer_inventory);
        }
        if (res.kpis) {
          setKpis(res.kpis);
        }
      }
    } catch (err) {
      console.error("Failed loading report for dialer-inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLiveReportData();
  }, [fromDate, toDate, selectedCampaign]);

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

  const displayLists = listRows;

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
    setRefreshBtnText("Refreshing...");
    setContainerOpacity(0.7);
    fetchLiveReportData().finally(() => {
      setRefreshBtnText("↻ Refresh");
      showNotification("Dialer Inventory Report refreshed successfully.");
    });
  };

  const exportCSV = () => {
    const headers = [
      "List ID",
      "List Name",
      "Campaign",
      "Total Leads",
      "Dialable",
      "Worked",
      "Never Dialed",
      "Completed",
      "Unworkable",
      "Penetration",
      "Avg Attempts",
      "Inventory %",
      "Health",
    ];

    const dataRows = displayLists.map((r) => [
      r.id || r.list_id,
      r.name || r.list_name,
      r.campaign || r.campaign_id,
      r.leads || r.total_leads,
      r.dialable,
      r.worked,
      r.never || r.neverDialed || r.never_dialed,
      r.comp || r.completed,
      r.unworkable,
      r.pen || r.penetration,
      r.avgAtt || r.avg_attempts,
      r.invPct || r.inventoryPct,
      r.health,
    ]);

    const rows = [headers, ...dataRows];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "CallZenza_Dialer_Inventory_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="di-root">
        <main className="di-container" style={{ opacity: containerOpacity, transition: "opacity 0.3s ease" }}>
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
                color: "#6d28d9",
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

          {/* PAGE TITLE */}
          <section className="di-page-title">
            <div>
              <h1>Dialer Inventory Report</h1>
              <p>Monitor dialable lead inventory, list penetration, remaining leads and calling runway.</p>
            </div>

            <div className="di-actions">
              <button className="di-btn-white" onClick={() => window.print()}>
                Print
              </button>
              <button className="di-btn-white" onClick={exportCSV}>
                Export CSV
              </button>
              <button className="di-btn-purple" onClick={refreshReport}>
                {refreshBtnText}
              </button>
            </div>
          </section>

          {/* FILTERS */}
          <section className="di-filters">
            <div className="di-field">
              <label>Campaign</label>
              <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
                <option>All Campaigns</option>
                <option>OUTBOUND_SALES</option>
                <option>RENEWAL_2026</option>
                <option>DEMO_CAMPAIGN</option>
                <option>ENTERPRISE_OUTBOUND</option>
              </select>
            </div>

            <div className="di-field">
              <label>List</label>
              <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
                <option>All Lists</option>
                <option>1001 - Main Sales Leads</option>
                <option>1002 - Premium Leads</option>
                <option>1003 - Follow Up</option>
                <option>1004 - Recycle Leads</option>
                <option>1005 - Enterprise</option>
                <option>1006 - Old Campaign</option>
              </select>
            </div>

            <div className="di-field">
              <label>Inventory Status</label>
              <select value={selectedInventoryStatus} onChange={(e) => setSelectedInventoryStatus(e.target.value)}>
                <option>All Inventory</option>
                <option>Healthy</option>
                <option>Watch</option>
                <option>Low</option>
                <option>Critical</option>
              </select>
            </div>

            <div className="di-field">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="di-field">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <button className="di-btn-purple" onClick={applyFilters} disabled={isApplyDisabled}>
              {applyBtnText}
            </button>
          </section>

          {/* HERO */}
          <section className="di-inventory-hero">
            <div>
              <div className="di-hero-title">
                <div className="di-hero-icon">◈</div>
                <div>
                  <h2>Current Dialable Inventory</h2>
                  <p>Leads currently available for campaign dialing</p>
                </div>
              </div>

              <div className="di-inventory-number">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.dialable || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "54,286"}</div>
              <div className="di-inventory-caption">Dialable leads remaining across active inventory</div>
            </div>

            <div className="di-hero-metrics">
              <div className="di-hero-metric">
                <div className="di-hero-metric-label">Total Leads</div>
                <div className="di-hero-metric-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.leads || l.total_leads || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "86,420"}</div>
                <div className="di-hero-metric-sub">All selected lists</div>
              </div>

              <div className="di-hero-metric">
                <div className="di-hero-metric-label">Worked</div>
                <div className="di-hero-metric-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.worked || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "32,134"}</div>
                <div className="di-hero-metric-sub">{displayLists[0]?.pen || "37.2%"} penetration</div>
              </div>

              <div className="di-hero-metric">
                <div className="di-hero-metric-label">Unworkable</div>
                <div className="di-hero-metric-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.unworkable || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "7,842"}</div>
                <div className="di-hero-metric-sub">Removed from dialable pool</div>
              </div>

              <div className="di-hero-metric">
                <div className="di-hero-metric-label">Calls / Hr</div>
                <div className="di-hero-metric-value">{kpis?.total_calls ? Math.round(Number(kpis.total_calls) * 1.5).toLocaleString() : "4,180"}</div>
                <div className="di-hero-metric-sub">Current average rate</div>
              </div>
            </div>
          </section>

          {/* KPIs */}
          <section className="di-kpis">
            <div className="di-kpi">
              <div className="di-kpi-label">Dialable Leads</div>
              <div className="di-kpi-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.dialable || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "54,286"}</div>
              <div className="di-kpi-meta">
                <span className="di-green">Active</span> pool
              </div>
            </div>

            <div className="di-kpi">
              <div className="di-kpi-label">Penetration</div>
              <div className="di-kpi-value">{displayLists[0]?.pen || "37.2%"}</div>
              <div className="di-kpi-meta">
                <span className="di-purple">Worked</span> leads
              </div>
            </div>

            <div className="di-kpi">
              <div className="di-kpi-label">Never Dialed</div>
              <div className="di-kpi-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.never || l.neverDialed || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "24,618"}</div>
              <div className="di-kpi-meta">
                <span className="di-blue">Fresh</span> inventory
              </div>
            </div>

            <div className="di-kpi">
              <div className="di-kpi-label">Completed</div>
              <div className="di-kpi-value">{kpis?.calls_connected || "16,842"}</div>
              <div className="di-kpi-meta">
                <span className="di-green">Calls</span> connected
              </div>
            </div>

            <div className="di-kpi">
              <div className="di-kpi-label">Avg Attempts</div>
              <div className="di-kpi-value">{displayLists[0]?.avgAtt || "2.46"}</div>
              <div className="di-kpi-meta">Attempts per worked lead</div>
            </div>

            <div className="di-kpi">
              <div className="di-kpi-label">Inventory Change</div>
              <div className="di-kpi-value">{kpis?.connect_rate || "62.8%"}</div>
              <div className="di-kpi-meta">
                <span className="di-orange">Connection</span> rate
              </div>
            </div>
          </section>

          {/* INVENTORY HEALTH */}
          <section className="di-grid">
            <div className="di-card">
              <div className="di-card-header">
                <div>
                  <h2>Inventory Health</h2>
                  <p>Current balance between remaining and worked inventory</p>
                </div>
                <span className="di-green">HEALTHY</span>
              </div>

              <div className="di-card-body">
                <div className="di-gauge-area">
                  <div className="di-gauge">
                    <div className="di-gauge-content">
                      <div className="di-gauge-value">62.8%</div>
                      <div className="di-gauge-label">DIALABLE</div>
                    </div>
                  </div>

                  <div className="di-inventory-bars">
                    <div className="di-inventory-row">
                      <div className="di-inventory-label">Dialable</div>
                      <div className="di-progress">
                        <span style={{ width: "63%", background: "#22c55e" }}></span>
                      </div>
                      <div className="di-inventory-value">54,286</div>
                    </div>

                    <div className="di-inventory-row">
                      <div className="di-inventory-label">Worked</div>
                      <div className="di-progress">
                        <span style={{ width: "37%", background: "#7c3aed" }}></span>
                      </div>
                      <div className="di-inventory-value">32,134</div>
                    </div>

                    <div className="di-inventory-row">
                      <div className="di-inventory-label">Unworkable</div>
                      <div className="di-progress">
                        <span style={{ width: "9%", background: "#ef4444" }}></span>
                      </div>
                      <div className="di-inventory-value">7,842</div>
                    </div>

                    <div className="di-inventory-row">
                      <div className="di-inventory-label">Completed</div>
                      <div className="di-progress">
                        <span style={{ width: "19%", background: "#3b82f6" }}></span>
                      </div>
                      <div className="di-inventory-value">16,842</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STATUS DISTRIBUTION */}
            <div className="di-card">
              <div className="di-card-header">
                <div>
                  <h2>Inventory Status</h2>
                  <p>Current lead disposition mix</p>
                </div>
              </div>

              <div className="di-card-body">
                <div className="di-status-list">
                  <div className="di-status-row">
                    <div className="di-status-name">NEW / READY</div>
                    <div className="di-status-bar">
                      <span style={{ width: "82%", background: "#22c55e" }}></span>
                    </div>
                    <div className="di-status-number">24,618</div>
                  </div>

                  <div className="di-status-row">
                    <div className="di-status-name">CONTACTED</div>
                    <div className="di-status-bar">
                      <span style={{ width: "69%", background: "#7c3aed" }}></span>
                    </div>
                    <div className="di-status-number">18,742</div>
                  </div>

                  <div className="di-status-row">
                    <div className="di-status-name">CALLBACK</div>
                    <div className="di-status-bar">
                      <span style={{ width: "34%", background: "#3b82f6" }}></span>
                    </div>
                    <div className="di-status-number">9,418</div>
                  </div>

                  <div className="di-status-row">
                    <div className="di-status-name">UNWORKABLE</div>
                    <div className="di-status-bar">
                      <span style={{ width: "29%", background: "#ef4444" }}></span>
                    </div>
                    <div className="di-status-number">7,842</div>
                  </div>

                  <div className="di-status-row">
                    <div className="di-status-name">COMPLETED</div>
                    <div className="di-status-bar">
                      <span style={{ width: "24%", background: "#94a3b8" }}></span>
                    </div>
                    <div className="di-status-number">16,842</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* LIST INVENTORY TABLE */}
          <section className="di-card di-table-card">
            <div className="di-card-header">
              <div>
                <h2>Inventory by List</h2>
                <p>Dialable inventory and penetration for each campaign list</p>
              </div>

              <span style={{ fontSize: "10px", color: "#8992a3" }}>{displayLists.length} Lists</span>
            </div>

            <div className="di-table-wrap">
              <table id="reportTable">
                <thead>
                  <tr>
                    <th>List ID</th>
                    <th>List Name</th>
                    <th>Campaign</th>
                    <th>Total Leads</th>
                    <th>Dialable</th>
                    <th>Worked</th>
                    <th>Never Dialed</th>
                    <th>Completed</th>
                    <th>Unworkable</th>
                    <th>Penetration</th>
                    <th>Avg Attempts</th>
                    <th>Inventory %</th>
                    <th>Health</th>
                  </tr>
                </thead>

                <tbody>
                  {displayLists.map((row: any, idx: number) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedRow(idx)}
                      style={{
                        background: selectedRow === idx ? "#faf8ff" : undefined,
                        cursor: "pointer",
                      }}
                    >
                      <td>
                        <span className="di-list-pill">{row.id || row.list_id}</span>
                      </td>
                      <td>{row.name || row.list_name}</td>
                      <td>{row.campaign || row.campaign_id}</td>
                      <td>{row.leads || row.total_leads}</td>
                      <td className={row.dClass || "di-green"}>{row.dialable}</td>
                      <td>{row.worked}</td>
                      <td>{row.never || row.neverDialed || row.never_dialed}</td>
                      <td>{row.comp || row.completed}</td>
                      <td>{row.unworkable}</td>
                      <td className={row.pClass || "di-green"}>{row.pen || row.penetration}</td>
                      <td>{row.avgAtt || row.avg_attempts}</td>
                      <td>{row.invPct || row.inventoryPct}</td>
                      <td>
                        <span className={`di-status-pill ${row.hClass || (row.health === "CRITICAL" ? "di-critical" : row.health === "WATCH" ? "di-watch" : "di-active")}`}>
                          {row.health || (parseFloat(row.invPct || row.penetration || "50") > 50 ? "HEALTHY" : "WATCH")}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="di-total-row">
                    <td colSpan={3}>TOTAL</td>
                    <td>{displayLists.reduce((acc: number, l: any) => acc + (parseInt(String(l.leads || l.total_leads || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc: number, l: any) => acc + (parseInt(String(l.dialable || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc: number, l: any) => acc + (parseInt(String(l.worked || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc: number, l: any) => acc + (parseInt(String(l.never || l.neverDialed || l.never_dialed || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc: number, l: any) => acc + (parseInt(String(l.comp || l.completed || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc: number, l: any) => acc + (parseInt(String(l.unworkable || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists[0]?.pen || "37.2%"}</td>
                    <td>{displayLists[0]?.avgAtt || "2.46"}</td>
                    <td>{displayLists[0]?.invPct || "62.8%"}</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* RUNWAY + ALERTS */}
          <section className="di-runway-grid">
            <div className="di-card">
              <div className="di-card-header">
                <div>
                  <h2>Estimated Calling Runway</h2>
                  <p>Approximate available calling capacity at the current rate</p>
                </div>
                <span className="di-green">HEALTHY</span>
              </div>

              <div className="di-runway-box">
                <div className="di-runway-number">13.0 hrs</div>
                <div className="di-runway-label">Estimated inventory remaining</div>

                <div className="di-runway-track">
                  <span></span>
                </div>

                <div className="di-runway-scale">
                  <span>0 hrs</span>
                  <span>10 hrs</span>
                  <span>20 hrs</span>
                </div>

                <div className="di-runway-note">
                  <strong>Recommendation:</strong> Current inventory provides a reasonable calling buffer. Monitor the remaining dialable count during high-volume periods and prepare another list before the available inventory approaches the minimum operating threshold.
                </div>
              </div>
            </div>

            <div className="di-card">
              <div className="di-card-header">
                <div>
                  <h2>Inventory Alerts</h2>
                  <p>Lists requiring operational attention</p>
                </div>
              </div>

              <div className="di-alert-list">
                <div className="di-alert di-alert-red">
                  <div className="di-alert-icon">!</div>
                  <div className="di-alert-text">
                    <strong>List 1006 — Critical Inventory</strong>
                    <span>Only 1,074 dialable leads remain and inventory penetration is already high.</span>
                  </div>
                </div>

                <div className="di-alert di-alert-orange">
                  <div className="di-alert-icon">!</div>
                  <div className="di-alert-text">
                    <strong>List 1004 — Watch Inventory</strong>
                    <span>Dialable inventory has fallen to 47.5%. Consider preparing additional leads.</span>
                  </div>
                </div>

                <div className="di-alert di-alert-green">
                  <div className="di-alert-icon">✓</div>
                  <div className="di-alert-text">
                    <strong>Lists 1001 &amp; 1002 — Healthy</strong>
                    <span>Both lists retain more than 70% of their inventory as dialable leads.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* INVENTORY TREND */}
          <section className="di-card di-table-card">
            <div className="di-card-header">
              <div>
                <h2>Dialable Inventory Trend</h2>
                <p>Seven-day movement of available calling inventory</p>
              </div>

              <span className="di-purple">54,286 current</span>
            </div>

            <div className="di-card-body">
              <div className="di-chart">
                <svg viewBox="0 0 900 270" preserveAspectRatio="none">
                  <line className="di-grid-line" x1="55" y1="30" x2="875" y2="30" />
                  <line className="di-grid-line" x1="55" y1="80" x2="875" y2="80" />
                  <line className="di-grid-line" x1="55" y1="130" x2="875" y2="130" />
                  <line className="di-grid-line" x1="55" y1="180" x2="875" y2="180" />
                  <line className="di-grid-line" x1="55" y1="230" x2="875" y2="230" />

                  <text className="di-axis" x="10" y="34">80K</text>
                  <text className="di-axis" x="10" y="84">60K</text>
                  <text className="di-axis" x="10" y="134">40K</text>
                  <text className="di-axis" x="10" y="184">20K</text>
                  <text className="di-axis" x="28" y="234">0</text>

                  <polygon className="di-area" points="70,62 200,78 330,94 460,112 590,130 720,150 850,166 850,230 70,230" />
                  <polyline className="di-line" points="70,62 200,78 330,94 460,112 590,130 720,150 850,166" />

                  <circle className="di-point" cx="70" cy="62" r="5" />
                  <circle className="di-point" cx="200" cy="78" r="5" />
                  <circle className="di-point" cx="330" cy="94" r="5" />
                  <circle className="di-point" cx="460" cy="112" r="5" />
                  <circle className="di-point" cx="590" cy="130" r="5" />
                  <circle className="di-point" cx="720" cy="150" r="5" />
                  <circle className="di-point" cx="850" cy="166" r="5" />

                  <text className="di-axis" x="55" y="260">Sep 01</text>
                  <text className="di-axis" x="185" y="260">Sep 02</text>
                  <text className="di-axis" x="315" y="260">Sep 03</text>
                  <text className="di-axis" x="445" y="260">Sep 04</text>
                  <text className="di-axis" x="575" y="260">Sep 05</text>
                  <text className="di-axis" x="705" y="260">Sep 06</text>
                  <text className="di-axis" x="835" y="260">Sep 07</text>
                </svg>
              </div>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="di-card">
            <div className="di-card-header">
              <div>
                <h2>Inventory Insights</h2>
                <p>Operational observations from the current dialer inventory</p>
              </div>
            </div>

            <div className="di-insights">
              <div className="di-insight">
                <div className="di-icon di-icon-green">✓</div>
                <h3>Healthy Overall Inventory</h3>
                <p>54,286 leads remain dialable, providing a substantial available pool across the selected campaigns and lists.</p>
              </div>

              <div className="di-insight">
                <div className="di-icon di-icon-purple">↘</div>
                <h3>Inventory Is Declining</h3>
                <p>Available inventory has decreased during the selected period. Continue monitoring the daily depletion rate.</p>
              </div>

              <div className="di-insight">
                <div className="di-icon di-icon-orange">!</div>
                <h3>Prepare the Next List</h3>
                <p>Lists 1004 and 1006 have lower remaining inventory. Preparing additional leads can help prevent dialing gaps.</p>
              </div>
            </div>
          </section>

          <div className="di-footer">CallZenza Reports • Dialer Inventory Report • Sep 07, 2026</div>
        </main>
      </div>

      <style jsx global>{`
        .di-root {
          font-family: Inter, Arial, sans-serif;
          background: #f4f6fa;
          color: #172033;
          min-height: 100vh;
        }

        .di-container {
          max-width: 1600px;
          margin: auto;
          padding: 26px 30px 45px;
        }

        .di-page-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .di-page-title h1 {
          font-size: 25px;
          font-weight: 850;
        }

        .di-page-title p {
          margin-top: 6px;
          color: #7a8496;
          font-size: 12px;
        }

        .di-actions {
          display: flex;
          gap: 8px;
        }

        .di-btn-white {
          background: #fff;
          color: #344054;
          border: 1px solid #dfe3eb;
          border-radius: 7px;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .di-btn-purple {
          background: #6d28d9;
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .di-btn-purple:hover {
          background: #5b21b6;
        }

        .di-filters {
          background: #fff;
          border: 1px solid #e3e7ef;
          border-radius: 12px;
          padding: 18px;
          display: grid;
          grid-template-columns: 1.3fr 1.2fr 1fr 1fr 1fr auto;
          gap: 13px;
          margin-bottom: 20px;
        }

        .di-field label {
          display: block;
          font-size: 10px;
          color: #667085;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .di-filters select,
        .di-filters input {
          width: 100%;
          height: 39px;
          border: 1px solid #d8dee8;
          border-radius: 7px;
          padding: 0 10px;
          background: #fff;
          color: #253047;
          font-size: 11px;
          outline: none;
        }

        .di-filters select:focus,
        .di-filters input:focus {
          border-color: #8b5cf6;
        }

        .di-inventory-hero {
          background: linear-gradient(110deg, #211844, #4c1d95);
          color: #fff;
          border-radius: 13px;
          padding: 23px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: 1.2fr 2fr;
          gap: 30px;
          align-items: center;
        }

        .di-hero-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .di-hero-icon {
          width: 50px;
          height: 50px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.13);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .di-hero-title h2 {
          font-size: 19px;
          font-weight: 700;
        }

        .di-hero-title p {
          margin-top: 5px;
          color: #ddd6fe;
          font-size: 10px;
        }

        .di-inventory-number {
          margin-top: 17px;
          font-size: 38px;
          font-weight: 900;
        }

        .di-inventory-caption {
          color: #ddd6fe;
          font-size: 10px;
        }

        .di-hero-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .di-hero-metric {
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 15px;
        }

        .di-hero-metric-label {
          font-size: 9px;
          color: #c4b5fd;
          text-transform: uppercase;
          font-weight: 800;
        }

        .di-hero-metric-value {
          margin-top: 7px;
          font-size: 20px;
          font-weight: 850;
        }

        .di-hero-metric-sub {
          margin-top: 4px;
          font-size: 9px;
          color: #ddd6fe;
        }

        .di-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .di-kpi {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 11px;
          padding: 17px;
          position: relative;
          overflow: hidden;
        }

        .di-kpi:after {
          content: "";
          position: absolute;
          width: 68px;
          height: 68px;
          right: -24px;
          bottom: -28px;
          border-radius: 50%;
          background: #f3e8ff;
        }

        .di-kpi-label {
          color: #7a8496;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 800;
        }

        .di-kpi-value {
          margin-top: 8px;
          font-size: 22px;
          font-weight: 850;
        }

        .di-kpi-meta {
          margin-top: 5px;
          color: #8992a3;
          font-size: 10px;
        }

        .di-green { color: #16a34a; font-weight: 800; }
        .di-purple { color: #7c3aed; font-weight: 800; }
        .di-orange { color: #d97706; font-weight: 800; }
        .di-red { color: #dc2626; font-weight: 800; }
        .di-blue { color: #2563eb; font-weight: 800; }

        .di-grid {
          display: grid;
          grid-template-columns: 1.5fr 0.9fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .di-card {
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 12px;
          overflow: hidden;
        }

        .di-card-header {
          padding: 18px 20px;
          border-bottom: 1px solid #edf0f4;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .di-card-header h2 {
          font-size: 14px;
          font-weight: 700;
        }

        .di-card-header p {
          margin-top: 4px;
          color: #8992a3;
          font-size: 10px;
        }

        .di-card-body {
          padding: 20px;
        }

        .di-gauge-area {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 25px;
          align-items: center;
        }

        .di-gauge {
          width: 210px;
          height: 210px;
          border-radius: 50%;
          background: conic-gradient(#22c55e 0deg 278deg, #f59e0b 278deg 326deg, #e5e7eb 326deg 360deg);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .di-gauge:after {
          content: "";
          width: 142px;
          height: 142px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
        }

        .di-gauge-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .di-gauge-value {
          font-size: 30px;
          font-weight: 900;
        }

        .di-gauge-label {
          margin-top: 4px;
          color: #8992a3;
          font-size: 9px;
        }

        .di-inventory-bars {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .di-inventory-row {
          display: grid;
          grid-template-columns: 120px 1fr 65px;
          gap: 12px;
          align-items: center;
        }

        .di-inventory-label {
          font-size: 10px;
          font-weight: 800;
        }

        .di-progress {
          height: 9px;
          background: #edf0f4;
          border-radius: 20px;
          overflow: hidden;
        }

        .di-progress span {
          display: block;
          height: 100%;
          border-radius: 20px;
        }

        .di-inventory-value {
          text-align: right;
          font-size: 10px;
          font-weight: 850;
        }

        .di-status-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .di-status-row {
          display: grid;
          grid-template-columns: 110px 1fr 65px;
          gap: 12px;
          align-items: center;
        }

        .di-status-name {
          font-size: 10px;
          font-weight: 800;
        }

        .di-status-bar {
          height: 9px;
          background: #edf0f4;
          border-radius: 20px;
          overflow: hidden;
        }

        .di-status-bar span {
          display: block;
          height: 100%;
          border-radius: 20px;
        }

        .di-status-number {
          text-align: right;
          font-size: 10px;
          font-weight: 850;
        }

        .di-table-card {
          margin-bottom: 20px;
        }

        .di-table-wrap {
          overflow: auto;
        }

        .di-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1350px;
        }

        .di-table-wrap thead th {
          background: #f8fafc;
          color: #667085;
          text-align: left;
          padding: 12px 10px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 1px solid #e5e8ef;
        }

        .di-table-wrap tbody td {
          padding: 13px 10px;
          font-size: 10px;
          border-bottom: 1px solid #edf0f4;
          white-space: nowrap;
        }

        .di-table-wrap tbody tr:hover {
          background: #faf8ff;
        }

        .di-list-pill {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 5px;
          background: #f3e8ff;
          color: #6d28d9;
          font-weight: 900;
          font-size: 9px;
        }

        .di-status-pill {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 900;
        }

        .di-active { background: #dcfce7; color: #15803d; }
        .di-watch { background: #fef3c7; color: #b45309; }
        .di-critical { background: #fee2e2; color: #b91c1c; }

        .di-total-row {
          background: #f8f7fb;
          font-weight: 900;
        }

        .di-runway-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .di-runway-box {
          padding: 20px;
        }

        .di-runway-number {
          font-size: 35px;
          font-weight: 900;
          color: #6d28d9;
        }

        .di-runway-label {
          margin-top: 5px;
          font-size: 10px;
          color: #8992a3;
        }

        .di-runway-track {
          height: 13px;
          background: #edf0f4;
          border-radius: 20px;
          overflow: hidden;
          margin-top: 20px;
        }

        .di-runway-track span {
          display: block;
          height: 100%;
          width: 68%;
          background: linear-gradient(90deg, #22c55e, #84cc16, #f59e0b);
          border-radius: 20px;
        }

        .di-runway-scale {
          display: flex;
          justify-content: space-between;
          margin-top: 7px;
          font-size: 9px;
          color: #8992a3;
        }

        .di-runway-note {
          margin-top: 17px;
          background: #faf8ff;
          border: 1px solid #eee8ff;
          border-radius: 9px;
          padding: 12px;
          font-size: 10px;
          color: #667085;
          line-height: 1.6;
        }

        .di-alert-list {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .di-alert {
          border-radius: 9px;
          padding: 12px 13px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .di-alert-icon {
          width: 27px;
          height: 27px;
          flex: none;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .di-alert-text strong {
          display: block;
          font-size: 10px;
          margin-bottom: 4px;
        }

        .di-alert-text span {
          display: block;
          font-size: 9px;
          line-height: 1.5;
          color: #667085;
        }

        .di-alert-green { background: #f0fdf4; }
        .di-alert-green .di-alert-icon { background: #dcfce7; color: #15803d; }

        .di-alert-orange { background: #fffbeb; }
        .di-alert-orange .di-alert-icon { background: #fef3c7; color: #b45309; }

        .di-alert-red { background: #fef2f2; }
        .di-alert-red .di-alert-icon { background: #fee2e2; color: #b91c1c; }

        .di-chart {
          height: 270px;
        }

        .di-chart svg {
          width: 100%;
          height: 100%;
        }

        .di-grid-line {
          stroke: #edf0f4;
          stroke-width: 1;
        }

        .di-axis {
          fill: #98a2b3;
          font-size: 9px;
        }

        .di-line {
          fill: none;
          stroke: #7c3aed;
          stroke-width: 3;
        }

        .di-area {
          fill: #7c3aed;
          opacity: 0.08;
        }

        .di-point {
          fill: #fff;
          stroke: #7c3aed;
          stroke-width: 3;
        }

        .di-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 20px;
        }

        .di-insight {
          border: 1px solid #e6e9ef;
          border-radius: 10px;
          padding: 15px;
        }

        .di-icon {
          width: 31px;
          height: 31px;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
          font-weight: 900;
        }

        .di-icon-purple { background: #f3e8ff; color: #7c3aed; }
        .di-icon-green { background: #dcfce7; color: #15803d; }
        .di-icon-orange { background: #fef3c7; color: #b45309; }

        .di-insight h3 {
          font-size: 11px;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .di-insight p {
          color: #667085;
          font-size: 10px;
          line-height: 1.6;
        }

        .di-footer {
          text-align: right;
          color: #98a2b3;
          font-size: 9px;
          padding-top: 15px;
        }

        @media (max-width: 1150px) {
          .di-filters {
            grid-template-columns: repeat(3, 1fr);
          }
          .di-kpis {
            grid-template-columns: repeat(3, 1fr);
          }
          .di-inventory-hero {
            grid-template-columns: 1fr;
          }
          .di-grid,
          .di-runway-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 750px) {
          .di-container {
            padding: 18px;
          }
          .di-page-title {
            flex-direction: column;
            gap: 14px;
          }
          .di-filters {
            grid-template-columns: 1fr;
          }
          .di-kpis {
            grid-template-columns: 1fr 1fr;
          }
          .di-hero-metrics {
            grid-template-columns: 1fr 1fr;
          }
          .di-gauge-area {
            grid-template-columns: 1fr;
            justify-items: center;
          }
          .di-insights {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
}
