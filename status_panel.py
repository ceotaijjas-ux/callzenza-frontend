import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Step 1: Add the status condition to the ternary
    target_ternary = '        ) : (\n          <>'
    replacement_ternary = """        ) : tab === "status" ? (
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            <div className="flex items-center justify-between bg-white border border-slate-300 rounded p-3 shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Status</span>
              </div>
              <button 
                onClick={() => router.push(pathname.includes("/supervisor") ? pathname : "/voice-agent/dashboard")}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                title="Close Status"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {/* LOWER WORKSPACE INJECTED HERE LATER */}
          </div>
        ) : (
          <>"""
    
    content = content.replace(target_ternary, replacement_ternary)

    # Step 2: Extract the LOWER WORKSPACE
    start_str = '{/* LOWER WORKSPACE (Split 50/50) */}'
    end_str = '        </div>\n        )}\n          </>\n        )}'
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx != -1 and end_idx != -1:
        # Extract the workspace block (and remove the `{tab === "status" && (` wrapper we added previously)
        lower_workspace_full = content[start_idx:end_idx + len(end_str)]
        
        # We need to strip the condition {tab === "status" && (  ... )}
        lower_workspace_stripped = lower_workspace_full.replace('{tab === "status" && (\n        <div className="flex gap-4 flex-1 min-h-0">', '<div className="flex gap-4 flex-1 min-h-0">')
        lower_workspace_stripped = lower_workspace_stripped.replace('        </div>\n        )}\n          </>\n        )}', '        </div>')
        
        # Remove it from its original place at the bottom of the default view
        content = content.replace(lower_workspace_full, '          </>\n        )}')
        
        # Inject it into the new status tab branch
        content = content.replace('{/* LOWER WORKSPACE INJECTED HERE LATER */}', lower_workspace_stripped)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Success')
