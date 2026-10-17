import { CommercialNewPage } from "@/components/commercial/commercial-new-page";

export const metadata = { title: "New invoice" };

export default function NewInvoicePage() {
  return <CommercialNewPage type="invoice" />;
}
