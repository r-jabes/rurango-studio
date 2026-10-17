import { DocumentPreview } from "@/components/ui/document-preview";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";

export const metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Private vault for client and project files."
      />
      <StatusBanner tone="info">
        Uploads, private object storage, versioning, and authorized downloads
        ship in Phase 3. Nothing is stored in public application folders.
      </StatusBanner>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <EmptyState
          title="No documents yet"
          description="When the vault is live, searchable files with tags and client links will list here."
        />
        <DocumentPreview />
      </div>
    </div>
  );
}
