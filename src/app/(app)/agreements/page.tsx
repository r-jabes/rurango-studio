import { SectionPlaceholder } from "@/components/sections/section-placeholder";

export const metadata = { title: "Agreements" };

export default function AgreementsPage() {
  return (
    <SectionPlaceholder
      title="Agreements"
      description="Agreements and uploaded signed copies with signing metadata."
      phaseNote="Immutable issued snapshots and signed uploads ship in Phase 4. Electronic signature providers are not claimed until implemented."
    />
  );
}
