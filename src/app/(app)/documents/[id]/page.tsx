import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveButton } from "@/components/crm/archive-button";
import { DocumentMetaForm } from "@/components/documents/document-meta-form";
import { SetCurrentVersionButton } from "@/components/documents/set-current-version-button";
import { VersionUploadForm } from "@/components/documents/version-upload-form";
import { Badge } from "@/components/ui/badge";
import { DocumentPreview } from "@/components/ui/document-preview";
import { PageHeader } from "@/components/ui/page-header";
import { formatBytes, isPreviewableMime } from "@/lib/documents/policy";
import { requireRole } from "@/lib/session";
import {
  listClientOptions,
  listProjectOptions,
} from "@/server/documents/options";
import {
  getDocumentById,
  listDocumentCategories,
} from "@/server/documents/queries";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const document = await getDocumentById(id);
  return { title: document?.title ?? "Document" };
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Params;
}) {
  await requireRole(["owner", "member"]);
  const { id } = await params;
  const document = await getDocumentById(id);
  if (!document) notFound();

  const [categories, clients, projects] = await Promise.all([
    listDocumentCategories(),
    listClientOptions(),
    listProjectOptions(),
  ]);

  const current = document.versions.find(
    (version) => version.id === document.currentVersionId,
  );
  const tags = document.tagLinks.map((link) => link.tag.name).join(", ");

  return (
    <div className="space-y-8">
      <PageHeader
        title={document.title}
        description={
          current
            ? `${current.originalFilename} · version ${current.versionNumber}`
            : "No file version attached"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {current ? (
              <a
                href={`/api/documents/${id}/download`}
                className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-secondary"
              >
                Download current
              </a>
            ) : null}
            {document.status === "active" ? (
              <ArchiveButton
                entity="document"
                entityId={id}
                mode="archive"
                label="Archive"
                confirmTitle="Archive this document?"
                confirmDescription="The document leaves the active list. All versions remain stored for recovery."
              />
            ) : (
              <ArchiveButton
                entity="document"
                entityId={id}
                mode="restore"
                label="Restore"
                confirmTitle="Restore this document?"
                confirmDescription="The document returns to the active vault list."
              />
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge tone={document.status === "active" ? "success" : "neutral"}>
          {document.status}
        </Badge>
        {document.category ? <Badge>{document.category.name}</Badge> : null}
        {document.tagLinks.map((link) => (
          <Badge key={link.tagId} tone="accent">
            {link.tag.name}
          </Badge>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <DocumentPreview
            title={document.title}
            mimeType={current?.mimeType}
            documentId={id}
            versionId={current?.id}
          />
          {current && !isPreviewableMime(current.mimeType) ? (
            <p className="text-sm text-foreground-muted">
              Inline preview is limited to images, PDF, and plain text.
            </p>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface/40 p-5">
            <h2 className="mb-4 text-sm font-medium">Details</h2>
            <DocumentMetaForm
              documentId={id}
              categories={categories.map((category) => ({
                id: category.id,
                name: category.name,
              }))}
              clients={clients}
              projects={projects}
              defaults={{
                title: document.title,
                categoryId: document.categoryId,
                clientId: document.clientId,
                projectId: document.projectId,
                tags,
              }}
            />
            <dl className="mt-6 grid gap-2 text-sm">
              <div>
                <dt className="text-foreground-muted">Client</dt>
                <dd>
                  {document.client ? (
                    <Link
                      href={`/clients/${document.client.id}`}
                      className="underline"
                    >
                      {document.client.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-foreground-muted">Project</dt>
                <dd>
                  {document.project ? (
                    <Link
                      href={`/projects/${document.project.id}`}
                      className="underline"
                    >
                      {document.project.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {document.status === "active" ? (
            <div className="rounded-xl border border-border bg-surface/40 p-5">
              <h2 className="mb-4 text-sm font-medium">New version</h2>
              <VersionUploadForm documentId={id} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface/40 p-5">
        <h2 className="mb-4 text-sm font-medium">Version history</h2>
        <ul className="space-y-3">
          {document.versions.map((version) => {
            const isCurrent = version.id === document.currentVersionId;
            return (
              <li
                key={version.id}
                className="flex flex-col gap-3 border-t border-border pt-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    Version {version.versionNumber}
                    {isCurrent ? " · current" : ""}
                  </p>
                  <p className="text-foreground-muted">
                    {version.originalFilename} · {formatBytes(version.byteSize)}{" "}
                    · {version.mimeType}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {version.uploader?.name ?? "Unknown"} ·{" "}
                    {version.createdAt.toLocaleString()}
                    {version.changeNote ? ` · ${version.changeNote}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/documents/${id}/download?versionId=${version.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-border bg-surface px-3 text-xs font-medium hover:bg-surface-secondary"
                  >
                    Download
                  </a>
                  {!isCurrent && document.status === "active" ? (
                    <SetCurrentVersionButton
                      documentId={id}
                      versionId={version.id}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
