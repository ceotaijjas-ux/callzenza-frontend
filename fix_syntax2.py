import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Clean up any stray {tab !== "status" && ( and <> that might have been injected
    broken_str = '        ) : (\n          <>\n            {tab !== "status" && (\n          <>\n        {/* Call Summary Cards */}'
    fixed_str = '        ) : (\n          <>\n        {/* Call Summary Cards */}'
    
    content = content.replace(broken_str, fixed_str)
    
    # Also just in case there's another variation
    broken_str2 = '          <>\n            {tab !== "status" && (\n          <>\n        {/* Call Summary Cards */}'
    fixed_str2 = '          <>\n        {/* Call Summary Cards */}'
    
    content = content.replace(broken_str2, fixed_str2)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Success')
