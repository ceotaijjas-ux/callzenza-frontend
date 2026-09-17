"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { clientService } from "@/lib/services/client.service";

interface CreateClientTabProps {
  onSuccess: () => void;
}

export function CreateClientTab({ onSuccess }: CreateClientTabProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError("Name and contact number are required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await clientService.create({
        name,
        company_name: company,
        contact_number: phone,
        email,
        address,
        status: "Active"
      });
      
      // Reset form
      setName("");
      setCompany("");
      setPhone("");
      setEmail("");
      setAddress("");
      
      // Notify parent to switch to "Assigned Clients" tab
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create client");
      console.error("Failed to create client:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-4 overflow-y-auto">
      <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-emerald-400" />
        Create Client
      </h3>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-2 rounded text-xs mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Client Name *</label>
          <input 
            required
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm focus:outline-none focus:border-emerald-500"
            placeholder=""
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company Name</label>
          <input 
            type="text" 
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm focus:outline-none focus:border-emerald-500"
            placeholder=""
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
            placeholder=""
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm focus:outline-none focus:border-emerald-500"
            placeholder=""
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Address</label>
          <textarea 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm focus:outline-none focus:border-emerald-500 resize-none h-16"
            placeholder=""
          />
        </div>
        
        <div className="mt-auto pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating..." : "Save Client"}
          </button>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            This client will be automatically assigned to you.
          </p>
        </div>
      </form>
    </div>
  );
}
