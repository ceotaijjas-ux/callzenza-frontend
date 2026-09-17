"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CampaignStatusListReport() {
  const [selectedCampaign, setSelectedCampaign] = useState("OUTBOUND_SALES");
  const [selectedListId, setSelectedListId] = useState("All List IDs");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-07");
  const [listRows, setListRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveReportData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("campaign-status-list", {
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
      console.error("Failed loading report for campaign-status-list:", err);
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
      setContainerOpacity(1);
      setRefreshBtnText("↻ Refresh");
      showNotification("Campaign Status List Report refreshed successfully.");
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
      "Avg Handle",
      "Contact Rate",
      "Status",
    ];

    const dataRows = displayLists.map((row) => [
      row.id || "",
      row.name || "",
      row.leads || "0",
      row.sale || "0",
      row.contact || "0",
      row.cb || "0",
      row.noAns || "0",
      row.busy || "0",
      row.dnc || "0",
      row.unworkable || "0",
      row.calls || "0",
      row.dur || "0h",
      row.handle || "0h",
      row.avgH || "0m",
      row.rate || "0.0%",
      row.status || "ACTIVE",
    ]);

    const rows = [headers, ...dataRows];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "CallZenza_Campaign_Status_List_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="csl-root">
        <main className="csl-container" style={{ opacity: containerOpacity, transition: "opacity 0.3s ease" }}>
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
          <section className="csl-page-title">
            <div>
              <h1>Campaign Status List Report</h1>
              <p>Status outcomes, call effort and handling performance broken down by List ID.</p>
            </div>

            <div className="csl-actions">
              <button className="csl-btn-white" onClick={() => window.print()}>
                Print
              </button>
              <button className="csl-btn-white" onClick={exportCSV}>
                Export CSV
              </button>
              <button className="csl-btn-purple" onClick={refreshReport}>
                {refreshBtnText}
              </button>
            </div>
          </section>

          {/* FILTERS */}
          <section className="csl-filters">
            <div className="csl-field">
              <label>Campaign</label>
              <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
                <option>OUTBOUND_SALES</option>
                <option>RENEWAL_2026</option>
                <option>DEMO_CAMPAIGN</option>
                <option>ENTERPRISE_OUTBOUND</option>
              </select>
            </div>

            <div className="csl-field">
              <label>List ID</label>
              <select value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)}>
                <option>All List IDs</option>
                <option>1001</option>
                <option>1002</option>
                <option>1003</option>
                <option>1004</option>
                <option>1005</option>
                <option>1006</option>
              </select>
            </div>

            <div className="csl-field">
              <label>Status</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
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

            <div className="csl-field">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="csl-field">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <button className="csl-btn-purple" onClick={applyFilters} disabled={isApplyDisabled}>
              {applyBtnText}
            </button>
          </section>

          {/* CAMPAIGN BANNER */}
          <section className="csl-campaign-banner">
            <div className="csl-campaign-info">
              <div className="csl-campaign-icon">◉</div>
              <div>
                <div className="csl-campaign-name">{selectedCampaign}</div>
                <div className="csl-campaign-sub">Campaign Status List Analysis • Sep 01 – Sep 07, 2026</div>
              </div>
            </div>

            <div className="csl-campaign-meta">
              <div className="csl-meta-item">
                <div className="csl-meta-label">Lists</div>
                <div className="csl-meta-value">6</div>
              </div>

              <div className="csl-meta-item">
                <div className="csl-meta-label">Leads</div>
                <div className="csl-meta-value">86.4K</div>
              </div>

              <div className="csl-meta-item">
                <div className="csl-meta-label">Statuses</div>
                <div className="csl-meta-value">8</div>
              </div>
            </div>
          </section>

          {/* KPIs */}
          <section className="csl-kpis">
            <div className="csl-kpi">
              <div className="csl-kpi-label">Total Calls</div>
              <div className="csl-kpi-value">{kpis?.calls_attempted || "220.4K"}</div>
              <div className="csl-kpi-meta">
                <span className="csl-green">Live</span> calls total
              </div>
            </div>

            <div className="csl-kpi">
              <div className="csl-kpi-label">Total Duration</div>
              <div className="csl-kpi-value">{kpis?.total_talk_time || "1,842h"}</div>
              <div className="csl-kpi-meta">Combined call duration</div>
            </div>

            <div className="csl-kpi">
              <div className="csl-kpi-label">Handle Time</div>
              <div className="csl-kpi-value">{kpis?.avg_handle_time || "1,126h"}</div>
              <div className="csl-kpi-meta">Agent handling time</div>
            </div>

            <div className="csl-kpi">
              <div className="csl-kpi-label">Sales</div>
              <div className="csl-kpi-value">{kpis?.human_answered || "4,862"}</div>
              <div className="csl-kpi-meta">
                <span className="csl-green">{kpis?.connect_rate || "2.21%"}</span> conversion
              </div>
            </div>

            <div className="csl-kpi">
              <div className="csl-kpi-label">Contacts</div>
              <div className="csl-kpi-value">{kpis?.calls_connected || "39,824"}</div>
              <div className="csl-kpi-meta">
                <span className="csl-purple">Connected</span> calls
              </div>
            </div>

            <div className="csl-kpi">
              <div className="csl-kpi-label">Avg Handle</div>
              <div className="csl-kpi-value">{kpis?.avg_talk_time || "18.4m"}</div>
              <div className="csl-kpi-meta">Per handled call</div>
            </div>
          </section>

          {/* STATUS + MIX */}
          <section className="csl-grid">
            {/* STATUS SUMMARY */}
            <div className="csl-card">
              <div className="csl-card-header">
                <div>
                  <h2>Status Summary</h2>
                  <p>Campaign lead outcomes across all selected lists</p>
                </div>
                <span className="csl-purple" style={{ fontSize: "10px" }}>
                  86,420 leads
                </span>
              </div>

              <div className="csl-card-body">
                <div className="csl-status-list">
                  <div className="csl-status-row">
                    <div className="csl-status-info">
                      <strong>CONTACT</strong>
                      <span>Customer Contact</span>
                    </div>
                    <div className="csl-progress">
                      <span style={{ width: "92%", background: "#7c3aed" }}></span>
                    </div>
                    <div className="csl-status-count">39,824</div>
                  </div>

                  <div className="csl-status-row">
                    <div className="csl-status-info">
                      <strong>NO ANSWER</strong>
                      <span>No Answer</span>
                    </div>
                    <div className="csl-progress">
                      <span style={{ width: "71%", background: "#94a3b8" }}></span>
                    </div>
                    <div className="csl-status-count">18,050</div>
                  </div>

                  <div className="csl-status-row">
                    <div className="csl-status-info">
                      <strong>CALLBACK</strong>
                      <span>Scheduled Callback</span>
                    </div>
                    <div className="csl-progress">
                      <span style={{ width: "52%", background: "#3b82f6" }}></span>
                    </div>
                    <div className="csl-status-count">9,418</div>
                  </div>

                  <div className="csl-status-row">
                    <div className="csl-status-info">
                      <strong>UNWORKABLE</strong>
                      <span>Unable to Work</span>
                    </div>
                    <div className="csl-progress">
                      <span style={{ width: "42%", background: "#ef4444" }}></span>
                    </div>
                    <div className="csl-status-count">7,512</div>
                  </div>

                  <div className="csl-status-row">
                    <div className="csl-status-info">
                      <strong>SALE</strong>
                      <span>Sale Made</span>
                    </div>
                    <div className="csl-progress">
                      <span style={{ width: "28%", background: "#22c55e" }}></span>
                    </div>
                    <div className="csl-status-count">4,862</div>
                  </div>

                  <div className="csl-status-row">
                    <div className="csl-status-info">
                      <strong>BUSY</strong>
                      <span>Busy Number</span>
                    </div>
                    <div className="csl-progress">
                      <span style={{ width: "23%", background: "#f59e0b" }}></span>
                    </div>
                    <div className="csl-status-count">3,766</div>
                  </div>

                  <div className="csl-status-row">
                    <div className="csl-status-info">
                      <strong>DNC</strong>
                      <span>Do Not Call</span>
                    </div>
                    <div className="csl-progress">
                      <span style={{ width: "14%", background: "#dc2626" }}></span>
                    </div>
                    <div className="csl-status-count">2,214</div>
                  </div>
                </div>
              </div>
            </div>

            {/* DONUT */}
            <div className="csl-card">
              <div className="csl-card-header">
                <div>
                  <h2>Status Distribution</h2>
                  <p>Campaign-wide outcome mix</p>
                </div>
              </div>

              <div className="csl-card-body">
                <div className="csl-donut-wrapper">
                  <div className="csl-donut">
                    <div className="csl-donut-center">
                      <strong>86.4K</strong>
                      <span>Lead Statuses</span>
                    </div>
                  </div>

                  <div className="csl-legend">
                    <div className="csl-legend-item">
                      <span className="csl-legend-dot" style={{ background: "#7c3aed" }}></span>
                      Contact
                    </div>

                    <div className="csl-legend-item">
                      <span className="csl-legend-dot" style={{ background: "#22c55e" }}></span>
                      Sale
                    </div>

                    <div className="csl-legend-item">
                      <span className="csl-legend-dot" style={{ background: "#3b82f6" }}></span>
                      Callback
                    </div>

                    <div className="csl-legend-item">
                      <span className="csl-legend-dot" style={{ background: "#f59e0b" }}></span>
                      Busy
                    </div>

                    <div className="csl-legend-item">
                      <span className="csl-legend-dot" style={{ background: "#ef4444" }}></span>
                      Unworkable
                    </div>

                    <div className="csl-legend-item">
                      <span className="csl-legend-dot" style={{ background: "#94a3b8" }}></span>
                      Other
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PER LIST DETAIL TABLE */}
          <section className="csl-card csl-table-card">
            <div className="csl-card-header">
              <div>
                <h2>Campaign Status by List ID</h2>
                <p>Status counts and calling effort for every list in the campaign</p>
              </div>

              <span style={{ fontSize: "10px", color: "#8992a3" }}>6 List IDs</span>
            </div>

            <div className="csl-table-wrap">
              <table id="reportTable">
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
                    <th>Avg Handle</th>
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
                        background: selectedRow === idx ? "#faf8ff" : undefined,
                        cursor: "pointer",
                      }}
                    >
                      <td>
                        <span className="csl-list-pill">{row.id || row.listId}</span>
                      </td>
                      <td>{row.name || row.listName}</td>
                      <td>{row.leads || row.totalLeads}</td>
                      <td className={row.saleClass || "csl-green"}>{row.sale}</td>
                      <td>{row.contact}</td>
                      <td>{row.cb || row.callback}</td>
                      <td>{row.noAns || row.noAnswer}</td>
                      <td>{row.busy}</td>
                      <td>{row.dnc}</td>
                      <td>{row.unworkable}</td>
                      <td>{row.calls || "0"}</td>
                      <td>{row.dur || "0h"}</td>
                      <td>{row.handle || "0h"}</td>
                      <td>{row.avgH || "18.0m"}</td>
                      <td className={row.rateClass || "csl-green"}>{row.rate || row.cRate || "45.0%"}</td>
                      <td>
                        <span className={`csl-status-pill ${row.badgeClass || 'csl-active'}`}>{row.status || 'ACTIVE'}</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="csl-total-row">
                    <td colSpan={2}>TOTAL</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.leads || l.totalLeads || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.sale || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.contact || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.cb || l.callback || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.noAns || l.noAnswer || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.busy || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.dnc || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.unworkable || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{kpis?.calls_attempted || "220,402"}</td>
                    <td>{kpis?.total_talk_time || "1,842h"}</td>
                    <td>{kpis?.avg_handle_time || "1,126h"}</td>
                    <td>{kpis?.avg_talk_time || "18.4m"}</td>
                    <td>46.1%</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* EFFICIENCY */}
          <section className="csl-card csl-table-card">
            <div className="csl-card-header">
              <div>
                <h2>List Efficiency</h2>
                <p>Comparing call effort against useful campaign outcomes</p>
              </div>
            </div>

            <div className="csl-efficiency-grid">
              <div className="csl-efficiency">
                <div className="csl-eff-title">Best Sales List</div>
                <div className="csl-eff-value">1001</div>
                <div className="csl-eff-sub">1,824 sales</div>
                <div className="csl-eff-bar">
                  <span style={{ width: "92%", background: "#22c55e" }}></span>
                </div>
              </div>

              <div className="csl-efficiency">
                <div className="csl-eff-title">Best Contact Rate</div>
                <div className="csl-eff-value">1002</div>
                <div className="csl-eff-sub">48.0% contact rate</div>
                <div className="csl-eff-bar">
                  <span style={{ width: "96%", background: "#7c3aed" }}></span>
                </div>
              </div>

              <div className="csl-efficiency">
                <div className="csl-eff-title">Highest Call Volume</div>
                <div className="csl-eff-value">1001</div>
                <div className="csl-eff-sub">72,480 calls</div>
                <div className="csl-eff-bar">
                  <span style={{ width: "100%", background: "#3b82f6" }}></span>
                </div>
              </div>

              <div className="csl-efficiency">
                <div className="csl-eff-title">Review Required</div>
                <div className="csl-eff-value">1006</div>
                <div className="csl-eff-sub">38.3% contact rate</div>
                <div className="csl-eff-bar">
                  <span style={{ width: "38%", background: "#ef4444" }}></span>
                </div>
              </div>
            </div>
          </section>

          {/* EFFORT TREND */}
          <section className="csl-card csl-table-card">
            <div className="csl-card-header">
              <div>
                <h2>Call Effort Trend</h2>
                <p>Daily call volume and agent handle time for the selected campaign</p>
              </div>

              <div style={{ display: "flex", gap: "14px", fontSize: "10px" }}>
                <span>
                  <span className="csl-legend-dot" style={{ display: "inline-block", background: "#7c3aed" }}></span> Calls
                </span>
                <span>
                  <span className="csl-legend-dot" style={{ display: "inline-block", background: "#22c55e" }}></span> Handle Time
                </span>
              </div>
            </div>

            <div className="csl-card-body">
              <div className="csl-chart">
                <svg viewBox="0 0 900 275" preserveAspectRatio="none">
                  <line className="csl-grid-line" x1="55" y1="30" x2="875" y2="30" />
                  <line className="csl-grid-line" x1="55" y1="80" x2="875" y2="80" />
                  <line className="csl-grid-line" x1="55" y1="130" x2="875" y2="130" />
                  <line className="csl-grid-line" x1="55" y1="180" x2="875" y2="180" />
                  <line className="csl-grid-line" x1="55" y1="230" x2="875" y2="230" />

                  <text className="csl-axis" x="15" y="34">40K</text>
                  <text className="csl-axis" x="15" y="84">30K</text>
                  <text className="csl-axis" x="15" y="134">20K</text>
                  <text className="csl-axis" x="15" y="184">10K</text>
                  <text className="csl-axis" x="25" y="234">0</text>

                  <polyline className="csl-line-calls" points="70,128 200,116 330,105 460,120 590,88 720,72 850,58" />
                  <polyline className="csl-line-handle" points="70,188 200,179 330,170 460,177 590,159 720,145 850,133" />

                  <circle className="csl-point" cx="70" cy="128" r="5" stroke="#7c3aed" />
                  <circle className="csl-point" cx="200" cy="116" r="5" stroke="#7c3aed" />
                  <circle className="csl-point" cx="330" cy="105" r="5" stroke="#7c3aed" />
                  <circle className="csl-point" cx="460" cy="120" r="5" stroke="#7c3aed" />
                  <circle className="csl-point" cx="590" cy="88" r="5" stroke="#7c3aed" />
                  <circle className="csl-point" cx="720" cy="72" r="5" stroke="#7c3aed" />
                  <circle className="csl-point" cx="850" cy="58" r="5" stroke="#7c3aed" />

                  <text className="csl-axis" x="55" y="260">Sep 01</text>
                  <text className="csl-axis" x="185" y="260">Sep 02</text>
                  <text className="csl-axis" x="315" y="260">Sep 03</text>
                  <text className="csl-axis" x="445" y="260">Sep 04</text>
                  <text className="csl-axis" x="575" y="260">Sep 05</text>
                  <text className="csl-axis" x="705" y="260">Sep 06</text>
                  <text className="csl-axis" x="835" y="260">Sep 07</text>
                </svg>
              </div>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="csl-card">
            <div className="csl-card-header">
              <div>
                <h2>Campaign List Insights</h2>
                <p>Operational observations from status and effort data</p>
              </div>
            </div>

            <div className="csl-insights">
              <div className="csl-insight">
                <div className="csl-icon csl-icon-green">↗</div>
                <h3>Strongest List: 1001</h3>
                <p>List 1001 produces the highest sales volume and also carries the largest call volume in this campaign.</p>
              </div>

              <div className="csl-insight">
                <div className="csl-icon csl-icon-purple">✓</div>
                <h3>Contact Efficiency</h3>
                <p>List 1002 records the highest displayed contact rate, making it a strong candidate for higher dialing priority.</p>
              </div>

              <div className="csl-insight">
                <div className="csl-icon csl-icon-orange">!</div>
                <h3>Review List 1006</h3>
                <p>
                  List 1006 has the lowest displayed contact rate and relatively low sales volume. Review list quality and campaign allocation before increasing call effort.
                </p>
              </div>
            </div>
          </section>

          <div className="csl-footer">CallZenza Reports • Campaign Status List Report • Sep 07, 2026</div>
        </main>
      </div>

      <style jsx global>{`
        .csl-root {
          font-family: Inter, Arial, sans-serif;
          background: #f4f6fa;
          color: #172033;
          min-height: 100vh;
        }

        .csl-container {
          max-width: 1600px;
          margin: auto;
          padding: 26px 30px 45px;
        }

        .csl-page-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .csl-page-title h1 {
          font-size: 25px;
          font-weight: 850;
        }

        .csl-page-title p {
          margin-top: 6px;
          color: #7a8496;
          font-size: 12px;
        }

        .csl-actions {
          display: flex;
          gap: 8px;
        }

        .csl-btn-white {
          background: #fff;
          color: #344054;
          border: 1px solid #dfe3eb;
          border-radius: 7px;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .csl-btn-purple {
          background: #6d28d9;
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .csl-btn-purple:hover {
          background: #5b21b6;
        }

        .csl-filters {
          background: #fff;
          border: 1px solid #e3e7ef;
          border-radius: 12px;
          padding: 18px;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr auto;
          gap: 13px;
          margin-bottom: 20px;
        }

        .csl-field label {
          display: block;
          font-size: 10px;
          color: #667085;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .csl-filters select,
        .csl-filters input {
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

        .csl-filters select:focus,
        .csl-filters input:focus {
          border-color: #8b5cf6;
        }

        .csl-campaign-banner {
          background: linear-gradient(110deg, #241b48, #43258b);
          color: #fff;
          border-radius: 12px;
          padding: 19px 22px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .csl-campaign-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .csl-campaign-icon {
          width: 45px;
          height: 45px;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.13);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .csl-campaign-name {
          font-size: 16px;
          font-weight: 850;
        }

        .csl-campaign-sub {
          margin-top: 4px;
          font-size: 10px;
          color: #ddd6fe;
        }

        .csl-campaign-meta {
          display: flex;
          gap: 28px;
        }

        .csl-meta-item {
          text-align: right;
        }

        .csl-meta-label {
          color: #c4b5fd;
          font-size: 9px;
          text-transform: uppercase;
        }

        .csl-meta-value {
          margin-top: 4px;
          font-size: 15px;
          font-weight: 850;
        }

        .csl-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .csl-kpi {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 11px;
          padding: 17px;
          position: relative;
          overflow: hidden;
        }

        .csl-kpi:after {
          content: "";
          position: absolute;
          width: 70px;
          height: 70px;
          right: -25px;
          bottom: -28px;
          border-radius: 50%;
          background: #f3e8ff;
        }

        .csl-kpi-label {
          color: #7a8496;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 800;
        }

        .csl-kpi-value {
          margin-top: 8px;
          font-size: 23px;
          font-weight: 850;
        }

        .csl-kpi-meta {
          margin-top: 5px;
          color: #8992a3;
          font-size: 10px;
        }

        .csl-green { color: #16a34a; font-weight: 800; }
        .csl-purple { color: #7c3aed; font-weight: 800; }
        .csl-orange { color: #d97706; font-weight: 800; }
        .csl-red { color: #dc2626; font-weight: 800; }

        .csl-grid {
          display: grid;
          grid-template-columns: 1.5fr 0.9fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .csl-card {
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 12px;
          overflow: hidden;
        }

        .csl-card-header {
          padding: 18px 20px;
          border-bottom: 1px solid #edf0f4;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .csl-card-header h2 {
          font-size: 14px;
          font-weight: 700;
        }

        .csl-card-header p {
          margin-top: 4px;
          color: #8992a3;
          font-size: 10px;
        }

        .csl-card-body {
          padding: 20px;
        }

        .csl-status-list {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .csl-status-row {
          display: grid;
          grid-template-columns: 120px 1fr 70px;
          gap: 12px;
          align-items: center;
        }

        .csl-status-info strong {
          display: block;
          font-size: 11px;
        }

        .csl-status-info span {
          display: block;
          margin-top: 3px;
          font-size: 9px;
          color: #8992a3;
        }

        .csl-progress {
          height: 10px;
          background: #edf0f4;
          border-radius: 20px;
          overflow: hidden;
        }

        .csl-progress span {
          display: block;
          height: 100%;
          border-radius: 20px;
        }

        .csl-status-count {
          text-align: right;
          font-size: 11px;
          font-weight: 850;
        }

        .csl-donut-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .csl-donut {
          width: 190px;
          height: 190px;
          border-radius: 50%;
          background: conic-gradient(
            #7c3aed 0deg 145deg,
            #22c55e 145deg 190deg,
            #3b82f6 190deg 236deg,
            #f59e0b 236deg 276deg,
            #ef4444 276deg 320deg,
            #94a3b8 320deg 360deg
          );
          position: relative;
        }

        .csl-donut:after {
          content: "";
          position: absolute;
          width: 116px;
          height: 116px;
          left: 37px;
          top: 37px;
          background: #fff;
          border-radius: 50%;
        }

        .csl-donut-center {
          position: absolute;
          z-index: 2;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
        }

        .csl-donut-center strong {
          font-size: 23px;
        }

        .csl-donut-center span {
          font-size: 9px;
          color: #8992a3;
          margin-top: 3px;
        }

        .csl-legend {
          width: 100%;
          margin-top: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .csl-legend-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          color: #667085;
        }

        .csl-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }

        .csl-table-card {
          margin-bottom: 20px;
        }

        .csl-table-wrap {
          overflow: auto;
        }

        .csl-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1450px;
        }

        .csl-table-wrap thead th {
          background: #f8fafc;
          padding: 12px 10px;
          text-align: left;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #667085;
          border-bottom: 1px solid #e5e8ef;
        }

        .csl-table-wrap tbody td {
          padding: 13px 10px;
          font-size: 10px;
          border-bottom: 1px solid #edf0f4;
          white-space: nowrap;
        }

        .csl-table-wrap tbody tr:hover {
          background: #faf8ff;
        }

        .csl-list-pill {
          padding: 5px 8px;
          background: #f3e8ff;
          color: #6d28d9;
          border-radius: 5px;
          font-weight: 900;
          font-size: 9px;
        }

        .csl-status-pill {
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 900;
        }

        .csl-active { background: #dcfce7; color: #15803d; }
        .csl-monitor { background: #fef3c7; color: #b45309; }
        .csl-low { background: #fee2e2; color: #b91c1c; }

        .csl-total-row {
          background: #f8f7fb;
          font-weight: 900;
        }

        .csl-efficiency-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          padding: 20px;
        }

        .csl-efficiency {
          border: 1px solid #e7eaf0;
          border-radius: 10px;
          padding: 15px;
        }

        .csl-eff-title {
          font-size: 9px;
          text-transform: uppercase;
          color: #8992a3;
          font-weight: 800;
        }

        .csl-eff-value {
          margin-top: 7px;
          font-size: 21px;
          font-weight: 850;
        }

        .csl-eff-sub {
          margin-top: 4px;
          color: #8992a3;
          font-size: 9px;
        }

        .csl-eff-bar {
          height: 6px;
          background: #edf0f4;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 11px;
        }

        .csl-eff-bar span {
          display: block;
          height: 100%;
          border-radius: 10px;
        }

        .csl-chart {
          height: 275px;
        }

        .csl-chart svg {
          width: 100%;
          height: 100%;
        }

        .csl-grid-line {
          stroke: #edf0f4;
          stroke-width: 1;
        }

        .csl-axis {
          fill: #98a2b3;
          font-size: 9px;
        }

        .csl-line-calls {
          fill: none;
          stroke: #7c3aed;
          stroke-width: 3;
        }

        .csl-line-handle {
          fill: none;
          stroke: #22c55e;
          stroke-width: 3;
        }

        .csl-point {
          fill: #fff;
          stroke-width: 3;
        }

        .csl-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 20px;
        }

        .csl-insight {
          border: 1px solid #e6e9ef;
          border-radius: 10px;
          padding: 15px;
        }

        .csl-icon {
          width: 31px;
          height: 31px;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
          font-weight: 900;
        }

        .csl-icon-purple { background: #f3e8ff; color: #7c3aed; }
        .csl-icon-green { background: #dcfce7; color: #15803d; }
        .csl-icon-orange { background: #fef3c7; color: #b45309; }

        .csl-insight h3 {
          font-size: 11px;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .csl-insight p {
          color: #667085;
          font-size: 10px;
          line-height: 1.6;
        }

        .csl-footer {
          text-align: right;
          color: #98a2b3;
          font-size: 9px;
          padding-top: 15px;
        }

        @media (max-width: 1150px) {
          .csl-filters {
            grid-template-columns: repeat(3, 1fr);
          }
          .csl-kpis {
            grid-template-columns: repeat(3, 1fr);
          }
          .csl-grid {
            grid-template-columns: 1fr;
          }
          .csl-efficiency-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .csl-container {
            padding: 18px;
          }
          .csl-page-title {
            flex-direction: column;
            gap: 14px;
          }
          .csl-filters {
            grid-template-columns: 1fr;
          }
          .csl-kpis {
            grid-template-columns: 1fr 1fr;
          }
          .csl-campaign-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
          }
          .csl-campaign-meta {
            width: 100%;
            justify-content: space-between;
          }
          .csl-status-row {
            grid-template-columns: 90px 1fr 55px;
          }
          .csl-efficiency-grid {
            grid-template-columns: 1fr;
          }
          .csl-insights {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
}
