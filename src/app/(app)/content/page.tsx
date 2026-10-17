import { SectionPlaceholder } from "@/components/sections/section-placeholder";

export const metadata = { title: "Content" };

export default function ContentPage() {
  return (
    <SectionPlaceholder
      title="Content"
      description="Drafts for portfolio projects, services, posts, and testimonials."
      phaseNote="CMS and approved publishing to the public site ship in Phase 6. The live portfolio remains unchanged until then."
    />
  );
}
