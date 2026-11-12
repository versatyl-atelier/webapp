"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { saveCalendarEvent } from "@/actions/calendar";
import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import { ActionTooltip } from "@/components/ActionTooltip";
import { FieldErrors } from "@/components/FieldErrors";
import { FormActionBar } from "@/components/FormActionBar";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AM_LABEL,
  CANCEL_LABEL,
  COLOR_HINT,
  COLOR_LABEL,
  CREATE_EVENT_LABEL,
  DATE_LABEL,
  DEFAULT_END_COUNT,
  DEFAULT_EVENT_COLOR,
  DEFAULT_EVENT_HOUR,
  DEFAULT_EVENT_TYPE,
  DEFAULT_FREQUENCY,
  DEFAULT_INTERVAL,
  DELETE_EVENT_LABEL,
  DETAIL_LABEL,
  DETAIL_PLACEHOLDER,
  EDIT_EVENT_LABEL,
  END_LABEL,
  EVENT_CATEGORY_LABELS,
  EVENT_COLOR_LABELS,
  EVENT_DELETED_MESSAGE,
  EVENT_DIALOG_DESCRIPTION,
  EVENT_SAVED_MESSAGE,
  EVENT_SUBCATEGORIES,
  FREQUENCY_LABEL,
  FREQUENCY_LABELS,
  FREQUENCY_UNIT_LABELS,
  HOUR_HINT,
  HOUR_LABEL,
  HOUR_MODE_LABELS,
  HOUR_MODES,
  HOURS_PER_DAY,
  INTERVAL_LABEL_PREFIX,
  LINKED_PROJECT_HINT,
  LINKED_PROJECT_LABEL,
  LINKED_PROJECT_PLACEHOLDER,
  MIDNIGHT_HOUR,
  NEW_CALENDAR_EVENT_PATH,
  NEW_EVENT_LABEL,
  NOON_HOUR,
  OCCURRENCES_LABEL,
  PERSONAL_NOTE,
  PM_LABEL,
  PROJECT_SEARCH_EMPTY,
  RECURRENCE_END_LABELS,
  REPEATS_LABEL,
  REPEATS_SPAN_NOTE,
  REPEATS_VALUE,
  SAVE_EVENT_LABEL,
  SERIES_EDIT_NOTE,
  SPAN_EDIT_NOTE,
  SPAN_END_DATE_HINT,
  SPAN_END_DATE_LABEL,
  SPAN_REPEATS_NOTE,
  START_DATE_LABEL,
  SUBCATEGORY_LABEL,
  SUBCATEGORY_OTHER_LABEL,
  SUBCATEGORY_OTHER_PLACEHOLDER,
  TITLE_LABEL,
  TITLE_PLACEHOLDER,
  TYPE_LABEL,
  WEEKDAY_LABELS,
  WEEKDAY_NUMBERS_FROM_MONDAY,
  WEEKDAYS_LABEL,
  WEEKDAYS_SEPARATOR,
  type HourMode,
} from "@/constants/calendar";
import {
  CalendarEventColor,
  CalendarEventType,
  RecurrenceEnd,
  RecurrenceFrequency,
} from "@/generated/prisma/enums";
import { useFormDirty } from "@/hooks/use-form-dirty";
import {
  calendarEventPath,
  calendarWeekPath,
  canRepeat,
  eventColorClass,
  formatHour,
  hasSpan,
  isOneOf,
  mondayOf,
  weekdayOf,
  type CalendarEventRecord,
  type DateKey,
  type LinkableProject,
} from "@/lib/calendar";
import { projectColorLabel, projectColorStyle } from "@/lib/projects";
import { cn } from "@/lib/utils";

type CalendarEventFormProps = {
  event?: CalendarEventRecord;
  initialDate: DateKey;
  projects: LinkableProject[];
  cancelHref: string;
  isModal?: boolean;
};

const EVENT_TYPES = Object.values(CalendarEventType);
const EVENT_COLORS = Object.values(CalendarEventColor);
const FREQUENCIES = Object.values(RecurrenceFrequency);
const RECURRENCE_ENDS = Object.values(RecurrenceEnd);
const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);
const HOUR_ITEMS = HOURS.map((hour) => ({
  value: String(hour),
  label: formatHour(hour),
}));
const PILL_CLASS =
  "data-pressed:border-primary data-pressed:bg-primary/10 data-pressed:text-primary rounded-full px-3";

