"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { ArrowLeft, User, Bot, PlayCircle } from "lucide-react";

interface CallDetail {
  id: string;
  lead_id: string;
  agent_id: string | null;
  direction: string;
  status: string;
  duration_seconds: number;
  recording_url: string;
  transcript: string;
  created_at: string;
  lead_name?: string;
  agent_name?: string;
  to_number: string;
  from_number: string;
}

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params.id as string;

  const [call, setCall] = useState<CallDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!callId) return;
    apiFetch<CallDetail>(`/api/voice/calls/${callId}`)
      .then(setCall)
      .catch((err) => setError(err.message));
  }, [callId]);

  return (
    <AppShell>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Call Analysis</h1>
          <p className="text-sm text-gray-500">View speech transcripts, audio records, and AI qualifications</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {call && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Conversation Transcript</h2>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {call.transcript ? (
                  call.transcript.split("\n").map((line, idx) => {
                    const isAgent = line.startsWith("AI:") || line.startsWith("Agent:") || line.includes("Agent");
                    return (
                      <div key={idx} className={`flex gap-3 items-start ${isAgent ? "" : "flex-row-reverse"}`}>
                        <div className={`p-2 rounded-full ${isAgent ? "bg-primary/10" : "bg-gray-100"}`}>
                          {isAgent ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${
                          isAgent ? "bg-primary/5 border border-primary/10" : "bg-gray-100"
                        }`}>
                          {line}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-sm text-center">No transcript available for this call.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Audio Recording</h2>
              {call.recording_url ? (
                <div className="space-y-2">
                  <audio controls src={call.recording_url} className="w-full mt-2" />
                  <p className="text-xs text-gray-400 text-center">Recording URL: {call.recording_url}</p>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 border border-dashed rounded-md flex flex-col items-center gap-2">
                  <PlayCircle className="h-8 w-8 text-gray-300" />
                  No audio recording available.
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-3">
              <h2 className="text-lg font-semibold">Metadata</h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Recipient</span>
                  <span className="font-medium text-gray-900">{call.lead_name || "Unknown"}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Phone Number</span>
                  <span className="font-medium text-gray-900">{call.to_number || call.from_number}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Agent Partner</span>
                  <span className="font-medium text-gray-900">{call.agent_name || "Default AI Agent"}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Direction</span>
                  <span className="font-medium text-gray-900">{call.direction}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-gray-900">{call.status}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-gray-900 font-mono font-bold">
                    {Math.floor((call.duration_seconds || 0) / 60)}m {(call.duration_seconds || 0) % 60}s ({Math.floor((call.duration_seconds || 0) / 60).toString().padStart(2, "0")}:{((call.duration_seconds || 0) % 60).toString().padStart(2, "0")})
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-medium text-gray-900">{new Date(call.created_at).toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
