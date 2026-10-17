import { CmsEntryForm } from "@/components/cms/cms-entry-form";
import { PageHeader } from "@/components/ui/page-header";
import { cmsTypeLabels, type CmsEntryType } from "@/lib/cms/meta";
import { requireRole } from "@/lib/session";

export async function CmsNewPage({ type }: { type: CmsEntryType }) {
  await requireRole(["owner", "member"]);
  return (
    <div className="space-y-6">
      <PageHeader
        title={`New ${cmsTypeLabels[type].toLowerCase()}`}
        description="Saved as draft until you publish through the workflow."
      />
      <CmsEntryForm mode="create" type={type} />
    </div>
  );
}
