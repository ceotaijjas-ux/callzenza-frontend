"use client";

import { useState, useEffect } from "react";
import { Users, Phone, Loader2, Plus } from "lucide-react";
import { leadService, Lead } from "@/lib/services/lead.service";

interface QualifiedCustomersTabProps {
  onCallRequest: (phone: string) => void;
}

export function QualifiedCustomersTab({ onCallRequest }: QualifiedCustomersTabProps) {
  const [customers, setCustomers] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const allLeads = await leadService.list();
      setCustomers(allLeads.filter(l => l.qualification_status === "QUALIFIED"));
    } catch (err) {
      console.error("Failed to load qualified customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    
    // Split name to first_name and last_name for Lead model
    const nameParts = name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    try {
      await leadService.create({
        first_name: firstName,
        last_name: lastName,
        phone,
        company,
        email,
        requirement: notes,
        qualification_status: "QUALIFIED", // Force qualified status
        status: "NEW", // Or whatever standard initial status is used
      });
      setShowAddForm(false);
      setName("");
      setPhone("");
      setCompany("");
      setEmail("");
      setNotes("");
      loadCustomers(); // Reload list
    } catch (err) {
      console.error("Failed to add customer:", err);
    }
  };

  if (showAddForm) {
    return (
      <div className="flex-1 flex flex-col bg-slate-950 p-4 overflow-y-auto">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Add Qualified Customer
        </h3>
        
        <form onSubmit={handleAddCustomer} className="space-y-3 flex-1 flex flex-col">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Name *</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Number *</label>
            <input 
              required
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm font-mono focus:outline-none focus:border-emerald-500"
              placeholder="e.g. +1234567890"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company (Optional)</label>
            <input 
              type="text" 
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email (Optional)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="e.g. john@acme.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm focus:outline-none focus:border-emerald-500 resize-none h-20"
              placeholder="Additional details..."
            />
          </div>
          
          <div className="mt-auto pt-4 flex gap-2">
            <button 
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs uppercase tracking-wider transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
      <div className="p-4 border-b border-indigo-900/50 sticky top-0 bg-slate-950 z-10 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Qualified
        </h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-slate-500 p-4 text-center">
          <Users className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs">No qualified customers found.</p>
        </div>
      ) : (
        <div className="p-2 space-y-2">
          {customers.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded p-3 hover:border-emerald-500/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{(c.first_name || "") + " " + (c.last_name || "")}</h4>
                  {c.company && <p className="text-xs text-slate-400">{c.company}</p>}
                </div>
                <span className="text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                  {c.qualification_status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-mono text-slate-300">{c.phone}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => c.phone && onCallRequest(c.phone)}
                    disabled={!c.phone}
                    className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-2 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}