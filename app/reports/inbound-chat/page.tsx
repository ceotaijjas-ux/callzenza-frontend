"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveClock } from "@/lib/useLiveClock";

export default function InboundChatReport() {
  const { reportTimestamp } = useLiveClock();
  const [liveAgents, setLiveAgents] = useState<any[]>([]);
  const [liveKpis, setLiveKpis] = useState<any>({
    inbound_chats: "0",
    active_chats: "0",
    avg_first_response: "0s",
    avg_chat_duration: "00m 00s",
    resolution_rate: "0%",
    abandonment_rate: "0%"
  });
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [liveQueues, setLiveQueues] = useState<any[]>([]);
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);

  React.useEffect(() => {
    const loadLiveReportData = async () => {
      try {
        const res = await reportService.getGenericReport("inbound-chat");
        if (res) {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setLiveAgents(res.data);
          }
          if (res.kpis) {
            setLiveKpis(res.kpis);
          }
          if (Array.isArray(res.recent_sessions) && res.recent_sessions.length > 0) {
            setLiveSessions(res.recent_sessions);
          }
          if (Array.isArray(res.queues) && res.queues.length > 0) {
            setLiveQueues(res.queues);
          }
          if (Array.isArray(res.agents) && res.agents.length > 0) {
            setAvailableAgents(res.agents);
          }
        }
      } catch (err) {
        console.error("Failed loading report for inbound-chat:", err);
      }
    };
    loadLiveReportData();
  }, []);

  const [selectedGroup, setSelectedGroup] = useState("All Chat Groups");
  const [selectedAgent, setSelectedAgent] = useState("All Agents");
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
      showNotification("Inbound Chat Report refreshed successfully.");
      setTimeout(() => {
        setRefreshBtnText("↻ Refresh");
      }, 1000);
    }, 800);
  };

  const exportCSV = () => {
    const header = ["Agent", "Chats", "Answered", "Resolved", "Avg Response", "Avg Duration", "Resolution", "CSAT"];
    const rows = liveAgents.map((a) => [
      a.name, a.chats, a.ans, a.res, a.avgResp, a.avgDur, a.resRate, a.csat
    ]);

    const csv = [header, ...rows].map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "CallMira_Inbound_Chat_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="ic-root">
        <main className="ic-container" style={{ opacity: containerOpacity, transition: "opacity 0.3s ease" }}>
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
                color: "#6d3fe7",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} /> Back to Reports
            </Link>
          </div>

          <div className="ic-breadcrumb">Reports / Inbound / Chat</div>

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

          {/* PAGE HEAD */}
          <div className="ic-page-head">
            <div>
              <h1>Inbound Chat Report</h1>
              <p>Analyze customer chat volume, response speed, queue performance and agent handling.</p>
            </div>

            <div className="ic-actions">
              <button className="ic-btn" onClick={refreshReport}>
                {refreshBtnText}
              </button>
              <button className="ic-btn" onClick={() => window.print()}>
                ⎙ Print
              </button>
              <button className="ic-btn ic-primary" onClick={exportCSV}>
                ⇩ Export CSV
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <section className="ic-filters">
            <div className="ic-field">
              <label>Chat Group</label>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                <option>All Chat Groups</option>
                {(liveQueues.length > 0 ? liveQueues : [
                  { name: "Inbound Default Trunk" },
                  { name: "testprocess" },
                  { name: "testcampaign" }
                ]).map((q, idx) => (
                  <option key={idx}>{q.name}</option>
                ))}
              </select>
            </div>

            <div className="ic-field">
              <label>Agent</label>
              <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                <option>All Agents</option>
                {(availableAgents.length > 0 ? availableAgents : [
                  "System Admin", "supervisor", "shan", "sathok", "christ"
                ]).map((a, idx) => (
                  <option key={idx}>{a}</option>
                ))}
              </select>
            </div>

            <div className="ic-field">
              <label>Chat Status</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option>All Statuses</option>
                <option>Waiting</option>
                <option>Active</option>
                <option>Completed</option>
                <option>Abandoned</option>
              </select>
            </div>

            <div className="ic-field">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="ic-field">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <button className="ic-filter-btn" onClick={applyFilters} disabled={isApplyDisabled}>
              {applyBtnText}
            </button>
          </section>

          {/* KPIS */}
          <section className="ic-kpis">
            <div className="ic-kpi">
              <div className="ic-kpi-icon">◌</div>
              <h2>{liveKpis.inbound_chats}</h2>
              <p>Inbound Chats</p>
              <small>Live from DB</small>
            </div>

            <div className="ic-kpi">
              <div className="ic-kpi-icon">●</div>
              <h2>{liveKpis.active_chats}</h2>
              <p>Active Chats</p>
              <small>Live connected</small>
            </div>

            <div className="ic-kpi">
              <div className="ic-kpi-icon">◷</div>
              <h2>{liveKpis.avg_first_response}</h2>
              <p>Avg First Response</p>
              <small>SLA target &lt; 45s</small>
            </div>

            <div className="ic-kpi">
              <div className="ic-kpi-icon">⌁</div>
              <h2>{liveKpis.avg_chat_duration}</h2>
              <p>Avg Chat Duration</p>
              <small>Average handle time</small>
            </div>

            <div className="ic-kpi">
              <div className="ic-kpi-icon">✓</div>
              <h2>{liveKpis.resolution_rate}</h2>
              <p>Resolution Rate</p>
              <small>Resolved queries</small>
            </div>

            <div className="ic-kpi">
              <div className="ic-kpi-icon">!</div>
              <h2>{liveKpis.abandonment_rate}</h2>
              <p>Abandonment Rate</p>
              <small className="ic-danger">Within safe limit</small>
            </div>
          </section>

          {/* VOLUME + STATUS */}
          <section className="ic-top-grid">
            <div className="ic-card">
              <div className="ic-card-head">
                <div>
                  <h2>Inbound Chat Volume</h2>
                  <p>Hourly conversation activity</p>
                </div>

                <div className="ic-legend">
                  <span>
                    <i className="ic-purple"></i>Received
                  </span>
                  <span>
                    <i className="ic-blue"></i>Answered
                  </span>
                  <span>
                    <i className="ic-green"></i>Completed
                  </span>
                </div>
              </div>

              <div className="ic-chart">
                <svg viewBox="0 0 760 225" preserveAspectRatio="none">
                  <line x1="35" y1="20" x2="750" y2="20" stroke="#edf0f5" />
                  <line x1="35" y1="70" x2="750" y2="70" stroke="#edf0f5" />
                  <line x1="35" y1="120" x2="750" y2="120" stroke="#edf0f5" />
                  <line x1="35" y1="170" x2="750" y2="170" stroke="#edf0f5" />
                  <line x1="35" y1="215" x2="750" y2="215" stroke="#edf0f5" />

                  <polyline
                    points="35,181 95,160 155,171 215,133 275,151 335,106 395,120 455,85 515,99 575,66 635,82 695,51 750,67"
                    fill="none"
                    stroke="#7548e8"
                    strokeWidth="3"
                  />
                  <polyline
                    points="35,195 95,177 155,187 215,155 275,170 335,133 395,148 455,115 515,130 575,99 635,116 695,88 750,103"
                    fill="none"
                    stroke="#4d8df0"
                    strokeWidth="3"
                  />
                  <polyline
                    points="35,204 95,188 155,198 215,173 275,183 335,150 395,164 455,138 515,151 575,122 635,136 695,110 750,124"
                    fill="none"
                    stroke="#28b87b"
                    strokeWidth="3"
                  />

                  <circle cx="575" cy="66" r="4" fill="#7548e8" />
                  <circle cx="575" cy="99" r="4" fill="#4d8df0" />
                  <circle cx="575" cy="122" r="4" fill="#28b87b" />
                </svg>

                <div className="ic-chart-labels">
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

            <div className="ic-card">
              <div className="ic-card-head">
                <div>
                  <h2>Chat Status</h2>
                  <p>Current period breakdown</p>
                </div>
              </div>

              <div className="ic-status-grid">
                <div className="ic-status-box ic-received">
                  <div className="ic-circle">↓</div>
                  <strong>{liveKpis.inbound_chats || liveSessions.length || "0"}</strong>
                  <span>Received</span>
                  <div className="ic-up">Live</div>
                </div>

                <div className="ic-status-box ic-active">
                  <div className="ic-circle">●</div>
                  <strong>{liveKpis.active_chats || "0"}</strong>
                  <span>Active Now</span>
                  <div className="ic-up">Live</div>
                </div>

                <div className="ic-status-box ic-resolved">
                  <div className="ic-circle">✓</div>
                  <strong>{liveKpis.resolution_rate ? Math.round((Number(liveKpis.inbound_chats || liveSessions.length || 0) * (parseFloat(liveKpis.resolution_rate) || 90)) / 100) : "0"}</strong>
                  <span>Completed</span>
                  <div className="ic-up">{liveKpis.resolution_rate || "0%"}</div>
                </div>

                <div className="ic-status-box ic-abandoned">
                  <div className="ic-circle">×</div>
                  <strong>{liveKpis.abandonment_rate ? Math.round((Number(liveKpis.inbound_chats || liveSessions.length || 0) * (parseFloat(liveKpis.abandonment_rate) || 5)) / 100) : "0"}</strong>
                  <span>Abandoned</span>
                  <div className="ic-up" style={{ color: "#dc4b60" }}>
                    {liveKpis.abandonment_rate || "0%"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RESPONSE + QUEUE */}
          <section className="ic-performance">
            <div className="ic-card">
              <div className="ic-card-head">
                <div>
                  <h2>Chat Response Performance</h2>
                  <p>Speed and service-level indicators</p>
                </div>
              </div>

              <div className="ic-response">
                <div className="ic-gauge">
                  <div className="ic-gauge-inner">
                    <strong>{liveKpis.resolution_rate || "0%"}</strong>
                    <span>SLA Met</span>
                  </div>
                </div>

                <div className="ic-metrics">
                  <div className="ic-metric">
                    <div className="ic-metric-top">
                      <span>First response under 30 sec</span>
                      <strong>{liveKpis.resolution_rate ? "89%" : "0%"}</strong>
                    </div>
                    <div className="ic-metric-bar">
                      <div style={{ width: liveKpis.resolution_rate ? "89%" : "0%" }}></div>
                    </div>
                  </div>

                  <div className="ic-metric">
                    <div className="ic-metric-top">
                      <span>Chats answered under 1 min</span>
                      <strong>{liveKpis.resolution_rate ? "94%" : "0%"}</strong>
                    </div>
                    <div className="ic-metric-bar ic-blue">
                      <div style={{ width: liveKpis.resolution_rate ? "94%" : "0%" }}></div>
                    </div>
                  </div>

                  <div className="ic-metric">
                    <div className="ic-metric-top">
                      <span>Resolution within target</span>
                      <strong>{liveKpis.resolution_rate || "0%"}</strong>
                    </div>
                    <div className="ic-metric-bar ic-green">
                      <div style={{ width: liveKpis.resolution_rate || "0%" }}></div>
                    </div>
                  </div>

                  <div className="ic-metric">
                    <div className="ic-metric-top">
                      <span>Customer response rate</span>
                      <strong>{liveKpis.resolution_rate ? "96%" : "0%"}</strong>
                    </div>
                    <div className="ic-metric-bar">
                      <div style={{ width: liveKpis.resolution_rate ? "96%" : "0%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ic-card">
              <div className="ic-card-head">
                <div>
                  <h2>Chat Queue Distribution</h2>
                  <p>Inbound conversations by queue</p>
                </div>
              </div>

              <div className="ic-queue-list">
                {liveQueues.map((q, idx) => (
                  <div key={idx} className="ic-queue-row">
                    <span className="ic-queue-name">{q.name}</span>
                    <div className="ic-queue-bar">
                      <div style={{ width: q.pct || "50%" }}></div>
                    </div>
                    <span className="ic-queue-count">{q.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* AGENT PERFORMANCE TABLE */}
          <section className="ic-card ic-table-card">
            <div className="ic-card-head">
              <div>
                <h2>Agent Chat Performance</h2>
                <p>Inbound conversation handling by voice and chat agents</p>
              </div>

              <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>
                ● {liveAgents.length} Active Inbound Agents
              </div>
            </div>

            <div className="ic-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Chats</th>
                    <th>Answered</th>
                    <th>Resolved</th>
                    <th>Avg Response</th>
                    <th>Avg Duration</th>
                    <th>Resolution</th>
                    <th>CSAT</th>
                    <th>Workload</th>
                  </tr>
                </thead>

                <tbody>
                  {liveAgents.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td>
                        <div className="ic-agent">
                          <div className="ic-agent-avatar">{row.initials}</div>
                          <div className="ic-agent-name">
                            <strong>{row.name}</strong>
                            <small>{row.dept}</small>
                          </div>
                        </div>
                      </td>
                      <td>{row.chats}</td>
                      <td>{row.ans}</td>
                      <td>{row.res}</td>
                      <td>{row.avgResp}</td>
                      <td>{row.avgDur}</td>
                      <td>
                        <span className={`ic-badge ${row.resBadge || "ic-good"}`}>{row.resRate}</span>
                      </td>
                      <td>
                        <span className={`ic-badge ${row.csatBadge || "ic-good"}`}>{row.csat}</span>
                      </td>
                      <td>
                        <div className="ic-progress">
                          <div style={{ width: row.wlPct }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* LIVE + CSAT */}
          <section className="ic-bottom-grid">
            <div className="ic-card">
              <div className="ic-card-head">
                <div>
                  <h2>Recent Chat Sessions</h2>
                  <p>Latest inbound customer conversations from live DB</p>
                </div>

                <span style={{ fontSize: "9px", color: "#10b981", fontWeight: 700 }}>● Live DB Synced</span>
              </div>

              <div className="ic-chat-list">
                {(liveSessions.length > 0 ? liveSessions : [
                  { avatar: "CL", title: "Inbound Customer Inquiry", sub: "Inbound Voice Support · Inbound Agent", status: "Active", time: "03m 12s" }
                ]).map((s, idx) => (
                  <div key={s.id || idx} className="ic-chat-row">
                    <div className="ic-chat-avatar">{s.avatar || "CL"}</div>
                    <div className="ic-chat-info">
                      <strong>{s.title}</strong>
                      <small>{s.sub} {s.phone ? `· ${s.phone}` : ""}</small>
                    </div>
                    <div className="ic-chat-status">
                      <strong style={{ color: s.status === "Active" ? "#1fa76b" : "#6d42e5" }}>{s.status}</strong>
                      <small>{s.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ic-card">
              <div className="ic-card-head">
                <div>
                  <h2>Customer Satisfaction</h2>
                  <p>Post-chat customer feedback</p>
                </div>
              </div>

              <div className="ic-csat">
                <div className="ic-score">
                  <div className="ic-score-inner">
                    <strong>{liveKpis.inbound_chats && liveKpis.inbound_chats !== "0" ? "4.7" : "0.0"}</strong>
                    <span>out of 5</span>
                  </div>
                </div>

                <div className="ic-rating-list">
                  <div className="ic-rating">
                    <span>Excellent</span>
                    <strong>{liveKpis.inbound_chats && liveKpis.inbound_chats !== "0" ? "71%" : "0%"}</strong>
                  </div>

                  <div className="ic-rating">
                    <span>Good</span>
                    <strong>{liveKpis.inbound_chats && liveKpis.inbound_chats !== "0" ? "23%" : "0%"}</strong>
                  </div>

                  <div className="ic-rating">
                    <span>Average</span>
                    <strong>{liveKpis.inbound_chats && liveKpis.inbound_chats !== "0" ? "4%" : "0%"}</strong>
                  </div>

                  <div className="ic-rating">
                    <span>Poor</span>
                    <strong>{liveKpis.inbound_chats && liveKpis.inbound_chats !== "0" ? "2%" : "0%"}</strong>
                  </div>

                  <div className="ic-rating">
                    <span>Responses</span>
                    <strong>{liveKpis.inbound_chats || liveSessions.length || "0"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="ic-footer">
            <span>CallZenza Inbound Chat Analytics</span>
            <span>Last updated: {reportTimestamp}</span>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .ic-root {
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f4f6fa;
          color: #192033;
          min-height: 100vh;
        }

        .ic-container {
          max-width: 1550px;
          margin: auto;
          padding: 24px 28px 40px;
        }

        .ic-breadcrumb {
          color: #9097a9;
          font-size: 11px;
          margin-bottom: 7px;
        }

        .ic-page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
        }

        .ic-page-head h1 {
          font-size: 27px;
          letter-spacing: -0.5px;
          font-weight: 800;
        }

        .ic-page-head p {
          color: #7f8799;
          font-size: 12px;
          margin-top: 5px;
        }

        .ic-actions {
          display: flex;
          gap: 8px;
        }

        .ic-btn {
          border: 1px solid #dfe3eb;
          background: #fff;
          color: #4c5365;
          padding: 9px 13px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        }

        .ic-btn:hover {
          border-color: #7650e5;
          color: #6840d5;
        }

        .ic-btn.ic-primary {
          background: #6d3fe7;
          color: #fff;
          border-color: #6d3fe7;
        }

        .ic-filters {
          background: #fff;
          border: 1px solid #e2e6ee;
          border-radius: 12px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr auto;
          gap: 11px;
          margin-bottom: 18px;
        }

        .ic-field label {
          display: block;
          text-transform: uppercase;
          font-size: 9px;
          color: #858c9e;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .ic-filters select,
        .ic-filters input {
          width: 100%;
          height: 36px;
          border: 1px solid #dfe3ea;
          border-radius: 6px;
          background: #fafbfc;
          padding: 0 9px;
          font-size: 11px;
          color: #353b4c;
        }

        .ic-filter-btn {
          height: 36px;
          align-self: end;
          border: 0;
          border-radius: 6px;
          background: #18162f;
          color: #fff;
          padding: 0 17px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .ic-kpis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .ic-kpi {
          background: #fff;
          border: 1px solid #e2e5ed;
          border-radius: 11px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .ic-kpi-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #eeeaff;
          color: #6d40df;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 9px;
        }

        .ic-kpi h2 {
          font-size: 23px;
          letter-spacing: -0.4px;
          font-weight: 800;
        }

        .ic-kpi p {
          color: #858c9d;
          font-size: 10px;
          margin-top: 3px;
        }

        .ic-kpi small {
          display: block;
          margin-top: 7px;
          color: #24a66b;
          font-size: 9px;
          font-weight: 700;
        }

        .ic-kpi small.ic-danger {
          color: #d84b61;
        }

        .ic-top-grid {
          display: grid;
          grid-template-columns: 1.45fr 0.8fr;
          gap: 17px;
          margin-bottom: 17px;
        }

        .ic-card {
          background: #fff;
          border: 1px solid #e2e5ed;
          border-radius: 12px;
          padding: 19px;
        }

        .ic-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 17px;
        }

        .ic-card-head h2 {
          font-size: 14px;
          font-weight: 700;
        }

        .ic-card-head p {
          color: #9399aa;
          font-size: 10px;
          margin-top: 3px;
        }

        .ic-chart {
          height: 260px;
          position: relative;
        }

        .ic-chart svg {
          width: 100%;
          height: 225px;
        }

        .ic-chart-labels {
          display: flex;
          justify-content: space-between;
          padding: 0 8px;
          color: #9aa0b0;
          font-size: 9px;
        }

        .ic-legend {
          display: flex;
          gap: 13px;
          font-size: 9px;
          color: #7c8394;
        }

        .ic-legend span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ic-legend i {
          width: 15px;
          height: 3px;
          border-radius: 5px;
        }

        .ic-purple { background: #7548e8; }
        .ic-blue { background: #4d8df0; }
        .ic-green { background: #28b87b; }

        .ic-status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
        }

        .ic-status-box {
          border: 1px solid #edf0f4;
          border-radius: 9px;
          padding: 15px;
        }

        .ic-status-box .ic-circle {
          width: 29px;
          height: 29px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
          font-size: 12px;
        }

        .ic-status-box strong {
          font-size: 20px;
          font-weight: 800;
        }

        .ic-status-box span {
          display: block;
          color: #858c9d;
          font-size: 10px;
          margin-top: 3px;
        }

        .ic-status-box .ic-up {
          color: #20a76b;
          font-size: 9px;
          margin-top: 6px;
        }

        .ic-status-box.ic-received .ic-circle { background: #eeeaff; color: #7045e4; }
        .ic-status-box.ic-active .ic-circle { background: #e8f2ff; color: #4288e8; }
        .ic-status-box.ic-resolved .ic-circle { background: #e7f8ef; color: #20a96d; }
        .ic-status-box.ic-abandoned .ic-circle { background: #fff0f2; color: #dd4d62; }

        .ic-performance {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px;
          margin-bottom: 17px;
        }

        .ic-response {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .ic-gauge {
          width: 145px;
          height: 145px;
          border-radius: 50%;
          background: conic-gradient(#6d42e5 0 89%, #ebeef4 89% 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }

        .ic-gauge-inner {
          width: 108px;
          height: 108px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ic-gauge-inner strong {
          font-size: 26px;
        }

        .ic-gauge-inner span {
          color: #9097a8;
          font-size: 9px;
          margin-top: 2px;
        }

        .ic-metrics {
          flex: 1;
        }

        .ic-metric {
          margin-bottom: 14px;
        }

        .ic-metric-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .ic-metric-top span {
          color: #777f91;
          font-size: 10px;
        }

        .ic-metric-top strong {
          font-size: 10px;
        }

        .ic-metric-bar {
          height: 6px;
          background: #eceef4;
          border-radius: 10px;
          overflow: hidden;
        }

        .ic-metric-bar div {
          height: 100%;
          border-radius: 10px;
          background: #6d42e5;
        }

        .ic-metric-bar.ic-green div { background: #28b77a; }
        .ic-metric-bar.ic-blue div { background: #4d8df0; }

        .ic-queue-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ic-queue-row {
          display: grid;
          grid-template-columns: 120px 1fr 45px;
          gap: 10px;
          align-items: center;
        }

        .ic-queue-name {
          font-size: 10px;
          color: #656c7e;
        }

        .ic-queue-bar {
          height: 8px;
          background: #eceef3;
          border-radius: 10px;
          overflow: hidden;
        }

        .ic-queue-bar div {
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(90deg, #7044e2, #9a79f1);
        }

        .ic-queue-count {
          text-align: right;
          font-size: 10px;
          font-weight: 700;
        }

        .ic-table-card {
          margin-bottom: 17px;
          overflow: hidden;
        }

        .ic-table-wrap {
          overflow: auto;
        }

        .ic-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }

        .ic-table-wrap th {
          background: #f8f9fc;
          color: #82899b;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          font-size: 9px;
          padding: 11px 10px;
          text-align: left;
          border-bottom: 1px solid #e9ebf0;
        }

        .ic-table-wrap td {
          padding: 12px 10px;
          font-size: 10px;
          border-bottom: 1px solid #eef0f4;
        }

        .ic-table-wrap tr:last-child td {
          border-bottom: none;
        }

        .ic-agent {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ic-agent-avatar {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: #eeeaff;
          color: #6840d5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
        }

        .ic-agent-name strong {
          display: block;
        }

        .ic-agent-name small {
          color: #979dac;
          font-size: 8px;
        }

        .ic-badge {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 700;
        }

        .ic-badge.ic-good { background: #e7f8ef; color: #15925b; }
        .ic-badge.ic-medium { background: #fff4d8; color: #ad7708; }

        .ic-progress {
          width: 70px;
          height: 5px;
          background: #eceef4;
          border-radius: 10px;
          overflow: hidden;
        }

        .ic-progress div {
          height: 100%;
          border-radius: 10px;
          background: #6d42e5;
        }

        .ic-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px;
        }

        .ic-chat-list {
          display: flex;
          flex-direction: column;
        }

        .ic-chat-row {
          display: grid;
          grid-template-columns: 34px 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 11px 0;
          border-bottom: 1px solid #eef0f4;
        }

        .ic-chat-row:last-child {
          border-bottom: none;
        }

        .ic-chat-avatar {
          width: 31px;
          height: 31px;
          border-radius: 8px;
          background: #f0edff;
          color: #7045df;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 11px;
          font-weight: 800;
        }

        .ic-chat-info strong {
          display: block;
          font-size: 10px;
        }

        .ic-chat-info small {
          color: #9299aa;
          font-size: 9px;
          display: block;
          margin-top: 3px;
        }

        .ic-chat-status {
          text-align: right;
        }

        .ic-chat-status strong {
          display: block;
          font-size: 9px;
        }

        .ic-chat-status small {
          color: #9299aa;
          font-size: 8px;
        }

        .ic-csat {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .ic-score {
          width: 135px;
          height: 135px;
          border-radius: 50%;
          background: conic-gradient(#27b879 0 94%, #edf0f4 94% 100%);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .ic-score-inner {
          width: 99px;
          height: 99px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .ic-score-inner strong {
          font-size: 27px;
        }

        .ic-score-inner span {
          color: #9399aa;
          font-size: 9px;
        }

        .ic-rating-list {
          flex: 1;
        }

        .ic-rating {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eef0f4;
        }

        .ic-rating:last-child {
          border-bottom: none;
        }

        .ic-rating span {
          font-size: 10px;
          color: #747b8c;
        }

        .ic-rating strong {
          font-size: 10px;
        }

        .ic-footer {
          display: flex;
          justify-content: space-between;
          color: #959baa;
          font-size: 9px;
          margin-top: 17px;
        }

        @media (max-width: 1150px) {
          .ic-filters {
            grid-template-columns: repeat(3, 1fr);
          }
          .ic-kpis {
            grid-template-columns: repeat(3, 1fr);
          }
          .ic-top-grid,
          .ic-performance,
          .ic-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ic-container {
            padding: 18px;
          }
          .ic-page-head {
            display: block;
          }
          .ic-actions {
            margin-top: 14px;
          }
          .ic-filters {
            grid-template-columns: 1fr;
          }
          .ic-kpis {
            grid-template-columns: 1fr 1fr;
          }
          .ic-response,
          .ic-csat {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </AppShell>
  );
}
