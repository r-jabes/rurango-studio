import { CmsNewPage } from "@/components/cms/cms-new-page";

export const metadata = { title: "New post" };

export default function NewContentPage() {
  return <CmsNewPage type="post" />;
}
