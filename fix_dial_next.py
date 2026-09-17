import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

mock_leads_code = """    leadService.list().then((data) => {
      if (data.length > 0) {
        setLeads(data);
        setActiveLead(data[0]);
      } else {
        // Fallback to mock leads if database is empty so Dial Next works in demo
        const mockLeads: Lead[] = [
          { id: "mock1", first_name: "John", last_name: "Smith", email: "john@example.com", phone: "+1 (555) 019-2834", location: "Los Angeles", status: "New" },
          { id: "mock2", first_name: "Sarah", last_name: "Connor", email: "sarah@example.com", phone: "+1 (555) 987-6543", location: "San Francisco", status: "New" },
          { id: "mock3", first_name: "Michael", last_name: "Jordan", email: "michael@example.com", phone: "+1 (555) 123-4567", location: "Chicago", status: "New" }
        ];
        setLeads(mockLeads);
        setActiveLead(mockLeads[0]);
      }
    }).catch(console.error);"""

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The existing code is:
    #     leadService.list().then((data) => {
    #       setLeads(data);
    #       if (data.length > 0) setActiveLead(data[0]);
    #     }).catch(console.error);
    
    target = """    leadService.list().then((data) => {
      setLeads(data);
      if (data.length > 0) setActiveLead(data[0]);
    }).catch(console.error);"""
    
    if target in content:
        content = content.replace(target, mock_leads_code)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Target not found in {filepath}")

print('Success')
