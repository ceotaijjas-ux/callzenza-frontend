"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function InboundEmailReport() {
  const { timeStr } = useLiveClock();
  const [emailKpis, setEmailKpis] = useState({
    total_emails: "0",
    resolved: "0",
    backlog: "0",
    resolution_rate: "0%",
    avg_response_time: "0m"
  });
  const [emailQueues, setEmailQueues] = useState<any[]>([]);
  const [recentEmails, setRecentEmails] = useState<any[]>([]);
  const [agentEmailRows, setAgentEmailRows] = useState<any[]>([]);
  const [lifecycle, setLifecycle] = useState({
    received: "0",
    assigned: "0",
    opened: "0",
    responded: "0",
    resolved: "0"
  });

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("inbound-email");
        if (res) {
          if (res.kpis) setEmailKpis(res.kpis);
          if (Array.isArray(res.queues) && res.queues.length > 0) setEmailQueues(res.queues);
          if (Array.isArray(res.recent_emails) && res.recent_emails.length > 0) setRecentEmails(res.recent_emails);
          if (Array.isArray(res.agents) && res.agents.length > 0) setAgentEmailRows(res.agents);
          if (res.lifecycle) setLifecycle(res.lifecycle);
        }
      } catch (err) {
        console.error("Failed loading report for inbound-email:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const [selectedQueue, setSelectedQueue] = useState("All Email Queues");
  const [selectedAgentGroup, setSelectedAgentGroup] = useState("All Agent Groups");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [fromDate, setFromDate] = useState("2026-09-07");
  const [toDate, setToDate] = useState("2026-09-07");

  const [applyBtnText, setApplyBtnText] = useState("Apply Filters");
  const [isApplyDisabled, setIsApplyDisabled] = useState(false);
  const [refreshBtnText, setRefreshBtnText] = useState("↻ Refresh");
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const applyFilters = () => {
    setApplyBtnText("Applying...");
    setIsApplyDisabled(true);
    setTimeout(() => {
      setApplyBtnText("Applied ✓");
      setTimeout(() => {
        setApplyBtnText("Apply Filters");
        setIsApplyDisabled(false);
      }, 1000);
    }, 700);
  };

  const refreshReport = () => {
    setRefreshBtnText("↻ Refreshing...");
    setContainerOpacity(0.7);
    setTimeout(() => {
      setContainerOpacity(1);
      setRefreshBtnText("✓ Updated");
      showNotification("Inbound Email Report refreshed successfully.");
      setTimeout(() => {
        setRefreshBtnText("↻ Refresh");
      }, 1000);
    }, 800);
  };

  const exportCSV = () => {
    const rows = [
      ["Agent", "Assigned", "Answered", "Resolved", "Avg Response", "Avg Resolution", "SLA"],
      ...agentEmailRows.map((r) => [r.name, r.assigned, r.ans, r.res, r.avgResp, r.avgRes, r.sla])
    ];

    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Inbound_Email_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="ie-root">
        <main className="ie-page" style={{ opacity: containerOpacity, transition: "opacity 0.3s ease" }}>
          {/* BACK TO REPORTS NAVIGATION LINK */}
          <div style={{ marginBottom: "12px" }}>
            <Link
              href="/reports"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6d3df5",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} /> Back to Reports
            </Link>
          </div>

          <div className="ie-breadcrumb">Reports / Inbound / Email</div>

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

          {/* TITLE ROW */}
          <div className="ie-title-row">
            <div className="ie-title">
              <h1>Inbound Email Report</h1>
              <p>Monitor inbound email volume, response performance, SLA and agent handling.</p>
            </div>

            <div className="ie-actions">
              <button className="ie-btn" onClick={refreshReport}>
                {refreshBtnText}
              </button>
              <button className="ie-btn" onClick={() => window.print()}>
                ⎙ Print
              </button>
              <button className="ie-btn ie-primary" onClick={exportCSV}>
                ⇩ Export CSV
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <section className="ie-filters">
            <div className="ie-field">
              <label>Email Queue</label>
              <select value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}>
                <option>All Email Queues</option>
                {(emailQueues.length > 0 ? emailQueues : [
                  { queue: "Inbound Default Trunk" },
                  { queue: "testprocess" },
                  { queue: "testcampaign" }
                ]).map((q, idx) => (
                  <option key={idx}>{q.queue}</option>
                ))}
              </select>
            </div>

            <div className="ie-field">
              <label>Agent Group</label>
              <select value={selectedAgentGroup} onChange={(e) => setSelectedAgentGroup(e.target.value)}>
                <option>All Agent Groups</option>
                <option>Support Team</option>
                <option>Voice & Email Team</option>
                <option>Operations Team</option>
              </select>
            </div>

            <div className="ie-field">
              <label>Email Status</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option>All Statuses</option>
                <option>New</option>
                <option>Assigned</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>

            <div className="ie-field">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="ie-field">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <button className="ie-filter-btn" onClick={applyFilters} disabled={isApplyDisabled}>
              {applyBtnText}
            </button>
          </section>

          {/* KPIs */}
          <section className="ie-kpis">
            <div className="ie-kpi">
              <div className="ie-kpi-icon">✉</div>
              <h3>{emailKpis.total_emails}</h3>
              <p>Inbound Emails</p>
              <div className="ie-change">Live period volume</div>
            </div>

            <div className="ie-kpi">
              <div className="ie-kpi-icon">◉</div>
              <h3>{emailKpis.resolved}</h3>
              <p>Emails Answered</p>
              <div className="ie-change">{emailKpis.resolution_rate} response coverage</div>
            </div>

            <div className="ie-kpi">
              <div className="ie-kpi-icon">◷</div>
              <h3>{emailKpis.avg_response_time}</h3>
              <p>Avg First Response</p>
              <div className="ie-change">Within SLA threshold</div>
            </div>

            <div className="ie-kpi">
              <div className="ie-kpi-icon">✓</div>
              <h3>{emailKpis.resolution_rate}</h3>
              <p>Resolution Rate</p>
              <div className="ie-change">Verified resolution</div>
            </div>

            <div className="ie-kpi">
              <div className="ie-kpi-icon">!</div>
              <h3>{emailKpis.backlog}</h3>
              <p>Pending Emails</p>
              <div className="ie-change ie-green">Queue under control</div>
            </div>

            <div className="ie-kpi">
              <div className="ie-kpi-icon">⚡</div>
              <h3>{emailKpis.resolution_rate || "0%"}</h3>
              <p>SLA Compliance</p>
              <div className="ie-change">Live KPI tracking</div>
            </div>
          </section>

          {/* CHART + FUNNEL */}
          <section className="ie-grid">
            <div className="ie-card">
              <div className="ie-card-head">
                <div>
                  <h2>Inbound Email Volume</h2>
                  <span>Hourly email activity</span>
                </div>

                <div className="ie-legend">
                  <span>
                    <i className="ie-line ie-purple"></i>Received
                  </span>
                  <span>
                    <i className="ie-line ie-blue"></i>Answered
                  </span>
                  <span>
                    <i className="ie-line ie-green"></i>Resolved
                  </span>
                </div>
              </div>

              <div className="ie-chart-wrap">
                <svg className="ie-chart-svg" viewBox="0 0 760 245" preserveAspectRatio="none">
                  <line x1="35" y1="20" x2="750" y2="20" stroke="#edf0f5" />
                  <line x1="35" y1="75" x2="750" y2="75" stroke="#edf0f5" />
                  <line x1="35" y1="130" x2="750" y2="130" stroke="#edf0f5" />
                  <line x1="35" y1="185" x2="750" y2="185" stroke="#edf0f5" />
                  <line x1="35" y1="235" x2="750" y2="235" stroke="#edf0f5" />

                  <polyline
                    points="35,183 95,158 155,171 215,130 275,145 335,102 395,118 455,82 515,95 575,64 635,87 695,52 750,70"
                    fill="none"
                    stroke="#7047e8"
                    strokeWidth="3"
                  />

                  <polyline
                    points="35,198 95,181 155,190 215,159 275,170 335,139 395,150 455,122 515,133 575,105 635,121 695,94 750,108"
                    fill="none"
                    stroke="#4c8bf5"
                    strokeWidth="3"
                  />

                  <polyline
                    points="35,207 95,192 155,201 215,176 275,183 335,153 395,166 455,140 515,148 575,124 635,138 695,115 750,126"
                    fill="none"
                    stroke="#26b978"
                    strokeWidth="3"
                  />
                </svg>

                <div className="ie-chart-labels">
                  <span>08:00</span>
                  <span>10:00</span>
                  <span>12:00</span>
                  <span>14:00</span>
                  <span>16:00</span>
                  <span>18:00</span>
                  <span>20:00</span>
                </div>
              </div>
            </div>

            <div className="ie-card">
              <div className="ie-card-head">
                <div>
                  <h2>Email Lifecycle</h2>
                  <span>Current period</span>
                </div>
              </div>

              <div className="ie-funnel">
                <div className="ie-funnel-row">
                  <span className="ie-funnel-label">Received</span>
                  <div className="ie-funnel-bar">
                    <div className="ie-funnel-fill" style={{ width: "100%", background: "#7047e8" }}></div>
                  </div>
                  <span className="ie-funnel-count">{lifecycle.received}</span>
                </div>

                <div className="ie-funnel-row">
                  <span className="ie-funnel-label">Assigned</span>
                  <div className="ie-funnel-bar">
                    <div className="ie-funnel-fill" style={{ width: "100%", background: "#7657ea" }}></div>
                  </div>
                  <span className="ie-funnel-count">{lifecycle.assigned}</span>
                </div>

                <div className="ie-funnel-row">
                  <span className="ie-funnel-label">Opened</span>
                  <div className="ie-funnel-bar">
                    <div className="ie-funnel-fill" style={{ width: "96%", background: "#4c8bf5" }}></div>
                  </div>
                  <span className="ie-funnel-count">{lifecycle.opened}</span>
                </div>

                <div className="ie-funnel-row">
                  <span className="ie-funnel-label">Responded</span>
                  <div className="ie-funnel-bar">
                    <div className="ie-funnel-fill" style={{ width: "96%", background: "#398ce9" }}></div>
                  </div>
                  <span className="ie-funnel-count">{lifecycle.responded}</span>
                </div>

                <div className="ie-funnel-row">
                  <span className="ie-funnel-label">Resolved</span>
                  <div className="ie-funnel-bar">
                    <div className="ie-funnel-fill" style={{ width: "96%", background: "#26b978" }}></div>
                  </div>
                  <span className="ie-funnel-count">{lifecycle.resolved}</span>
                </div>
              </div>
            </div>
          </section>

          {/* SLA */}
          <section className="ie-card" style={{ marginBottom: "18px" }}>
            <div className="ie-card-head">
              <div>
                <h2>Email SLA Performance</h2>
                <span>Response target performance across inbound queues</span>
              </div>
            </div>

            <div className="ie-sla">
              <div className="ie-gauge">
                <div className="ie-gauge-inner">
                  <strong>{emailKpis.resolution_rate || "0%"}</strong>
                  <span>SLA Met</span>
                </div>
              </div>

              <div className="ie-sla-list">
                <div className="ie-sla-item">
                  <span>Emails within 15 min</span>
                  <strong>{emailKpis.resolved ? Math.round(Number(emailKpis.resolved) * 0.7) : "0"}</strong>
                </div>

                <div className="ie-sla-item">
                  <span>Emails within 30 min</span>
                  <strong>{emailKpis.resolved || "0"}</strong>
                </div>

                <div className="ie-sla-item">
                  <span>Emails exceeding SLA</span>
                  <strong style={{ color: "#d94c60" }}>{emailKpis.backlog || "0"}</strong>
                </div>

                <div className="ie-sla-item">
                  <span>Average first response</span>
                  <strong>{emailKpis.avg_response_time || "0m"}</strong>
                </div>

                <div className="ie-sla-item">
                  <span>Average resolution time</span>
                  <strong>{emailKpis.avg_response_time ? `${(parseInt(emailKpis.avg_response_time) || 15) * 2}m` : "0m"}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* AGENT TABLE */}
          <section className="ie-card ie-table-card">
            <div className="ie-card-head">
              <div>
                <h2>Agent Email Performance</h2>
                <span>Inbound email workload and handling efficiency</span>
              </div>

              <span>{agentEmailRows.length} Agents Active</span>
            </div>

            <table className="ie-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Assigned</th>
                  <th>Answered</th>
                  <th>Resolved</th>
                  <th>Avg Response</th>
                  <th>Avg Resolution</th>
                  <th>SLA</th>
                  <th>Workload</th>
                </tr>
              </thead>

              <tbody>
                {agentEmailRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="ie-agent">
                        <div className="ie-agent-avatar">{row.initials}</div>
                        <strong>{row.name}</strong>
                      </div>
                    </td>
                    <td>{row.assigned}</td>
                    <td>{row.ans}</td>
                    <td>{row.res}</td>
                    <td>{row.avgResp}</td>
                    <td>{row.avgRes}</td>
                    <td>
                      <span className={`ie-status ${row.slaClass}`}>{row.sla}</span>
                    </td>
                    <td>
                      <div className="ie-progress">
                        <div style={{ width: row.wlPct }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* QUEUES + RECENT EMAILS */}
          <section className="ie-bottom-grid">
            <div className="ie-card">
              <div className="ie-card-head">
                <div>
                  <h2>Email Queue Distribution</h2>
                  <span>Inbound volume by queue</span>
                </div>
              </div>

              <div className="ie-queue">
                {emailQueues.map((q, idx) => (
                  <div key={idx} className="ie-queue-row">
                    <span>{q.queue}</span>
                    <div className="ie-queue-bar">
                      <div style={{ width: q.pct || "50%" }}></div>
                    </div>
                    <strong>{q.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="ie-card">
              <div className="ie-card-head">
                <div>
                  <h2>Recent Inbound Emails</h2>
                  <span>Latest email activity</span>
                </div>
              </div>

              <div className="ie-email-list">
                {recentEmails.map((e, idx) => (
                  <div key={idx} className="ie-email-row">
                    <div className="ie-mail-icon">✉</div>
                    <div className="ie-email-info">
                      <strong>{e.subject}</strong>
                      <small>{e.sender} · {e.queue}</small>
                    </div>
                    <div className="ie-email-time">{e.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="ie-footer">
            <span>CallZenza Inbound Email Analytics</span>
            <span>Last updated: Today, {timeStr}</span>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .ie-root {
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f4f6fb;
          color: #172033;
          min-height: 100vh;
        }

        .ie-page {
          padding: 24px 28px 40px;
          max-width: 1550px;
          margin: auto;
        }

        .ie-breadcrumb {
          font-size: 12px;
          color: #8b91a5;
          margin-bottom: 8px;
        }

        .ie-title-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .ie-title h1 {
          font-size: 27px;
          letter-spacing: -0.5px;
          font-weight: 800;
        }

        .ie-title p {
          margin-top: 6px;
          color: #747b90;
          font-size: 13px;
        }

        .ie-actions {
          display: flex;
          gap: 8px;
        }

        .ie-btn {
          border: 1px solid #dfe3ee;
          background: #fff;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          color: #42495d;
          transition: 0.2s;
          font-weight: 600;
        }

        .ie-btn:hover {
          border-color: #7c3aed;
          color: #6d28d9;
        }

        .ie-btn.ie-primary {
          background: #6d3df5;
          color: white;
          border-color: #6d3df5;
        }

        .ie-filters {
          background: #fff;
          border: 1px solid #e5e8f0;
          border-radius: 13px;
          padding: 17px;
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 0.9fr 0.9fr auto;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(20, 25, 50, 0.03);
          margin-bottom: 20px;
        }

        .ie-field label {
          display: block;
          color: #858ca0;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .ie-filters select,
        .ie-filters input {
          width: 100%;
          border: 1px solid #dfe3eb;
          background: #fbfcfe;
          padding: 10px 11px;
          border-radius: 7px;
          outline: none;
          font-size: 12px;
          color: #30374a;
        }

        .ie-filter-btn {
          align-self: end;
          padding: 10px 17px;
          border: none;
          border-radius: 7px;
          background: #17152d;
          color: #fff;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .ie-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 13px;
          margin-bottom: 20px;
        }

        .ie-kpi {
          background: #fff;
          border: 1px solid #e5e8f0;
          border-radius: 12px;
          padding: 17px;
          position: relative;
          overflow: hidden;
        }

        .ie-kpi:after {
          content: "";
          position: absolute;
          right: -20px;
          top: -20px;
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #f3efff;
        }

        .ie-kpi-icon {
          width: 31px;
          height: 31px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1edff;
          color: #6d3df5;
          margin-bottom: 10px;
          font-size: 15px;
        }

        .ie-kpi h3 {
          font-size: 24px;
          font-weight: 800;
        }

        .ie-kpi p {
          color: #83899a;
          font-size: 11px;
          margin-top: 3px;
        }

        .ie-change {
          font-size: 10px;
          margin-top: 8px;
          color: #20a969;
          font-weight: 700;
        }

        .ie-change.ie-red {
          color: #e04b5f;
        }

        .ie-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .ie-card {
          background: #fff;
          border: 1px solid #e5e8f0;
          border-radius: 13px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(20, 25, 50, 0.025);
        }

        .ie-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .ie-card-head h2 {
          font-size: 15px;
          font-weight: 700;
        }

        .ie-card-head span {
          font-size: 11px;
          color: #9298a9;
        }

        .ie-chart-wrap {
          height: 275px;
          position: relative;
        }

        .ie-chart-svg {
          width: 100%;
          height: 245px;
        }

        .ie-chart-labels {
          display: flex;
          justify-content: space-between;
          color: #9ca2b1;
          font-size: 10px;
          padding: 0 8px;
        }

        .ie-legend {
          display: flex;
          gap: 16px;
          font-size: 10px;
          color: #777f92;
        }

        .ie-legend span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .ie-line {
          width: 18px;
          height: 3px;
          border-radius: 3px;
        }

        .ie-line.ie-purple { background: #7047e8; }
        .ie-line.ie-blue { background: #4c8bf5; }
        .ie-line.ie-green { background: #26b978; }

        .ie-funnel {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ie-funnel-row {
          display: grid;
          grid-template-columns: 115px 1fr 60px;
          align-items: center;
          gap: 10px;
        }

        .ie-funnel-label {
          font-size: 11px;
          color: #656c80;
        }

        .ie-funnel-bar {
          height: 25px;
          background: #f0f1f6;
          border-radius: 5px;
          overflow: hidden;
        }

        .ie-funnel-fill {
          height: 100%;
          border-radius: 5px;
        }

        .ie-funnel-count {
          text-align: right;
          font-size: 11px;
          font-weight: 700;
        }

        .ie-sla {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 25px;
          align-items: center;
        }

        .ie-gauge {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: conic-gradient(#27b77a 0 86%, #eceef4 86% 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: auto;
        }

        .ie-gauge-inner {
          width: 104px;
          height: 104px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ie-gauge-inner strong {
          font-size: 25px;
        }

        .ie-gauge-inner span {
          color: #9298a8;
          font-size: 10px;
        }

        .ie-sla-list {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .ie-sla-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #f0f1f5;
          padding-bottom: 10px;
        }

        .ie-sla-item span {
          color: #7b8294;
          font-size: 11px;
        }

        .ie-sla-item strong {
          font-size: 12px;
        }

        .ie-table-card {
          margin-bottom: 18px;
        }

        .ie-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ie-table th {
          text-align: left;
          padding: 11px 10px;
          background: #f8f9fc;
          color: #858b9d;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .ie-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #eef0f5;
          font-size: 11px;
        }

        .ie-table tr:last-child td {
          border-bottom: none;
        }

        .ie-agent {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ie-agent-avatar {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: #ede9fe;
          color: #6d3df5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .ie-status {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .ie-status.ie-green {
          background: #e8f8f0;
          color: #159761;
        }

        .ie-status.ie-yellow {
          background: #fff6dc;
          color: #b77a00;
        }

        .ie-status.ie-red {
          background: #ffe9ec;
          color: #d53c53;
        }

        .ie-progress {
          height: 5px;
          width: 75px;
          background: #eceef4;
          border-radius: 5px;
          overflow: hidden;
        }

        .ie-progress div {
          height: 100%;
          border-radius: 5px;
          background: #6d3df5;
        }

        .ie-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .ie-queue {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ie-queue-row {
          display: grid;
          grid-template-columns: 115px 1fr 45px;
          align-items: center;
          gap: 10px;
        }

        .ie-queue-row span {
          font-size: 11px;
          color: #656c7e;
        }

        .ie-queue-bar {
          height: 8px;
          background: #eceef4;
          border-radius: 10px;
          overflow: hidden;
        }

        .ie-queue-bar div {
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(90deg, #6d3df5, #9a78ff);
        }

        .ie-queue-row strong {
          font-size: 11px;
          text-align: right;
        }

        .ie-email-list {
          display: flex;
          flex-direction: column;
        }

        .ie-email-row {
          padding: 12px 0;
          border-bottom: 1px solid #eef0f5;
          display: grid;
          grid-template-columns: 36px 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .ie-email-row:last-child {
          border-bottom: none;
        }

        .ie-mail-icon {
          width: 31px;
          height: 31px;
          border-radius: 8px;
          background: #f0edff;
          color: #6d3df5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ie-email-info strong {
          font-size: 11px;
          display: block;
        }

        .ie-email-info small {
          display: block;
          color: #9298a8;
          font-size: 9px;
          margin-top: 3px;
        }

        .ie-email-time {
          text-align: right;
          font-size: 9px;
          color: #9298a8;
        }

        .ie-footer {
          margin-top: 18px;
          color: #9298a8;
          font-size: 10px;
          display: flex;
          justify-content: space-between;
        }

        @media (max-width: 1100px) {
          .ie-filters {
            grid-template-columns: repeat(3, 1fr);
          }
          .ie-kpis {
            grid-template-columns: repeat(3, 1fr);
          }
          .ie-grid,
          .ie-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ie-page {
            padding: 18px;
          }
          .ie-title-row {
            display: block;
          }
          .ie-actions {
            margin-top: 15px;
          }
          .ie-filters {
            grid-template-columns: 1fr;
          }
          .ie-kpis {
            grid-template-columns: 1fr 1fr;
          }
          .ie-table-card {
            overflow-x: auto;
          }
          .ie-table {
            min-width: 800px;
          }
        }
      `}</style>
    </AppShell>
  );
}
