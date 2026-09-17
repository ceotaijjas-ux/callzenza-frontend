import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add select-none to the main dashboard container to prevent text selection / caret flashing on click
    # The main container is: <div className="flex h-full animate-in fade-in duration-300 bg-slate-200/50">
    # Wait, the supervisor page has a slightly different container:
    # <div className="flex h-full animate-in fade-in duration-300 bg-slate-200/50 -m-6 rounded-tl-2xl overflow-hidden relative">
    
    # We will just replace 'animate-in fade-in duration-300 bg-slate-200/50' with 'animate-in fade-in duration-300 bg-slate-200/50 select-none'
    content = content.replace('animate-in fade-in duration-300 bg-slate-200/50', 'animate-in fade-in duration-300 bg-slate-200/50 select-none')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Success')
