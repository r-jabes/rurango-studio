import { UploadForm } from "@/components/documents/upload-form";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";
import {
  getAllowedMimeTypes,
  getUploadMaxBytes,
} from "@/lib/documents/policy";
import { requireRole } from "@/lib/session";
import {
  listClientOptions,
  listProjectOptions,
} from "@/server/documents/options";
import { listDocumentCategories } from "@/server/documents/queries";

export const metadata = { title: "Upload document" };

export default async function NewDocumentPage() {
  await requireRole(["owner", "member"]);
  const [categories, clients, projects] = await Promise.all([
    listDocumentCategories(),
    listClientOptions(),
    listProjectOptions(),
  ]);

  const maxMb = Math.round(getUploadMaxBytes() / (1024 * 1024));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload document"
        description="Files go to private storage with randomized keys. They are never written under /public."
        actions={
          <ButtonLink href="/documents" variant="secondary">
            Back
          </ButtonLink>
        }
      />
      <StatusBanner tone="info">
        Max size {maxMb} MB. Allowed types: {getAllowedMimeTypes().join(", ")}.
      </StatusBanner>
      <UploadForm
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        clients={clients}
        projects={projects}
      />
    </div>
  );
}
