"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";

import { JobineForm } from "@/components/JobineForm";
import { JobineSection } from "@/components/JobineSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ACTIVE_JOBINES_TITLE,
  ARCHIVED_JOBINES_TITLE,
  JOBINES_FILTER_LABEL,
  JOBINES_FILTER_PLACEHOLDER,
  JOBINES_FOUND_LABEL,
  NO_ACTIVE_JOBINES_LABEL,
  NO_ARCHIVED_JOBINES_LABEL,
  NO_JOBINE_MATCH_LABEL,
} from "@/constants/jobines";
import { filterJobines, type JobineRecord } from "@/lib/jobines";

type JobinesBrowserProps = {
  jobines: JobineRecord[];
};

export function JobinesBrowser({ jobines }: JobinesBrowserProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const { active, archived } = filterJobines(jobines, query);
  const hasQuery = query.trim().length > 0;
  const emptyLabel = (label: string) =>
    hasQuery ? NO_JOBINE_MATCH_LABEL : label;

  return (
    <>
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="relative md:col-span-2"
      >
        <Label htmlFor={inputId} className="sr-only">
          {JOBINES_FILTER_LABEL}
        </Label>
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={JOBINES_FILTER_PLACEHOLDER}
          className="bg-card rounded border-2 pl-8"
        />
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none"
        />
      </form>
      <p className="sr-only" aria-live="polite">
        {hasQuery &&
          `${active.length + archived.length} ${JOBINES_FOUND_LABEL}`}
      </p>
      <JobineSection
        title={ACTIVE_JOBINES_TITLE}
        jobines={active}
        emptyLabel={emptyLabel(NO_ACTIVE_JOBINES_LABEL)}
      >
        <JobineForm />
      </JobineSection>
      <JobineSection
        title={ARCHIVED_JOBINES_TITLE}
        jobines={archived}
        emptyLabel={emptyLabel(NO_ARCHIVED_JOBINES_LABEL)}
      />
    </>
  );
}
