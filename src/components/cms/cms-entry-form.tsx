"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
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
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <FieldError errors={fieldErrors.slug} />
          </div>
          <div>
            <Label htmlFor="coverPublicPath">Cover path (public site)</Label>
            <Input
              id="coverPublicPath"
              name="coverPublicPath"
              placeholder="/work/example/cover.png"
              defaultValue={defaults?.coverPublicPath ?? undefined}
            />
          </div>
          <div>
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input
              id="seoTitle"
              name="seoTitle"
              defaultValue={defaults?.seoTitle ?? undefined}
            />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO description</Label>
            <Input
              id="seoDescription"
              name="seoDescription"
              defaultValue={defaults?.seoDescription ?? undefined}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="tagsText">Tags (comma-separated)</Label>
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
              <Textarea
                id="summary"
                name="summary"
                required
                rows={3}
                defaultValue={String(body.summary ?? "")}
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
                <Input
                  id="liveUrl"
                  name="liveUrl"
                  required
                  defaultValue={String(body.liveUrl ?? "")}
                />
                <FieldError errors={fieldErrors.liveUrl} />
              </div>
              <div>
                <Label htmlFor="previewImage">Preview image path</Label>
                <Input
                  id="previewImage"
                  name="previewImage"
                  defaultValue={String(body.previewImage ?? "")}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
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
                ["context", "Context"],
                ["problem", "Problem"],
                ["approach", "Approach"],
                ["implementation", "Implementation"],
                ["notes", "Notes"],
              ] as const
            ).map(([name, label]) => (
              <div key={name}>
                <Label htmlFor={name}>{label}</Label>
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
                ["scopeText", "Scope (one per line)", "scope"],
                ["constraintsText", "Constraints", "constraints"],
                ["technologiesText", "Technologies", "technologies"],
                ["outcomesText", "Outcomes", "outcomes"],
                ["learningsText", "Learnings", "learnings"],
                ["capabilitiesText", "Capabilities", "capabilities"],
              ] as const
            ).map(([name, label, key]) => (
              <div key={name}>
                <Label htmlFor={name}>{label}</Label>
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
              <Textarea
                id="description"
                name="description"
                required
                rows={3}
                defaultValue={String(body.description ?? "")}
              />
            </div>
            <div>
              <Label htmlFor="problem">Problem</Label>
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
              <Textarea
                id="deliverablesText"
                name="deliverablesText"
                rows={4}
                defaultValue={lines(body.deliverables)}
              />
            </div>
            <div>
              <Label htmlFor="relatedSlugsText">Related project slugs</Label>
              <Textarea
                id="relatedSlugsText"
                name="relatedSlugsText"
                rows={2}
                defaultValue={lines(body.relatedSlugs)}
              />
            </div>
          </div>
        ) : null}

        {type === "post" ? (
          <div className="space-y-4 rounded-md border border-border p-4">
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                rows={2}
                defaultValue={String(body.excerpt ?? "")}
              />
            </div>
            <div>
              <Label htmlFor="markdown">Markdown body</Label>
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
              Phase 6 does not publish them to the public site.
            </StatusBanner>
            <div>
              <Label htmlFor="quote">Quote</Label>
              <Textarea
                id="quote"
                name="quote"
                required
                rows={4}
                defaultValue={String(body.quote ?? "")}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="attribution">Attribution</Label>
                <Input
                  id="attribution"
                  name="attribution"
                  required
                  defaultValue={String(body.attribution ?? "")}
                />
              </div>
              <div>
                <Label htmlFor="roleOrCompany">Role / company</Label>
                <Input
                  id="roleOrCompany"
                  name="roleOrCompany"
                  defaultValue={String(body.roleOrCompany ?? "")}
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
