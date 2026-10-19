"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { FieldHint } from "@/components/ui/field-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { updateCompanySettingsAction } from "@/server/settings/actions";

type CompanySettingsFormProps = {
  defaults: {
    legalName: string;
    tradingName: string;
    defaultCurrency: string;
    taxId?: string | null;
    supportEmail?: string | null;
    addressJson?: Record<string, string> | null;
    invoicePrefix: string;
    quotationPrefix: string;
    proposalPrefix: string;
    agreementPrefix: string;
    uploadMaxBytes: number;
    logoStorageKey?: string | null;
  };
};

export function CompanySettingsForm({ defaults }: CompanySettingsFormProps) {
  const { pending, fieldErrors, run } = useActionFeedback();
  const logoUrl = defaults.logoStorageKey
    ? `/api/media/${defaults.logoStorageKey}`
    : null;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() => updateCompanySettingsAction(formData), {
      successTitle: "Settings saved",
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" encType="multipart/form-data">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="legalName">Legal name</Label>
          <FieldHint>Registered entity name shown on commercial PDFs.</FieldHint>
          <Input id="legalName" name="legalName" required defaultValue={defaults.legalName} />
          <FieldError errors={fieldErrors.legalName} />
        </div>
        <div>
          <Label htmlFor="tradingName">Trading name</Label>
          <FieldHint>Brand name used in the PDF header and footer.</FieldHint>
          <Input
            id="tradingName"
            name="tradingName"
            required
            defaultValue={defaults.tradingName}
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="logoFile">Company logo</Label>
          <FieldHint>
            PNG, JPEG, or WebP. Appears on issued proposals, quotations,
            agreements, and invoices.
          </FieldHint>
          {logoUrl ? (
            <div className="flex items-center gap-4 rounded-md border border-border bg-background-secondary p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Company logo"
                className="h-10 w-auto max-w-[180px] object-contain"
              />
              <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                <input type="checkbox" name="clearLogo" value="true" />
                Remove logo
              </label>
            </div>
          ) : null}
          <Input
            id="logoFile"
            name="logoFile"
            type="file"
            accept="image/png,image/jpeg,image/webp"
          />
        </div>
        <div>
          <Label htmlFor="defaultCurrency">Default currency</Label>
          <Input
            id="defaultCurrency"
            name="defaultCurrency"
            required
            maxLength={3}
            defaultValue={defaults.defaultCurrency}
          />
        </div>
        <div>
          <Label htmlFor="taxId">Tax ID</Label>
          <Input id="taxId" name="taxId" defaultValue={defaults.taxId ?? undefined} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="supportEmail">Support email</Label>
          <Input
            id="supportEmail"
            name="supportEmail"
            type="email"
            defaultValue={defaults.supportEmail ?? undefined}
          />
          <FieldError errors={fieldErrors.supportEmail} />
        </div>
        <div>
          <Label htmlFor="addressLine1">Address line 1</Label>
          <Input
            id="addressLine1"
            name="addressLine1"
            defaultValue={defaults.addressJson?.line1}
          />
        </div>
        <div>
          <Label htmlFor="addressLine2">Address line 2</Label>
          <Input
            id="addressLine2"
            name="addressLine2"
            defaultValue={defaults.addressJson?.line2}
          />
        </div>
        <div>
          <Label htmlFor="addressCity">City</Label>
          <Input
            id="addressCity"
            name="addressCity"
            defaultValue={defaults.addressJson?.city}
          />
        </div>
        <div>
          <Label htmlFor="addressCountry">Country</Label>
          <Input
            id="addressCountry"
            name="addressCountry"
            defaultValue={defaults.addressJson?.country}
          />
        </div>
        <div>
          <Label htmlFor="proposalPrefix">Proposal prefix</Label>
          <Input
            id="proposalPrefix"
            name="proposalPrefix"
            required
            defaultValue={defaults.proposalPrefix}
          />
        </div>
        <div>
          <Label htmlFor="quotationPrefix">Quotation prefix</Label>
          <Input
            id="quotationPrefix"
            name="quotationPrefix"
            required
            defaultValue={defaults.quotationPrefix}
          />
        </div>
        <div>
          <Label htmlFor="agreementPrefix">Agreement prefix</Label>
          <Input
            id="agreementPrefix"
            name="agreementPrefix"
            required
            defaultValue={defaults.agreementPrefix}
          />
        </div>
        <div>
          <Label htmlFor="invoicePrefix">Invoice prefix</Label>
          <Input
            id="invoicePrefix"
            name="invoicePrefix"
            required
            defaultValue={defaults.invoicePrefix}
          />
        </div>
        <div>
          <Label htmlFor="uploadMaxBytes">Upload max bytes</Label>
          <Input
            id="uploadMaxBytes"
            name="uploadMaxBytes"
            required
            inputMode="numeric"
            defaultValue={String(defaults.uploadMaxBytes)}
          />
          <FieldError errors={fieldErrors.uploadMaxBytes} />
        </div>
      </div>

      <Button type="submit" loading={pending}>
        {pending ? "Saving…" : "Save company settings"}
      </Button>
    </form>
  );
}
