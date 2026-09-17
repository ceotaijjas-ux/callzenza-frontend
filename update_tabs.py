import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove lowerTab state
    content = content.replace(
        '  // Lower Left Tab state\n  const [lowerTab, setLowerTab] = useState<"DETAILS" | "LIVE">("DETAILS");',
        ''
    )

    # Replace the internal tab buttons with a static header driven by URL tab
    target_buttons = """            <div className="flex border-b border-slate-200 bg-slate-100/50">
              <button onClick={() => setLowerTab("DETAILS")} className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-r border-slate-200 ${lowerTab === "DETAILS" ? "bg-white text-indigo-600 shadow-[0_-2px_0_inset_#4f46e5]" : "text-slate-500 hover:text-slate-700"}`}>Call Detail</button>
              <button onClick={() => setLowerTab("LIVE")} className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-r border-slate-200 ${lowerTab === "LIVE" ? "bg-white text-indigo-600 shadow-[0_-2px_0_inset_#4f46e5]" : "text-slate-500 hover:text-slate-700"}`}>Call History</button>
            </div>"""
    
    replacement_buttons = """            <div className="flex border-b border-slate-200 bg-slate-100/50">
              <div className="px-6 py-2.5 text-sm font-bold uppercase tracking-wider bg-white text-indigo-600 border-r border-slate-200 shadow-[0_-2px_0_inset_#4f46e5]">
                {tab === "history" ? "Call History" : "Call Detail"}
              </div>
            </div>"""
    
    content = content.replace(target_buttons, replacement_buttons)

    # Replace rendering condition
    content = content.replace('{lowerTab === "DETAILS" && (', '{tab !== "history" && (')
    content = content.replace('{lowerTab === "LIVE" && (', '{tab === "history" && (')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Success')
