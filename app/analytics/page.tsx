"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { analyticsService, DashboardSummary } from "@/lib/services/analytics.service";
import { Activity, Award, CheckCircle2, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsService.dashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" /> Analytics Center
        </h1>
        <p className="text-sm text-gray-500">Live operational intelligence, conversion ratios, and pipeline values</p>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-800 rounded-full">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Qualification Rate</span>
                <span className="text-2xl font-bold">{data.qualification_rate}%</span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-800 rounded-full">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Qualified Leads</span>
                <span className="text-2xl font-bold">{data.qualified_leads}</span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-800 rounded-full">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Won Deals</span>
                <span className="text-2xl font-bold">{data.won_deals}</span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-full text-lg">
                💰
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Pipeline Revenue</span>
                <span className="text-2xl font-bold">${data.revenue.toLocaleString()}</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Lead Source Channels</h2>
              <div className="space-y-3">
                {Object.entries(data.lead_sources).map(([source, count]) => {
                  const max = Math.max(...Object.values(data.lead_sources) as number[], 1);
                  const pct = ((count as number) / max) * 100;
                  return (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 capitalize">{source}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Deals Pipeline Stages</h2>
              <div className="space-y-3">
                {Object.entries(data.pipeline_by_stage).map(([stage, count]) => {
                  const max = Math.max(...Object.values(data.pipeline_by_stage) as number[], 1);
                  const pct = ((count as number) / max) * 100;
                  return (
                    <div key={stage} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 capitalize">{stage}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
