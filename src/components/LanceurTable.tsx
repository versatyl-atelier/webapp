"use client";

import { Trash2 } from "lucide-react";

import { ActionTooltip } from "@/components/ActionTooltip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  LANCEUR_APPROVED_FIELD_LABEL,
  LANCEUR_COLUMNS,
  LANCEUR_COLUMN_ABBREVIATIONS,
  LANCEUR_NONE_VALUE,
  LANCEUR_PRINT_CHECK,
  LANCEUR_PRINT_COLUMN_WIDTH_CLASSES,
  LANCEUR_NO_RESPONSIBLE_LABEL,
  LANCEUR_REMOVE_PHASE_LABEL,
  LANCEUR_SIGNED_FIELD_LABEL,
  LANCEUR_TABLE_EMPTY_LABEL,
  LANCEUR_TABLE_TITLE,
} from "@/constants/lanceur";
import { useLanceurRows } from "@/hooks/use-lanceur-rows";
import {
  formatPrice,
  formatShortDate,
  isApproved,
  mergeOptionValue,
  phaseLabel,
  type LanceurEmployee,
  type LanceurRow,
} from "@/lib/lanceur";
import { projectColorStyle } from "@/lib/projects";
import { cn } from "@/lib/utils";

const HEADER_CELL_CLASS =
  "bg-primary text-primary-foreground px-1.5 py-1.5 text-left text-2xs font-semibold tracking-wide uppercase print:bg-foreground print:px-1 print:py-1 print:text-print print:text-background";
const CELL_CLASS = "border px-0.5 py-0.5 align-middle";
const PRINT_ONLY_CLASS = "hidden print:block";
const PRINT_TEXT_CLASS = cn(PRINT_ONLY_CLASS, "px-1 text-print leading-tight");
const BARE_CONTROL_CLASS =
  "w-full rounded-sm border-transparent bg-transparent px-1 text-xs shadow-none md:text-xs dark:bg-transparent hover:bg-muted focus-visible:bg-muted dark:hover:bg-muted dark:focus-visible:bg-muted print:p-0 print:text-print print:hover:bg-transparent md:print:text-print";
const CONTROL_CLASS = cn("h-7", BARE_CONTROL_CLASS);
const SELECT_CLASS = cn(
  CONTROL_CLASS,
  "[&_svg]:opacity-0 hover:[&_svg]:opacity-100 focus-visible:[&_svg]:opacity-100 print:[&_svg]:hidden",
);
const DATE_CLASS = cn(
  CONTROL_CLASS,
  "[&::-webkit-calendar-picker-indicator]:hidden",
);
const CHECKBOX_CELL_CLASS = cn(CELL_CLASS, "text-center");

type ColumnHeader = {
  label: string;
  short?: string;
  centered?: boolean;
  right?: boolean;
};

const COLUMN_HEADERS: ColumnHeader[] = [
  {
    label: LANCEUR_COLUMNS.priority,
    short: LANCEUR_COLUMN_ABBREVIATIONS.priority,
    centered: true,
  },
  { label: LANCEUR_COLUMNS.etape },
  {
    label: LANCEUR_COLUMNS.signed,
    short: LANCEUR_COLUMN_ABBREVIATIONS.signed,
    centered: true,
  },
  {
    label: LANCEUR_COLUMNS.approved,
    short: LANCEUR_COLUMN_ABBREVIATIONS.approved,
    centered: true,
  },
  { label: LANCEUR_COLUMNS.responsible },
  { label: LANCEUR_COLUMNS.project },
  { label: LANCEUR_COLUMNS.price, right: true },
  { label: LANCEUR_COLUMNS.installateur },
  { label: LANCEUR_COLUMNS.pdm },
  { label: LANCEUR_COLUMNS.approval },
  { label: LANCEUR_COLUMNS.delivery },
  { label: LANCEUR_COLUMNS.comment },
];
const COLUMN_WIDTH_CLASSES = [
  "w-9",
  "w-28",
  "w-8",
  "w-8",
  "w-36",
  "w-52",
  "w-20",
  "w-24",
  "w-24",
  "w-24",
  "w-24",
  "w-auto",
];

type LanceurTableProps = {
  rows: LanceurRow[];
  employees: LanceurEmployee[];
  etapes: string[];
  installateurs: string[];
  today: string;
};

