import os

# Fix Sidebar
sidebar_path = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\components\settings\components\layout\Sidebar.jsx'

with open(sidebar_path, 'r', encoding='utf-8') as f:
    sidebar_content = f.read()

target_ul = '<ul className="list-none px-2.5">'
replacement_ul = '<ul className="list-none px-2.5 flex-1 flex flex-col">'
sidebar_content = sidebar_content.replace(target_ul, replacement_ul)

with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(sidebar_content)

# Fix App layout
app_path = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\components\settings\App.jsx'

with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

app_target = '<div className="px-6 sm:px-10 lg:px-12 pt-8 pb-24 w-full max-w-[1400px] mx-auto animate-fade" key={activeTab}>'
app_replacement = '<div className="px-6 sm:px-10 lg:px-16 pt-8 pb-24 w-full max-w-full animate-fade" key={activeTab}>'
app_content = app_content.replace(app_target, app_replacement)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

# Fix FieldGrid
field_path = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\components\settings\components\ui\Field.jsx'

with open(field_path, 'r', encoding='utf-8') as f:
    field_content = f.read()

field_target = '  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 gap-x-8">{children}</div>;'
field_replacement = '  return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 gap-x-10">{children}</div>;'
field_content = field_content.replace(field_target, field_replacement)

# Also update the full span to match the new grid cols
full_target = '    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>'
full_replacement = '    <div className={`flex flex-col gap-2 ${full ? "sm:col-span-2 xl:col-span-3 2xl:col-span-4" : ""}`}>'
field_content = field_content.replace(full_target, full_replacement)

with open(field_path, 'w', encoding='utf-8') as f:
    f.write(field_content)

print("Success")
