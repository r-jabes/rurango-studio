import { CmsDetailPage } from "@/components/cms/cms-detail-page";

export const metadata = { title: "Portfolio project" };

type Params = Promise<{ id: string }>;

export default async function ContentDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  return <CmsDetailPage type="portfolio_project" id={id} />;
}
