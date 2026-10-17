import { CmsListPage } from "@/components/cms/cms-list-page";

export const metadata = { title: "Services" };

export default function ContentServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  return <CmsListPage type="service" searchParams={searchParams} />;
}
