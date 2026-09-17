import sys
import re

path = 'app/supervisor/voice-agents/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to remove the duplicate CUSTOMER DATA SECTION and LOWER WORKSPACE block (lines 243 to 356)
# Let's find the boundaries.
start_marker = ') : (\n          <>\n          {/* CUSTOMER DATA SECTION */}'
end_marker = '</div>\n          </div>\n        ) : (\n          <>'

if start_marker in content and end_marker in content:
    idx_start = content.find(start_marker)
    idx_end = content.find(end_marker, idx_start)
    if idx_start != -1 and idx_end != -1:
        # The block we want to remove is from idx_start + length of the first line of start_marker?
        # Actually, let's just do text replacement. We want to remove the block between `) : tab === "status" ? (...)` and the actual `Call Summary Cards` section.
        pass

# Let's just use regex to remove the duplicate block.
# The duplicate block starts at `          <>` followed by `{/* CUSTOMER DATA SECTION */}` and ends with `        ) : (\n          <>`
pattern = re.compile(r'\) : \(\n\s*<>\n\s*\{\/\* CUSTOMER DATA SECTION \*\/\}.*?</div>\n\s*</div>\n\s*\) : \(\n\s*<>', re.DOTALL)
new_content = pattern.sub(r') : (\n          <>', content)

# Also fix the trailing `)}` at the end
new_content = new_content.replace('                  </>\n        )}\n\n      </div>\n\n      <DialControlPanel', '                  </>\n        )}\n\n      </div>\n\n      <DialControlPanel')
# Wait, the closing of the tertiary is just `)}`. It should be `)}` after `</>`.
# Wait, let's check if the regex actually matched.
print("Regex replaced:", new_content != content)

# But wait, what if we want to KEEP the QUEUE and LOWER WORKSPACE from the remote?
# Let's just restore the file to the correct state manually by pulling out the required parts.
