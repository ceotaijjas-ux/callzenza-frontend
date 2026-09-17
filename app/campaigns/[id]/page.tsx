"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { campaignService, Campaign, CampaignLead } from "@/lib/services/campaign.service";
import { ArrowLeft } from "lucide-react";

export default function CampaignLeadsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;

    const loadCampaignDetails = () => {
      Promise.all([
        campaignService.get(campaignId),
        campaignService.getLeads(campaignId)
      ])
        .then(([c, l]) => {
          setCampaign(c);
          setLeads(l);
        })
        .catch((err) => setError(err.message));
    };

    loadCampaignDetails();
    const interval = setInterval(loadCampaignDetails, 5000);
    return () => clearInterval(interval);
  }, [campaignId]);

  return (
    <AppShell>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{campaign ? campaign.name : "Campaign Leads"}</h1>
            {campaign && (
              <Badge
                className={`text-[11px] font-extrabold border-none px-2.5 py-1 rounded-full ${
                  campaign.auto_dial_enabled || campaign.status === "RUNNING"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                PD: {campaign.auto_dial_enabled || campaign.status === "RUNNING" ? "ACTIVE" : "INACTIVE"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">Inspect calling outcomes for each lead in this campaign</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Lead ID</th>
              <th className="px-6 py-3">Call Status</th>
              <th className="px-6 py-3">Link</th>
              <th className="px-6 py-3">Assigned Call ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No leads registered in this campaign.
                </td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id}>
                  <td className="px-6 py-4 font-mono text-xs">{l.lead_id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      l.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                      l.status === "CALLING" ? "bg-yellow-100 text-yellow-800" :
                      l.status === "FAILED" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="link" size="sm" onClick={() => router.push(`/leads/${l.lead_id}`)}>
                      View Lead
                    </Button>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">
                    {l.call_id ? (
                      <Button variant="link" size="sm" onClick={() => router.push(`/calls/${l.call_id}`)}>
                        {l.call_id}
                      </Button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
