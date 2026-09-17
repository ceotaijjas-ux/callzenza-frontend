import os
import re

filepath = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\admin\supervisors\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
import_search = 'import { useState } from "react";'
import_replacement = '''import { useState, useEffect } from "react";
import { AdminUser } from "@/lib/services/admin.service";'''
content = content.replace(import_search, import_replacement)

# 2. Add state for supervisors
state_search = '  const [success, setSuccess] = useState<string | null>(null);'
state_replacement = '''  const [success, setSuccess] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const fetchSupervisors = async () => {
    try {
      setFetching(true);
      const data = await adminService.getUsers("SUPERVISOR");
      setSupervisors(data);
    } catch (err) {
      console.error("Failed to fetch supervisors", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };'''
content = content.replace(state_search, state_replacement)

# 3. Refresh list after creation
handle_create_search = '''      setSuccess(`Supervisor account for ${email} created successfully!`);
      setEmail("");
      setPassword("");'''
handle_create_replacement = '''      setSuccess(`Supervisor account for ${email} created successfully!`);
      setEmail("");
      setPassword("");
      fetchSupervisors();'''
content = content.replace(handle_create_search, handle_create_replacement)

# 4. Add the Supervisor List UI at the end
end_search = '        </Card>\n      </div>\n    </AppShell>'
list_ui = '''        </Card>

        {/* Supervisors List */}
        <div className="mt-8">
          <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" /> Existing Supervisors
          </h2>
          <Card className="border border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden">
            {fetching ? (
              <div className="p-8 text-center text-slate-500 font-medium">Loading supervisors...</div>
            ) : supervisors.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">No supervisors found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs font-bold">
                    <tr>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Password</th>
                      <th className="px-6 py-4">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supervisors.map((sup) => (
                      <tr key={sup.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{sup.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-700 w-32 truncate">
                              {visiblePasswords[sup.id] ? (sup.plain_password || "N/A") : "••••••••"}
                            </span>
                            <button 
                              onClick={() => togglePasswordVisibility(sup.id)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                              title={visiblePasswords[sup.id] ? "Hide Password" : "Show Password"}
                            >
                              {visiblePasswords[sup.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(sup.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>'''
content = content.replace(end_search, list_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated supervisors page")