export function LanceurTable({
  rows,
  employees,
  etapes,
  installateurs,
  today,
}: LanceurTableProps) {
  const {
    rows: optimisticRows,
    save,
    remove,
  } = useLanceurRows(rows, employees);

  if (optimisticRows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {LANCEUR_TABLE_EMPTY_LABEL}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="print-exact print:text-print w-full min-w-(--container-lanceur-table) table-fixed border-collapse text-xs print:min-w-0">
        <caption className="sr-only">{LANCEUR_TABLE_TITLE}</caption>
        <colgroup>
          {COLUMN_WIDTH_CLASSES.map((widthClass, index) => (
            <col
              key={index}
              className={cn(
                widthClass,
                LANCEUR_PRINT_COLUMN_WIDTH_CLASSES[index],
              )}
            />
          ))}
          <col className="w-9 print:hidden" />
        </colgroup>
        <thead>
          <tr>
            {COLUMN_HEADERS.map(({ label, short, centered, right }) => (
              <th
                key={label}
                scope="col"
                className={cn(
                  HEADER_CELL_CLASS,
                  centered && "text-center",
                  right && "text-right",
                )}
              >
                {short ? (
                  <ActionTooltip
                    label={label}
                    render={<abbr aria-label={label} tabIndex={0} />}
                  >
                    {short}
                  </ActionTooltip>
                ) : (
                  label
                )}
              </th>
            ))}
            <th scope="col" className="print:hidden">
              <span className="sr-only">{LANCEUR_REMOVE_PHASE_LABEL}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {optimisticRows.map((row) => (
            <tr
              key={row.phaseId}
              className="hover:bg-muted/50 print:break-inside-avoid"
            >
              <td className={CELL_CLASS}>
                <Input
                  key={row.priority}
                  type="text"
                  inputMode="numeric"
                  aria-label={LANCEUR_COLUMNS.priority}
                  className={cn(CONTROL_CLASS, "text-center")}
                  defaultValue={row.priority}
                  onBlur={(event) => {
                    const priority = Number(event.target.value);
                    if (
                      Number.isInteger(priority) &&
                      priority !== row.priority
                    ) {
                      save(row.phaseId, { priority });
                    }
                  }}
                />
              </td>
              <td className={CELL_CLASS}>
                <OptionSelect
                  label={LANCEUR_COLUMNS.etape}
                  value={row.etape}
                  values={etapes}
                  onChange={(etape) => save(row.phaseId, { etape })}
                />
              </td>
              <td className={CHECKBOX_CELL_CLASS}>
                <Checkbox
                  className="mx-auto print:hidden"
                  aria-label={LANCEUR_SIGNED_FIELD_LABEL}
                  checked={row.isSigned}
                  onCheckedChange={(checked) =>
                    save(row.phaseId, { isSigned: checked })
                  }
                />
                <span
                  aria-hidden
                  className={cn(
                    PRINT_ONLY_CLASS,
                    "text-punch-pos-diff text-print font-bold",
                  )}
                >
                  {row.isSigned ? LANCEUR_PRINT_CHECK : ""}
                </span>
              </td>
              <td className={CHECKBOX_CELL_CLASS}>
                <Checkbox
                  className="mx-auto print:hidden"
                  aria-label={LANCEUR_APPROVED_FIELD_LABEL}
                  checked={isApproved(row, today)}
                  onCheckedChange={(checked) =>
                    save(row.phaseId, { approvedOverride: checked })
                  }
                />
                <span
                  aria-hidden
                  className={cn(
                    PRINT_ONLY_CLASS,
                    "text-info text-print font-bold",
                  )}
                >
                  {isApproved(row, today) ? LANCEUR_PRINT_CHECK : ""}
                </span>
              </td>
              <td className={CELL_CLASS}>
                <Select
                  value={String(row.responsibleId ?? LANCEUR_NONE_VALUE)}
                  onValueChange={(value) =>
                    save(row.phaseId, {
                      responsibleId:
                        value === null || value === LANCEUR_NONE_VALUE
                          ? null
                          : Number(value),
                    })
                  }
                >
                  <SelectTrigger
                    aria-label={LANCEUR_COLUMNS.responsible}
                    className={SELECT_CLASS}
                  >
                    <SelectValue>
                      {row.responsibleName ?? LANCEUR_NO_RESPONSIBLE_LABEL}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LANCEUR_NONE_VALUE}>
                      {LANCEUR_NO_RESPONSIBLE_LABEL}
                    </SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className={CELL_CLASS}>
                <div
                  className="flex items-center gap-2 px-1"
                  style={projectColorStyle(
                    row.responsibleColor ?? "transparent",
                  )}
                >
                  <span
                    aria-hidden
                    className="print-exact size-2.5 shrink-0 rounded-full bg-(--project-color)"
                  />
                  <span className="leading-tight font-medium">
                    {phaseLabel(row)}
                  </span>
                </div>
              </td>
              <td className={CELL_CLASS}>
                <Input
                  key={row.price ?? "none"}
                  type="number"
                  min={0}
                  step={100}
                  aria-label={LANCEUR_COLUMNS.price}
                  className={cn(CONTROL_CLASS, "text-right print:hidden")}
                  defaultValue={row.price ?? ""}
                  onBlur={(event) => {
                    const price =
                      event.target.value === ""
                        ? null
                        : Number(event.target.value);
                    if (price !== row.price && (price === null || price >= 0)) {
                      save(row.phaseId, { price });
                    }
                  }}
                />
                <span className={cn(PRINT_TEXT_CLASS, "text-right")}>
                  {row.price === null ? "" : formatPrice(row.price)}
                </span>
              </td>
              <td className={CELL_CLASS}>
                <OptionSelect
                  label={LANCEUR_COLUMNS.installateur}
                  value={row.installateur}
                  values={installateurs}
                  onChange={(installateur) =>
                    save(row.phaseId, { installateur })
                  }
                />
              </td>
              <td className={CELL_CLASS}>
                <DateCell
                  label={LANCEUR_COLUMNS.pdm}
                  value={row.pdmDate}
                  onChange={(pdmDate) => save(row.phaseId, { pdmDate })}
                />
              </td>
              <td className={CELL_CLASS}>
                <DateCell
                  label={LANCEUR_COLUMNS.approval}
                  value={row.approvalDate}
                  onChange={(approvalDate) =>
                    save(row.phaseId, { approvalDate })
                  }
                />
              </td>
              <td className={CELL_CLASS}>
                <DateCell
                  label={LANCEUR_COLUMNS.delivery}
                  value={row.deliveryDate}
                  onChange={(deliveryDate) =>
                    save(row.phaseId, { deliveryDate })
                  }
                />
              </td>
              <td className={CELL_CLASS}>
                <RichTextEditor
                  label={LANCEUR_COLUMNS.comment}
                  value={row.deliveryComment}
                  onCommit={(deliveryComment) =>
                    save(row.phaseId, { deliveryComment })
                  }
                />
              </td>
              <td className="px-1 print:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${LANCEUR_REMOVE_PHASE_LABEL}: ${phaseLabel(row)}`}
                  onClick={() => remove(row.phaseId)}
                >
                  <Trash2 />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type DateCellProps = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

function DateCell({ label, value, onChange }: DateCellProps) {
  return (
    <>
      <Input
        type="date"
        aria-label={label}
        className={cn(DATE_CLASS, "print:hidden")}
        value={value ?? ""}
        onClick={(event) => event.currentTarget.showPicker?.()}
        onChange={(event) => onChange(event.target.value || null)}
      />
      <span className={PRINT_TEXT_CLASS}>
        {value === null ? "" : formatShortDate(value)}
      </span>
    </>
  );
}

type OptionSelectProps = {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
};

function OptionSelect({ label, value, values, onChange }: OptionSelectProps) {
  const choices = mergeOptionValue(values, value);
  return (
    <Select
      value={value === "" ? LANCEUR_NONE_VALUE : value}
      onValueChange={(next) =>
        onChange(next === null || next === LANCEUR_NONE_VALUE ? "" : next)
      }
    >
      <SelectTrigger aria-label={label} className={SELECT_CLASS}>
        <SelectValue>{value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={LANCEUR_NONE_VALUE}>{" "}</SelectItem>
        {choices.map((choice) => (
          <SelectItem key={choice} value={choice}>
            {choice}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
