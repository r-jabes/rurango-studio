import { CmsDetailPage } from "@/components/cms/cms-detail-page";

export const metadata = { title: "Testimonial" };

type Params = Promise<{ id: string }>;

export default async function ContentDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  return <CmsDetailPage type="testimonial" id={id} />;
}
