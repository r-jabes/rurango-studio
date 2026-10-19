"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { FieldHint } from "@/components/ui/field-hint";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import { Textarea } from "@/components/ui/textarea";
import {
  cmsTypeLabels,
  cmsTypeRoutes,
  slugify,
  type CmsEntryType,
} from "@/lib/cms/meta";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  createCmsEntryAction,
  updateCmsEntryAction,
} from "@/server/cms/actions";

type CmsEntryFormProps = {
  mode: "create" | "edit";
  type: CmsEntryType;
  entryId?: string;
  locked?: boolean;
  defaults?: {
    title?: string;
    slug?: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    coverPublicPath?: string | null;
    tags?: string[];
    body?: Record<string, unknown>;
  };
};

function lines(value: unknown) {
  return Array.isArray(value) ? value.join("\n") : "";
}

export function CmsEntryForm({
  mode,
  type,
  entryId,
  locked = false,
  defaults,
}: CmsEntryFormProps) {
  const { pending, fieldErrors, run, router } = useActionFeedback();
  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const body = defaults?.body ?? {};

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const formData = new FormData(event.currentTarget);
    formData.set("type", type);
    formData.set("slug", slug);

    run(
      () =>
        mode === "create"
          ? createCmsEntryAction(formData)
          : updateCmsEntryAction(entryId!, formData),
      {
        successTitle: mode === "create" ? "Entry created" : "Entry saved",
        refresh: mode !== "create",
        onSuccess: (result) => {
          if (
            mode === "create" &&
            result.data &&
            typeof result.data === "object" &&
            "id" in result.data
          ) {
            router.push(
              `${cmsTypeRoutes[type]}/${String((result.data as { id: string }).id)}`,
            );
            router.refresh();
          }
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {locked ? (
        <StatusBanner tone="warning">
          Published entries are locked. Change status to draft or archive before
          editing.
        </StatusBanner>
      ) : null}

      <fieldset disabled={locked || pending} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <FieldHint>
              {type === "testimonial"
                ? "Short label for Studio lists (e.g. Client name — product)."
                : type === "service"
                  ? "Service name as it should appear publicly."
                  : "Project or post title."}
            </FieldHint>
            <Input
              id="title"
              name="title"
              required
              defaultValue={defaults?.title}
              onBlur={(e) => {
                if (!slug) setSlug(slugify(e.target.value));
              }}
            />
            <FieldError errors={fieldErrors.title} />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <FieldHint>URL fragment: lowercase letters, numbers, hyphens.</FieldHint>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <FieldError errors={fieldErrors.slug} />
          </div>
          <div className="sm:col-span-2">
            <ImageUploadField
              id="coverPublicPath"
              name="coverPublicPath"
              label="Cover image"
              hint="Upload a PNG, JPEG, or WebP, or paste an existing public path (e.g. /work/example/cover.png)."
              defaultValue={defaults?.coverPublicPath}
            />
          </div>
          <div>
            <Label htmlFor="seoTitle">SEO title</Label>
            <FieldHint>Optional override for search results; leave blank to use the title.</FieldHint>
            <Input
              id="seoTitle"
              name="seoTitle"
              defaultValue={defaults?.seoTitle ?? undefined}
            />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO description</Label>
            <FieldHint>One or two sentences for search snippets and social cards.</FieldHint>
            <Input
              id="seoDescription"
              name="seoDescription"
              defaultValue={defaults?.seoDescription ?? undefined}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="tagsText">Tags (comma-separated)</Label>
            <FieldHint>e.g. marketplace, rwanda, operations</FieldHint>
            <Input
              id="tagsText"
              name="tagsText"
              defaultValue={defaults?.tags?.join(", ") ?? ""}
            />
          </div>
        </div>

        {type === "portfolio_project" ? (
          <div className="space-y-4 rounded-md border border-border p-4">
            <h2 className="text-sm font-medium">
              {cmsTypeLabels[type]} fields
            </h2>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <FieldHint>One short paragraph for cards and listings (max ~500 characters).</FieldHint>
              <Textarea
                id="summary"
                name="summary"
                required
                rows={3}
                defaultValue={String(body.summary ?? "")}
                placeholder="What this product does and who it is for."
              />
              <FieldError errors={fieldErrors.summary} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="projectType">Project type</Label>
                <Select
                  id="projectType"
                  name="projectType"
                  defaultValue={String(body.projectType ?? "product")}
                >
                  <option value="product">product</option>
                  <option value="client">client</option>
                  <option value="internal">internal</option>
                  <option value="personal">personal</option>
                  <option value="concept">concept</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="projectStatus">Delivery status</Label>
                <Select
                  id="projectStatus"
                  name="projectStatus"
                  defaultValue={String(body.projectStatus ?? "concept")}
                >
                  <option value="shipped">shipped</option>
                  <option value="in-progress">in-progress</option>
                  <option value="soft-launch">soft-launch</option>
                  <option value="concept">concept</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  inputMode="numeric"
                  defaultValue={body.year != null ? String(body.year) : ""}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="liveUrl">Live URL</Label>
                <FieldHint>Public product URL visitors can open.</FieldHint>
                <Input
                  id="liveUrl"
                  name="liveUrl"
                  required
                  defaultValue={String(body.liveUrl ?? "")}
                  placeholder="https://…"
                />
                <FieldError errors={fieldErrors.liveUrl} />
              </div>
              <div>
                <ImageUploadField
                  id="previewImage"
                  name="previewImage"
                  label="Preview image"
                  hint="Card/hero image. Upload preferred; path still allowed."
                  defaultValue={
                    typeof body.previewImage === "string"
                      ? body.previewImage
                      : null
                  }
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <FieldHint>Your role on the work (e.g. Product design & engineering).</FieldHint>
                <Input id="role" name="role" defaultValue={String(body.role ?? "")} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="featured"
                    value="true"
                    defaultChecked={Boolean(body.featured)}
                  />
                  Featured on home
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="audience">Audience</Label>
              <Textarea
                id="audience"
                name="audience"
                rows={2}
                defaultValue={String(body.audience ?? "")}
              />
            </div>
            {(
              [
                ["context", "Context", "Background: market, users, and why the work started."],
                ["problem", "Problem", "The operational or user problem you set out to solve."],
                ["approach", "Approach", "How you framed the solution and key product choices."],
                ["implementation", "Implementation", "Technical/build notes that are safe to publish."],
                ["notes", "Notes", "Caveats, soft-launch status, or honesty labels."],
              ] as const
            ).map(([name, label, hint]) => (
              <div key={name}>
                <Label htmlFor={name}>{label}</Label>
                <FieldHint>{hint}</FieldHint>
                <Textarea
                  id={name}
                  name={name}
                  rows={3}
                  defaultValue={String(body[name] ?? "")}
                />
              </div>
            ))}
            {(
              [
                ["scopeText", "Scope (one per line)", "scope", "Major inclusions."],
                ["constraintsText", "Constraints", "constraints", "Hard limits (currency, offline, roles)."],
                ["technologiesText", "Technologies", "technologies", "Stack names, one per line."],
                ["outcomesText", "Outcomes", "outcomes", "Verified results only — no invented metrics."],
                ["learningsText", "Learnings", "learnings", "What you would change next time."],
                ["capabilitiesText", "Capabilities", "capabilities", "Service tags this project demonstrates."],
              ] as const
            ).map(([name, label, key, hint]) => (
              <div key={name}>
                <Label htmlFor={name}>{label}</Label>
                <FieldHint>{hint}</FieldHint>
                <Textarea
                  id={name}
                  name={name}
                  rows={3}
                  defaultValue={lines(body[key])}
                />
              </div>
            ))}
            <div>
              <Label htmlFor="decisionsJson">Decisions JSON</Label>
              <FieldHint>
                Array of {"{"}&quot;title&quot;, &quot;detail&quot;{"}"} objects for case-study decision cards.
              </FieldHint>
              <Textarea
                id="decisionsJson"
                name="decisionsJson"
                rows={5}
                defaultValue={JSON.stringify(body.decisions ?? [], null, 2)}
                className="font-mono text-xs"
              />
            </div>
          </div>
        ) : null}

        {type === "service" ? (
          <div className="space-y-4 rounded-md border border-border p-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <FieldHint>What the service is, in clear commercial language.</FieldHint>
              <Textarea
                id="description"
                name="description"
                required
                rows={3}
                defaultValue={String(body.description ?? "")}
                placeholder="Custom software for workflows that outgrow spreadsheets…"
              />
            </div>
            <div>
              <Label htmlFor="problem">Problem</Label>
              <FieldHint>The buyer pain this service addresses.</FieldHint>
              <Textarea
                id="problem"
                name="problem"
                required
                rows={3}
                defaultValue={String(body.problem ?? "")}
              />
            </div>
            <div>
              <Label htmlFor="deliverablesText">Deliverables (one per line)</Label>
              <FieldHint>Concrete outputs the client receives.</FieldHint>
              <Textarea
                id="deliverablesText"
                name="deliverablesText"
                rows={4}
                defaultValue={lines(body.deliverables)}
                placeholder={"Requirements workshop\nProduction deployment\nHandover documentation"}
              />
            </div>
            <div>
              <Label htmlFor="relatedSlugsText">Related project slugs</Label>
              <FieldHint>Portfolio slugs that prove this service (one per line).</FieldHint>
              <Textarea
                id="relatedSlugsText"
                name="relatedSlugsText"
                rows={2}
                defaultValue={lines(body.relatedSlugs)}
                placeholder={"umutungo\numugina"}
              />
            </div>
          </div>
        ) : null}

        {type === "post" ? (
          <div className="space-y-4 rounded-md border border-border p-4">
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <FieldHint>Short teaser for listings and SEO.</FieldHint>
              <Textarea
                id="excerpt"
                name="excerpt"
                rows={2}
                defaultValue={String(body.excerpt ?? "")}
              />
            </div>
            <div>
              <Label htmlFor="markdown">Markdown body</Label>
              <FieldHint>Full article in Markdown.</FieldHint>
              <Textarea
                id="markdown"
                name="markdown"
                required
                rows={12}
                className="font-mono text-xs"
                defaultValue={String(body.markdown ?? "")}
              />
            </div>
          </div>
        ) : null}

        {type === "testimonial" ? (
          <div className="space-y-4 rounded-md border border-border p-4">
            <StatusBanner tone="info">
              Testimonials stay internal unless a real client approved them.
              They are not exported to the public site by default.
            </StatusBanner>
            <div>
              <Label htmlFor="quote">Quote</Label>
              <FieldHint>Exact client wording — do not invent praise.</FieldHint>
              <Textarea
                id="quote"
                name="quote"
                required
                rows={4}
                defaultValue={String(body.quote ?? "")}
                placeholder="“The ops dashboard cut our weekly reconciliation time…”"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="attribution">Attribution</Label>
                <FieldHint>Person’s name as they want it shown.</FieldHint>
                <Input
                  id="attribution"
                  name="attribution"
                  required
                  defaultValue={String(body.attribution ?? "")}
                  placeholder="Jane Uwase"
                />
              </div>
              <div>
                <Label htmlFor="roleOrCompany">Role / company</Label>
                <FieldHint>e.g. Operations lead, Acme Retail</FieldHint>
                <Input
                  id="roleOrCompany"
                  name="roleOrCompany"
                  defaultValue={String(body.roleOrCompany ?? "")}
                  placeholder="Operations lead, Acme Retail"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="clientApproved"
                value="true"
                defaultChecked={Boolean(body.clientApproved)}
                required
              />
              Client explicitly approved this quote for Studio records
            </label>
          </div>
        ) : null}
      </fieldset>

      {!locked ? (
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create draft" : "Save draft"}
        </Button>
      ) : null}
    </form>
  );
}
