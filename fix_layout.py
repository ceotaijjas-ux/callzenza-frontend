import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to move `</>\n        )}` from above LOWER WORKSPACE to below it.
    
    # 1. Remove it from its current position
    broken_fragment_close = """          </div>
        </div>

          </>
        )}

        {/* LOWER WORKSPACE (Split 50/50) */}"""

    fixed_fragment_close = """          </div>
        </div>

        {/* LOWER WORKSPACE (Split 50/50) */}"""
    
    content = content.replace(broken_fragment_close, fixed_fragment_close)

    # 2. Add it back at the end of the LOWER WORKSPACE
    broken_end = """        </div>

      </div>

      <DialControlPanel"""

    fixed_end = """        </div>
          </>
        )}

      </div>

      <DialControlPanel"""

    content = content.replace(broken_end, fixed_end)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Success')
