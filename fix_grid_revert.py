import os

field_path = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\components\settings\components\ui\Field.jsx'

with open(field_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Revert Field and FieldGrid back to 2 columns
target_field = '    <div className={`flex flex-col gap-2 ${full ? "sm:col-span-2 lg:col-span-3 xl:col-span-4" : ""}`}>'
replacement_field = '    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>'
content = content.replace(target_field, replacement_field)

target_grid = '  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 gap-x-8">{children}</div>;'
replacement_grid = '  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 gap-x-8">{children}</div>;'
content = content.replace(target_grid, replacement_grid)

with open(field_path, 'w', encoding='utf-8') as f:
    f.write(content)

app_path = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\components\settings\App.jsx'
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Change app layout to use a larger max width but centered
app_target = '<div className="px-6 sm:px-10 lg:px-16 pt-8 pb-24 w-full animate-fade" key={activeTab}>'
app_replacement = '<div className="px-6 sm:px-10 lg:px-12 pt-8 pb-24 w-full max-w-[1400px] mx-auto animate-fade" key={activeTab}>'
app_content = app_content.replace(app_target, app_replacement)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

print("Success")
