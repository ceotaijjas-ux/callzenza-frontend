import re
with open('app/voice-agent/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "CUSTOMER DATA SECTION" in line or "Call Summary Cards" in line or ") : (" in line or "LOWER WORKSPACE" in line or "Active Call Bar" in line:
        print(f"{i+1}: {line.strip()}")
