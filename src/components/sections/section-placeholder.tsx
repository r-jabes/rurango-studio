import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBanner } from "@/components/ui/status-banner";

type SectionPlaceholderProps = {
  title: string;
  description: string;
  phaseNote: string;
};

export function SectionPlaceholder({
  title,
  description,
  phaseNote,
}: SectionPlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <StatusBanner tone="info">{phaseNote}</StatusBanner>
      <EmptyState
        title={`No ${title.toLowerCase()} yet`}
        description="This section is wired into the app shell. Create, search, and record tools will appear here when the related phase ships — no placeholder actions that pretend to work."
      />
    </div>
  );
}
