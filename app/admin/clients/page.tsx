"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientService, Client, ClientCreateInput, ClientUpdateInput } from "@/lib/services/client.service";
import { adminService } from "@/lib/services/admin.service";
import { Shield, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, X, Search, Filter } from "lucide-react";
import { formatISTDate } from "@/lib/date-utils";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [supervisors, setSupervisors] = useState<{ id: string; email: string; full_name: string }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const defaultFormState = {
    name: "",
    company_name: "",
    contact_number: "",
    email: "",
    address: "",
    status: "Active",
    assigned_agent_id: ""
  };
  
  const [formData, setFormData] = useState<ClientCreateInput | ClientUpdateInput>(defaultFormState);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientService.list();
      setClients(data);
      // Fetch users to populate the Assigned Supervisor dropdown
      const usersData = await adminService.getUsers();
      // First priority: Users with role === "SUPERVISOR"
      let supervisorList = (usersData || []).filter((u: any) => u.role?.toUpperCase() === "SUPERVISOR");
      // Fallback: If no users with role === "SUPERVISOR", show available admin / supervisor / voice agent users
      if (supervisorList.length === 0) {
        supervisorList = (usersData || []).filter((u: any) =>
          ["SUPERVISOR", "ADMIN", "SUPER_ADMIN", "VOICE_AGENT", "BUSINESS_OWNER"].includes(u.role?.toUpperCase())
        );
      }
      if (supervisorList.length === 0 && (usersData || []).length > 0) {
        supervisorList = usersData;
      }
      setSupervisors(supervisorList);
    } catch (err: any) {
      setError(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormState);
    setShowForm(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      company_name: client.company_name,
      contact_number: client.contact_number,
      email: client.email,
      address: client.address,
      status: client.status,
      assigned_agent_id: client.assigned_agent_id || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client "${name}"?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await clientService.remove(id);
      setSuccess(`Client "${name}" deleted successfully`);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete client");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!formData.name) {
      setError("Client Name is required");
      return;
    }

    try {
      if (editingId) {
        await clientService.update(editingId, formData);
        setSuccess(`Client "${formData.name}" updated successfully`);
      } else {
        await clientService.create(formData as ClientCreateInput);
        setSuccess(`Client "${formData.name}" created successfully`);
      }
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setError(err.message || `Failed to ${editingId ? 'update' : 'create'} client`);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === "ALL" || c.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-8 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
              <Shield className="h-6.5 w-6.5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Client Management</h1>
              <p className="text-sm text-slate-500 mt-1">manage client assignments and details</p>
            </div>
          </div>
          <Button 
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 rounded-xl self-start sm:self-center cursor-pointer font-bold"
          >
            <Plus className="h-4 w-4" /> Create Client
          </Button>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {showForm && (
          <Card className="p-6 border border-slate-100 shadow-lg rounded-2xl bg-white max-w-4xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                {editingId ? "✏️ Edit Client" : "🚀 Create New Client"}
              </h3>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 transition-premium p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name *</label>
                  <Input
                    placeholder=""
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                  <Input
                    placeholder=""
                    value={formData.company_name || ""}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                  <Input
                    placeholder=""
                    value={formData.contact_number || ""}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <Input
                    type="email"
                    placeholder=""
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-11 bg-white font-semibold text-slate-700 cursor-pointer"
                    value={formData.status || "Active"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Supervisor</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-11 bg-white font-semibold text-slate-700 cursor-pointer"
                    value={formData.assigned_agent_id || ""}
                    onChange={(e) => setFormData({ ...formData, assigned_agent_id: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 lg:col-span-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                  <Input
                    placeholder=""
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-50 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  {editingId ? "Save Changes" : "Create Client"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative w-full sm:w-auto flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="w-full sm:w-40 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer appearance-none transition-colors"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col justify-center items-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fetching clients...</span>
            </div>
          ) : (
            <div className="overflow-x-auto font-medium text-slate-700">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-4">Client Name</th>
                    <th className="pb-4">Company</th>
                    <th className="pb-4">Contact</th>
                    <th className="pb-4">Assigned Supervisor</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Created Date</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredClients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-premium">
                      <td className="py-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-4 text-slate-600">{c.company_name || "—"}</td>
                      <td className="py-4">
                        <div className="text-slate-900 font-semibold">{c.contact_number || "—"}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{c.email || "—"}</div>
                      </td>
                      <td className="py-4">
                        {c.assigned_agent_name ? (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                            {c.assigned_agent_name}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                          c.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-slate-400">
                        {formatISTDate(c.created_at)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-600 transition-premium cursor-pointer"
                            title="Edit Client"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1.5 rounded-lg hover:bg-slate-50 text-rose-500 hover:text-rose-600 transition-premium cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No clients found in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
