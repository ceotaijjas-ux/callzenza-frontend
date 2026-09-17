import sys

with open('app/voice-agent/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def get_block(start_str, end_str):
    s = content.find(start_str)
    if s == -1: return ""
    e = content.find(end_str, s)
    if e == -1: return ""
    return content[s:e+len(end_str)]

part_top = content[:content.find('        ) : (\n          <>\n')]

part_summary = get_block('{/* Call Summary Cards (Dynamic Real Data) */}', '            </div>\n            </div>')
# Fix part_summary indentation: it has `            </div>\n            </div>` at the end which closes the grid and what else?
# wait, it is inside `<div className="flex flex-col gap-4 min-h-0 flex-1">` which was opened at line 352!
part_summary = get_block('<div className="flex flex-col gap-4 min-h-0 flex-1">\n            {/* Call Summary Cards (Dynamic Real Data) */}', '            </div>\n            </div>')
# If it can't find the wrapper div, just find the summary cards block
if not part_summary:
    part_summary = '          <div className="flex flex-col gap-4 min-h-0 flex-1">\n            ' + get_block('{/* Call Summary Cards (Dynamic Real Data) */}', '              ))} \n            </div>')

part_active_call = get_block('{/* Active Call Bar (Only shows when call is active) */}', '            </div>\n')
# We need to make sure we get the full active call bar, which ends after the End Call button div
active_idx = content.rfind('{/* Active Call Bar (Only shows when call is active) */}')
if active_idx != -1:
    end_active = content.find('            </div>', content.find('End Call', active_idx))
    part_active_call = content[active_idx:end_active+18]

part_category = get_block('{/* ASSIGNED LEADS BAR & CATEGORY SELECTOR */}', '            </div>\n')
# The category selector has a huge block that ends before CUSTOMER DATA SECTION.
cat_idx = content.find('{/* ASSIGNED LEADS BAR & CATEGORY SELECTOR */}')
if cat_idx != -1:
    end_cat = content.find('{/* CUSTOMER DATA SECTION */}', cat_idx)
    part_category = content[cat_idx:end_cat].strip()

part_customer = get_block('{/* CUSTOMER DATA SECTION */}', '              </div>\n            )} \n          </div>\n        </div>')
if not part_customer:
    cust_idx = content.rfind('{/* CUSTOMER DATA SECTION */}')
    end_cust = content.find('          </div>\n        </div>', cust_idx)
    part_customer = content[cust_idx:end_cust+32]

part_lower = get_block('{/* LOWER WORKSPACE (Split 50/50) */}', '        </div>\n          </div>')
if not part_lower:
    lower_idx = content.rfind('{/* LOWER WORKSPACE (Split 50/50) */}')
    end_lower = content.find('        </div>\n          </div>', lower_idx)
    part_lower = content[lower_idx:end_lower+32]

final_code = part_top + '        ) : (\n          <>\n'
final_code += '          <div className="flex flex-col gap-4 min-h-0 flex-1">\n'
final_code += '            ' + part_summary.strip() + '\n\n'
final_code += '            ' + part_active_call.strip() + '\n\n'
final_code += '            ' + part_category.strip() + '\n\n'
final_code += '            ' + part_customer.strip() + '\n\n'
final_code += '            ' + part_lower.strip() + '\n'
final_code += '          </div>\n          </>\n        )}\n\n      </div>\n'

# Add DialControlPanel and Dispo Modal
bottom_idx = content.find('      <DialControlPanel')
final_code += content[bottom_idx:]

with open('app/voice-agent/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(final_code)
print("Dashboard rebuilt!")
