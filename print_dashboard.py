with open('app/voice-agent/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if ") : (" in line:
        print("-------")
        start = max(0, i-3)
        end = min(len(lines), i+4)
        for j in range(start, end):
            print(f"{j+1}: {lines[j].strip()}")
