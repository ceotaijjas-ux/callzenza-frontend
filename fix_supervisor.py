import os

source_file = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx'
dest_file = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('export default function VoiceAgentDashboard() {', 'export default function SupervisorVoiceAgentsPage() {')
content = content.replace('import { useSearchParams, useRouter } from "next/navigation";', 'import { useSearchParams, useRouter } from "next/navigation";\nimport { AppShell } from "@/components/AppShell";\nimport { VoiceAgentSidebar } from "@/components/VoiceAgentSidebar";')

# Wrap return in AppShell
content = content.replace(
    'return (\n    <div className="flex h-full animate-in fade-in duration-300 bg-slate-200/50">',
    'return (\n    <AppShell>\n      <div className="flex h-full animate-in fade-in duration-300 bg-slate-200/50 -m-6 rounded-tl-2xl overflow-hidden relative">\n        <VoiceAgentSidebar basePath="/supervisor/voice-agents" />'
)

# Replace closing tags for AppShell
content = content.replace(
    '    </div>\n  );\n}',
    '      </div>\n    </AppShell>\n  );\n}'
)

with open(dest_file, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
