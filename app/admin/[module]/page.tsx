import { ALL_MODULES } from "../../../lib/adminModules";
import ModulePage from "../../../components/admin/ModulePage";

export function generateStaticParams() {
  return ALL_MODULES.map((mod) => ({
    module: mod.key,
  }));
}

export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  
  return <ModulePage moduleKey={module} />;
}
