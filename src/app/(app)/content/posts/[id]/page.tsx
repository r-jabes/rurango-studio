import { CmsDetailPage } from "@/components/cms/cms-detail-page";

export const metadata = { title: "Post" };

type Params = Promise<{ id: string }>;

export default async function ContentDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  return <CmsDetailPage type="post" id={id} />;
}
