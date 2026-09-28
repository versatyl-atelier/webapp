"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useId,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { loadDayOccurrences, saveCalendarEvent } from "@/actions/calendar";
import { CalendarDayOrderPreview } from "@/components/CalendarDayOrderPreview";
import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
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
  FieldError,
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
  END_LABEL,
  EVENT_CATEGORY_LABELS,
  EVENT_COLOR_LABELS,
  EVENT_DELETED_MESSAGE,
  EVENT_SAVED_MESSAGE,
  FREQUENCY_LABEL,
  FREQUENCY_LABELS,
  FREQUENCY_UNIT_LABELS,
  HOUR_HINT,
  HOUR_LABEL,
  HOUR_MODE_LABELS,
  HOUR_MODES,
  HOURS_PER_DAY,
  INTERVAL_LABEL_PREFIX,
  LANCEUR_EVENT_TYPES,
  LANCEUR_NOTE,
  MIDNIGHT_HOUR,
  NEW_EVENT_LABEL,
  NOON_HOUR,
  OCCURRENCES_LABEL,
  PM_LABEL,
  PROJECT_SEARCH_EMPTY,
  PROJECT_SEARCH_HINT,
  PROJECT_SEARCH_LABEL,
  PROJECT_SEARCH_PLACEHOLDER,
  RECURRENCE_END_LABELS,
  REPEATS_LABEL,
  REPEATS_VALUE,
  SAVE_EVENT_LABEL,
  SERIES_EDIT_NOTE,
  START_DATE_LABEL,
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
import {
  calendarWeekPath,
  dayOrderPreview,
  eventColorClass,
  formatHour,
  isOneOf,
  mondayOf,
  weekdayOf,
  type CalendarEventRecord,
  type CalendarOccurrence,
  type DateKey,
  type EventTemplate,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

type CalendarEventFormProps = {
  event?: CalendarEventRecord;
  initialDate: DateKey;
  initialDayOccurrences: CalendarOccurrence[];
  templates: EventTemplate[];
  cancelHref: string;
};

const EVENT_TYPES = Object.values(CalendarEventType);
const EVENT_COLORS = Object.values(CalendarEventColor);
const FREQUENCIES = Object.values(RecurrenceFrequency);
const RECURRENCE_ENDS = Object.values(RecurrenceEnd);
const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);
const DRAFT_KEY = "draft";

function FieldErrors({ errors }: { errors?: string[] }) {
  return (
    <FieldError>
      {errors?.map((error) => (
        <p key={error}>- {error}</p>
      ))}
    </FieldError>
  );
}

