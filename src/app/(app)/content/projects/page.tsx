import { CmsListPage } from "@/components/cms/cms-list-page";

export const metadata = { title: "Portfolio projects" };

export default function ContentProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  return <CmsListPage type="portfolio_project" searchParams={searchParams} />;
}