export function CalendarEventForm({
  event,
  initialDate,
  projects,
  cancelHref,
  isModal = false,
}: CalendarEventFormProps) {
  const formId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const [state, action, saving] = useActionState(saveCalendarEvent, undefined);
  const { ref: formRef, isDirty, submit } = useFormDirty();
  const [confirmingClose, setConfirmingClose] = useState(false);

  const [type, setType] = useState(event?.type ?? DEFAULT_EVENT_TYPE);
  const [subcategory, setSubcategory] = useState(event?.subcategory ?? "");
  const [title, setTitle] = useState(event?.title ?? "");
  const [detail, setDetail] = useState(event?.detail ?? "");
  const [date, setDate] = useState(event?.date ?? initialDate);
  const [spanEndDate, setSpanEndDate] = useState(event?.spanEndDate ?? "");
  const [hour, setHour] = useState(event?.hour ?? DEFAULT_EVENT_HOUR);
  const [hourMode, setHourMode] = useState<HourMode>("24h");
  const [color, setColor] = useState(event?.color ?? DEFAULT_EVENT_COLOR);
  const [project, setProject] = useState<LinkableProject | null>(
    projects.find(({ id }) => id === event?.projectId) ?? null,
  );
  const [repeats, setRepeats] = useState(!!event?.frequency);
  const [frequency, setFrequency] = useState(
    event?.frequency ?? DEFAULT_FREQUENCY,
  );
  const [interval, setIntervalValue] = useState(
    String(event?.interval ?? DEFAULT_INTERVAL),
  );
  const [weekdays, setWeekdays] = useState(event?.weekdays ?? []);
  const [endType, setEndType] = useState(event?.endType ?? RecurrenceEnd.never);
  const [endDate, setEndDate] = useState(event?.endDate ?? "");
  const [endCount, setEndCount] = useState(
    String(event?.endCount ?? DEFAULT_END_COUNT),
  );

  useEffect(() => {
    if (
      !state?.date ||
      (state.message !== EVENT_SAVED_MESSAGE &&
        state.message !== EVENT_DELETED_MESSAGE)
    ) {
      return;
    }
    toast.success(state.message, { position: "top-left", icon: "✅" });
    router.replace(calendarWeekPath(mondayOf(state.date)));
  }, [state, router]);

  const repeatable = canRepeat(type);
  const isRecurring = repeatable && repeats;
  const isSpan = !isRecurring && hasSpan({ date, spanEndDate });
  const isPresetSubcategory = isOneOf(EVENT_SUBCATEGORIES, subcategory);
  const errors = state?.errors;
  const heading = event ? EDIT_EVENT_LABEL : NEW_EVENT_LABEL;
  const dialogPath = event
    ? calendarEventPath(event.id)
    : NEW_CALENDAR_EVENT_PATH;

  const close = () => router.back();

  const requestClose = () => {
    if (saving) {
      return;
    }
    if (isDirty()) {
      setConfirmingClose(true);
      return;
    }
    close();
  };

  const selectType = (value: CalendarEventType) => {
    setType(value);
    if (!canRepeat(value)) {
      setRepeats(false);
    }
  };

  const changeRepeats = (checked: boolean) => {
    setRepeats(checked);
    if (checked && weekdays.length === 0 && date) {
      setWeekdays([weekdayOf(date)]);
    }
  };

  const form = (
    <form
      id={formId}
      ref={formRef}
      action={action}
      className="flex w-full min-w-0 flex-col gap-5"
    >
      <FormValidationAlerts errors={errors} />
      {event && <input type="hidden" name="id" value={event.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="subcategory" value={subcategory} />
      <input type="hidden" name="hour" value={hour} />
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="projectId" value={project?.id ?? ""} />
      <input
        type="hidden"
        name="spanEndDate"
        value={isRecurring ? "" : spanEndDate}
      />
      {isRecurring && (
        <input type="hidden" name="repeats" value={REPEATS_VALUE} />
      )}
      <input type="hidden" name="frequency" value={frequency} />
      <input type="hidden" name="interval" value={interval} />
      <input
        type="hidden"
        name="weekdays"
        value={weekdays.join(WEEKDAYS_SEPARATOR)}
      />
      <input type="hidden" name="endType" value={endType} />
      <input type="hidden" name="endDate" value={endDate} />
      <input type="hidden" name="endCount" value={endCount} />

      <Field>
        <FieldLabel htmlFor={`${formId}-project`}>
          {LINKED_PROJECT_LABEL}
        </FieldLabel>
        <Combobox
          items={projects}
          value={project}
          onValueChange={setProject}
          isItemEqualToValue={(a: LinkableProject, b: LinkableProject) =>
            a.id === b.id
          }
          itemToStringLabel={(item: LinkableProject) => item.name}
          itemToStringValue={(item: LinkableProject) => item.id}
        >
          <ComboboxInput
            id={`${formId}-project`}
            placeholder={LINKED_PROJECT_PLACEHOLDER}
            aria-invalid={!!errors?.projectId}
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>{PROJECT_SEARCH_EMPTY}</ComboboxEmpty>
            <ComboboxList>
              {(item: LinkableProject) => (
                <ComboboxItem key={item.id} value={item}>
                  <ActionTooltip
                    label={projectColorLabel(item.color)}
                    render={
                      <span
                        aria-hidden
                        style={projectColorStyle(item.color)}
                        className="size-2 shrink-0 rounded-full bg-(--project-color)"
                      />
                    }
                  />
                  {item.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>{LINKED_PROJECT_HINT}</FieldDescription>
        <FieldErrors errors={errors?.projectId} />
      </Field>

      <FieldSet>
        <FieldLegend variant="label">{TYPE_LABEL}</FieldLegend>
        <ToggleGroup
          variant="outline"
          value={[type]}
          onValueChange={([value]) => {
            if (isOneOf(EVENT_TYPES, value)) {
              selectType(value);
            }
          }}
          className="flex-wrap"
        >
          {EVENT_TYPES.map((eventType) => (
            <ToggleGroupItem
              key={eventType}
              value={eventType}
              className={PILL_CLASS}
            >
              <EventCategoryIcon category={eventType} />
              {EVENT_CATEGORY_LABELS[eventType]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {type === CalendarEventType.personnel && (
          <p className="bg-muted text-muted-foreground rounded-sm px-2.5 py-1.5 text-xs">
            {PERSONAL_NOTE}
          </p>
        )}
        <FieldErrors errors={errors?.type} />
      </FieldSet>

      {type === CalendarEventType.divers && (
        <FieldSet>
          <FieldLegend variant="label">{SUBCATEGORY_LABEL}</FieldLegend>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              variant="outline"
              value={isPresetSubcategory ? [subcategory] : []}
              onValueChange={([value]) => setSubcategory(value ?? "")}
              className="flex-wrap"
            >
              {EVENT_SUBCATEGORIES.map((preset) => (
                <ToggleGroupItem
                  key={preset}
                  value={preset}
                  className={PILL_CLASS}
                >
                  {preset}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Input
              aria-label={SUBCATEGORY_OTHER_LABEL}
              placeholder={SUBCATEGORY_OTHER_PLACEHOLDER}
              value={isPresetSubcategory ? "" : subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="h-8 w-32 rounded-full px-3"
            />
          </div>
          <FieldErrors errors={errors?.subcategory} />
        </FieldSet>
      )}

      <Field>
        <FieldLabel htmlFor={`${formId}-title`}>{TITLE_LABEL}</FieldLabel>
        <Input
          id={`${formId}-title`}
          name="title"
          placeholder={TITLE_PLACEHOLDER}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!errors?.title}
        />
        <FieldErrors errors={errors?.title} />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${formId}-detail`}>{DETAIL_LABEL}</FieldLabel>
        <Input
          id={`${formId}-detail`}
          name="detail"
          placeholder={DETAIL_PLACEHOLDER}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        <FieldErrors errors={errors?.detail} />
      </Field>

      <div className="flex flex-wrap gap-4">
        <Field className="flex-1">
          <FieldLabel htmlFor={`${formId}-date`}>
            {isRecurring || isSpan ? START_DATE_LABEL : DATE_LABEL}
          </FieldLabel>
          <Input
            id={`${formId}-date`}
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors?.date}
          />
          <FieldErrors errors={errors?.date} />
        </Field>
        <Field className="flex-1" data-disabled={isRecurring}>
          <FieldLabel htmlFor={`${formId}-span-end`}>
            {SPAN_END_DATE_LABEL}
          </FieldLabel>
          <Input
            id={`${formId}-span-end`}
            type="date"
            min={date}
            disabled={isRecurring}
            value={isRecurring ? "" : spanEndDate}
            onChange={(e) => setSpanEndDate(e.target.value)}
            aria-invalid={!!errors?.spanEndDate}
          />
          <FieldDescription>
            {isRecurring ? REPEATS_SPAN_NOTE : SPAN_END_DATE_HINT}
          </FieldDescription>
          <FieldErrors errors={errors?.spanEndDate} />
        </Field>
        <FieldSet className="flex-1">
          <FieldLegend variant="label">{HOUR_LABEL}</FieldLegend>
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={0}
            value={[hourMode]}
            onValueChange={([value]) => {
              if (isOneOf(HOUR_MODES, value)) {
                setHourMode(value);
              }
            }}
          >
            {HOUR_MODES.map((mode) => (
              <ToggleGroupItem key={mode} value={mode}>
                {HOUR_MODE_LABELS[mode]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {hourMode === "24h" ? (
            <Select
              items={HOUR_ITEMS}
              value={String(hour)}
              onValueChange={(value) => {
                if (value !== null) {
                  setHour(Number(value));
                }
              }}
            >
              <SelectTrigger aria-label={HOUR_LABEL} className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOUR_ITEMS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={0}
              aria-label={HOUR_LABEL}
              value={[hour < NOON_HOUR ? AM_LABEL : PM_LABEL]}
              onValueChange={([value]) => {
                if (value) {
                  setHour(value === AM_LABEL ? MIDNIGHT_HOUR : NOON_HOUR);
                }
              }}
            >
              <ToggleGroupItem value={AM_LABEL}>{AM_LABEL}</ToggleGroupItem>
              <ToggleGroupItem value={PM_LABEL}>{PM_LABEL}</ToggleGroupItem>
            </ToggleGroup>
          )}
          <FieldDescription>{HOUR_HINT}</FieldDescription>
          <FieldErrors errors={errors?.hour} />
        </FieldSet>
      </div>

      <FieldSet>
        <FieldLegend variant="label">{COLOR_LABEL}</FieldLegend>
        <RadioGroup
          value={color}
          onValueChange={(value) => {
            if (isOneOf(EVENT_COLORS, value)) {
              setColor(value);
            }
          }}
          className="flex flex-wrap gap-2"
        >
          {EVENT_COLORS.map((eventColor) => (
            <ActionTooltip
              key={eventColor}
              label={EVENT_COLOR_LABELS[eventColor]}
              render={
                <RadioGroupItem
                  value={eventColor}
                  aria-label={EVENT_COLOR_LABELS[eventColor]}
                  className={cn(
                    "data-checked:ring-foreground data-checked:ring-offset-background size-7 border-0 text-white data-checked:ring-2 data-checked:ring-offset-2",
                    eventColorClass(eventColor),
                  )}
                />
              }
            />
          ))}
        </RadioGroup>
        <FieldDescription>{COLOR_HINT}</FieldDescription>
        <FieldErrors errors={errors?.color} />
      </FieldSet>

      {repeatable && (
        <Field orientation="horizontal" data-disabled={isSpan}>
          <Checkbox
            id={`${formId}-repeats`}
            checked={isRecurring}
            disabled={isSpan}
            onCheckedChange={(checked) => changeRepeats(checked === true)}
          />
          <FieldLabel htmlFor={`${formId}-repeats`}>{REPEATS_LABEL}</FieldLabel>
          {isSpan && <FieldDescription>{SPAN_REPEATS_NOTE}</FieldDescription>}
        </Field>
      )}

      {isSpan && event && hasSpan(event) && (
        <p className="text-muted-foreground text-xs">{SPAN_EDIT_NOTE}</p>
      )}

      {isRecurring && (
        <div className="bg-muted flex flex-col gap-4 rounded-lg border p-4">
          <div className="flex flex-wrap gap-4">
            <Field className="flex-1">
              <FieldLabel htmlFor={`${formId}-frequency`}>
                {FREQUENCY_LABEL}
              </FieldLabel>
              <Select
                items={FREQUENCY_LABELS}
                value={frequency}
                onValueChange={(value) => {
                  if (value !== null && isOneOf(FREQUENCIES, value)) {
                    setFrequency(value);
                  }
                }}
              >
                <SelectTrigger
                  id={`${formId}-frequency`}
                  className="bg-background w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {FREQUENCY_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldErrors errors={errors?.frequency} />
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor={`${formId}-interval`}>
                {INTERVAL_LABEL_PREFIX} {FREQUENCY_UNIT_LABELS[frequency]}
              </FieldLabel>
              <Input
                id={`${formId}-interval`}
                type="number"
                min={1}
                className="bg-background"
                value={interval}
                onChange={(e) => setIntervalValue(e.target.value)}
                aria-invalid={!!errors?.interval}
              />
              <FieldErrors errors={errors?.interval} />
            </Field>
          </div>

          {frequency === RecurrenceFrequency.weekly && (
            <FieldSet>
              <FieldLegend variant="label">{WEEKDAYS_LABEL}</FieldLegend>
              <ToggleGroup
                multiple
                variant="outline"
                size="sm"
                value={weekdays.map(String)}
                onValueChange={(values) => setWeekdays(values.map(Number))}
                className="flex-wrap"
              >
                {WEEKDAY_NUMBERS_FROM_MONDAY.map((day, index) => (
                  <ToggleGroupItem
                    key={day}
                    value={String(day)}
                    className="bg-background data-pressed:bg-primary data-pressed:text-primary-foreground w-10"
                  >
                    {WEEKDAY_LABELS[index]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldErrors errors={errors?.weekdays} />
            </FieldSet>
          )}

          <FieldSet>
            <FieldLegend variant="label">{END_LABEL}</FieldLegend>
            <RadioGroup
              value={endType}
              onValueChange={(value) => {
                if (isOneOf(RECURRENCE_ENDS, value)) {
                  setEndType(value);
                }
              }}
            >
              {RECURRENCE_ENDS.map((value) => (
                <div key={value} className="flex items-center gap-2">
                  <RadioGroupItem id={`${formId}-end-${value}`} value={value} />
                  <Label htmlFor={`${formId}-end-${value}`}>
                    {RECURRENCE_END_LABELS[value]}
                  </Label>
                  {value === RecurrenceEnd.date && (
                    <Input
                      type="date"
                      aria-label={END_LABEL}
                      className="bg-background w-44"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setEndType(RecurrenceEnd.date);
                      }}
                      aria-invalid={!!errors?.endDate}
                    />
                  )}
                  {value === RecurrenceEnd.count && (
                    <>
                      <Input
                        type="number"
                        min={1}
                        aria-label={OCCURRENCES_LABEL}
                        className="bg-background w-20"
                        value={endCount}
                        onChange={(e) => {
                          setEndCount(e.target.value);
                          setEndType(RecurrenceEnd.count);
                        }}
                        aria-invalid={!!errors?.endCount}
                      />
                      <span className="text-sm">{OCCURRENCES_LABEL}</span>
                    </>
                  )}
                </div>
              ))}
            </RadioGroup>
            <FieldErrors errors={errors?.endDate} />
            <FieldErrors errors={errors?.endCount} />
          </FieldSet>

          {event?.frequency && (
            <p className="text-muted-foreground text-xs">{SERIES_EDIT_NOTE}</p>
          )}
        </div>
      )}
    </form>
  );

  const actions = (
    <>
      {event && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="destructive"
                className="mr-auto"
                disabled={saving}
              />
            }
          >
            {DELETE_EVENT_LABEL}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {DELETE_EVENT_LABEL} « {event.title} » ?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{CANCEL_LABEL}</AlertDialogCancel>
              <AlertDialogAction
                type="submit"
                form={formId}
                name="command"
                value="delete"
                variant="destructive"
              >
                {DELETE_EVENT_LABEL}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {isModal ? (
        <Button type="button" variant="ghost" onClick={close}>
          {CANCEL_LABEL}
        </Button>
      ) : (
        <Button
          render={<Link href={cancelHref} />}
          nativeButton={false}
          variant="ghost"
        >
          {CANCEL_LABEL}
        </Button>
      )}
      <Button
        type="submit"
        form={formId}
        name="command"
        value="save"
        disabled={saving}
      >
        {event ? SAVE_EVENT_LABEL : CREATE_EVENT_LABEL}
      </Button>
    </>
  );

  if (!isModal) {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-base font-semibold tracking-tight">{heading}</h1>
        {form}
        <FormActionBar>{actions}</FormActionBar>
      </div>
    );
  }

  if (pathname !== dialogPath) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && requestClose()}>
      <DialogContent className="max-h-11/12 gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg">{heading}</DialogTitle>
          <DialogDescription className="sr-only">
            {EVENT_DIALOG_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">{form}</div>
        <DialogFooter className="mx-0 px-6 py-4">{actions}</DialogFooter>
        <UnsavedChangesDialog
          open={confirmingClose}
          onOpenChange={setConfirmingClose}
          onSave={submit}
          onDiscard={close}
        />
      </DialogContent>
    </Dialog>
  );
}
