with open('app/supervisor/voice-agents/page.tsx', 'r', encoding='utf-8') as f:
    supervisor_content = f.read()

new_content = supervisor_content

# Rename component
new_content = new_content.replace('export default function SupervisorVoiceAgentsPage() {', 'export default function VoiceAgentDashboard() {')
new_content = new_content.replace('basePath="/supervisor/voice-agents"', 'basePath="/voice-agent"')
new_content = new_content.replace('router.push(pathname.includes("/supervisor") ? pathname : "/voice-agent/dashboard")', 'router.push("/voice-agent/dashboard")')

# Add missing state variables if needed
state_vars = """
  // Category tab state for assigned leads
  const [categoryTab, setCategoryTab] = useState<"ACTIVE" | "REQUESTED" | "HISTORY">("ACTIVE");
"""
new_content = new_content.replace('  // Upper Tab state', state_vars + '  // Upper Tab state')

# Change data loading to Agent-specific
new_content = new_content.replace('leadAssignmentService.getAssignments()', 'leadAssignmentService.getMyAssignments()')

# Add computed variables just before `return (`
computed_vars = """
  // Filter assignments into categories
  const activeAssignments = assignments.filter(a => a.status === "ACTIVE");
  const historyAssignments = assignments.filter(a => a.status === "REASSIGNED" || a.status === "COMPLETED");
  const myRequestedQueue = queueItems.filter(q => q.requested_expert_name?.toLowerCase() === (user?.full_name || "").toLowerCase());

  return ("""
new_content = new_content.replace('  return (', computed_vars)

# Inject the ASSIGNED LEADS BAR before CUSTOMER DATA SECTION
category_bar = """            {/* ASSIGNED LEADS BAR & CATEGORY SELECTOR */}
            <div className="bg-white border border-slate-300 rounded shadow-sm p-3 shrink-0 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCategoryTab("ACTIVE")}
                    className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-all ${
                      categoryTab === "ACTIVE" 
                        ? "text-indigo-600 border-b-2 border-indigo-600" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Active Leads ({activeAssignments.length})
                  </button>
                  <button 
                    onClick={() => setCategoryTab("REQUESTED")}
                    className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-all ${
                      categoryTab === "REQUESTED" 
                        ? "text-purple-600 border-b-2 border-purple-600" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    My Requested Queue ({myRequestedQueue.length})
                  </button>
                  <button 
                    onClick={() => setCategoryTab("HISTORY")}
                    className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-all ${
                      categoryTab === "HISTORY" 
                        ? "text-slate-800 border-b-2 border-slate-800" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Reassignment History ({historyAssignments.length})
                  </button>
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  Live Sync (5s)
                </span>
              </div>

              {/* Items Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                {categoryTab === "ACTIVE" && (
                  activeAssignments.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-1">No active leads assigned yet. Waiting for incoming AI call transfers or qualified leads.</div>
                  ) : (
                    activeAssignments.map((item) => {
                      const isActive = activeAssignment?.id === item.id;
                      const source = item.trigger_source || "TALK_TO_AGENT";
                      const isSpecific = source === "SPECIFIC_AGENT_REQUEST";
                      const isTalkToAgent = source === "TALK_TO_AGENT";
                      const isQualified = source === "QUALIFIED_LEAD";

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveAssignment(item)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            isActive
                              ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{item.context?.lead_name || item.lead_id.slice(0, 8)}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                              isSpecific
                                ? "bg-purple-600 text-white"
                                : isTalkToAgent
                                ? "bg-indigo-600 text-white"
                                : isQualified
                                ? "bg-emerald-600 text-white"
                                : "bg-amber-500 text-white"
                            }`}
                          >
                            {isSpecific ? "Requested Agent" : isTalkToAgent ? "Talk to Agent" : isQualified ? "Qualified Lead" : "Queue Auto"}
                          </span>
                        </button>
                      );
                    })
                  )
                )}

                {categoryTab === "REQUESTED" && (
                  myRequestedQueue.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-1">No pending leads specifically waiting for you in queue.</div>
                  ) : (
                    myRequestedQueue.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-purple-200 bg-purple-50 text-purple-900 text-xs font-semibold shrink-0">
                        <span>{q.lead_name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-600 text-white font-bold uppercase">
                          Waiting for You
                        </span>
                      </div>
                    ))
                  )
                )}

                {categoryTab === "HISTORY" && (
                  historyAssignments.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-1">No reassigned lead history.</div>
                  ) : (
                    historyAssignments.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveAssignment(item)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-900 text-xs font-semibold shrink-0"
                      >
                        <span>{item.context?.lead_name || item.lead_id.slice(0, 8)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-600 text-white font-bold uppercase">
                          Reassigned
                        </span>
                      </button>
                    ))
                  )
                )}
              </div>
            </div>"""

new_content = new_content.replace('{/* CUSTOMER DATA SECTION */}', category_bar + '\n\n        {/* CUSTOMER DATA SECTION */}')

with open('app/voice-agent/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Final clean rebuild successful!")
