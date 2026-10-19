"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FieldHint } from "@/components/ui/field-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { uploadPublicImageAction } from "@/server/media/actions";

type ImageUploadFieldProps = {
  id: string;
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  /** When set, also write the storage key into this hidden field name. */
  storageKeyName?: string;
  defaultStorageKey?: string | null;
};

/**
 * Image picker that uploads to Studio media storage and fills a URL/path field.
 * Keeps an optional manual path override for existing public-site assets.
 */
export function ImageUploadField({
  id,
  name,
  label,
  hint,
  defaultValue,
  storageKeyName,
  defaultStorageKey,
}: ImageUploadFieldProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue ?? "");
  const [storageKey, setStorageKey] = useState(defaultStorageKey ?? "");

  function onPick(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadPublicImageAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setValue(result.data!.url);
      setStorageKey(result.data!.key);
      toast.success("Image ready to save with this entry.", "Uploaded");
    });
  }

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint ? <FieldHint>{hint}</FieldHint> : null}
      </div>

      {value ? (
        <div className="overflow-hidden rounded-md border border-border bg-background-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-32 w-full object-cover object-center"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            onPick(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </Button>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setValue("");
              setStorageKey("");
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <Input
        id={id}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="/work/example/cover.png or uploaded URL"
      />
      {storageKeyName ? (
        <input type="hidden" name={storageKeyName} value={storageKey} />
      ) : null}
    </div>
  );
}
