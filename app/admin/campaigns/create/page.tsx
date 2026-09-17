import { Suspense } from "react";
import { CampaignCreateFlow } from "@/components/campaign/CampaignCreateFlow";

export default function AdminNewCampaignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading campaign flow...</div>}>
      <CampaignCreateFlow redirectPath="/admin/campaigns" role="ADMIN" />
    </Suspense>
  );
}
