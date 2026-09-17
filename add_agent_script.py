import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add the Agent Script button
    target_button = '<button onClick={() => setUpperTab("CUSTOMER")} className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-r border-slate-200 ${upperTab === "CUSTOMER" ? "bg-white text-indigo-600 shadow-[0_-2px_0_inset_#4f46e5]" : "text-slate-500 hover:text-slate-700"}`}>Customer Data</button>'
    replacement_button = target_button + '\n            <button onClick={() => setUpperTab("SCRIPT")} className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-r border-slate-200 ${upperTab === "SCRIPT" ? "bg-white text-indigo-600 shadow-[0_-2px_0_inset_#4f46e5]" : "text-slate-500 hover:text-slate-700"}`}>Agent Script</button>'
    
    content = content.replace(target_button, replacement_button)

    # Add the Agent Script content
    target_content = """                <div><label className="block text-[10px] font-bold text-slate-400 uppercase">vendor id(emailid)</label><span className="font-medium">{activeLead?.email || "john@example.com"}</span></div>
              </div>
            )}"""
    
    replacement_content = target_content + """
            {upperTab === "SCRIPT" && (
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-w-3xl">
                <h4 className="font-bold mb-2">Introduction</h4>
                <p className="mb-4 bg-slate-50 p-3 rounded border border-slate-200">"Hello {activeLead?.first_name || 'Customer'}, this is calling on a recorded line. How are you doing today?"</p>
                
                <h4 className="font-bold mb-2">Purpose of Call</h4>
                <p className="mb-4 bg-slate-50 p-3 rounded border border-slate-200">"I'm following up on your recent inquiry regarding our services. I wanted to see if you had a few minutes to answer some quick questions so we can better assist you."</p>
                
                <h4 className="font-bold mb-2">Key Discovery Questions</h4>
                <ul className="list-disc pl-5 mb-4 space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                  <li>Are you currently looking for a solution?</li>
                  <li>What is your timeline for making a decision?</li>
                  <li>What are your biggest pain points right now?</li>
                </ul>
              </div>
            )}"""

    content = content.replace(target_content, replacement_content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Success')
