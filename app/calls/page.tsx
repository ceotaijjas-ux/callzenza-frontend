"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { Phone, Clock, FileText, User, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface CallLog {
  id: string;
  business_id: string;
  lead_id: string;
  agent_id: string | null;
  direction: string;
  status: string;
  duration_seconds: number;
  created_at: string;
  to_number: string;
  from_number: string;
  lead_name?: string;
  agent_name?: string;
}

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<CallLog[]>("/api/voice/calls")
      .then(setCalls)
      .catch((err) => setError(err.message));
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
      case "CONNECTED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FAILED":
      case "BUSY":
      case "NO_ANSWER":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "IN_PROGRESS":
      case "ANSWERED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "RINGING":
      case "QUEUED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Call History</h1>
        <p className="text-sm text-gray-500">Browse previous outbound campaigns and inbound customer calls</p>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 gap-4">
        {calls.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No calls recorded yet.
          </Card>
        ) : (
          calls.map((call, idx) => (
            <Card key={`${call.id || 'call'}-${idx}`} className="p-5 flex items-center justify-between hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${call.direction === "OUTBOUND" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                  {call.direction === "OUTBOUND" ? (
                    <ArrowUpRight className="h-5 w-5" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {call.lead_name || "Unknown Recipient"}
                    <span className="text-sm font-normal text-gray-400">({call.to_number || call.from_number})</span>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {formatDuration(call.duration_seconds)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> {call.agent_name || "Default AI Agent"}
                    </span>
                    <span>•</span>
                    <span>{new Date(call.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(call.status)}`}>
                  {call.status}
                </Badge>
                <Link href={`/calls/${call.id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 h-9">
                    <FileText className="h-4 w-4" /> View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
