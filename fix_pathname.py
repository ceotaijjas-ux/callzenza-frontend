import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Import usePathname if not imported
    if 'usePathname' not in content:
        content = content.replace(
            'import { useSearchParams, useRouter } from "next/navigation";',
            'import { useSearchParams, useRouter, usePathname } from "next/navigation";'
        )
    
    # 2. Add const pathname = usePathname();
    if 'const pathname =' not in content:
        content = content.replace(
            '  const searchParams = useSearchParams();',
            '  const searchParams = useSearchParams();\n  const pathname = usePathname();'
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Success')
