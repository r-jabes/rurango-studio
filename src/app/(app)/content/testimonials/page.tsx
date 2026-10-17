import { CmsListPage } from "@/components/cms/cms-list-page";

export const metadata = { title: "Testimonials" };

export default function ContentTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  return <CmsListPage type="testimonial" searchParams={searchParams} />;
}
