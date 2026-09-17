"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ListsPassReport() {
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedList, setSelectedList] = useState("All Lists");
  const [selectedPassRange, setSelectedPassRange] = useState("Pass 1 - 5");
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-07");
  const [passRows, setPassRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveReportData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("lists-pass", {
        from_date: fromDate,
        to_date: toDate,
        campaign_id: selectedCampaign,
      });
      if (res && res.success) {
        if (res.passes && res.passes.length > 0) {
          setPassRows(res.passes);
        }
        if (res.kpis) {
          setKpis(res.kpis);
        }
      }
    } catch (err) {
      console.error("Failed loading report for lists-pass:", err);
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

  const displayPasses = passRows;

  const totalLeads = displayPasses.reduce((acc, p) => acc + (parseInt(String(p.leads || 0).replace(/,/g, "")) || 0), 0);
  const totalContacts = displayPasses.reduce((acc, p) => acc + (parseInt(String(p.contacts || 0).replace(/,/g, "")) || 0), 0);
  const totalSales = displayPasses.reduce((acc, p) => acc + (parseInt(String(p.sales || 0).replace(/,/g, "")) || 0), 0);
  const totalCompleted = displayPasses.reduce((acc, p) => acc + (parseInt(String(p.comp || p.completed || 0).replace(/,/g, "")) || 0), 0);
  const totalCallbacks = displayPasses.reduce((acc, p) => acc + (parseInt(String(p.cb || p.callbacks || 0).replace(/,/g, "")) || 0), 0);
  const totalDNC = displayPasses.reduce((acc, p) => acc + (parseInt(String(p.dnc || 0).replace(/,/g, "")) || 0), 0);
  const totalUnworkable = displayPasses.reduce((acc, p) => acc + (parseInt(String(p.unworkable || 0).replace(/,/g, "")) || 0), 0);
  const totalContactRate = totalLeads > 0 ? ((totalContacts / totalLeads) * 100).toFixed(1) : "0.0";
  const totalSaleRate = totalContacts > 0 ? ((totalSales / totalContacts) * 100).toFixed(1) : "0.0";

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
      setContainerOpacity(1);
      setRefreshBtnText("↻ Refresh");
      showNotification("Lists Pass Report refreshed successfully.");
    });
  };

  const exportCSV = () => {
    const headers = [
      "Pass",
      "Leads",
      "Contacts",
      "Contact Rate",
      "Sales",
      "Sale Rate",
      "Customer Contact",
      "DNC",
      "Callbacks",
      "Unworkable",
      "Completed",
    ];

    const dataRows = displayPasses.map((r) => [
      r.pass || "",
      r.leads || "0",
      r.contacts || "0",
      r.cRate || "0.0%",
      r.sales || "0",
      r.sRate || "0.0%",
      r.cc || "0",
      r.dnc || "0",
      r.cb || "0",
      r.unworkable || "0",
      r.comp || "0",
    ]);

    const rows = [headers, ...dataRows];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "CallZenza_Lists_Pass_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="lp-root">
        <main className="lp-container" style={{ opacity: containerOpacity, transition: "opacity 0.3s ease" }}>
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

          {/* TITLE */}
          <section className="lp-page-title">
            <div>
              <h1>Lists Pass Report</h1>
              <p>Analyze lead performance across repeated passes through outbound lists.</p>
            </div>

            <div className="lp-actions">
              <button className="lp-btn-light" onClick={() => window.print()}>
                Print
              </button>
              <button className="lp-btn-light" onClick={exportCSV}>
                Export CSV
              </button>
              <button className="lp-btn-primary" onClick={refreshReport}>
                {refreshBtnText}
              </button>
            </div>
          </section>

          {/* FILTERS */}
          <section className="lp-filters">
            <div className="lp-field">
              <label>Campaign</label>
              <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
                <option>All Campaigns</option>
                <option>Sales Campaign</option>
                <option>Renewal Campaign</option>
                <option>Demo Campaign</option>
              </select>
            </div>

            <div className="lp-field">
              <label>List</label>
              <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
                <option>All Lists</option>
                <option>List 1001 - Main Leads</option>
                <option>List 1002 - Premium Leads</option>
                <option>List 1003 - Follow Up</option>
                <option>List 1004 - Recycle</option>
              </select>
            </div>

            <div className="lp-field">
              <label>Pass Range</label>
              <select value={selectedPassRange} onChange={(e) => setSelectedPassRange(e.target.value)}>
                <option>Pass 1 - 5</option>
                <option>Pass 1 - 3</option>
                <option>Pass 2 - 5</option>
              </select>
            </div>

            <div className="lp-field">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="lp-field">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <button className="lp-btn-primary lp-filter-btn" onClick={applyFilters} disabled={isApplyDisabled}>
              {applyBtnText}
            </button>
          </section>

          {/* KPI */}
          <section className="lp-kpis">
            <div className="lp-kpi">
              <div className="lp-kpi-label">Total Leads</div>
              <div className="lp-kpi-value">{kpis?.calls_attempted || "48,620"}</div>
              <div className="lp-kpi-meta">
                <span className="lp-up">Live</span> in database
              </div>
            </div>

            <div className="lp-kpi">
              <div className="lp-kpi-label">Total Contacts</div>
              <div className="lp-kpi-value">{kpis?.calls_connected || "17,842"}</div>
              <div className="lp-kpi-meta">
                <span className="lp-up">{kpis?.connect_rate || "36.7%"}</span> contact rate
              </div>
            </div>

            <div className="lp-kpi">
              <div className="lp-kpi-label">Total Sales</div>
              <div className="lp-kpi-value">{kpis?.human_answered || "2,184"}</div>
              <div className="lp-kpi-meta">
                <span className="lp-up">Conversions</span> recorded
              </div>
            </div>

            <div className="lp-kpi">
              <div className="lp-kpi-label">Callbacks</div>
              <div className="lp-kpi-value">{displayPasses.reduce((acc, p) => acc + (parseInt(String(p.cb || p.callbacks || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "4,726"}</div>
              <div className="lp-kpi-meta">
                <span className="lp-up">Scheduled</span> callbacks
              </div>
            </div>

            <div className="lp-kpi">
              <div className="lp-kpi-label">Completed Leads</div>
              <div className="lp-kpi-value">{displayPasses.reduce((acc, p) => acc + (parseInt(String(p.comp || p.completed || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "41,928"}</div>
              <div className="lp-kpi-meta">
                <span className="lp-up">Workable</span> leads
              </div>
            </div>
          </section>

          {/* MAIN ANALYTICS */}
          <section className="lp-grid">
            {/* PASS CHART */}
            <div className="lp-card">
              <div className="lp-card-head">
                <div>
                  <h2>Pass-by-Pass Performance</h2>
                  <span>Lead outcome volume by recycling pass</span>
                </div>
                <span>Pass 1 → Pass 5</span>
              </div>

              <div className="lp-pass-chart">
                <div className="lp-pass-column">
                  <div className="lp-bars">
                    <div className="lp-bar lp-contact" style={{ height: "91%" }}></div>
                    <div className="lp-bar lp-sale" style={{ height: "62%" }}></div>
                    <div className="lp-bar lp-callback" style={{ height: "75%" }}></div>
                  </div>
                  <div className="lp-pass-number">PASS 1</div>
                  <div className="lp-pass-total">14,820 leads</div>
                </div>

                <div className="lp-pass-column">
                  <div className="lp-bars">
                    <div className="lp-bar lp-contact" style={{ height: "73%" }}></div>
                    <div className="lp-bar lp-sale" style={{ height: "45%" }}></div>
                    <div className="lp-bar lp-callback" style={{ height: "60%" }}></div>
                  </div>
                  <div className="lp-pass-number">PASS 2</div>
                  <div className="lp-pass-total">11,260 leads</div>
                </div>

                <div className="lp-pass-column">
                  <div className="lp-bars">
                    <div className="lp-bar lp-contact" style={{ height: "55%" }}></div>
                    <div className="lp-bar lp-sale" style={{ height: "31%" }}></div>
                    <div className="lp-bar lp-callback" style={{ height: "43%" }}></div>
                  </div>
                  <div className="lp-pass-number">PASS 3</div>
                  <div className="lp-pass-total">9,480 leads</div>
                </div>

                <div className="lp-pass-column">
                  <div className="lp-bars">
                    <div className="lp-bar lp-contact" style={{ height: "39%" }}></div>
                    <div className="lp-bar lp-sale" style={{ height: "20%" }}></div>
                    <div className="lp-bar lp-callback" style={{ height: "29%" }}></div>
                  </div>
                  <div className="lp-pass-number">PASS 4</div>
                  <div className="lp-pass-total">7,320 leads</div>
                </div>

                <div className="lp-pass-column">
                  <div className="lp-bars">
                    <div className="lp-bar lp-contact" style={{ height: "25%" }}></div>
                    <div className="lp-bar lp-sale" style={{ height: "12%" }}></div>
                    <div className="lp-bar lp-callback" style={{ height: "19%" }}></div>
                  </div>
                  <div className="lp-pass-number">PASS 5</div>
                  <div className="lp-pass-total">5,740 leads</div>
                </div>
              </div>

              <div className="lp-legend">
                <div className="lp-legend-item">
                  <span className="lp-legend-dot lp-purple"></span>
                  Contacts
                </div>

                <div className="lp-legend-item">
                  <span className="lp-legend-dot lp-green"></span>
                  Sales
                </div>

                <div className="lp-legend-item">
                  <span className="lp-legend-dot lp-blue"></span>
                  Callbacks
                </div>
              </div>
            </div>

            {/* RATE ANALYSIS */}
            <div className="lp-card">
              <div className="lp-card-head">
                <div>
                  <h2>Pass Rate Analysis</h2>
                  <span>Outcome rate by pass</span>
                </div>
              </div>

              <div className="lp-rate-list">
                <div className="lp-rate-row">
                  <div className="lp-rate-label">Pass 1</div>
                  <div className="lp-progress">
                    <span className="lp-purple" style={{ width: "78%" }}></span>
                  </div>
                  <div className="lp-rate-value">78%</div>
                </div>

                <div className="lp-rate-row">
                  <div className="lp-rate-label">Pass 2</div>
                  <div className="lp-progress">
                    <span className="lp-purple" style={{ width: "63%" }}></span>
                  </div>
                  <div className="lp-rate-value">63%</div>
                </div>

                <div className="lp-rate-row">
                  <div className="lp-rate-label">Pass 3</div>
                  <div className="lp-progress">
                    <span className="lp-purple" style={{ width: "48%" }}></span>
                  </div>
                  <div className="lp-rate-value">48%</div>
                </div>

                <div className="lp-rate-row">
                  <div className="lp-rate-label">Pass 4</div>
                  <div className="lp-progress">
                    <span className="lp-orange" style={{ width: "34%" }}></span>
                  </div>
                  <div className="lp-rate-value">34%</div>
                </div>

                <div className="lp-rate-row">
                  <div className="lp-rate-label">Pass 5</div>
                  <div className="lp-progress">
                    <span className="lp-red" style={{ width: "21%" }}></span>
                  </div>
                  <div className="lp-rate-value">21%</div>
                </div>
              </div>

              <div style={{ marginTop: "27px", padding: "15px", background: "#faf8ff", borderRadius: "9px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#6d28d9" }}>PASS EFFICIENCY</div>
                <div style={{ fontSize: "25px", fontWeight: 800, marginTop: "5px" }}>-57%</div>
                <div style={{ fontSize: "10px", color: "#667085", marginTop: "4px" }}>Reduction from Pass 1 to Pass 5</div>
              </div>
            </div>
          </section>

          {/* STATUS BREAKDOWN */}
          <section className="lp-card lp-table-card">
            <div className="lp-card-head">
              <div>
                <h2>Status Breakdown by Pass</h2>
                <span>Detailed lead outcomes across every recycling pass</span>
              </div>
              <span>48,620 total leads</span>
            </div>

            <div className="lp-table-wrap">
              <table id="reportTable">
                <thead>
                  <tr>
                    <th>Pass</th>
                    <th>Leads</th>
                    <th>Contacts</th>
                    <th>Contact Rate</th>
                    <th>Sales</th>
                    <th>Sale Rate</th>
                    <th>Customer Contact</th>
                    <th>DNC</th>
                    <th>Callbacks</th>
                    <th>Unworkable</th>
                    <th>Completed</th>
                  </tr>
                </thead>

                <tbody>
                  {displayPasses.map((row, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedRow(idx)}
                      style={{
                        background: selectedRow === idx ? "#faf8ff" : undefined,
                        cursor: "pointer",
                      }}
                    >
                      <td>
                        <span className="lp-pass-badge">{row.pass || row.passNum}</span>
                      </td>
                      <td>{row.leads}</td>
                      <td>{row.contacts}</td>
                      <td className={row.cClass || "lp-good"}>{row.cRate || row.contactRate}</td>
                      <td>{row.sales}</td>
                      <td className={row.sClass || "lp-good"}>{row.sRate || row.saleRate}</td>
                      <td>{row.cc || row.custContact}</td>
                      <td>{row.dnc}</td>
                      <td>{row.cb || row.callbacks}</td>
                      <td>{row.unworkable}</td>
                      <td>{row.comp || row.completed}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 800, background: "#fafafa" }}>
                    <td>TOTAL</td>
                    <td>{totalLeads.toLocaleString()}</td>
                    <td>{totalContacts.toLocaleString()}</td>
                    <td>{totalContactRate}%</td>
                    <td>{totalSales.toLocaleString()}</td>
                    <td>{totalSaleRate}%</td>
                    <td>{displayPasses.reduce((acc, p) => acc + (parseInt(String(p.cc || p.custContact || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{totalDNC.toLocaleString()}</td>
                    <td>{totalCallbacks.toLocaleString()}</td>
                    <td>{totalUnworkable.toLocaleString()}</td>
                    <td>{totalCompleted.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* TREND + DISTRIBUTION */}
          <section className="lp-grid">
            <div className="lp-card">
              <div className="lp-card-head">
                <div>
                  <h2>Contact &amp; Sales Decay</h2>
                  <span>Performance trend across list passes</span>
                </div>

                <div className="lp-legend">
                  <div className="lp-legend-item">
                    <span className="lp-legend-dot lp-purple"></span>
                    Contact Rate
                  </div>
                  <div className="lp-legend-item">
                    <span className="lp-legend-dot lp-green"></span>
                    Sale Rate
                  </div>
                </div>
              </div>

              <div className="lp-trend-area">
                <svg viewBox="0 0 650 240" preserveAspectRatio="none">
                  <line className="lp-grid-line" x1="50" y1="30" x2="630" y2="30" />
                  <line className="lp-grid-line" x1="50" y1="75" x2="630" y2="75" />
                  <line className="lp-grid-line" x1="50" y1="120" x2="630" y2="120" />
                  <line className="lp-grid-line" x1="50" y1="165" x2="630" y2="165" />
                  <line className="lp-grid-line" x1="50" y1="210" x2="630" y2="210" />

                  <text className="lp-axis-label" x="10" y="34">60%</text>
                  <text className="lp-axis-label" x="10" y="79">45%</text>
                  <text className="lp-axis-label" x="10" y="124">30%</text>
                  <text className="lp-axis-label" x="10" y="169">15%</text>
                  <text className="lp-axis-label" x="25" y="214">0%</text>

                  <polyline className="lp-line-contact" points="70,55 205,82 340,118 475,150 610,180" />
                  <polyline className="lp-line-sale" points="70,110 205,128 340,153 475,177 610,196" />

                  <circle className="lp-point" cx="70" cy="55" r="5" stroke="#7c3aed" />
                  <circle className="lp-point" cx="205" cy="82" r="5" stroke="#7c3aed" />
                  <circle className="lp-point" cx="340" cy="118" r="5" stroke="#7c3aed" />
                  <circle className="lp-point" cx="475" cy="150" r="5" stroke="#7c3aed" />
                  <circle className="lp-point" cx="610" cy="180" r="5" stroke="#7c3aed" />

                  <circle className="lp-point" cx="70" cy="110" r="5" stroke="#22c55e" />
                  <circle className="lp-point" cx="205" cy="128" r="5" stroke="#22c55e" />
                  <circle className="lp-point" cx="340" cy="153" r="5" stroke="#22c55e" />
                  <circle className="lp-point" cx="475" cy="177" r="5" stroke="#22c55e" />
                  <circle className="lp-point" cx="610" cy="196" r="5" stroke="#22c55e" />

                  <text className="lp-axis-label" x="60" y="232">Pass 1</text>
                  <text className="lp-axis-label" x="195" y="232">Pass 2</text>
                  <text className="lp-axis-label" x="330" y="232">Pass 3</text>
                  <text className="lp-axis-label" x="465" y="232">Pass 4</text>
                  <text className="lp-axis-label" x="600" y="232">Pass 5</text>
                </svg>
              </div>
            </div>

            <div className="lp-card">
              <div className="lp-card-head">
                <div>
                  <h2>Lead Outcome Mix</h2>
                  <span>Current distribution</span>
                </div>
              </div>

              <div className="lp-rate-list">
                <div className="lp-rate-row">
                  <div className="lp-rate-label">Completed</div>
                  <div className="lp-progress">
                    <span className="lp-green" style={{ width: `${totalLeads > 0 ? ((totalCompleted / totalLeads) * 100).toFixed(1) : 0}%` }}></span>
                  </div>
                  <div className="lp-rate-value">{totalLeads > 0 ? ((totalCompleted / totalLeads) * 100).toFixed(1) : "0.0"}%</div>
                </div>

                <div className="lp-rate-row">
                  <div className="lp-rate-label">Contacts</div>
                  <div className="lp-progress">
                    <span className="lp-purple" style={{ width: `${totalContactRate}%` }}></span>
                  </div>
                  <div className="lp-rate-value">{totalContactRate}%</div>
                </div>

                <div className="lp-rate-row">
                  <div className="lp-rate-label">Callbacks</div>
                  <div className="lp-progress">
                    <span className="lp-blue" style={{ width: `${totalLeads > 0 ? ((totalCallbacks / totalLeads) * 100).toFixed(1) : 0}%` }}></span>
                  </div>
                  <div className="lp-rate-value">{totalLeads > 0 ? ((totalCallbacks / totalLeads) * 100).toFixed(1) : "0.0"}%</div>
                </div>

                <div className="lp-rate-row">
                  <div className="lp-rate-label">DNC</div>
                  <div className="lp-progress">
                    <span className="lp-orange" style={{ width: `${totalLeads > 0 ? ((totalDNC / totalLeads) * 100).toFixed(1) : 0}%` }}></span>
                  </div>
                  <div className="lp-rate-value">{totalLeads > 0 ? ((totalDNC / totalLeads) * 100).toFixed(1) : "0.0"}%</div>
                </div>

                <div className="lp-rate-row">
                  <div className="lp-rate-label">Unworkable</div>
                  <div className="lp-progress">
                    <span className="lp-red" style={{ width: `${totalLeads > 0 ? ((totalUnworkable / totalLeads) * 100).toFixed(1) : 0}%` }}></span>
                  </div>
                  <div className="lp-rate-value">{totalLeads > 0 ? ((totalUnworkable / totalLeads) * 100).toFixed(1) : "0.0"}%</div>
                </div>
              </div>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="lp-card">
            <div className="lp-card-head">
              <div>
                <h2>Pass Performance Insights</h2>
                <span>Automated observations from the current report</span>
              </div>
            </div>

            <div className="lp-insights">
              <div className="lp-insight">
                <div className="lp-icon lp-icon-purple">↘</div>
                <div className="lp-insight-title">Contact Rate Declining</div>
                <div className="lp-insight-text">
                  Contact rate falls from 60.3% in Pass 1 to 20.0% in Pass 5, indicating reduced value from repeated dialing.
                </div>
              </div>

              <div className="lp-insight">
                <div className="lp-icon lp-icon-green">✓</div>
                <div className="lp-insight-title">Strong First-Pass Sales</div>
                <div className="lp-insight-text">
                  Pass 1 generates the highest sales volume and conversion, making fresh leads the strongest source of opportunities.
                </div>
              </div>

              <div className="lp-insight">
                <div className="lp-icon lp-icon-orange">!</div>
                <div className="lp-insight-title">Watch Pass 4+</div>
                <div className="lp-insight-text">
                  Pass 4 and Pass 5 show significantly lower contact and sale rates while unworkable leads continue to increase.
                </div>
              </div>
            </div>
          </section>

          <div className="lp-footer">CallZenza Reports • Lists Pass Report • Generated Sep 07, 2026</div>
        </main>
      </div>

      <style jsx global>{`
        .lp-root {
          font-family: Inter, Arial, sans-serif;
          background: #f5f7fb;
          color: #172033;
          min-height: 100vh;
        }

        .lp-container {
          padding: 25px 30px 45px;
          max-width: 1600px;
          margin: auto;
        }

        .lp-page-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .lp-page-title h1 {
          font-size: 26px;
          margin-bottom: 5px;
          font-weight: 800;
        }

        .lp-page-title p {
          color: #697386;
          font-size: 13px;
        }

        .lp-actions {
          display: flex;
          gap: 9px;
        }

        .lp-btn-light {
          background: #fff;
          border: 1px solid #dce1ea;
          color: #344054;
          border-radius: 7px;
          padding: 10px 15px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .lp-btn-primary {
          background: #6d28d9;
          color: white;
          border: none;
          border-radius: 7px;
          padding: 10px 15px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .lp-filters {
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 12px;
          padding: 18px;
          display: grid;
          grid-template-columns: 1.2fr 1.2fr 1fr 1fr 1fr auto;
          gap: 13px;
          align-items: end;
          margin-bottom: 22px;
        }

        .lp-field label {
          display: block;
          font-size: 11px;
          color: #667085;
          font-weight: 700;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .lp-filters select,
        .lp-filters input {
          width: 100%;
          height: 39px;
          border: 1px solid #d9dee8;
          border-radius: 7px;
          padding: 0 11px;
          background: #fff;
          color: #253047;
          font-size: 12px;
          outline: none;
        }

        .lp-filters select:focus,
        .lp-filters input:focus {
          border-color: #8b5cf6;
        }

        .lp-filter-btn {
          height: 39px;
        }

        .lp-kpis {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
          margin-bottom: 22px;
        }

        .lp-kpi {
          background: #fff;
          border: 1px solid #e6e9f0;
          border-radius: 12px;
          padding: 18px;
          position: relative;
          overflow: hidden;
        }

        .lp-kpi:after {
          content: "";
          position: absolute;
          right: -25px;
          bottom: -30px;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #f3e8ff;
        }

        .lp-kpi-label {
          color: #697386;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 9px;
        }

        .lp-kpi-value {
          font-size: 25px;
          font-weight: 800;
        }

        .lp-kpi-meta {
          margin-top: 7px;
          font-size: 11px;
          color: #667085;
        }

        .lp-up {
          color: #16a34a;
          font-weight: 700;
        }

        .lp-down {
          color: #dc2626;
          font-weight: 700;
        }

        .lp-grid {
          display: grid;
          grid-template-columns: 1.65fr 1fr;
          gap: 18px;
          margin-bottom: 20px;
        }

        .lp-card {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 12px;
          padding: 20px;
        }

        .lp-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .lp-card-head h2 {
          font-size: 15px;
          font-weight: 700;
        }

        .lp-card-head span {
          font-size: 11px;
          color: #7a8497;
        }

        .lp-pass-chart {
          display: flex;
          gap: 15px;
          align-items: flex-end;
          height: 270px;
          padding: 12px 8px 0;
          border-bottom: 1px solid #e8ebf1;
        }

        .lp-pass-column {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          position: relative;
        }

        .lp-bars {
          width: 100%;
          max-width: 80px;
          height: 210px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
        }

        .lp-bar {
          flex: 1;
          border-radius: 5px 5px 0 0;
          min-height: 4px;
          transition: 0.2s;
        }

        .lp-bar:hover {
          opacity: 0.75;
        }

        .lp-bar.lp-contact { background: #7c3aed; }
        .lp-bar.lp-sale { background: #22c55e; }
        .lp-bar.lp-callback { background: #3b82f6; }

        .lp-pass-number {
          margin-top: 9px;
          font-weight: 800;
          font-size: 12px;
        }

        .lp-pass-total {
          margin-top: 4px;
          color: #98a2b3;
          font-size: 10px;
        }

        .lp-legend {
          display: flex;
          gap: 18px;
          margin-top: 16px;
          font-size: 11px;
          color: #667085;
        }

        .lp-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lp-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }

        .lp-rate-list {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .lp-rate-row {
          display: grid;
          grid-template-columns: 82px 1fr 52px;
          align-items: center;
          gap: 10px;
        }

        .lp-rate-label {
          font-size: 11px;
          font-weight: 700;
        }

        .lp-progress {
          height: 9px;
          background: #eef1f5;
          border-radius: 10px;
          overflow: hidden;
        }

        .lp-progress span {
          display: block;
          height: 100%;
          border-radius: 10px;
        }

        .lp-rate-value {
          font-size: 11px;
          text-align: right;
          font-weight: 800;
        }

        .lp-purple { background: #7c3aed; }
        .lp-green { background: #16a34a; }
        .lp-blue { background: #2563eb; }
        .lp-orange { background: #f59e0b; }
        .lp-red { background: #ef4444; }

        .lp-table-card {
          margin-bottom: 20px;
        }

        .lp-table-wrap {
          overflow: auto;
        }

        .lp-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        .lp-table-wrap thead th {
          background: #f8fafc;
          color: #667085;
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 12px 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        .lp-table-wrap tbody td {
          padding: 13px 10px;
          font-size: 11px;
          border-bottom: 1px solid #edf0f4;
          white-space: nowrap;
        }

        .lp-table-wrap tbody tr:hover {
          background: #faf8ff;
        }

        .lp-pass-badge {
          padding: 5px 8px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 800;
          background: #f3e8ff;
          color: #6d28d9;
        }

        .lp-good { color: #15803d; font-weight: 800; }
        .lp-warning { color: #b45309; font-weight: 800; }
        .lp-bad { color: #dc2626; font-weight: 800; }

        .lp-trend-area {
          height: 260px;
          position: relative;
          padding: 10px 5px;
        }

        .lp-grid-line {
          stroke: #e8ebf1;
          stroke-width: 1;
        }

        .lp-axis-label {
          fill: #98a2b3;
          font-size: 10px;
        }

        .lp-line-contact {
          fill: none;
          stroke: #7c3aed;
          stroke-width: 3;
        }

        .lp-line-sale {
          fill: none;
          stroke: #22c55e;
          stroke-width: 3;
        }

        .lp-point {
          fill: #fff;
          stroke-width: 3;
        }

        .lp-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .lp-insight {
          padding: 16px;
          border-radius: 10px;
          border: 1px solid #e7eaf0;
          background: #fafbfc;
        }

        .lp-insight-title {
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .lp-insight-text {
          color: #667085;
          font-size: 11px;
          line-height: 1.6;
        }

        .lp-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          font-weight: 900;
        }

        .lp-icon-purple {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .lp-icon-green {
          background: #dcfce7;
          color: #15803d;
        }

        .lp-icon-orange {
          background: #fef3c7;
          color: #b45309;
        }

        .lp-footer {
          text-align: right;
          color: #98a2b3;
          font-size: 10px;
          padding-top: 15px;
        }

        @media (max-width: 1100px) {
          .lp-filters {
            grid-template-columns: repeat(3, 1fr);
          }
          .lp-kpis {
            grid-template-columns: repeat(3, 1fr);
          }
          .lp-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .lp-container {
            padding: 18px;
          }
          .lp-page-title {
            flex-direction: column;
            gap: 15px;
          }
          .lp-filters {
            grid-template-columns: 1fr;
          }
          .lp-kpis {
            grid-template-columns: 1fr 1fr;
          }
          .lp-insights {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
}
