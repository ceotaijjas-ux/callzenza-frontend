import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where LOWER WORKSPACE starts and where it ends before the closing </> )}
    target_start = '{/* LOWER WORKSPACE (Split 50/50) */}\n        <div className="flex gap-4 flex-1 min-h-0">'
    replacement_start = '{/* LOWER WORKSPACE (Split 50/50) */}\n        {tab === "status" && (\n        <div className="flex gap-4 flex-1 min-h-0">'
    
    content = content.replace(target_start, replacement_start)

    # Find the end of LOWER WORKSPACE
    target_end = '        </div>\n          </>\n        )}'
    replacement_end = '        </div>\n        )}\n          </>\n        )}'

    content = content.replace(target_end, replacement_end)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Success')
