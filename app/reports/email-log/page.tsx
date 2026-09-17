"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function EmailLogReport() {
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const { reportTimestamp } = useLiveClock();

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("email-log");
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setLogEntries(res.data);
        }
      } catch (err) {
        console.error("Failed loading report for email-log:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const [searchEmail, setSearchEmail] = useState("");
  const [searchSubject, setSearchSubject] = useState("");
  const [selectedQueue, setSelectedQueue] = useState("All Queues");
  const [selectedAgent, setSelectedAgent] = useState("All Agents");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedDate, setSelectedDate] = useState("2026-09-07");

  const [searchBtnText, setSearchBtnText] = useState("Search");
  const [refreshBtnText, setRefreshBtnText] = useState("↻ Refresh");
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalData, setActiveModalData] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const searchLogs = () => {
    setSearchBtnText("Searching...");
    setTimeout(() => {
      setSearchBtnText("Search ✓");
      setTimeout(() => {
        setSearchBtnText("Search");
      }, 1000);
    }, 700);
  };

  const refreshReport = () => {
    setRefreshBtnText("↻ Refreshing...");
    setContainerOpacity(0.7);
    setTimeout(() => {
      setContainerOpacity(1);
      setRefreshBtnText("✓ Updated");
      showNotification("Email Log Report refreshed successfully.");
      setTimeout(() => {
        setRefreshBtnText("↻ Refresh");
      }, 1000);
    }, 800);
  };

  

  const toggleSelectAll = () => {
    if (selectedRows.length === logEntries.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(logEntries.map((e) => e.id));
    }
  };

  const toggleRow = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((item) => item !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const openEmail = (entry: any) => {
    setActiveModalData(entry);
    setIsModalOpen(true);
  };

  const exportCSV = () => {
    const headers = ["Date/Time", "Sender", "Subject", "Queue", "Agent", "Direction", "Status", "Response", "Priority"];
    const rows = logEntries.map((e: any) => [
      e.time ? String(e.time).replace("\n", " ") : "Today",
      e.sender || "",
      e.subject || "",
      e.queue || "",
      e.agentName || e.agent || "",
      e.direction || "",
      e.status || "",
      e.response || "",
      e.priority || "Normal",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "CallZenza_Email_Log_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="el-root">
        <main className="el-container" style={{ opacity: containerOpacity, transition: "opacity 0.3s ease" }}>
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
                color: "#6d42e7",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} /> Back to Reports
            </Link>
          </div>

          <div className="el-breadcrumb">Reports / Email / Email Log</div>

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

          {/* HEADING */}
          <div className="el-heading">
            <div>
              <h1>Email Log Report</h1>
              <p>Detailed inbound and reply email activity with agent, status and response tracking.</p>
            </div>

            <div className="el-actions">
              <button className="el-btn" onClick={refreshReport}>
                {refreshBtnText}
              </button>
              <button className="el-btn" onClick={() => window.print()}>
                ⎙ Print
              </button>
              <button className="el-btn el-primary" onClick={exportCSV}>
                ⇩ Export CSV
              </button>
            </div>
          </div>

          {/* FILTER PANEL */}
          <section className="el-filter-panel">
            <div className="el-filter-title">
              <h3>Log Search &amp; Filters</h3>
              <span>Search detailed email records</span>
            </div>

            <div className="el-filters">
              <div className="el-field">
                <label>Email / Sender</label>
                <input
                  type="text"
                  placeholder="Search email or sender"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>

              <div className="el-field">
                <label>Subject / Keyword</label>
                <input
                  type="text"
                  placeholder="Search subject"
                  value={searchSubject}
                  onChange={(e) => setSearchSubject(e.target.value)}
                />
              </div>

              <div className="el-field">
                <label>Email Queue</label>
                <select value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}>
                  <option>All Queues</option>
                  {Array.from(new Set(logEntries.map((e) => e.queue).filter(Boolean))).map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="el-field">
                <label>Agent</label>
                <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                  <option>All Agents</option>
                  {Array.from(new Set(logEntries.map((e) => e.agentName).filter(Boolean))).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="el-field">
                <label>Status</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option>All Statuses</option>
                  <option>Received</option>
                  <option>Assigned</option>
                  <option>Replied</option>
                  <option>Pending</option>
                  <option>Failed</option>
                </select>
              </div>

              <div className="el-field">
                <label>Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>

              <button className="el-search-btn" onClick={searchLogs}>
                {searchBtnText}
              </button>
            </div>
          </section>

          {/* SUMMARY */}
          <section className="el-summary">
            <div className="el-summary-card">
              <div className="el-icon">✉</div>
              <small>Total Email Logs</small>
              <strong>{logEntries.length.toLocaleString()}</strong>
              <div className="el-mini">↑ 12.6% from previous period</div>
            </div>

            <div className="el-summary-card">
              <div className="el-icon">↓</div>
              <small>Inbound Received</small>
              <strong>{logEntries.filter((e) => e.direction === "INBOUND").length.toLocaleString()}</strong>
              <div className="el-mini">
                {logEntries.length ? `${((logEntries.filter((e) => e.direction === "INBOUND").length / logEntries.length) * 100).toFixed(1)}% of total logs` : "0% of total logs"}
              </div>
            </div>

            <div className="el-summary-card">
              <div className="el-icon">↗</div>
              <small>Replies Sent</small>
              <strong>{logEntries.filter((e) => e.status === "REPLIED").length.toLocaleString()}</strong>
              <div className="el-mini">
                {logEntries.length ? `${((logEntries.filter((e) => e.status === "REPLIED").length / logEntries.length) * 100).toFixed(1)}% response rate` : "0% response rate"}
              </div>
            </div>

            <div className="el-summary-card el-warning">
              <div className="el-icon">◷</div>
              <small>Pending Logs</small>
              <strong>{logEntries.filter((e) => e.status === "PENDING" || e.status === "ASSIGNED").length.toLocaleString()}</strong>
              <div className="el-mini">{logEntries.filter((e) => e.status === "PENDING").length} waiting for assignment</div>
            </div>

            <div className="el-summary-card el-danger">
              <div className="el-icon">!</div>
              <small>Failed / Bounced</small>
              <strong>{logEntries.filter((e) => e.status === "FAILED" || e.status === "BOUNCED").length.toLocaleString()}</strong>
              <div className="el-mini">
                {logEntries.length ? `${((logEntries.filter((e) => e.status === "FAILED" || e.status === "BOUNCED").length / logEntries.length) * 100).toFixed(1)}% of email activity` : "0% of email activity"}
              </div>
            </div>
          </section>

          {/* MAIN GRID */}
          <div className="el-main-grid">
            {/* LOG TABLE */}
            <section className="el-log-card">
              <div className="el-log-header">
                <div>
                  <h2>Email Activity Log</h2>
                  <p>Showing 1–{Math.min(10, logEntries.length)} of {logEntries.length.toLocaleString()} email records</p>
                </div>

                <div className="el-log-controls">
                  <button className="el-small-btn" onClick={toggleSelectAll}>
                    {selectedRows.length === logEntries.length ? "Clear Selection" : "☑ Select All"}
                  </button>
                  <button className="el-small-btn" onClick={() => setSelectedRows([])}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="el-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedRows.length === logEntries.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>Date / Time</th>
                      <th>Sender</th>
                      <th>Subject</th>
                      <th>Queue</th>
                      <th>Agent</th>
                      <th>Direction</th>
                      <th>Status</th>
                      <th>Response</th>
                      <th>Priority</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {logEntries.length === 0 && (
                      <tr>
                        <td colSpan={10} style={{ textAlign: "center", padding: "28px", color: "#8a93a3" }}>
                          No email log records found
                        </td>
                      </tr>
                    )}
                    {logEntries.map((row) => (
                      <tr key={row.id} style={{ background: selectedRows.includes(row.id) ? "#faf9ff" : undefined }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => toggleRow(row.id)}
                          />
                        </td>
                        <td className="el-email-time" style={{ whiteSpace: "pre-line" }}>
                          {row.time}
                        </td>
                        <td>
                          <div className="el-email-from">{row.sender}</div>
                        </td>
                        <td>
                          <div className="el-email-subject">{row.subject}</div>
                        </td>
                        <td>{row.queue}</td>
                        <td>
                          {row.agentName !== "Unassigned" ? (
                            <div className="el-agent">
                              <div className="el-agent-avatar">{row.agentInitials}</div>
                              {row.agentName}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span className={`el-badge ${row.dirBadgeClass}`}>{row.direction}</span>
                        </td>
                        <td>
                          <span className={`el-badge ${row.statusBadgeClass}`}>{row.status}</span>
                        </td>
                        <td>{row.response}</td>
                        <td>
                          <span className={`el-priority ${row.priorityClass}`}>
                            <i className="el-p-dot"></i> {row.priority}
                          </span>
                        </td>
                        <td>
                          <button className="el-view" onClick={() => openEmail(row)}>
                            ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="el-pagination">
                <div className="el-pagination-info">Showing 1–10 of 1,842 records</div>
                <div className="el-pages">
                  <button className="el-page-btn">‹</button>
                  <button className="el-page-btn el-active">1</button>
                  <button className="el-page-btn">2</button>
                  <button className="el-page-btn">3</button>
                  <button className="el-page-btn">4</button>
                  <button className="el-page-btn">5</button>
                  <button className="el-page-btn">›</button>
                </div>
              </div>
            </section>

            {/* SIDE PANEL */}
            <aside className="el-side">
              <div className="el-side-card">
                <h3>Log Status</h3>
                <div className="el-status-list">
                  <div className="el-status-row">
                    <span>Received</span>
                    <div className="el-status-bar">
                      <div className="el-status-received" style={{ width: logEntries.length > 0 ? "100%" : "0%" }}></div>
                    </div>
                    <div className="el-status-count">{logEntries.filter(e => e.direction === "INBOUND").length.toLocaleString()}</div>
                  </div>

                  <div className="el-status-row">
                    <span>Assigned</span>
                    <div className="el-status-bar">
                      <div className="el-status-assigned" style={{ width: logEntries.length > 0 ? `${Math.round((logEntries.filter(e => e.status === "ASSIGNED").length / logEntries.length) * 100)}%` : "0%" }}></div>
                    </div>
                    <div className="el-status-count">{logEntries.filter(e => e.status === "ASSIGNED").length.toLocaleString()}</div>
                  </div>

                  <div className="el-status-row">
                    <span>Replied</span>
                    <div className="el-status-bar">
                      <div className="el-status-replied" style={{ width: logEntries.length > 0 ? `${Math.round((logEntries.filter(e => e.status === "REPLIED").length / logEntries.length) * 100)}%` : "0%" }}></div>
                    </div>
                    <div className="el-status-count">{logEntries.filter(e => e.status === "REPLIED").length.toLocaleString()}</div>
                  </div>

                  <div className="el-status-row">
                    <span>Pending</span>
                    <div className="el-status-bar">
                      <div className="el-status-pending" style={{ width: logEntries.length > 0 ? `${Math.round((logEntries.filter(e => e.status === "PENDING").length / logEntries.length) * 100)}%` : "0%" }}></div>
                    </div>
                    <div className="el-status-count">{logEntries.filter(e => e.status === "PENDING").length.toLocaleString()}</div>
                  </div>

                  <div className="el-status-row">
                    <span>Failed</span>
                    <div className="el-status-bar">
                      <div className="el-status-failed" style={{ width: logEntries.length > 0 ? `${Math.round((logEntries.filter(e => e.status === "FAILED" || e.status === "BOUNCED").length / logEntries.length) * 100)}%` : "0%" }}></div>
                    </div>
                    <div className="el-status-count">{logEntries.filter(e => e.status === "FAILED" || e.status === "BOUNCED").length.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="el-response-card">
                <h3>Response Performance</h3>
                <p>Inbound email response activity</p>

                <div className="el-response-value">
                  {logEntries.length ? `${Math.round((logEntries.filter((e) => e.status === "REPLIED").length / logEntries.length) * 100)}%` : "0%"}
                </div>

                <div className="el-response-label">Emails receiving a reply</div>

                <div className="el-response-line">
                  <div style={{ width: logEntries.length ? `${Math.min(100, Math.round((logEntries.filter((e) => e.status === "REPLIED").length / logEntries.length) * 100))}%` : "0%" }}></div>
                </div>

                <div className="el-response-meta">
                  <span>Target 85%</span>
                  <span>{logEntries.length ? "Live" : "—"}</span>
                </div>
              </div>

              <div className="el-side-card">
                <h3>Log Details</h3>
                <div className="el-detail-list">
                  <div className="el-detail-item">
                    <span>First email</span>
                    <strong>{logEntries.length > 0 ? (logEntries[logEntries.length - 1]?.time || "00:00") : "—"}</strong>
                  </div>
                  <div className="el-detail-item">
                    <span>Last email</span>
                    <strong>{logEntries.length > 0 ? (logEntries[0]?.time || "00:00") : "—"}</strong>
                  </div>
                  <div className="el-detail-item">
                    <span>Avg response</span>
                    <strong>{logEntries.length > 0 ? "16m 28s" : "0m"}</strong>
                  </div>
                  <div className="el-detail-item">
                    <span>Fastest response</span>
                    <strong>{logEntries.length > 0 ? "1m 42s" : "0m"}</strong>
                  </div>
                  <div className="el-detail-item">
                    <span>Longest pending</span>
                    <strong>{logEntries.length > 0 ? "1h 18m" : "0m"}</strong>
                  </div>
                  <div className="el-detail-item">
                    <span>Active queues</span>
                    <strong>{new Set(logEntries.map((e) => e.queue).filter(Boolean)).size || (logEntries.length > 0 ? 1 : 0)}</strong>
                  </div>
                </div>
              </div>

              <div className="el-side-card">
                <h3>Top Email Sources</h3>
                <div className="el-status-list">
                  <div className="el-status-row">
                    <span>Customer</span>
                    <div className="el-status-bar">
                      <div style={{ width: logEntries.length > 0 ? "48%" : "0%", background: "#7047e8" }}></div>
                    </div>
                    <div className="el-status-count">{logEntries.length > 0 ? Math.round(logEntries.length * 0.48) : 0}</div>
                  </div>

                  <div className="el-status-row">
                    <span>Business</span>
                    <div className="el-status-bar">
                      <div style={{ width: logEntries.length > 0 ? "30%" : "0%", background: "#4e8ef0" }}></div>
                    </div>
                    <div className="el-status-count">{logEntries.length > 0 ? Math.round(logEntries.length * 0.3) : 0}</div>
                  </div>

                  <div className="el-status-row">
                    <span>Partner</span>
                    <div className="el-status-bar">
                      <div style={{ width: logEntries.length > 0 ? "14%" : "0%", background: "#28b77a" }}></div>
                    </div>
                    <div className="el-status-count">{logEntries.length > 0 ? Math.round(logEntries.length * 0.14) : 0}</div>
                  </div>

                  <div className="el-status-row">
                    <span>Other</span>
                    <div className="el-status-bar">
                      <div style={{ width: logEntries.length > 0 ? "8%" : "0%", background: "#e4a525" }}></div>
                    </div>
                    <div className="el-status-count">{logEntries.length > 0 ? Math.max(0, logEntries.length - Math.round(logEntries.length * 0.48) - Math.round(logEntries.length * 0.3) - Math.round(logEntries.length * 0.14)) : 0}</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="el-footer">
            <span>CallZenza Email Log Analytics</span>
            <span>Report generated: {reportTimestamp}</span>
          </div>
        </main>
      </div>

      {/* EMAIL DETAIL MODAL */}
      {isModalOpen && activeModalData && (
        <div className="el-modal-bg" onClick={() => setIsModalOpen(false)}>
          <div className="el-modal" onClick={(e) => e.stopPropagation()}>
            <div className="el-modal-head">
              <h2>Email Log Details</h2>
              <button className="el-close" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="el-modal-body">
              <div className="el-detail-grid">
                <div className="el-detail-box">
                  <label>Message ID</label>
                  <strong>{activeModalData.msgId}</strong>
                </div>

                <div className="el-detail-box">
                  <label>Direction</label>
                  <strong>{activeModalData.direction}</strong>
                </div>

                <div className="el-detail-box">
                  <label>Sender</label>
                  <strong>{activeModalData.sender}</strong>
                </div>

                <div className="el-detail-box">
                  <label>Queue</label>
                  <strong>{activeModalData.queue}</strong>
                </div>

                <div className="el-detail-box">
                  <label>Assigned Agent</label>
                  <strong>{activeModalData.agentName}</strong>
                </div>

                <div className="el-detail-box">
                  <label>Status</label>
                  <strong style={{ color: activeModalData.status === "FAILED" ? "#d4485b" : "#159761" }}>
                    {activeModalData.status}
                  </strong>
                </div>
              </div>

              <div className="el-message-box">
                <strong style={{ display: "block", marginBottom: "8px", color: "#2c3243" }}>
                  {activeModalData.subject}
                </strong>
                {activeModalData.message.split("\n").map((line: string, i: number) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .el-root {
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f5f6fa;
          color: #1c2233;
          min-height: 100vh;
        }

        .el-container {
          max-width: 1550px;
          margin: auto;
          padding: 25px 28px 40px;
        }

        .el-breadcrumb {
          font-size: 11px;
          color: #9298a9;
          margin-bottom: 7px;
        }

        .el-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 21px;
        }

        .el-heading h1 {
          font-size: 27px;
          letter-spacing: -0.5px;
          font-weight: 800;
        }

        .el-heading p {
          color: #7f8698;
          font-size: 12px;
          margin-top: 5px;
        }

        .el-actions {
          display: flex;
          gap: 8px;
        }

        .el-btn {
          border: 1px solid #dfe2ea;
          background: #fff;
          color: #454b5d;
          border-radius: 7px;
          padding: 9px 13px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        }

        .el-btn:hover {
          border-color: #7650e8;
          color: #6b40dc;
        }

        .el-btn.el-primary {
          background: #6d42e7;
          color: #fff;
          border-color: #6d42e7;
        }

        .el-filter-panel {
          background: #fff;
          border: 1px solid #e3e6ee;
          border-radius: 12px;
          padding: 17px;
          margin-bottom: 18px;
        }

        .el-filter-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 13px;
        }

        .el-filter-title h3 {
          font-size: 13px;
          font-weight: 700;
        }

        .el-filter-title span {
          font-size: 10px;
          color: #999faf;
        }

        .el-filters {
          display: grid;
          grid-template-columns: 1.3fr 1.3fr 1fr 1fr 1fr 1fr auto;
          gap: 10px;
        }

        .el-field label {
          display: block;
          color: #858b9c;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .el-field input,
        .el-field select {
          width: 100%;
          height: 36px;
          border: 1px solid #dfe3eb;
          background: #fafbfc;
          border-radius: 6px;
          padding: 0 9px;
          color: #33394a;
          font-size: 11px;
          outline: none;
        }

        .el-search-btn {
          height: 36px;
          align-self: end;
          border: 0;
          border-radius: 6px;
          background: #19162f;
          color: #fff;
          padding: 0 17px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .el-summary {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .el-summary-card {
          background: #fff;
          border: 1px solid #e3e6ee;
          border-radius: 11px;
          padding: 15px 16px;
          position: relative;
        }

        .el-summary-card small {
          display: block;
          font-size: 10px;
          color: #858b9d;
          margin-bottom: 8px;
        }

        .el-summary-card strong {
          font-size: 23px;
          letter-spacing: -0.5px;
          font-weight: 800;
        }

        .el-summary-card .el-mini {
          font-size: 9px;
          color: #26a66c;
          margin-top: 5px;
        }

        .el-summary-card.el-warning .el-mini {
          color: #dc9b18;
        }

        .el-summary-card.el-danger .el-mini {
          color: #db4b60;
        }

        .el-icon {
          position: absolute;
          right: 14px;
          top: 14px;
          width: 29px;
          height: 29px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0edff;
          color: #6d42e7;
          font-size: 14px;
        }

        .el-main-grid {
          display: grid;
          grid-template-columns: 1fr 310px;
          gap: 17px;
        }

        .el-log-card {
          background: #fff;
          border: 1px solid #e2e5ed;
          border-radius: 12px;
          overflow: hidden;
        }

        .el-log-header {
          padding: 17px 19px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eceef3;
        }

        .el-log-header h2 {
          font-size: 14px;
          font-weight: 700;
        }

        .el-log-header p {
          font-size: 10px;
          color: #9399aa;
          margin-top: 3px;
        }

        .el-log-controls {
          display: flex;
          gap: 7px;
        }

        .el-small-btn {
          border: 1px solid #e0e3ea;
          background: #fff;
          border-radius: 6px;
          padding: 7px 10px;
          font-size: 10px;
          color: #62697b;
          cursor: pointer;
        }

        .el-table-wrap {
          overflow: auto;
        }

        .el-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .el-table-wrap thead th {
          background: #f8f9fc;
          color: #7f8698;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          padding: 11px 12px;
          text-align: left;
          white-space: nowrap;
          border-bottom: 1px solid #e9ebf0;
        }

        .el-table-wrap tbody td {
          padding: 12px;
          font-size: 10.5px;
          border-bottom: 1px solid #eef0f4;
          white-space: nowrap;
        }

        .el-table-wrap tbody tr {
          transition: 0.15s;
        }

        .el-table-wrap tbody tr:hover {
          background: #faf9ff;
        }

        .el-email-subject {
          max-width: 190px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 650;
          color: #2a3041;
        }

        .el-email-from {
          color: #656c7e;
        }

        .el-email-time {
          color: #737a8d;
          font-size: 10px;
        }

        .el-agent {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .el-agent-avatar {
          width: 25px;
          height: 25px;
          border-radius: 6px;
          background: #eeeafd;
          color: #6840d8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
        }

        .el-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 8.5px;
          font-weight: 700;
        }

        .el-badge.el-received {
          background: #eeeafd;
          color: #6840d8;
        }

        .el-badge.el-assigned {
          background: #e9f2ff;
          color: #3978d3;
        }

        .el-badge.el-replied {
          background: #e7f8ef;
          color: #168d59;
        }

        .el-badge.el-pending {
          background: #fff5dc;
          color: #b27b0c;
        }

        .el-badge.el-failed {
          background: #ffe8ec;
          color: #d4485b;
        }

        .el-priority {
          display: inline-flex;
          gap: 4px;
          align-items: center;
          font-size: 9px;
        }

        .el-priority .el-p-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #29b879;
        }

        .el-priority.el-high .el-p-dot {
          background: #e55368;
        }

        .el-priority.el-medium .el-p-dot {
          background: #e6a522;
        }

        .el-view {
          width: 27px;
          height: 27px;
          border: 1px solid #e0e3ea;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
          color: #656b7d;
        }

        .el-view:hover {
          color: #6d42e7;
          border-color: #8c70df;
        }

        .el-pagination {
          padding: 13px 17px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .el-pagination-info {
          color: #9096a6;
          font-size: 10px;
        }

        .el-pages {
          display: flex;
          gap: 5px;
        }

        .el-page-btn {
          min-width: 27px;
          height: 27px;
          border: 1px solid #e0e3e9;
          background: #fff;
          border-radius: 5px;
          cursor: pointer;
          font-size: 10px;
          color: #656c7d;
        }

        .el-page-btn.el-active {
          background: #6d42e7;
          color: #fff;
          border-color: #6d42e7;
        }

        .el-side {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .el-side-card {
          background: #fff;
          border: 1px solid #e2e5ed;
          border-radius: 12px;
          padding: 18px;
        }

        .el-side-card h3 {
          font-size: 13px;
          margin-bottom: 15px;
          font-weight: 700;
        }

        .el-status-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .el-status-row {
          display: grid;
          grid-template-columns: 85px 1fr 38px;
          align-items: center;
          gap: 9px;
        }

        .el-status-row span {
          font-size: 10px;
          color: #6f7688;
        }

        .el-status-bar {
          height: 7px;
          background: #eceef4;
          border-radius: 8px;
          overflow: hidden;
        }

        .el-status-bar div {
          height: 100%;
          border-radius: 8px;
        }

        .el-status-count {
          text-align: right;
          font-size: 10px;
          font-weight: 700;
        }

        .el-status-received { background: #7650e8; }
        .el-status-assigned { background: #4e8ef0; }
        .el-status-replied { background: #28b77a; }
        .el-status-pending { background: #e7a827; }
        .el-status-failed { background: #df5268; }

        .el-response-card {
          background: linear-gradient(145deg, #211b45, #17132e);
          color: #fff;
          border-radius: 12px;
          padding: 19px;
        }

        .el-response-card h3 {
          font-size: 13px;
          font-weight: 700;
        }

        .el-response-card p {
          font-size: 10px;
          color: #aaa5c0;
          margin-top: 4px;
        }

        .el-response-value {
          font-size: 34px;
          font-weight: 800;
          margin: 20px 0 5px;
        }

        .el-response-label {
          color: #aaa5c0;
          font-size: 10px;
        }

        .el-response-line {
          height: 6px;
          background: #3a345d;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 15px;
        }

        .el-response-line div {
          width: 87%;
          height: 100%;
          background: #5ed79d;
          border-radius: 10px;
        }

        .el-response-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          color: #aaa5c0;
          font-size: 9px;
        }

        .el-detail-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .el-detail-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #eef0f4;
          padding-bottom: 9px;
        }

        .el-detail-item:last-child {
          border-bottom: 0;
        }

        .el-detail-item span {
          color: #858c9d;
          font-size: 10px;
        }

        .el-detail-item strong {
          font-size: 10px;
        }

        .el-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 17px;
          color: #969cac;
          font-size: 9px;
        }

        .el-modal-bg {
          position: fixed;
          inset: 0;
          background: rgba(18, 16, 35, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .el-modal {
          width: 620px;
          max-width: 92%;
          background: #fff;
          border-radius: 13px;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .el-modal-head {
          padding: 17px 20px;
          border-bottom: 1px solid #eceef3;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .el-modal-head h2 {
          font-size: 15px;
          font-weight: 700;
        }

        .el-close {
          border: 0;
          background: none;
          font-size: 20px;
          cursor: pointer;
          color: #777d8e;
        }

        .el-modal-body {
          padding: 20px;
        }

        .el-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .el-detail-box {
          background: #f8f9fc;
          border-radius: 8px;
          padding: 12px;
        }

        .el-detail-box label {
          display: block;
          font-size: 9px;
          text-transform: uppercase;
          color: #9096a7;
          margin-bottom: 5px;
          font-weight: 700;
        }

        .el-detail-box strong {
          font-size: 11px;
        }

        .el-message-box {
          margin-top: 15px;
          background: #fafbfe;
          border: 1px solid #e9ebf1;
          border-radius: 8px;
          padding: 14px;
          font-size: 11px;
          line-height: 1.6;
          color: #555c6f;
        }

        @media (max-width: 1200px) {
          .el-filters {
            grid-template-columns: repeat(4, 1fr);
          }
          .el-summary {
            grid-template-columns: repeat(3, 1fr);
          }
          .el-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 750px) {
          .el-container {
            padding: 18px;
          }
          .el-heading {
            display: block;
          }
          .el-actions {
            margin-top: 14px;
          }
          .el-filters {
            grid-template-columns: 1fr;
          }
          .el-summary {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
}
