import { CmsListPage } from "@/components/cms/cms-list-page";

export const metadata = { title: "Posts" };

export default function ContentPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  return <CmsListPage type="post" searchParams={searchParams} />;
}
