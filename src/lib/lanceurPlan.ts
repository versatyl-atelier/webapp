import {
  PLAN_AVAILABILITY_HORIZON_WEEKS,
  PLAN_EPSILON,
  PLAN_LOAD_LEVELS,
  PLAN_LOAD_THRESHOLDS,
  PLAN_LONG_DATE_OPTIONS,
  PLAN_POINTS_SCALE,
  type PlanLoadLevel,
} from "@/constants/lanceurPlan";
import { LANCEUR_LOCALE } from "@/constants/lanceur";
import { DAYS_PER_WEEK, WORK_DAYS_PER_WEEK } from "@/constants/calendar";
import { addDays, isWeekend, mondayOf, type DateKey } from "@/lib/calendar";

export type PlanItem = {
  id: number;
  label: string;
  color: string | null;
  pdmDate: DateKey | null;
  approvalDate: DateKey | null;
  deliveryDate: DateKey | null;
  price: number | null;
};

export type PlanSettings = {
  capacityRatio: number;
  minProdDays: number;
  maxWeekShare: number;
  closures: readonly DateKey[];
};

export type AvailabilityWeek = {
  openDays: DateKey[];
  capacity: number;
  load: number;
  free: number;
};

export type Availability = { start: DateKey; end: DateKey };

export function productionDays(
  item: Pick<PlanItem, "approvalDate" | "deliveryDate">,
  closures: ReadonlySet<DateKey>,
): DateKey[] {
  if (!item.approvalDate || !item.deliveryDate) {
    return [];
  }
  const days: DateKey[] = [];
  for (
    let day = addDays(item.approvalDate, 1);
    day <= item.deliveryDate;
    day = addDays(day, 1)
  ) {
    if (!isWeekend(day) && !closures.has(day)) {
      days.push(day);
    }
  }
  return days;
}

export function loadByDay(
  items: readonly PlanItem[],
  closures: ReadonlySet<DateKey>,
): Map<DateKey, number> {
  const byDay = new Map<DateKey, number>();
  for (const item of items) {
    const days = productionDays(item, closures);
    if (days.length === 0) {
      continue;
    }
    const daily = (item.price ?? 0) / days.length;
    for (const day of days) {
      byDay.set(day, (byDay.get(day) ?? 0) + daily);
    }
  }
  return byDay;
}

export function toPoints(amount: number, capacityRatio: number): number {
  return (amount / capacityRatio) * PLAN_POINTS_SCALE;
}

export function weekPoints(
  byDay: ReadonlyMap<DateKey, number>,
  weekStart: DateKey,
  capacityRatio: number,
): number {
  let sum = 0;
  for (let offset = 0; offset < DAYS_PER_WEEK; offset += 1) {
    sum += byDay.get(addDays(weekStart, offset)) ?? 0;
  }
  return toPoints(sum, capacityRatio);
}

export function loadLevel(points: number): PlanLoadLevel {
  const rounded = Math.round(points);
  if (rounded === 0) return PLAN_LOAD_LEVELS.none;
  if (rounded <= PLAN_LOAD_THRESHOLDS.low) return PLAN_LOAD_LEVELS.low;
  if (rounded <= PLAN_LOAD_THRESHOLDS.medium) return PLAN_LOAD_LEVELS.medium;
  if (rounded <= PLAN_LOAD_THRESHOLDS.high) return PLAN_LOAD_LEVELS.high;
  if (rounded === PLAN_LOAD_THRESHOLDS.full) return PLAN_LOAD_LEVELS.full;
  if (rounded <= PLAN_LOAD_THRESHOLDS.warning) return PLAN_LOAD_LEVELS.warning;
  return PLAN_LOAD_LEVELS.over;
}

export function buildAvailabilityWeeks(
  items: readonly PlanItem[],
  settings: PlanSettings,
  today: DateKey,
): AvailabilityWeek[] {
  const closures = new Set(settings.closures);
  const byDay = loadByDay(items, closures);
  const firstMonday = mondayOf(today);
  const weeks: AvailabilityWeek[] = [];
  for (let index = 0; index < PLAN_AVAILABILITY_HORIZON_WEEKS; index += 1) {
    const monday = addDays(firstMonday, index * DAYS_PER_WEEK);
    const openDays: DateKey[] = [];
    for (let offset = 0; offset < WORK_DAYS_PER_WEEK; offset += 1) {
      const day = addDays(monday, offset);
      if (day >= today && !closures.has(day)) {
        openDays.push(day);
      }
    }
    const amount = openDays.reduce(
      (sum, day) => sum + (byDay.get(day) ?? 0),
      0,
    );
    weeks.push({
      openDays,
      capacity: (PLAN_POINTS_SCALE * openDays.length) / WORK_DAYS_PER_WEEK,
      load: toPoints(amount, settings.capacityRatio),
      free: 0,
    });
  }
  let carry = 0;
  for (const week of weeks) {
    const total = week.load + carry;
    if (total > week.capacity + PLAN_EPSILON) {
      carry = total - week.capacity;
      week.free = 0;
    } else {
      carry = 0;
      week.free = week.capacity - total;
    }
  }
  return weeks;
}

export function findFirstAvailability(
  amount: number,
  weeks: readonly AvailabilityWeek[],
  settings: Pick<
    PlanSettings,
    "capacityRatio" | "minProdDays" | "maxWeekShare"
  >,
): Availability | null {
  const total = toPoints(amount, settings.capacityRatio);
  const paceMax = total / settings.minProdDays;
  for (let start = 0; start < weeks.length; start += 1) {
    if (weeks[start].openDays.length === 0) {
      continue;
    }
    let remaining = total;
    let last: AvailabilityWeek | null = null;
    for (
      let index = start;
      index < weeks.length && remaining > PLAN_EPSILON;
      index += 1
    ) {
      const week = weeks[index];
      if (week.openDays.length === 0) {
        continue;
      }
      const allocation = Math.min(
        remaining,
        week.free,
        settings.maxWeekShare,
        paceMax * week.openDays.length,
      );
      if (allocation <= PLAN_EPSILON) {
        break;
      }
      remaining -= allocation;
      last = week;
    }
    if (remaining <= PLAN_EPSILON && last) {
      return {
        start: weeks[start].openDays[0],
        end: last.openDays[last.openDays.length - 1],
      };
    }
  }
  return null;
}

const planDateFormatter = new Intl.DateTimeFormat(
  LANCEUR_LOCALE,
  PLAN_LONG_DATE_OPTIONS,
);

export function formatPlanDate(date: DateKey): string {
  return planDateFormatter.format(new Date(`${date}T00:00:00Z`));
}
