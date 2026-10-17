import { SectionPlaceholder } from "@/components/sections/section-placeholder";

export const metadata = { title: "Proposals" };

export default function ProposalsPage() {
  return (
    <SectionPlaceholder
      title="Proposals"
      description="Proposal drafts, issued snapshots, and client relationships."
      phaseNote="Templates, numbering, and PDF export ship in Phase 4."
    />
  );
}
