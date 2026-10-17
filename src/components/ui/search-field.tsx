"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SearchFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

/** Controlled search input for list pages. Wire to URL/query in later phases. */
export function SearchField({
  id = "search",
  label = "Search",
  value,
  onChange,
  placeholder = "Search…",
  disabled,
}: SearchFieldProps) {
  return (
    <div className="w-full max-w-sm">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  );
}
