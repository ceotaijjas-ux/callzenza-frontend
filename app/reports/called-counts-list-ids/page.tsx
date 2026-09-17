"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CalledCountsListIdsReport() {
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [selectedLeadList, setSelectedLeadList] = useState("All Lists");
  const [selectedStatusCategory, setSelectedStatusCategory] = useState("All Statuses");
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-07");
  const [listRows, setListRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveReportData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getGenericReport("called-counts-list-ids", {
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
      console.error("Failed loading report for called-counts-list-ids:", err);
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
  const [selectedListCard, setSelectedListCard] = useState<number | null>(null);
  const [selectedTableRow, setSelectedTableRow] = useState<number | null>(null);
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
      showNotification("Called Counts List IDs Report refreshed successfully.");
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
      "Contact Rate",
      "Sale Rate",
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
      row.cRate || "0.0%",
      row.sRate || "0.0%",
      row.status || "ACTIVE",
    ]);

    const rows = [headers, ...dataRows];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "CallZenza_Called_Counts_List_IDs_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="ccl-root">
        <main className="ccl-container" style={{ opacity: containerOpacity, transition: "opacity 0.3s ease" }}>
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
          <div className="ccl-top-title">
            <div>
              <h1>Called Counts List IDs Report</h1>
              <p>Campaign lead status distribution broken down by individual lists and call counts.</p>
            </div>

            <div className="ccl-actions">
              <button className="ccl-btn-white" onClick={() => window.print()}>
                Print
              </button>
              <button className="ccl-btn-white" onClick={exportCSV}>
                Export CSV
              </button>
              <button className="ccl-btn-purple" onClick={refreshReport}>
                {refreshBtnText}
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <section className="ccl-filters">
            <div className="ccl-field">
              <label>Campaign</label>
              <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
                <option>All Campaigns</option>
                <option>SALES_INBOUND</option>
                <option>OUTBOUND_SALES</option>
                <option>RENEWAL_2026</option>
                <option>DEMO_CAMPAIGN</option>
              </select>
            </div>

            <div className="ccl-field">
              <label>Lead List</label>
              <select value={selectedLeadList} onChange={(e) => setSelectedLeadList(e.target.value)}>
                <option>All Lists</option>
                <option>1001 - Main Leads</option>
                <option>1002 - Premium Leads</option>
                <option>1003 - Follow Up</option>
                <option>1004 - Recycle Leads</option>
                <option>1005 - Enterprise</option>
              </select>
            </div>

            <div className="ccl-field">
              <label>Status Category</label>
              <select value={selectedStatusCategory} onChange={(e) => setSelectedStatusCategory(e.target.value)}>
                <option>All Statuses</option>
                <option>SALE</option>
                <option>CONTACT</option>
                <option>CALLBACK</option>
                <option>DNC</option>
                <option>UNWORKABLE</option>
              </select>
            </div>

            <div className="ccl-field">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="ccl-field">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <button className="ccl-btn-purple" onClick={applyFilters} disabled={isApplyDisabled}>
              {applyBtnText}
            </button>
          </section>

          {/* KPI */}
          <section className="ccl-kpis">
            <div className="ccl-kpi">
              <div className="ccl-kpi-label">Total Lists</div>
              <div className="ccl-kpi-value">{displayLists.length}</div>
              <div className="ccl-kpi-change">
                <span className="ccl-purple-text">Active lists</span>
              </div>
            </div>

            <div className="ccl-kpi">
              <div className="ccl-kpi-label">Total Leads</div>
              <div className="ccl-kpi-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.leads || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "86,420"}</div>
              <div className="ccl-kpi-change">
                <span className="ccl-green-text">Database</span> total
              </div>
            </div>

            <div className="ccl-kpi">
              <div className="ccl-kpi-label">Contacted</div>
              <div className="ccl-kpi-value">{kpis?.calls_connected || "41,286"}</div>
              <div className="ccl-kpi-change">
                <span className="ccl-green-text">{kpis?.connect_rate || "47.8%"}</span> of leads
              </div>
            </div>

            <div className="ccl-kpi">
              <div className="ccl-kpi-label">Sales</div>
              <div className="ccl-kpi-value">{kpis?.human_answered || "4,862"}</div>
              <div className="ccl-kpi-change">
                <span className="ccl-green-text">Conversions</span>
              </div>
            </div>

            <div className="ccl-kpi">
              <div className="ccl-kpi-label">Callbacks</div>
              <div className="ccl-kpi-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.cb || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "9,418"}</div>
              <div className="ccl-kpi-change">
                <span className="ccl-purple-text">Callbacks</span>
              </div>
            </div>

            <div className="ccl-kpi">
              <div className="ccl-kpi-label">Unworkable</div>
              <div className="ccl-kpi-value">{displayLists.reduce((acc, l) => acc + (parseInt(String(l.unworkable || 0).replace(/,/g, "")) || 0), 0).toLocaleString() || "13,826"}</div>
              <div className="ccl-kpi-change">
                <span className="ccl-orange-text">Unworkable</span>
              </div>
            </div>
          </section>

          {/* LIST ID SUMMARY */}
          <section className="ccl-section">
            <div className="ccl-section-header">
              <div>
                <h2>List ID Summary</h2>
                <p>Total leads distributed across campaign lists</p>
              </div>

              <div className="ccl-section-tools">
                <button className="ccl-btn-white">Sort by Leads</button>
              </div>
            </div>

            <div className="ccl-list-summary">
              {[
                { id: "LIST 1001", name: "Main Sales Leads", count: "24,860", status: "ACTIVE", width: "82%", barColor: "#7c3aed" },
                { id: "LIST 1002", name: "Premium Leads", count: "19,420", status: "ACTIVE", width: "70%", barColor: "#3b82f6" },
                { id: "LIST 1003", name: "Follow Up Leads", count: "17,680", status: "ACTIVE", width: "61%", barColor: "#22c55e" },
                { id: "LIST 1004", name: "Recycle Leads", count: "13,240", status: "ACTIVE", width: "49%", barColor: "#f59e0b" },
                { id: "LIST 1005", name: "Enterprise Leads", count: "7,860", status: "ACTIVE", width: "35%", barColor: "#8b5cf6" },
                { id: "LIST 1006", name: "Old Campaign Leads", count: "3,360", status: "PAUSED", width: "18%", barColor: "#94a3b8", isPaused: true },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="ccl-list-card"
                  onClick={() => setSelectedListCard(idx)}
                  style={{
                    borderColor: selectedListCard === idx ? "#8b5cf6" : undefined,
                  }}
                >
                  <div className="ccl-list-top">
                    <span className="ccl-list-id">{card.id}</span>
                    <span
                      className="ccl-list-status"
                      style={card.isPaused ? { background: "#fef3c7", color: "#b45309" } : undefined}
                    >
                      {card.status}
                    </span>
                  </div>

                  <div className="ccl-list-name">{card.name}</div>
                  <div className="ccl-list-count">{card.count}</div>
                  <div className="ccl-list-caption">Total Leads</div>

                  <div className="ccl-mini-bar">
                    <span style={{ width: card.width, background: card.barColor }}></span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TWO COLUMN: STATUS + DONUT */}
          <section className="ccl-two-column">
            <div className="ccl-section">
              <div className="ccl-section-header">
                <div>
                  <h2>Status Flag Summary</h2>
                  <p>Lead count by current status category</p>
                </div>
                <span style={{ fontSize: "10px", color: "#8992a3" }}>86,420 leads</span>
              </div>

              <div className="ccl-status-content">
                <div className="ccl-status-grid">
                  <div className="ccl-status-item">
                    <div className="ccl-status-item-top">
                      <div>
                        <div className="ccl-status-code">SALE</div>
                        <div className="ccl-status-desc">Sale Made</div>
                      </div>
                      <div className="ccl-status-number">4,862</div>
                    </div>
                    <div className="ccl-status-progress">
                      <span style={{ width: "68%", background: "#22c55e" }}></span>
                    </div>
                    <div className="ccl-status-footer">
                      <span>5.63%</span>
                      <span>+12.4%</span>
                    </div>
                  </div>

                  <div className="ccl-status-item">
                    <div className="ccl-status-item-top">
                      <div>
                        <div className="ccl-status-code">CONTACT</div>
                        <div className="ccl-status-desc">Customer Contact</div>
                      </div>
                      <div className="ccl-status-number">36,424</div>
                    </div>
                    <div className="ccl-status-progress">
                      <span style={{ width: "92%", background: "#7c3aed" }}></span>
                    </div>
                    <div className="ccl-status-footer">
                      <span>42.15%</span>
                      <span>+7.8%</span>
                    </div>
                  </div>

                  <div className="ccl-status-item">
                    <div className="ccl-status-item-top">
                      <div>
                        <div className="ccl-status-code">CALLBK</div>
                        <div className="ccl-status-desc">Scheduled Callback</div>
                      </div>
                      <div className="ccl-status-number">9,418</div>
                    </div>
                    <div className="ccl-status-progress">
                      <span style={{ width: "54%", background: "#3b82f6" }}></span>
                    </div>
                    <div className="ccl-status-footer">
                      <span>10.90%</span>
                      <span>+5.2%</span>
                    </div>
                  </div>

                  <div className="ccl-status-item">
                    <div className="ccl-status-item-top">
                      <div>
                        <div className="ccl-status-code">DNC</div>
                        <div className="ccl-status-desc">Do Not Call</div>
                      </div>
                      <div className="ccl-status-number">2,840</div>
                    </div>
                    <div className="ccl-status-progress">
                      <span style={{ width: "24%", background: "#f59e0b" }}></span>
                    </div>
                    <div className="ccl-status-footer">
                      <span>3.29%</span>
                      <span>+1.4%</span>
                    </div>
                  </div>

                  <div className="ccl-status-item">
                    <div className="ccl-status-item-top">
                      <div>
                        <div className="ccl-status-code">NA</div>
                        <div className="ccl-status-desc">No Answer</div>
                      </div>
                      <div className="ccl-status-number">18,050</div>
                    </div>
                    <div className="ccl-status-progress">
                      <span style={{ width: "70%", background: "#94a3b8" }}></span>
                    </div>
                    <div className="ccl-status-footer">
                      <span>20.89%</span>
                      <span>-2.8%</span>
                    </div>
                  </div>

                  <div className="ccl-status-item">
                    <div className="ccl-status-item-top">
                      <div>
                        <div className="ccl-status-code">UNWORKABLE</div>
                        <div className="ccl-status-desc">Unable to Work</div>
                      </div>
                      <div className="ccl-status-number">13,826</div>
                    </div>
                    <div className="ccl-status-progress">
                      <span style={{ width: "61%", background: "#ef4444" }}></span>
                    </div>
                    <div className="ccl-status-footer">
                      <span>16.00%</span>
                      <span>+3.7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DONUT */}
            <div className="ccl-section">
              <div className="ccl-section-header">
                <div>
                  <h2>Campaign Status Mix</h2>
                  <p>Distribution of lead outcomes</p>
                </div>
              </div>

              <div className="ccl-donut-area">
                <div className="ccl-donut">
                  <div className="ccl-donut-center">
                    <strong>86.4K</strong>
                    <span>Total Leads</span>
                  </div>
                </div>

                <div className="ccl-donut-legend">
                  <div className="ccl-legend">
                    <span className="ccl-legend-dot" style={{ background: "#7c3aed" }}></span>
                    Contact
                  </div>
                  <div className="ccl-legend">
                    <span className="ccl-legend-dot" style={{ background: "#22c55e" }}></span>
                    Sale
                  </div>
                  <div className="ccl-legend">
                    <span className="ccl-legend-dot" style={{ background: "#3b82f6" }}></span>
                    Callback
                  </div>
                  <div className="ccl-legend">
                    <span className="ccl-legend-dot" style={{ background: "#f59e0b" }}></span>
                    DNC
                  </div>
                  <div className="ccl-legend">
                    <span className="ccl-legend-dot" style={{ background: "#ef4444" }}></span>
                    Unworkable
                  </div>
                  <div className="ccl-legend">
                    <span className="ccl-legend-dot" style={{ background: "#94a3b8" }}></span>
                    Other
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STATUS TREND */}
          <section className="ccl-section">
            <div className="ccl-section-header">
              <div>
                <h2>Campaign Status Trend</h2>
                <p>Seven-day movement across major status categories</p>
              </div>

              <div className="ccl-section-tools">
                <div className="ccl-legend">
                  <span className="ccl-legend-dot" style={{ background: "#7c3aed" }}></span>
                  Contact
                </div>
                <div className="ccl-legend">
                  <span className="ccl-legend-dot" style={{ background: "#22c55e" }}></span>
                  Sale
                </div>
                <div className="ccl-legend">
                  <span className="ccl-legend-dot" style={{ background: "#3b82f6" }}></span>
                  Callback
                </div>
              </div>
            </div>

            <div className="ccl-chart-card">
              <div className="ccl-chart">
                <svg viewBox="0 0 900 270" preserveAspectRatio="none">
                  <line className="ccl-grid-line" x1="55" y1="25" x2="875" y2="25" />
                  <line className="ccl-grid-line" x1="55" y1="75" x2="875" y2="75" />
                  <line className="ccl-grid-line" x1="55" y1="125" x2="875" y2="125" />
                  <line className="ccl-grid-line" x1="55" y1="175" x2="875" y2="175" />
                  <line className="ccl-grid-line" x1="55" y1="225" x2="875" y2="225" />

                  <text className="ccl-axis" x="15" y="29">40K</text>
                  <text className="ccl-axis" x="15" y="79">30K</text>
                  <text className="ccl-axis" x="15" y="129">20K</text>
                  <text className="ccl-axis" x="15" y="179">10K</text>
                  <text className="ccl-axis" x="28" y="229">0</text>

                  <polyline className="ccl-line-contact" points="70,72 200,83 330,70 460,92 590,76 720,61 850,55" />
                  <polyline className="ccl-line-sale" points="70,190 200,181 330,176 460,168 590,160 720,153 850,145" />
                  <polyline className="ccl-line-callback" points="70,155 200,149 330,157 460,143 590,137 720,128 850,119" />

                  <circle className="ccl-chart-point" cx="70" cy="72" r="4" stroke="#7c3aed" />
                  <circle className="ccl-chart-point" cx="200" cy="83" r="4" stroke="#7c3aed" />
                  <circle className="ccl-chart-point" cx="330" cy="70" r="4" stroke="#7c3aed" />
                  <circle className="ccl-chart-point" cx="460" cy="92" r="4" stroke="#7c3aed" />
                  <circle className="ccl-chart-point" cx="590" cy="76" r="4" stroke="#7c3aed" />
                  <circle className="ccl-chart-point" cx="720" cy="61" r="4" stroke="#7c3aed" />
                  <circle className="ccl-chart-point" cx="850" cy="55" r="4" stroke="#7c3aed" />

                  <text className="ccl-axis" x="60" y="255">Sep 01</text>
                  <text className="ccl-axis" x="190" y="255">Sep 02</text>
                  <text className="ccl-axis" x="320" y="255">Sep 03</text>
                  <text className="ccl-axis" x="450" y="255">Sep 04</text>
                  <text className="ccl-axis" x="580" y="255">Sep 05</text>
                  <text className="ccl-axis" x="710" y="255">Sep 06</text>
                  <text className="ccl-axis" x="840" y="255">Sep 07</text>
                </svg>
              </div>
            </div>
          </section>

          {/* PER LIST DETAIL */}
          <section className="ccl-section">
            <div className="ccl-section-header">
              <div>
                <h2>Per List Status Detail</h2>
                <p>Detailed campaign status counts for each lead list</p>
              </div>
              <span style={{ fontSize: "10px", color: "#8992a3" }}>6 Lists</span>
            </div>

            <div className="ccl-table-wrap">
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
                    <th>Contact Rate</th>
                    <th>Sale Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {displayLists.map((row, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedTableRow(idx)}
                      style={{
                        background: selectedTableRow === idx ? "#faf8ff" : undefined,
                        cursor: "pointer",
                      }}
                    >
                      <td>
                        <span className="ccl-code-pill">{row.id || row.listId}</span>
                      </td>
                      <td>{row.name || row.listName}</td>
                      <td>{row.leads || row.totalLeads}</td>
                      <td className={row.sClass || "ccl-rate-good"}>{row.sale}</td>
                      <td>{row.contact}</td>
                      <td>{row.cb || row.callback}</td>
                      <td>{row.noAns || row.noAnswer}</td>
                      <td>{row.busy}</td>
                      <td>{row.dnc}</td>
                      <td>{row.unworkable}</td>
                      <td className={row.cClass || "ccl-rate-good"}>{row.cRate || "45.0%"}</td>
                      <td className={row.sClass || "ccl-rate-good"}>{row.sRate || "7.0%"}</td>
                      <td className={row.stClass || "ccl-green-text"}>{row.status || "ACTIVE"}</td>
                    </tr>
                  ))}
                  <tr className="ccl-total-row">
                    <td colSpan={2}>TOTAL</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.leads || l.totalLeads || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.sale || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.contact || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.cb || l.callback || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.noAns || l.noAnswer || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.busy || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.dnc || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>{displayLists.reduce((acc, l) => acc + (parseInt(String(l.unworkable || 0).replace(/,/g, "")) || 0), 0).toLocaleString()}</td>
                    <td>46.1%</td>
                    <td>5.6%</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* INSIGHTS */}
          <section className="ccl-section">
            <div className="ccl-section-header">
              <div>
                <h2>Campaign List Insights</h2>
                <p>Quick operational observations from the current status distribution</p>
              </div>
            </div>

            <div className="ccl-insights">
              <div className="ccl-insight">
                <div className="ccl-insight-icon ccl-i-purple">↗</div>
                <h3>Top Performing List</h3>
                <p>List 1001 has the highest sales volume with 1,824 sales and a strong 7.3% sale rate.</p>
              </div>

              <div className="ccl-insight">
                <div className="ccl-insight-icon ccl-i-green">✓</div>
                <h3>Strong Contact Volume</h3>
                <p>Premium Leads maintains a 48.0% contact rate and contributes significant customer-contact volume.</p>
              </div>

              <div className="ccl-insight">
                <div className="ccl-insight-icon ccl-i-orange">!</div>
                <h3>List Requires Review</h3>
                <p>List 1006 is paused and shows the lowest contact and sale rates among the displayed lists.</p>
              </div>
            </div>
          </section>

          <div className="ccl-footer">CallZenza Reports • Called Counts List IDs Report • Sep 07, 2026</div>
        </main>
      </div>

      <style jsx global>{`
        .ccl-root {
          font-family: Inter, Arial, sans-serif;
          background: #f4f6fa;
          color: #172033;
          min-height: 100vh;
        }

        .ccl-container {
          max-width: 1600px;
          margin: auto;
          padding: 25px 30px 45px;
        }

        .ccl-top-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .ccl-top-title h1 {
          font-size: 25px;
          font-weight: 800;
        }

        .ccl-top-title p {
          margin-top: 6px;
          color: #7a8497;
          font-size: 12px;
        }

        .ccl-actions {
          display: flex;
          gap: 9px;
        }

        .ccl-btn-white {
          background: white;
          border: 1px solid #dfe3eb;
          color: #344054;
          border-radius: 7px;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .ccl-btn-purple {
          background: #6d28d9;
          color: white;
          border: none;
          border-radius: 7px;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .ccl-filters {
          background: white;
          border: 1px solid #e3e7ef;
          border-radius: 12px;
          padding: 18px;
          display: grid;
          grid-template-columns: 1.3fr 1.2fr 1fr 1fr 1fr auto;
          gap: 13px;
          margin-bottom: 20px;
        }

        .ccl-field label {
          display: block;
          font-size: 10px;
          font-weight: 800;
          color: #667085;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .ccl-filters select,
        .ccl-filters input {
          width: 100%;
          height: 38px;
          border: 1px solid #d9dee8;
          border-radius: 7px;
          padding: 0 10px;
          background: white;
          font-size: 11px;
          color: #273246;
          outline: none;
        }

        .ccl-filters select:focus,
        .ccl-filters input:focus {
          border-color: #8b5cf6;
        }

        .ccl-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .ccl-kpi {
          background: white;
          border: 1px solid #e5e8ef;
          border-radius: 11px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .ccl-kpi:after {
          content: "";
          position: absolute;
          width: 65px;
          height: 65px;
          right: -22px;
          bottom: -24px;
          border-radius: 50%;
          background: #f3e8ff;
        }

        .ccl-kpi-label {
          font-size: 10px;
          color: #7a8497;
          font-weight: 800;
          text-transform: uppercase;
        }

        .ccl-kpi-value {
          margin-top: 8px;
          font-size: 23px;
          font-weight: 850;
        }

        .ccl-kpi-change {
          margin-top: 5px;
          font-size: 10px;
          color: #667085;
        }

        .ccl-green-text { color: #16a34a; font-weight: 800; }
        .ccl-purple-text { color: #7c3aed; font-weight: 800; }
        .ccl-orange-text { color: #d97706; font-weight: 800; }

        .ccl-section {
          background: white;
          border: 1px solid #e4e8ef;
          border-radius: 12px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .ccl-section-header {
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #edf0f4;
        }

        .ccl-section-header h2 {
          font-size: 14px;
          font-weight: 700;
        }

        .ccl-section-header p {
          margin-top: 4px;
          font-size: 10px;
          color: #8a93a3;
        }

        .ccl-section-tools {
          display: flex;
          gap: 8px;
        }

        .ccl-list-summary {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .ccl-list-card {
          border: 1px solid #e6e9f0;
          border-radius: 10px;
          padding: 15px;
          background: #fcfcfd;
          transition: 0.2s;
          cursor: pointer;
        }

        .ccl-list-card:hover {
          transform: translateY(-2px);
          border-color: #c4b5fd;
          box-shadow: 0 5px 18px rgba(79, 70, 229, 0.08);
        }

        .ccl-list-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ccl-list-id {
          color: #6d28d9;
          font-weight: 900;
          font-size: 11px;
        }

        .ccl-list-status {
          font-size: 9px;
          padding: 4px 7px;
          border-radius: 20px;
          background: #dcfce7;
          color: #15803d;
          font-weight: 800;
        }

        .ccl-list-name {
          margin-top: 9px;
          font-size: 12px;
          font-weight: 800;
        }

        .ccl-list-count {
          margin-top: 13px;
          font-size: 22px;
          font-weight: 850;
        }

        .ccl-list-caption {
          font-size: 10px;
          color: #8a93a3;
        }

        .ccl-mini-bar {
          height: 6px;
          background: #edf0f4;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 12px;
        }

        .ccl-mini-bar span {
          display: block;
          height: 100%;
          border-radius: 10px;
        }

        .ccl-two-column {
          display: grid;
          grid-template-columns: 1.45fr 0.9fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .ccl-status-content {
          padding: 20px;
        }

        .ccl-status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .ccl-status-item {
          border: 1px solid #e7eaf0;
          border-radius: 9px;
          padding: 13px;
        }

        .ccl-status-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 9px;
        }

        .ccl-status-code {
          font-weight: 900;
          font-size: 11px;
        }

        .ccl-status-desc {
          font-size: 9px;
          color: #8a93a3;
          margin-top: 3px;
        }

        .ccl-status-number {
          font-size: 13px;
          font-weight: 850;
        }

        .ccl-status-progress {
          height: 7px;
          background: #edf0f4;
          border-radius: 8px;
          overflow: hidden;
        }

        .ccl-status-progress span {
          display: block;
          height: 100%;
          border-radius: 8px;
        }

        .ccl-status-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 7px;
          font-size: 9px;
          color: #8a93a3;
        }

        .ccl-donut-area {
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
        }

        .ccl-donut {
          width: 190px;
          height: 190px;
          border-radius: 50%;
          background: conic-gradient(
            #7c3aed 0deg 116deg,
            #22c55e 116deg 190deg,
            #3b82f6 190deg 245deg,
            #f59e0b 245deg 288deg,
            #ef4444 288deg 326deg,
            #94a3b8 326deg 360deg
          );
          position: relative;
        }

        .ccl-donut:after {
          content: "";
          position: absolute;
          width: 115px;
          height: 115px;
          background: white;
          border-radius: 50%;
          left: 37px;
          top: 37px;
        }

        .ccl-donut-center {
          position: absolute;
          z-index: 2;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .ccl-donut-center strong {
          font-size: 22px;
        }

        .ccl-donut-center span {
          font-size: 9px;
          color: #8992a3;
          margin-top: 3px;
        }

        .ccl-donut-legend {
          width: 100%;
          margin-top: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .ccl-legend {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          color: #667085;
        }

        .ccl-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }

        .ccl-table-wrap {
          overflow: auto;
        }

        .ccl-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1250px;
        }

        .ccl-table-wrap thead th {
          background: #f8fafc;
          padding: 12px 10px;
          text-align: left;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #667085;
          border-bottom: 1px solid #e5e8ef;
        }

        .ccl-table-wrap tbody td {
          padding: 13px 10px;
          font-size: 10px;
          border-bottom: 1px solid #edf0f4;
          white-space: nowrap;
        }

        .ccl-table-wrap tbody tr:hover {
          background: #faf8ff;
        }

        .ccl-total-row {
          background: #f8f7fb;
          font-weight: 900;
        }

        .ccl-code-pill {
          display: inline-block;
          padding: 5px 7px;
          border-radius: 5px;
          background: #f3e8ff;
          color: #6d28d9;
          font-size: 9px;
          font-weight: 900;
        }

        .ccl-rate-good { color: #15803d; font-weight: 900; }
        .ccl-rate-mid { color: #b45309; font-weight: 900; }
        .ccl-rate-low { color: #dc2626; font-weight: 900; }

        .ccl-chart-card {
          padding: 20px;
        }

        .ccl-chart {
          height: 275px;
          position: relative;
        }

        .ccl-chart svg {
          width: 100%;
          height: 100%;
        }

        .ccl-grid-line {
          stroke: #edf0f4;
          stroke-width: 1;
        }

        .ccl-axis {
          fill: #98a2b3;
          font-size: 9px;
        }

        .ccl-line-sale {
          fill: none;
          stroke: #22c55e;
          stroke-width: 3;
        }

        .ccl-line-contact {
          fill: none;
          stroke: #7c3aed;
          stroke-width: 3;
        }

        .ccl-line-callback {
          fill: none;
          stroke: #3b82f6;
          stroke-width: 3;
        }

        .ccl-chart-point {
          fill: white;
          stroke-width: 3;
        }

        .ccl-insights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 20px;
        }

        .ccl-insight {
          border: 1px solid #e7eaf0;
          border-radius: 10px;
          padding: 15px;
        }

        .ccl-insight-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          font-weight: 900;
        }

        .ccl-i-purple { background: #f3e8ff; color: #7c3aed; }
        .ccl-i-green { background: #dcfce7; color: #15803d; }
        .ccl-i-orange { background: #fef3c7; color: #b45309; }

        .ccl-insight h3 {
          font-size: 11px;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .ccl-insight p {
          color: #667085;
          font-size: 10px;
          line-height: 1.6;
        }

        .ccl-footer {
          text-align: right;
          color: #98a2b3;
          font-size: 9px;
          padding-top: 15px;
        }

        @media (max-width: 1150px) {
          .ccl-filters {
            grid-template-columns: repeat(3, 1fr);
          }
          .ccl-kpis {
            grid-template-columns: repeat(3, 1fr);
          }
          .ccl-list-summary {
            grid-template-columns: repeat(2, 1fr);
          }
          .ccl-two-column {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ccl-container {
            padding: 18px;
          }
          .ccl-top-title {
            flex-direction: column;
            gap: 14px;
          }
          .ccl-filters {
            grid-template-columns: 1fr;
          }
          .ccl-kpis {
            grid-template-columns: 1fr 1fr;
          }
          .ccl-list-summary {
            grid-template-columns: 1fr;
          }
          .ccl-status-grid {
            grid-template-columns: 1fr;
          }
          .ccl-insights {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
}
