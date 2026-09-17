import { Suspense } from "react";
import { CampaignCreateFlow } from "@/components/campaign/CampaignCreateFlow";

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading campaign flow...</div>}>
      <CampaignCreateFlow redirectPath="/campaigns" role="USER" />
    </Suspense>
  );
}
