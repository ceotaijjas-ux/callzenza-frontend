import re

with open('app/supervisor/voice-agents/page.tsx', 'r', encoding='utf-8') as f:
    supervisor_content = f.read()

with open('app/voice-agent/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    broken_dashboard = f.read()

# 1. Extract the ASSIGNED LEADS BAR from broken_dashboard
s = broken_dashboard.find('{/* ASSIGNED LEADS BAR & CATEGORY SELECTOR */}')
# Find the next section: {/* CUSTOMER DATA SECTION */}
e = broken_dashboard.find('{/* CUSTOMER DATA SECTION */}', s)
category_bar_code = broken_dashboard[s:e].strip() if s != -1 and e != -1 else ""

# 2. Start transforming supervisor_content
new_content = supervisor_content

# Rename component
new_content = new_content.replace('export default function SupervisorVoiceAgentsPage() {', 'export default function VoiceAgentDashboard() {')
new_content = new_content.replace('basePath="/supervisor/voice-agents"', 'basePath="/voice-agent"')
new_content = new_content.replace('router.push(pathname.includes("/supervisor") ? pathname : "/voice-agent/dashboard")', 'router.push("/voice-agent/dashboard")')

# Add missing state variables if needed
# We need `categoryTab`, `myRequestedQueue`, `activeAssignments`, `historyAssignments`
state_vars = """
  // Category tab state for assigned leads
  const [categoryTab, setCategoryTab] = useState<"ACTIVE" | "REQUESTED" | "HISTORY">("ACTIVE");
"""
new_content = new_content.replace('  // Upper Tab state', state_vars + '  // Upper Tab state')

# In Supervisor page, it does:
#       leadAssignmentService.getAssignments().then(setAssignments).catch(console.error);
# We want to change that to getMyAssignments() for the agent dashboard.
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
new_content = new_content.replace('{/* CUSTOMER DATA SECTION */}', category_bar_code + '\n\n        {/* CUSTOMER DATA SECTION */}')

with open('app/voice-agent/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Clean rebuild successful!")
