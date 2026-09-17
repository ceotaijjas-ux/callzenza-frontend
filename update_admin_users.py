import os
import re

filepath = r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\admin\users\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add invitePermissions state
state_search = '  const [inviteBusinessId, setInviteBusinessId] = useState("");'
state_replacement = '''  const [inviteBusinessId, setInviteBusinessId] = useState("");
  const [invitePermissions, setInvitePermissions] = useState({
    viewAnalytics: false,
    runCampaigns: false,
    manageBilling: false,
    viewRecordings: false,
  });'''
content = content.replace(state_search, state_replacement)

# Update handleInvite payload
handle_invite_search = '''      await adminService.inviteUser({
        email: inviteEmail,
        phone: invitePhone,
        password: invitePassword || "password123",
        role: inviteRole,
        business_id: inviteBusinessId.trim() || undefined,
      });'''
handle_invite_replacement = '''      await adminService.inviteUser({
        email: inviteEmail,
        phone: invitePhone,
        password: invitePassword || "password123",
        role: inviteRole,
        business_id: inviteBusinessId.trim() || undefined,
        permissions: invitePermissions,
      });'''
content = content.replace(handle_invite_search, handle_invite_replacement)

# Reset permissions on success
reset_search = '''      setInviteRole("USER");
      setInviteBusinessId("");'''
reset_replacement = '''      setInviteRole("USER");
      setInviteBusinessId("");
      setInvitePermissions({
        viewAnalytics: false,
        runCampaigns: false,
        manageBilling: false,
        viewRecordings: false,
      });'''
content = content.replace(reset_search, reset_replacement)

# Add editPermissions state
edit_state_search = '  const [editIsActive, setEditIsActive] = useState(true);'
edit_state_replacement = '''  const [editIsActive, setEditIsActive] = useState(true);
  const [editPermissions, setEditPermissions] = useState({
    viewAnalytics: false,
    runCampaigns: false,
    manageBilling: false,
    viewRecordings: false,
  });'''
content = content.replace(edit_state_search, edit_state_replacement)

# Update handleOpenEditModal
open_edit_search = '''    setEditIsActive(u.is_active);
    setEditPassword("");
  };'''
open_edit_replacement = '''    setEditIsActive(u.is_active);
    setEditPassword("");
    setEditPermissions({
      viewAnalytics: u.permissions?.viewAnalytics || false,
      runCampaigns: u.permissions?.runCampaigns || false,
      manageBilling: u.permissions?.manageBilling || false,
      viewRecordings: u.permissions?.viewRecordings || false,
    });
  };'''
content = content.replace(open_edit_search, open_edit_replacement)

# Update handleEditUserSubmit
edit_submit_search = '''      await adminService.updateUser(editTargetUser.id, {
        full_name: editFullName,
        email: editEmail,
        role: editRole,
        is_active: editIsActive,
        password: editPassword.trim() ? editPassword.trim() : undefined,
      });'''
edit_submit_replacement = '''      await adminService.updateUser(editTargetUser.id, {
        full_name: editFullName,
        email: editEmail,
        role: editRole,
        is_active: editIsActive,
        password: editPassword.trim() ? editPassword.trim() : undefined,
        permissions: editPermissions,
      });'''
content = content.replace(edit_submit_search, edit_submit_replacement)

# Now, add the permission UI to the Invite Form
invite_form_button_search = '''              <div className="lg:col-span-3 flex justify-end gap-3.5 mt-2 border-t border-slate-50 pt-4">'''
permissions_ui_invite = '''              <div className="lg:col-span-3 space-y-3 mt-2 border-t border-slate-50 pt-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" /> Granular Permissions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "viewAnalytics", label: "View Analytics & Metrics" },
                    { key: "runCampaigns", label: "Create & Run Calling Campaigns" },
                    { key: "manageBilling", label: "Manage Billing & Top-Up Credits" },
                    { key: "viewRecordings", label: "View Audio Recordings" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex gap-2.5 items-center select-none cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-premium">
                      <input
                        type="checkbox"
                        checked={(invitePermissions as any)[key]}
                        onChange={(e) => setInvitePermissions({ ...invitePermissions, [key]: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-3 flex justify-end gap-3.5 mt-2 pt-2">'''
content = content.replace(invite_form_button_search, permissions_ui_invite)

# Now, add the permission UI to the Edit Form
edit_form_button_search = '''                <div className="flex justify-end gap-3 border-t border-slate-50 pt-4 mt-6">'''
permissions_ui_edit = '''                <div className="space-y-3 mt-4 border-t border-slate-50 pt-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" /> Granular Permissions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "viewAnalytics", label: "View Analytics & Metrics" },
                      { key: "runCampaigns", label: "Create & Run Calling Campaigns" },
                      { key: "manageBilling", label: "Manage Billing & Top-Up Credits" },
                      { key: "viewRecordings", label: "View Audio Recordings" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex gap-2.5 items-center select-none cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-premium">
                        <input
                          type="checkbox"
                          checked={(editPermissions as any)[key]}
                          onChange={(e) => setEditPermissions({ ...editPermissions, [key]: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 mt-4">'''
content = content.replace(edit_form_button_search, permissions_ui_edit)

# Remove the permissions modal button from the list view
perm_button_search = '''                          <button
                            onClick={() => setPermissionTarget(u)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 hover:text-indigo-600 transition-premium cursor-pointer"
                            title="Manage Permissions"
                          >
                            <ShieldCheck className="h-4.5 w-4.5" />
                          </button>'''
content = content.replace(perm_button_search, "")

# Remove the standalone permissions modal completely
modal_start = '{/* Permissions Modal */}'
modal_regex = re.compile(r'\{\/\*\s*Permissions Modal\s*\*\/.*?\}\s*\)\}\s*<\/div>\s*<\/AppShell>', re.DOTALL)
content = modal_regex.sub('      </div>\n    </AppShell>', content)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin users page")
