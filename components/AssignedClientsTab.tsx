"use client";

import { useState, useEffect } from "react";
import { UserCheck, Phone, Loader2 } from "lucide-react";
import { clientService, Client } from "@/lib/services/client.service";

interface AssignedClientsTabProps {
  onCallRequest: (phone: string) => void;
}

export function AssignedClientsTab({ onCallRequest }: AssignedClientsTabProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = async () => {
    setLoading(true);
    try {
      // The API route filters by logged in agent automatically
      const allClients = await clientService.list();
      setClients(allClients);
    } catch (err) {
      console.error("Failed to load assigned clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
      <div className="p-4 border-b border-indigo-900/50 sticky top-0 bg-slate-950 z-10 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-400" />
          My Clients
        </h3>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">
          {clients.length} Total
        </span>
      </div>
      
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-slate-500 p-4 text-center">
          <UserCheck className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs">No assigned clients found.</p>
          <p className="text-[10px] mt-1 text-slate-600">Create a new client or wait to be assigned.</p>
        </div>
      ) : (
        <div className="p-2 space-y-2">
          {clients.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded p-3 hover:border-indigo-500/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{c.name}</h4>
                  {c.company_name && <p className="text-xs text-slate-400">{c.company_name}</p>}
                </div>
                <span className="text-[9px] font-bold uppercase bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">
                  {c.status}
                </span>
              </div>
              
              {c.email && (
                <div className="text-[10px] text-slate-400 mb-2 truncate">
                  {c.email}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800">
                <p className="text-xs font-mono text-slate-300">{c.contact_number}</p>
                <button 
                  onClick={() => c.contact_number && onCallRequest(c.contact_number)}
                  disabled={!c.contact_number}
                  className="flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-2 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Phone className="w-3 h-3" /> Call
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
