import { SectionPlaceholder } from "@/components/sections/section-placeholder";

export const metadata = { title: "Backups" };

export default function BackupsPage() {
  return (
    <SectionPlaceholder
      title="Backups"
      description="Database and file backup status for disaster recovery."
      phaseNote="Independent backup destinations, retention, and restore drills ship in Phase 7."
    />
  );
}
