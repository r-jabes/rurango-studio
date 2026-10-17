import { SectionPlaceholder } from "@/components/sections/section-placeholder";

export const metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <SectionPlaceholder
      title="Clients"
      description="Client companies and contacts for projects, documents, and billing."
      phaseNote="CRUD, archive, search, and activity timeline ship in Phase 2."
    />
  );
}
