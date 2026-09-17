"use client";

import { useEffect, useState } from "react";
import { VoiceAgentHeader } from "@/components/VoiceAgentHeader";
import { VoiceAgentSidebar } from "@/components/VoiceAgentSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientService, Client, ClientCreateInput, ClientUpdateInput } from "@/lib/services/client.service";
import { Shield, Plus, Edit2, CheckCircle2, AlertTriangle, X, Search, Phone } from "lucide-react";
import { formatISTDate } from "@/lib/date-utils";

export default function AgentClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const defaultFormState = {
    name: "",
    company_name: "",
    contact_number: "",
    email: "",
    address: "",
    status: "Active"
  };
  
  const [formData, setFormData] = useState<ClientCreateInput | ClientUpdateInput>(defaultFormState);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientService.list();
      setClients(data);
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
      status: client.status
    });
    setShowForm(true);
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
    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <VoiceAgentHeader />
      <div className="flex flex-1 overflow-hidden">
        <VoiceAgentSidebar />
        <main className="flex-1 overflow-auto relative p-6">
          <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
                  <Phone className="h-6.5 w-6.5 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Clients</h1>
                  <p className="text-sm text-slate-500 mt-1">view and manage your assigned clients</p>
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
              <Card className="p-6 border border-slate-200 shadow-lg rounded-2xl bg-white max-w-4xl animate-in fade-in slide-in-from-top-4 duration-300">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name *</label>
                      <Input
                        placeholder="John Doe"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                      <Input
                        placeholder="Acme Corp"
                        value={formData.company_name || ""}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                      <Input
                        placeholder="+1234567890"
                        value={formData.contact_number || ""}
                        onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                      <Input
                        type="email"
                        placeholder="john@acme.com"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 lg:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                      <Input
                        placeholder="123 Main St, City, Country"
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

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-auto flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search your clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
              {loading ? (
                <div className="py-16 flex flex-col justify-center items-center gap-3">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fetching your clients...</span>
                </div>
              ) : (
                <div className="overflow-x-auto font-medium text-slate-700">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-4">Client Name</th>
                        <th className="pb-4">Company</th>
                        <th className="pb-4">Contact</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Created Date</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredClients.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-premium">
                          <td className="py-4 font-bold text-slate-900">{c.name}</td>
                          <td className="py-4 text-slate-600">{c.company_name || "—"}</td>
                          <td className="py-4">
                            <div className="text-slate-900 font-semibold">{c.contact_number || "—"}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{c.email || "—"}</div>
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
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredClients.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            You have no clients assigned.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
