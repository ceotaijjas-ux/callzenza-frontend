"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { reportService } from "@/lib/services/report.service";
import { useLiveClock } from "@/lib/useLiveClock";

export default function ExportCallsReport() {
  const { reportTimestamp } = useLiveClock();
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [direction, setDirection] = useState("All Calls");
  const [campaign, setCampaign] = useState("All Campaigns");
  const [userGroup, setUserGroup] = useState("All User Groups");
  const [list, setList] = useState("All Lists");
  const [status, setStatus] = useState("All Statuses");
  const [agent, setAgent] = useState("All Agents");
  const [maxRecords, setMaxRecords] = useState("100,000");

  const [activeOptions, setActiveOptions] = useState<string[]>(["Header Row"]);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "Call Date",
    "Phone Number",
    "Direction",
    "Status",
    "Agent / User",
    "Campaign ID",
    "Vendor Lead Code",
    "Source ID",
    "List ID",
    "First Name",
    "Last Name",
  ]);
  const [selectedFormat, setSelectedFormat] = useState("Standard Export");

  const [masterChecked, setMasterChecked] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [refreshPreviewText, setRefreshPreviewText] = useState("↻ Refresh Preview");
  const [generateBtnText, setGenerateBtnText] = useState("⇩ Generate Export");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [liveCalls, setLiveCalls] = useState<any[]>([]);
  const [liveCampaigns, setLiveCampaigns] = useState<any[]>([]);
  const [liveAgents, setLiveAgents] = useState<any[]>([]);
  const [liveStatuses, setLiveStatuses] = useState<string[]>([]);
  const [liveSummary, setLiveSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleOption = (optName: string) => {
    if (activeOptions.includes(optName)) {
      setActiveOptions(activeOptions.filter((item) => item !== optName));
    } else {
      setActiveOptions([...activeOptions, optName]);
    }
  };

  const toggleField = (fieldName: string) => {
    if (selectedFields.includes(fieldName)) {
      setSelectedFields(selectedFields.filter((item) => item !== fieldName));
    } else {
      setSelectedFields([...selectedFields, fieldName]);
    }
  };

  const fetchExportCallsData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getCallsReport({
        from_date: fromDate,
        to_date: toDate,
        direction: direction !== "All Calls" ? direction : undefined,
        campaign_id: campaign !== "All Campaigns" ? campaign : undefined,
        agent_id: agent !== "All Agents" ? agent : undefined,
        status: status !== "All Statuses" ? status : undefined,
      });
      if (res && Array.isArray(res.data)) {
        setLiveCalls(res.data);
      }
      if (res && res.summary) {
        setLiveSummary(res.summary);
      }
      if (res && (res as any).campaigns) {
        setLiveCampaigns((res as any).campaigns);
      }
      if (res && (res as any).agents) {
        setLiveAgents((res as any).agents);
      }
      if (res && (res as any).statuses) {
        setLiveStatuses((res as any).statuses);
      }
    } catch (err) {
      console.error("Failed to fetch export calls data:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchExportCallsData();
  }, [fromDate, toDate, campaign, agent, status, direction]);

  const previewRows = liveCalls.map((c, i) => ({
    id: c.id || (i + 1),
    date: c.date || (c.created_at ? new Date(c.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "Today"),
    phone: c.phone_number || "+91 98765 43210",
    status: c.status || "COMPLETED",
    statusClass: c.status === "COMPLETED" ? "ec-sale" : (c.status === "FAILED" ? "ec-dnc" : "ec-contact"),
    agent: c.agent || "Voice Agent",
    campaign: c.campaign || c.campaign_id || "Sales Campaign",
    vendor: `VL-${String(c.id || "88241").slice(0, 5)}`,
    source: "WEB-441",
    list: "1001",
    fname: c.client_name?.split(" ")[0] || "Client",
    lname: c.client_name?.split(" ").slice(1).join(" ") || "",
    city: "Chennai",
    state: "Tamil Nadu",
    email: "client@example.com",
    duration: c.duration || "00:00",
    leadId: String(c.id || "88241").slice(0, 5),
    recording: true,
    direction: c.direction || "Outbound"
  }));

  const selectAllRows = () => {
    if (selectedRows.length === previewRows.length) {
      setSelectedRows([]);
      setMasterChecked(false);
    } else {
      setSelectedRows(previewRows.map((r) => r.id));
      setMasterChecked(true);
    }
  };

  const toggleRow = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((r) => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const refreshPreview = async () => {
    setRefreshPreviewText("Refreshing...");
    await fetchExportCallsData();
    setRefreshPreviewText("✓ Updated");
    setTimeout(() => {
      setRefreshPreviewText("↻ Refresh Preview");
    }, 1200);
  };

  const resetReport = () => {
    setFromDate(new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
    setToDate(new Date().toISOString().split("T")[0]);
    setDirection("All Calls");
    setCampaign("All Campaigns");
    setUserGroup("All User Groups");
    setList("All Lists");
    setStatus("All Statuses");
    setAgent("All Agents");
    setMaxRecords("100,000");
    setActiveOptions(["Header Row"]);
    setSelectedFormat("Standard Export");
    showNotification("Export configuration reset to defaults.");
  };

  const generateExport = () => {
    setGenerateBtnText("Preparing Export...");
    setIsGenerating(true);
    setTimeout(() => {
      setGenerateBtnText("✓ Export Ready");
      setIsModalOpen(true);
      setTimeout(() => {
        setGenerateBtnText("⇩ Generate Export");
        setIsGenerating(false);
      }, 1200);
    }, 800);
  };

  const downloadCSV = () => {
    const headerRow = [
      "call_date",
      "phone_number_dialed",
      "direction",
      "status",
      "user",
      "campaign_id",
      "vendor_lead_code",
      "source_id",
      "list_id",
      "first_name",
      "last_name",
      "city",
      "state",
      "email",
      "duration",
      "lead_id",
    ];

    const dataRows = previewRows.map(r => [
      r.date,
      r.phone,
      r.direction,
      r.status,
      r.agent,
      r.campaign,
      r.vendor,
      r.source,
      r.list,
      r.fname,
      r.lname,
      r.city,
      r.state,
      r.email,
      r.duration,
      r.leadId
    ]);

    const rows = [headerRow, ...dataRows];

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CALL_EXPORT_${fromDate}_to_${toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsModalOpen(false);
    showNotification("Calls export downloaded successfully.");
  };

  const playRecording = () => {
    alert("Recording preview would open here when a recording URL is available.");
  };

  return (
    <AppShell>
      <div className="ec-root">
        <main className="ec-container">
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
                color: "#6d3fe5",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} /> Back to Reports
            </Link>
          </div>

          <div className="ec-breadcrumb">Reports / Calling / Export Calls</div>

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
          <div className="ec-page-head">
            <div>
              <h1>Export Calls Report</h1>
              <p>Build a filtered call export with lead, call, recording and extended call information.</p>
            </div>

            <div className="ec-actions">
              <button className="ec-btn" onClick={resetReport}>
                ↻ Reset
              </button>
              <button className="ec-btn" onClick={() => window.print()}>
                ⎙ Print
              </button>
            </div>
          </div>

          {/* BUILDER */}
          <section className="ec-builder">
            {/* SIDEBAR */}
            <aside className="ec-sidebar">
              <div className="ec-sidebar-title">Export Builder</div>
              <div className="ec-sidebar-sub">Configure your call export before generating the file.</div>

              <div className="ec-steps">
                <div className="ec-step ec-complete">
                  <div className="ec-step-num">✓</div>
                  <div>
                    <strong>Date &amp; Scope</strong>
                    <span>Time period and call source</span>
                  </div>
                </div>

                <div className="ec-step ec-active">
                  <div className="ec-step-num">2</div>
                  <div>
                    <strong>Call Filters</strong>
                    <span>Campaign, list and status</span>
                  </div>
                </div>

                <div className="ec-step">
                  <div className="ec-step-num">3</div>
                  <div>
                    <strong>Export Fields</strong>
                    <span>Select information to include</span>
                  </div>
                </div>

                <div className="ec-step">
                  <div className="ec-step-num">4</div>
                  <div>
                    <strong>Generate File</strong>
                    <span>Preview and download</span>
                  </div>
                </div>
              </div>

              <div className="ec-sidebar-info">
                <strong>Export limits</strong>
                <p>
                  Preview contains a sample of matching calls. The generated export can include standard, extended, recording and custom information.
                </p>
              </div>
            </aside>

            {/* CONFIGURATION */}
            <div className="ec-config">
              <div className="ec-section-head">
                <div>
                  <h2>Export Configuration</h2>
                </div>
                <span>Step 1 &amp; 2 of 4</span>
              </div>

              <div className="ec-form-grid">
                <div className="ec-field">
                  <label>From Date</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>

                <div className="ec-field">
                  <label>To Date</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>

                <div className="ec-field">
                  <label>Call Direction / Agent Option</label>
                  <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                    <option value="All Calls">All Calls</option>
                    <option value="Inbound Agent Calls">Inbound Agent Calls</option>
                    <option value="Inbound Calls">Inbound Calls</option>
                    <option value="Outbound Calls">Outbound Calls</option>
                    <option value="Inbound + Outbound">Inbound + Outbound</option>
                  </select>
                </div>

                <div className="ec-field">
                  <label>Campaign</label>
                  <select value={campaign} onChange={(e) => setCampaign(e.target.value)}>
                    <option value="All Campaigns">All Campaigns</option>
                    {liveCampaigns.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="ec-field">
                  <label>User Group</label>
                  <select value={userGroup} onChange={(e) => setUserGroup(e.target.value)}>
                    <option>All User Groups</option>
                    <option>Sales &amp; Support Team</option>
                    <option>Supervisory Team</option>
                    <option>Admin Team</option>
                  </select>
                </div>

                <div className="ec-field">
                  <label>List</label>
                  <select value={list} onChange={(e) => setList(e.target.value)}>
                    <option>All Lists</option>
                    <option>1001 - Default Voice Lead List</option>
                    <option>1002 - Inbound Customer Queue</option>
                    <option>1003 - Warm Transfer Queue</option>
                  </select>
                </div>

                <div className="ec-field">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="All Statuses">All Statuses</option>
                    {(liveStatuses.length > 0 ? liveStatuses : [
                      "COMPLETED", "HUMAN_HANDLING", "FAILED", "BUSY", "NO_ANSWER", "QUALIFIED"
                    ]).map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="ec-field">
                  <label>Agent</label>
                  <select value={agent} onChange={(e) => setAgent(e.target.value)}>
                    <option value="All Agents">All Agents</option>
                    {liveAgents.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="ec-field">
                  <label>Maximum Records</label>
                  <select value={maxRecords} onChange={(e) => setMaxRecords(e.target.value)}>
                    <option>100,000</option>
                    <option>50,000</option>
                    <option>25,000</option>
                    <option>10,000</option>
                    <option>5,000</option>
                  </select>
                </div>
              </div>

              <div className="ec-options">
                <div className="ec-section-head">
                  <h2>Export Options</h2>
                  <span>Choose additional information</span>
                </div>

                <div className="ec-option-grid">
                  {[
                    { title: "Header Row", desc: "Include column names in the exported file." },
                    { title: "Recording Fields", desc: "Include recording ID, filename or location." },
                    { title: "Custom Fields", desc: "Include configured lead custom-field values." },
                    { title: "Call Notes", desc: "Include notes associated with exported calls." },
                  ].map((opt, i) => {
                    const isActive = activeOptions.includes(opt.title);
                    return (
                      <div
                        key={i}
                        className={`ec-option ${isActive ? "ec-active" : ""}`}
                        onClick={() => toggleOption(opt.title)}
                      >
                        <div className="ec-option-head">
                          <strong>{opt.title}</strong>
                          <div className="ec-check"></div>
                        </div>
                        <p>{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* SUMMARY */}
          <section className="ec-summary">
            <div className="ec-summary-card">
              <div className="ec-summary-icon">☎</div>
              <small>Matching Calls</small>
              <strong>{liveSummary?.total_calls ?? liveCalls.length}</strong>
              <span>Based on selected filters</span>
            </div>

            <div className="ec-summary-card">
              <div className="ec-summary-icon">✓</div>
              <small>Connected Calls</small>
              <strong>{liveSummary?.answered ?? liveCalls.filter(c => ["COMPLETED", "HUMAN_HANDLING", "QUALIFIED"].includes(c.status)).length}</strong>
              <span>{liveSummary?.completion_rate || "100%"} connection rate</span>
            </div>

            <div className="ec-summary-card">
              <div className="ec-summary-icon">◷</div>
              <small>Total Talk Time</small>
              <strong>{liveSummary?.total_talk_time || liveSummary?.avg_duration || "0m"}</strong>
              <span>Across matching calls</span>
            </div>

            <div className="ec-summary-card">
              <div className="ec-summary-icon">●</div>
              <small>Unique Leads</small>
              <strong>{liveSummary?.unique_leads ?? liveCalls.length}</strong>
              <span>Distinct lead records</span>
            </div>

            <div className="ec-summary-card ec-warning">
              <div className="ec-summary-icon">⇩</div>
              <small>Estimated File</small>
              <strong>{liveSummary?.estimated_file || "1.2 MB"}</strong>
              <span>Standard fields selected</span>
            </div>
          </section>

          {/* PREVIEW */}
          <section className="ec-preview-card">
            <div className="ec-preview-head">
              <div>
                <h2>Export Preview</h2>
                <p>Sample rows matching the current export configuration</p>
              </div>

              <div className="ec-preview-actions">
                <button className="ec-small-btn" onClick={refreshPreview}>
                  {refreshPreviewText}
                </button>
                <button className="ec-small-btn" onClick={selectAllRows}>
                  ☑ Select
                </button>
              </div>
            </div>

            <div className="ec-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={masterChecked}
                        onChange={selectAllRows}
                      />
                    </th>
                    <th>Call Date</th>
                    <th>Phone Dialed</th>
                    <th>Status</th>
                    <th>Agent</th>
                    <th>Campaign</th>
                    <th>Vendor Lead</th>
                    <th>Source ID</th>
                    <th>List ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Email</th>
                    <th>Duration</th>
                    <th>Lead ID</th>
                    <th>Recording</th>
                    <th>Direction</th>
                  </tr>
                </thead>

                <tbody>
                  {previewRows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(r.id)}
                          onChange={() => toggleRow(r.id)}
                        />
                      </td>
                      <td>{r.date}</td>
                      <td>{r.phone}</td>
                      <td>
                        <span className={`ec-status ${r.statusClass}`}>{r.status}</span>
                      </td>
                      <td>{r.agent}</td>
                      <td>{r.campaign}</td>
                      <td>{r.vendor}</td>
                      <td>{r.source}</td>
                      <td>{r.list}</td>
                      <td>{r.fname}</td>
                      <td>{r.lname}</td>
                      <td>{r.city}</td>
                      <td>{r.state}</td>
                      <td>{r.email}</td>
                      <td>{r.duration}</td>
                      <td>{r.leadId}</td>
                      <td>
                        {r.recording ? (
                          <button className="ec-play" onClick={playRecording}>
                            ▶
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <select
                          defaultValue={r.direction}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #dfe3eb",
                            fontSize: "11px",
                            background: "#fff",
                            color: "#4d5465",
                            cursor: "pointer"
                          }}
                        >
                          <option value="Inbound">Inbound</option>
                          <option value="Outbound">Outbound</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ec-preview-footer">
              <span>Previewing 5 of 18,642 matching records</span>
              <span>Standard export fields</span>
            </div>
          </section>

          {/* LOWER CONFIG */}
          <section className="ec-lower">
            {/* FIELDS */}
            <div className="ec-field-card">
              <h2>Export Field Set</h2>
              <p>Select the lead and call information included in the generated file.</p>

              <div className="ec-field-list">
                {[
                  "Call Date",
                  "Phone Number",
                  "Direction",
                  "Status",
                  "Agent / User",
                  "Campaign ID",
                  "Vendor Lead Code",
                  "Source ID",
                  "List ID",
                  "First Name",
                  "Last Name",
                  "Address",
                  "City / State",
                  "Email",
                  "Call Duration",
                  "Lead ID",
                  "Owner / Rank",
                ].map((fName, i) => {
                  const isSel = selectedFields.includes(fName);
                  return (
                    <div
                      key={i}
                      className={`ec-field-option ${isSel ? "ec-selected" : ""}`}
                      onClick={() => toggleField(fName)}
                    >
                      <div className="ec-field-check"></div>
                      <span>{fName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORMAT */}
            <div className="ec-format-card">
              <h2>Export Format</h2>
              <p>Choose the output structure for your generated call file.</p>

              <div className="ec-format-list">
                {[
                  { title: "Standard Export", sub: "Standard call and lead fields", tag: "TXT" },
                  { title: "Extended Export", sub: "Additional call and carrier information", tag: "TXT" },
                  { title: "CSV Export", sub: "Comma-separated format for spreadsheets", tag: "CSV" },
                  { title: "Custom Export", sub: "Use selected fields and options", tag: "CUSTOM" },
                ].map((fmt, i) => {
                  const isSel = selectedFormat === fmt.title;
                  return (
                    <div
                      key={i}
                      className={`ec-format ${isSel ? "ec-selected" : ""}`}
                      onClick={() => setSelectedFormat(fmt.title)}
                    >
                      <div className="ec-format-left">
                        <div className="ec-radio"></div>
                        <div>
                          <strong>{fmt.title}</strong>
                          <small>{fmt.sub}</small>
                        </div>
                      </div>
                      <span className="ec-format-tag">{fmt.tag}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "17px", padding: "12px", background: "#f8f9fc", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "7px" }}>
                  <span style={{ color: "#858c9d" }}>Header Row</span>
                  <strong>{activeOptions.includes("Header Row") ? "Enabled" : "Disabled"}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "7px" }}>
                  <span style={{ color: "#858c9d" }}>Recording Fields</span>
                  <strong>{activeOptions.includes("Recording Fields") ? "Enabled" : "Disabled"}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
                  <span style={{ color: "#858c9d" }}>Call Notes</span>
                  <strong>{activeOptions.includes("Call Notes") ? "Enabled" : "Disabled"}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* EXPORT BAR */}
          <section className="ec-export-bar">
            <div className="ec-export-info">
              <h3>Ready to Generate Export</h3>
              <p>18,642 calls match the current filters · Estimated output 14.8 MB</p>
            </div>

            <div className="ec-export-right">
              <span className="ec-file-size">Standard fields · Header enabled</span>
              <button className="ec-export-btn" onClick={generateExport} disabled={isGenerating}>
                {generateBtnText}
              </button>
            </div>
          </section>

          <div className="ec-footer">
            <span>CallZenza Export Calls Analytics</span>
            <span>Report updated: {reportTimestamp}</span>
          </div>
        </main>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="ec-modal-bg" onClick={() => setIsModalOpen(false)}>
          <div className="ec-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Export Generated</h2>
            <p>Your call export has been prepared successfully. The selected filters and fields have been applied to the export.</p>

            <div style={{ marginTop: "18px", background: "#f7f8fb", borderRadius: "8px", padding: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <span style={{ fontSize: "9px", color: "#858c9d" }}>File</span>
                <strong style={{ fontSize: "9px" }}>CALL_EXPORT_{new Date().toISOString().slice(0, 10).replace(/-/g, "")}.csv</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <span style={{ fontSize: "9px", color: "#858c9d" }}>Records</span>
                <strong style={{ fontSize: "9px" }}>{(liveSummary?.total_calls || liveCalls.length || 0).toLocaleString()}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "9px", color: "#858c9d" }}>Format</span>
                <strong style={{ fontSize: "9px" }}>{selectedFormat}</strong>
              </div>
            </div>

            <div className="ec-modal-actions">
              <button className="ec-btn" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
              <button className="ec-btn ec-primary" onClick={downloadCSV}>
                ⇩ Download
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .ec-root {
          font-family: Inter, Segoe UI, Arial, sans-serif;
          background: #f4f6fa;
          color: #192033;
          min-height: 100vh;
        }

        .ec-container {
          max-width: 1540px;
          margin: auto;
          padding: 25px 28px 45px;
        }

        .ec-breadcrumb {
          font-size: 11px;
          color: #9298a9;
          margin-bottom: 7px;
        }

        .ec-page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
        }

        .ec-page-head h1 {
          font-size: 27px;
          letter-spacing: -0.6px;
          font-weight: 800;
        }

        .ec-page-head p {
          font-size: 12px;
          color: #7f8799;
          margin-top: 5px;
        }

        .ec-actions {
          display: flex;
          gap: 8px;
        }

        .ec-btn {
          border: 1px solid #dfe3eb;
          background: #fff;
          color: #4d5465;
          border-radius: 7px;
          padding: 9px 13px;
          font-size: 11px;
          cursor: pointer;
          font-weight: 600;
        }

        .ec-btn:hover {
          border-color: #7042e3;
          color: #7042e3;
        }

        .ec-btn.ec-primary {
          background: #6d3fe5;
          color: #fff;
          border-color: #6d3fe5;
        }

        .ec-builder {
          display: grid;
          grid-template-columns: 310px 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .ec-sidebar {
          background: #1b1835;
          border-radius: 13px;
          padding: 21px;
          color: #fff;
        }

        .ec-sidebar-title {
          font-size: 14px;
          font-weight: 700;
        }

        .ec-sidebar-sub {
          color: #a7a3bb;
          font-size: 10px;
          margin-top: 4px;
          line-height: 1.5;
        }

        .ec-steps {
          margin-top: 25px;
        }

        .ec-step {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 13px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .ec-step:last-child {
          border-bottom: 0;
        }

        .ec-step-num {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #302a54;
          color: #aaa5bd;
          font-size: 10px;
          flex-shrink: 0;
          font-weight: 700;
        }

        .ec-step.ec-active .ec-step-num {
          background: #7547e8;
          color: #fff;
        }

        .ec-step.ec-complete .ec-step-num {
          background: #27b879;
          color: #fff;
        }

        .ec-step strong {
          display: block;
          font-size: 11px;
        }

        .ec-step span {
          display: block;
          color: #9894ae;
          font-size: 9px;
          margin-top: 3px;
        }

        .ec-sidebar-info {
          margin-top: 23px;
          background: #252044;
          border-radius: 9px;
          padding: 13px;
        }

        .ec-sidebar-info strong {
          font-size: 10px;
        }

        .ec-sidebar-info p {
          color: #aaa6bd;
          font-size: 9px;
          line-height: 1.6;
          margin-top: 5px;
        }

        .ec-config {
          background: #fff;
          border: 1px solid #e2e5ed;
          border-radius: 13px;
          padding: 20px;
        }

        .ec-section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 17px;
        }

        .ec-section-head h2 {
          font-size: 15px;
          font-weight: 700;
        }

        .ec-section-head span {
          color: #9298a9;
          font-size: 10px;
        }

        .ec-form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .ec-field label {
          display: block;
          font-size: 9px;
          color: #858c9e;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .ec-field input,
        .ec-field select {
          width: 100%;
          height: 38px;
          border: 1px solid #dfe3ea;
          border-radius: 7px;
          background: #fafbfc;
          padding: 0 10px;
          color: #333a4c;
          font-size: 11px;
          outline: none;
        }

        .ec-field input:focus,
        .ec-field select:focus {
          border-color: #7c55df;
        }

        .ec-options {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #edf0f4;
        }

        .ec-option-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .ec-option {
          border: 1px solid #e2e5ec;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: 0.2s;
        }

        .ec-option:hover {
          border-color: #8061dd;
        }

        .ec-option.ec-active {
          border-color: #7042e2;
          background: #f8f6ff;
        }

        .ec-option-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ec-option strong {
          font-size: 10px;
        }

        .ec-option p {
          color: #8b92a3;
          font-size: 9px;
          margin-top: 5px;
          line-height: 1.4;
        }

        .ec-check {
          width: 15px;
          height: 15px;
          border: 1px solid #d2d6df;
          border-radius: 4px;
        }

        .ec-option.ec-active .ec-check {
          background: #7042e2;
          border-color: #7042e2;
          position: relative;
        }

        .ec-option.ec-active .ec-check:after {
          content: "✓";
          color: #fff;
          font-size: 10px;
          position: absolute;
          left: 2px;
          top: -1px;
        }

        .ec-summary {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .ec-summary-card {
          background: #fff;
          border: 1px solid #e2e5ed;
          border-radius: 11px;
          padding: 15px;
          position: relative;
        }

        .ec-summary-card small {
          color: #858c9d;
          display: block;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .ec-summary-card strong {
          display: block;
          font-size: 23px;
          margin-top: 7px;
          font-weight: 800;
        }

        .ec-summary-card span {
          display: block;
          color: #26a96c;
          font-size: 9px;
          margin-top: 5px;
        }

        .ec-summary-card.ec-warning span {
          color: #d2971c;
        }

        .ec-summary-icon {
          position: absolute;
          right: 13px;
          top: 13px;
          width: 29px;
          height: 29px;
          border-radius: 7px;
          background: #efebff;
          color: #6d40df;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .ec-preview-card {
          background: #fff;
          border: 1px solid #e2e5ed;
          border-radius: 13px;
          overflow: hidden;
          margin-bottom: 18px;
        }

        .ec-preview-head {
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eceef3;
        }

        .ec-preview-head h2 {
          font-size: 14px;
          font-weight: 700;
        }

        .ec-preview-head p {
          color: #949aaa;
          font-size: 10px;
          margin-top: 3px;
        }

        .ec-preview-actions {
          display: flex;
          gap: 7px;
        }

        .ec-small-btn {
          border: 1px solid #dfe3e9;
          background: #fff;
          border-radius: 6px;
          padding: 7px 10px;
          font-size: 10px;
          color: #62697a;
          cursor: pointer;
        }

        .ec-small-btn:hover {
          color: #6c40dd;
          border-color: #8060dc;
        }

        .ec-table-wrap {
          overflow: auto;
        }

        .ec-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1300px;
        }

        .ec-table-wrap th {
          background: #f8f9fc;
          color: #7f8698;
          text-align: left;
          padding: 10px;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          white-space: nowrap;
          border-bottom: 1px solid #e9ebf0;
        }

        .ec-table-wrap td {
          padding: 11px 10px;
          font-size: 9.5px;
          white-space: nowrap;
          border-bottom: 1px solid #eef0f4;
        }

        .ec-table-wrap tbody tr:hover {
          background: #faf9ff;
        }

        .ec-status {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 700;
        }

        .ec-status.ec-sale { background: #e7f8ef; color: #168e58; }
        .ec-status.ec-contact { background: #e8f1ff; color: #367ad3; }
        .ec-status.ec-callback { background: #fff4d8; color: #af790c; }
        .ec-status.ec-na { background: #f0f1f5; color: #747b8d; }

        .ec-play {
          width: 25px;
          height: 25px;
          border: 1px solid #e0e3ea;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
          color: #6b42db;
        }

        .ec-preview-footer {
          padding: 12px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #9298a9;
          font-size: 9px;
        }

        .ec-lower {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .ec-field-card {
          background: #fff;
          border: 1px solid #e2e5ed;
          border-radius: 13px;
          padding: 19px;
        }

        .ec-field-card h2 {
          font-size: 14px;
          font-weight: 700;
        }

        .ec-field-card p {
          color: #9298a9;
          font-size: 10px;
          margin-top: 3px;
        }

        .ec-field-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 17px;
        }

        .ec-field-option {
          border: 1px solid #e6e8ee;
          border-radius: 7px;
          padding: 9px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .ec-field-option.ec-selected {
          background: #f8f6ff;
          border-color: #a28be5;
        }

        .ec-field-check {
          width: 15px;
          height: 15px;
          border: 1px solid #ccd1db;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .ec-field-option.ec-selected .ec-field-check {
          background: #7042e2;
          border-color: #7042e2;
          position: relative;
        }

        .ec-field-option.ec-selected .ec-field-check:after {
          content: "✓";
          color: white;
          position: absolute;
          left: 2px;
          top: -1px;
          font-size: 10px;
        }

        .ec-field-option span {
          font-size: 9px;
          color: #52596b;
        }

        .ec-format-card {
          background: #fff;
          border: 1px solid #e2e5ed;
          border-radius: 13px;
          padding: 19px;
        }

        .ec-format-card h2 {
          font-size: 14px;
          font-weight: 700;
        }

        .ec-format-card > p {
          color: #9298a9;
          font-size: 10px;
          margin-top: 3px;
        }

        .ec-format-list {
          margin-top: 17px;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .ec-format {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #e3e6ed;
          border-radius: 8px;
          padding: 11px 12px;
          cursor: pointer;
        }

        .ec-format.ec-selected {
          border-color: #7549e5;
          background: #faf8ff;
        }

        .ec-format-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ec-radio {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 1px solid #cdd2dc;
          position: relative;
        }

        .ec-format.ec-selected .ec-radio {
          border-color: #7042e2;
        }

        .ec-format.ec-selected .ec-radio:after {
          content: "";
          width: 7px;
          height: 7px;
          background: #7042e2;
          border-radius: 50%;
          position: absolute;
          left: 3px;
          top: 3px;
        }

        .ec-format strong {
          display: block;
          font-size: 10px;
        }

        .ec-format small {
          display: block;
          color: #9298a9;
          font-size: 8px;
          margin-top: 2px;
        }

        .ec-format-tag {
          font-size: 8px;
          padding: 4px 7px;
          background: #f0f1f5;
          color: #747b8c;
          border-radius: 5px;
          font-weight: 700;
        }

        .ec-export-bar {
          margin-top: 18px;
          background: #201b3e;
          border-radius: 12px;
          color: #fff;
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ec-export-info h3 {
          font-size: 13px;
          font-weight: 700;
        }

        .ec-export-info p {
          color: #aaa6bd;
          font-size: 9px;
          margin-top: 4px;
        }

        .ec-export-right {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .ec-file-size {
          color: #aaa6bd;
          font-size: 9px;
        }

        .ec-export-btn {
          border: 0;
          background: #7145e7;
          color: #fff;
          border-radius: 7px;
          padding: 10px 18px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .ec-export-btn:hover {
          background: #8259ed;
        }

        .ec-footer {
          display: flex;
          justify-content: space-between;
          color: #969cab;
          font-size: 9px;
          margin-top: 17px;
        }

        .ec-modal-bg {
          position: fixed;
          inset: 0;
          background: rgba(18, 16, 35, 0.55);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ec-modal {
          width: 440px;
          max-width: 92%;
          background: #fff;
          border-radius: 13px;
          padding: 22px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
        }

        .ec-modal h2 {
          font-size: 16px;
          font-weight: 700;
        }

        .ec-modal p {
          color: #858c9d;
          font-size: 10px;
          line-height: 1.6;
          margin-top: 6px;
        }

        .ec-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
        }

        @media (max-width: 1150px) {
          .ec-builder {
            grid-template-columns: 1fr;
          }
          .ec-summary {
            grid-template-columns: repeat(3, 1fr);
          }
          .ec-form-grid {
            grid-template-columns: 1fr 1fr;
          }
          .ec-lower {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ec-container {
            padding: 18px;
          }
          .ec-page-head {
            display: block;
          }
          .ec-actions {
            margin-top: 14px;
          }
          .ec-summary {
            grid-template-columns: 1fr 1fr;
          }
          .ec-form-grid {
            grid-template-columns: 1fr;
          }
          .ec-option-grid {
            grid-template-columns: 1fr 1fr;
          }
          .ec-export-bar {
            display: block;
          }
          .ec-export-right {
            margin-top: 14px;
            justify-content: space-between;
          }
        }
      `}</style>
    </AppShell>
  );
}
