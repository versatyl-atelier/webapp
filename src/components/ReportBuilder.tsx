"use client";

import { useState } from "react";

import { ProjectTransfer } from "@/components/ProjectTransfer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PUNCH_REPORT_PRINT_PATH } from "@/constants/punch";
import {
  DEFAULT_REPORT_GROUPINGS,
  GENERATE_REPORT_LABEL,
  GROUPING_LABELS,
  GROUPING_REQUIRED_MESSAGE,
  GROUPINGS_SECTION_TITLE,
  PERIOD_END_LABEL,
  PERIOD_HINT,
  PERIOD_SECTION_TITLE,
  PERIOD_START_LABEL,
  PROJECT_REQUIRED_REPORT_MESSAGE,
  PROJECTS_SECTION_TITLE,
  REPORT_END_PARAM,
  REPORT_FORM_ID_PERIOD_END,
  REPORT_FORM_ID_PERIOD_START,
  REPORT_GROUPING_PARAM,
  REPORT_GROUPINGS,
  REPORT_PROJECT_PARAM,
  REPORT_START_PARAM,
  type ReportGrouping,
} from "@/constants/report";
import type { UsedProject } from "@/lib/report";

type ReportBuilderProps = {
  projects: UsedProject[];
};

const SECTION_CLASS = "bg-card rounded-lg border-2 p-2.5";
const SECTION_TITLE_CLASS =
  "border-primary mb-2 border-b-2 pb-1 text-center text-xs font-bold";
const HINT_CLASS = "text-muted-foreground mt-1.5 text-xs";

export function ReportBuilder({ projects }: ReportBuilderProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [groupings, setGroupings] = useState<ReportGrouping[]>(
    DEFAULT_REPORT_GROUPINGS,
  );
  const hasProjects = selectedKeys.length > 0;
  const hasGroupings = groupings.length > 0;

  function toggleGrouping(grouping: ReportGrouping, isChecked: boolean) {
    setGroupings(
      REPORT_GROUPINGS.filter((candidate) =>
        candidate === grouping ? isChecked : groupings.includes(candidate),
      ),
    );
  }

  return (
    <form
      action={PUNCH_REPORT_PRINT_PATH}
      method="get"
      className="flex flex-col gap-3"
    >
      {selectedKeys.map((key) => (
        <input
          key={key}
          type="hidden"
          name={REPORT_PROJECT_PARAM}
          value={key}
        />
      ))}
      {groupings.map((grouping) => (
        <input
          key={grouping}
          type="hidden"
          name={REPORT_GROUPING_PARAM}
          value={grouping}
        />
      ))}

      <section className={SECTION_CLASS}>
        <h2 className={SECTION_TITLE_CLASS}>{PROJECTS_SECTION_TITLE}</h2>
        <ProjectTransfer
          projects={projects}
          selectedKeys={selectedKeys}
          onChange={setSelectedKeys}
        />
        {!hasProjects && (
          <p className={HINT_CLASS}>{PROJECT_REQUIRED_REPORT_MESSAGE}</p>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <section className={SECTION_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>{PERIOD_SECTION_TITLE}</h2>
          <div className="flex flex-wrap gap-2.5">
            <Field className="w-44">
              <FieldLabel
                htmlFor={REPORT_FORM_ID_PERIOD_START}
                className="mb-1 block text-xs font-semibold uppercase"
              >
                {PERIOD_START_LABEL}
              </FieldLabel>
              <Input
                id={REPORT_FORM_ID_PERIOD_START}
                name={REPORT_START_PARAM}
                type="date"
                className="w-full rounded border-2 px-1.5 py-1 text-xs"
              />
            </Field>
            <Field className="w-44">
              <FieldLabel
                htmlFor={REPORT_FORM_ID_PERIOD_END}
                className="mb-1 block text-xs font-semibold uppercase"
              >
                {PERIOD_END_LABEL}
              </FieldLabel>
              <Input
                id={REPORT_FORM_ID_PERIOD_END}
                name={REPORT_END_PARAM}
                type="date"
                className="w-full rounded border-2 px-1.5 py-1 text-xs"
              />
            </Field>
          </div>
          <p className={HINT_CLASS}>{PERIOD_HINT}</p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>{GROUPINGS_SECTION_TITLE}</h2>
          <ul className="flex flex-col gap-1.5">
            {REPORT_GROUPINGS.map((grouping) => (
              <li key={grouping}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={groupings.includes(grouping)}
                    onCheckedChange={(isChecked) =>
                      toggleGrouping(grouping, isChecked)
                    }
                  />
                  {GROUPING_LABELS[grouping]}
                </label>
              </li>
            ))}
          </ul>
          {!hasGroupings && (
            <p className={HINT_CLASS}>{GROUPING_REQUIRED_MESSAGE}</p>
          )}
        </section>
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={!hasProjects || !hasGroupings}
        className="w-fit rounded-sm text-xs font-semibold uppercase"
      >
        {GENERATE_REPORT_LABEL}
      </Button>
    </form>
  );
}
