import os

# 1. Revert FloatingSave.jsx
file_path = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\components\settings\components\ui\FloatingSave.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '    <div className="fixed bottom-0 right-0 w-full md:w-[calc(100%-264px)] px-6 sm:px-10 lg:px-16 py-4 flex justify-end gap-2.5 bg-bg-app/95 backdrop-blur-[8px] border-t border-border z-[60] shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">'
replacement = '    <div className="sticky bottom-0 -mx-6 sm:-mx-10 lg:-mx-16 px-6 sm:px-10 lg:px-16 mt-2 py-4 flex justify-end gap-2.5 bg-bg-app/95 backdrop-blur-[8px] border-t border-border z-10">'

if target in content:
    content = content.replace(target, replacement)
else:
    # try replacing the old one just in case
    old_target = '    <div className="sticky bottom-0 -mx-4 sm:-mx-8 px-4 sm:px-8 mt-2 py-3.5 flex justify-end gap-2.5 bg-bg-app/95 backdrop-blur-sm border-t border-border">'
    content = content.replace(old_target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)


# 2. Revert FieldGrid to 2 cols
field_path = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\components\settings\components\ui\Field.jsx'

with open(field_path, 'r', encoding='utf-8') as f:
    field_content = f.read()

grid_target = '  return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 gap-x-10">{children}</div>;'
grid_replacement = '  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 gap-x-8">{children}</div>;'
if grid_target in field_content:
    field_content = field_content.replace(grid_target, grid_replacement)

span_target = '    <div className={`flex flex-col gap-2 ${full ? "sm:col-span-2 xl:col-span-3 2xl:col-span-4" : ""}`}>'
span_replacement = '    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>'
if span_target in field_content:
    field_content = field_content.replace(span_target, span_replacement)

with open(field_path, 'w', encoding='utf-8') as f:
    f.write(field_content)

print("Success")
