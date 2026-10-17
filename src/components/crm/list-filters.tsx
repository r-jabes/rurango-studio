"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type FilterOption = { value: string; label: string };

type ListFiltersProps = {
  pathname: string;
  q?: string;
  status?: string;
  statusOptions: FilterOption[];
};

export function ListFilters({
  pathname,
  q = "",
  status = "",
  statusOptions,
}: ListFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);
  const [selectedStatus, setSelectedStatus] = useState(status);

  function apply(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedStatus) params.set("status", selectedStatus);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-4 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name…"
        />
      </div>
      <div className="w-full sm:w-48">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Filtering…" : "Apply"}
      </Button>
    </form>
  );
}
