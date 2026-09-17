import os

file_path = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\components\settings\components\ui\FloatingSave.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '    <div className="sticky bottom-0 -mx-4 sm:-mx-8 px-4 sm:px-8 mt-2 py-3.5 flex justify-end gap-2.5 bg-bg-app/95 backdrop-blur-sm border-t border-border">'
replacement = '    <div className="fixed bottom-0 right-0 w-full md:w-[calc(100%-264px)] px-6 sm:px-10 lg:px-16 py-4 flex justify-end gap-2.5 bg-bg-app/95 backdrop-blur-[8px] border-t border-border z-[60] shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">'

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found. Current content:")
    print(content)
