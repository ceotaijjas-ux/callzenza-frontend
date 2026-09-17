import sys
import re

file_path = 'app/supervisor/voice-agents/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's fix the invalid duplicated code block.
# We will match the entire default case which currently has:
#         ) : (
#           <>
#           {/* CUSTOMER DATA SECTION */}
#           ...
#           </div>
#         ) : (
#           <>
#         {/* Call Summary Cards */}
#           ...
#         )}
# We want to merge the components inside both <> blocks into a single <> block and remove the duplicate `) : (`.

# What we actually have starting from line 238:
#           </div>
#         ) : (
#           <>
#           {/* CUSTOMER DATA SECTION */}

# I'll just find the exact text `        ) : (\n          <>\n          {/* CUSTOMER DATA SECTION */}`
# and everything down to `                  </>\n        )}\n\n      </div>\n\n      <DialControlPanel`

start_idx = content.find('        ) : (\n          <>\n          {/* CUSTOMER DATA SECTION */}')
end_idx = content.find('      <DialControlPanel ', start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find the bounds!")
    sys.exit(1)

block = content[start_idx:end_idx]

# Inside `block`, there is `        ) : (\n          <>\n        {/* Call Summary Cards */}`.
# This indicates the split.
split_str = '        ) : (\n          <>\n        {/* Call Summary Cards */}'
split_idx = block.find(split_str)

if split_idx == -1:
    print("Could not find split string")
    sys.exit(1)

part1 = block[:split_idx]
part2 = block[split_idx + len(split_str):]

# part1 contains:
#         ) : (
#           <>
#           {/* CUSTOMER DATA SECTION */}
#           ... (up to the closing of LOWER WORKSPACE)
#         </div>
#           </div>

# wait, part1 actually contains `) : (` at the beginning.
# part2 contains the summary cards, active call bar, and the OLD customer data section.
# We should keep summary cards, active call bar, and then the NEW customer data section and LOWER WORKSPACE.

# Let's extract Summary Cards and Active Call Bar from part2.
# part2 looks like:
#         <div className="grid grid-cols-5 ...
#         ...
#         {/* Active Call Bar (Only shows when call is active) */}
#         <div ...
#         ...
#         {/* CUSTOMER DATA SECTION */}

part2_split = part2.find('        {/* CUSTOMER DATA SECTION */}')
if part2_split == -1:
    print("Could not find CUSTOMER DATA SECTION in part2")
    sys.exit(1)

summary_cards_and_active_call_bar = part2[:part2_split]

# Now, part1 without the `) : (\n          <>\n` is the NEW customer data section and LOWER WORKSPACE.
new_sections = part1[part1.find('          {/* CUSTOMER DATA SECTION */}') : ]
# Strip the trailing `        </div>\n          </div>\n` which belongs to the extra tags we don't want?
# Actually, the NEW customer data section is inside `<div className="bg-white border border-slate-300 rounded shadow-sm flex flex-col shrink-0 min-h-[250px]">` ... `</div>`
# And LOWER WORKSPACE is `<div className="flex gap-4 flex-1 min-h-0">` ... `</div>`
# Let's just use `new_sections` but remove the trailing `        </div>\n          </div>\n`
new_sections = new_sections.rstrip().rsplit('\n', 2)[0] + '\n'

new_block = '        ) : (\n          <>\n' + summary_cards_and_active_call_bar + new_sections + '\n          </>\n        )}\n\n      </div>\n\n'

new_content = content[:start_idx] + new_block + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully patched page.tsx!")
