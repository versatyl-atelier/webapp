"use client";

import { useRouter } from "next/navigation";

import { BreadcrumbItem } from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PUNCH_TIMESHEET_PATH } from "@/constants/punch";
import {
  PAY_END_LABEL,
  PAY_END_PARAM,
  PAY_PERIOD,
  PERIOD_LABEL,
  PERIOD_LABELS,
  PERIOD_PARAM,
  TIMESHEET_PERIODS,
  type TimesheetPeriod,
} from "@/constants/timesheet";
import type { DateKey } from "@/lib/calendar";

type PeriodCrumbsProps = {
  period: TimesheetPeriod;
  payEnd: DateKey;
  payEnds: DateKey[];
};

const TRIGGER_CLASS = "rounded border-2 px-1.5 py-1 text-xs";

export function PeriodCrumbs({ period, payEnd, payEnds }: PeriodCrumbsProps) {
  const router = useRouter();
  const payEndItems = payEnds.map((end) => ({ value: end, label: end }));

  function navigate(params: Record<string, string>) {
    router.push(`${PUNCH_TIMESHEET_PATH}?${new URLSearchParams(params)}`);
  }

  return (
    <BreadcrumbItem role="group" aria-label={PERIOD_LABEL} className="shrink-0">
      <Select
        items={PERIOD_LABELS}
        value={period}
        onValueChange={(value) => {
          if (value !== null) navigate({ [PERIOD_PARAM]: value });
        }}
      >
        <SelectTrigger aria-label={PERIOD_LABEL} className={TRIGGER_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIMESHEET_PERIODS.map((value) => (
            <SelectItem key={value} value={value}>
              {PERIOD_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {period === PAY_PERIOD && (
        <Select
          items={payEndItems}
          value={payEnd}
          onValueChange={(value) => {
            if (value !== null) {
              navigate({ [PERIOD_PARAM]: period, [PAY_END_PARAM]: value });
            }
          }}
        >
          <SelectTrigger aria-label={PAY_END_LABEL} className={TRIGGER_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {payEndItems.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </BreadcrumbItem>
  );
}