export function CalendarEventForm({
  event,
  initialDate,
  initialDayOccurrences,
  templates,
  cancelHref,
}: CalendarEventFormProps) {
  const formId = useId();
  const router = useRouter();
  const [state, action, saving] = useActionState(saveCalendarEvent, undefined);
  const [previewPending, startPreviewTransition] = useTransition();

  const [type, setType] = useState(event?.type ?? DEFAULT_EVENT_TYPE);
  const [title, setTitle] = useState(event?.title ?? "");
  const [detail, setDetail] = useState(event?.detail ?? "");
  const [date, setDate] = useState(event?.date ?? initialDate);
  const [hour, setHour] = useState(event?.hour ?? DEFAULT_EVENT_HOUR);
  const [hourMode, setHourMode] = useState<HourMode>("24h");
  const [color, setColor] = useState(event?.color ?? DEFAULT_EVENT_COLOR);
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
  const [dayOccurrences, setDayOccurrences] = useState(initialDayOccurrences);

  useEffect(() => {
    if (
      !state?.date ||
      (state.message !== EVENT_SAVED_MESSAGE &&
        state.message !== EVENT_DELETED_MESSAGE)
    ) {
      return;
    }
    toast.success(state.message, { position: "top-left", icon: "✅" });
    router.push(calendarWeekPath(mondayOf(state.date)));
  }, [state, router]);

  const canRepeat = type === CalendarEventType.manuel;
  const isRecurring = canRepeat && repeats;
  const errors = state?.errors;

  const selectType = (value: CalendarEventType) => {
    setType(value);
    if (value !== CalendarEventType.manuel) {
      setRepeats(false);
    }
  };

  const applyTemplate = (template: EventTemplate) => {
    setTitle(template.title);
    setColor(template.color);
    if (LANCEUR_EVENT_TYPES.includes(template.type)) {
      selectType(template.type);
    }
  };

  const changeDate = (value: DateKey) => {
    setDate(value);
    if (!value) {
      return;
    }
    startPreviewTransition(async () => {
      setDayOccurrences(await loadDayOccurrences(value));
    });
  };

  const changeRepeats = (checked: boolean) => {
    setRepeats(checked);
    if (checked && weekdays.length === 0 && date) {
      setWeekdays([weekdayOf(date)]);
    }
  };

  const preview = dayOrderPreview(
    dayOccurrences.flatMap(({ eventId, key, date, hour, color, title }) =>
      eventId === event?.id ? [] : [{ key, date, hour, color, title }],
    ),
    {
      key: DRAFT_KEY,
      date,
      hour,
      color,
      title: title.trim() || NEW_EVENT_LABEL,
    },
  );

  return (
    <div className="flex w-full flex-col items-start gap-8 md:flex-row">
      <form
        id={formId}
        action={action}
        className="flex w-full min-w-0 flex-col gap-5 md:flex-[1.3]"
      >
        <FormValidationAlerts errors={errors} />
        {event && <input type="hidden" name="id" value={event.id} />}
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="hour" value={hour} />
        <input type="hidden" name="color" value={color} />
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

        {templates.length > 0 && (
          <Field>
            <FieldLabel htmlFor={`${formId}-template`}>
              {PROJECT_SEARCH_LABEL}
            </FieldLabel>
            <Combobox
              items={templates}
              itemToStringLabel={(template: EventTemplate) => template.title}
              onValueChange={(template) => {
                if (template) {
                  applyTemplate(template);
                }
              }}
            >
              <ComboboxInput
                id={`${formId}-template`}
                placeholder={PROJECT_SEARCH_PLACEHOLDER}
                showClear
              />
              <ComboboxContent>
                <ComboboxEmpty>{PROJECT_SEARCH_EMPTY}</ComboboxEmpty>
                <ComboboxList>
                  {(template: EventTemplate) => (
                    <ComboboxItem key={template.title} value={template}>
                      <span
                        aria-hidden
                        className={cn(
                          "size-2 rounded-full",
                          eventColorClass(template.color),
                        )}
                      />
                      {template.title}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldDescription>{PROJECT_SEARCH_HINT}</FieldDescription>
          </Field>
        )}

        <FieldSet>
          <FieldLegend variant="label">{TYPE_LABEL}</FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            value={type}
            onValueChange={(value) => {
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
                className="data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary rounded-full px-3"
              >
                <EventCategoryIcon category={eventType} />
                {EVENT_CATEGORY_LABELS[eventType]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {LANCEUR_EVENT_TYPES.includes(type) && (
            <p className="bg-muted text-muted-foreground rounded-sm px-2.5 py-1.5 text-xs">
              {LANCEUR_NOTE}
            </p>
          )}
          <FieldErrors errors={errors?.type} />
        </FieldSet>

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
              {isRecurring ? START_DATE_LABEL : DATE_LABEL}
            </FieldLabel>
            <Input
              id={`${formId}-date`}
              name="date"
              type="date"
              required
              value={date}
              onChange={(e) => changeDate(e.target.value)}
              aria-invalid={!!errors?.date}
            />
            <FieldErrors errors={errors?.date} />
          </Field>
          <FieldSet className="flex-1">
            <FieldLegend variant="label">{HOUR_LABEL}</FieldLegend>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={hourMode}
              onValueChange={(value) => {
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
                value={String(hour)}
                onValueChange={(value) => setHour(Number(value))}
              >
                <SelectTrigger aria-label={HOUR_LABEL} className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {formatHour(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                aria-label={HOUR_LABEL}
                value={hour < NOON_HOUR ? AM_LABEL : PM_LABEL}
                onValueChange={(value) => {
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
              <RadioGroupItem
                key={eventColor}
                value={eventColor}
                aria-label={EVENT_COLOR_LABELS[eventColor]}
                title={EVENT_COLOR_LABELS[eventColor]}
                className={cn(
                  "data-[state=checked]:ring-foreground data-[state=checked]:ring-offset-background size-7 border-0 text-white data-[state=checked]:ring-2 data-[state=checked]:ring-offset-2",
                  eventColorClass(eventColor),
                )}
              />
            ))}
          </RadioGroup>
          <FieldDescription>{COLOR_HINT}</FieldDescription>
          <FieldErrors errors={errors?.color} />
        </FieldSet>

        {canRepeat && (
          <Field orientation="horizontal">
            <Checkbox
              id={`${formId}-repeats`}
              checked={repeats}
              onCheckedChange={(checked) => changeRepeats(checked === true)}
            />
            <FieldLabel htmlFor={`${formId}-repeats`}>
              {REPEATS_LABEL}
            </FieldLabel>
          </Field>
        )}

        {isRecurring && (
          <div className="bg-muted flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex flex-wrap gap-4">
              <Field className="flex-1">
                <FieldLabel htmlFor={`${formId}-frequency`}>
                  {FREQUENCY_LABEL}
                </FieldLabel>
                <Select
                  value={frequency}
                  onValueChange={(value) => {
                    if (isOneOf(FREQUENCIES, value)) {
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
                  type="multiple"
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
                      className="bg-background data-[state=on]:bg-primary data-[state=on]:text-primary-foreground w-10"
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
                    <RadioGroupItem
                      id={`${formId}-end-${value}`}
                      value={value}
                    />
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
              <p className="text-muted-foreground text-xs">
                {SERIES_EDIT_NOTE}
              </p>
            )}
          </div>
        )}

        <footer className="flex flex-wrap justify-end gap-2.5 border-t pt-3">
          {event && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="mr-auto"
                  disabled={saving}
                >
                  {DELETE_EVENT_LABEL}
                </Button>
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
          <Button asChild variant="ghost">
            <Link href={cancelHref}>{CANCEL_LABEL}</Link>
          </Button>
          <Button type="submit" name="command" value="save" disabled={saving}>
            {event ? SAVE_EVENT_LABEL : CREATE_EVENT_LABEL}
          </Button>
        </footer>
      </form>

      <div className="w-full md:sticky md:top-4 md:min-w-64 md:flex-1">
        <CalendarDayOrderPreview
          date={date || initialDate}
          preview={preview}
          pending={previewPending}
        />
      </div>
    </div>
  );
}
