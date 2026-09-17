import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove the duplicate tab === "status" opening condition
    content = content.replace('{tab === "status" && (\n        {tab === "status" && (\n        <div className="flex gap-4 flex-1 min-h-0">', '<div className="flex gap-4 flex-1 min-h-0">')
    
    # Remove the stray closing bracket
    content = content.replace('        </div>\n        )}\n          </>\n        )}\n\n      </div>', '        </div>\n          </>\n        )}\n\n      </div>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Success')
