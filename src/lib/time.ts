export function parseTimeToSeconds(input: string | number): number {
  if (typeof input === "number") {
    // Si nombre < 100, considérer comme heures, sinon secondes
    return input < 100 ? hoursToSeconds(input) : Math.round(input);
  }

  const str = String(input).trim().toLowerCase();

  // Format spécial "5h 56" ou "5h56" (heures + nombre sans unité = minutes)
  const hourMinPattern = /^(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(\d+(?:\.\d+)?)$/i;
  const hourMinMatch = str.match(hourMinPattern);
  if (hourMinMatch) {
    const hours = parseFloat(hourMinMatch[1]);
    const minutes = parseFloat(hourMinMatch[2]);
    return Math.round(hours * 3600 + minutes * 60);
  }

  // Format avec unités: "1h30m", "1h 30m", "30m", "45s", "1h 30m 15s"
  const timePattern =
    /(?:(\d+(?:\.\d+)?)\s*h(?:ours?)?)?(?:\s*(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?)?(?:\s*(\d+(?:\.\d+)?)\s*s(?:ec(?:ond)?s?)?)?/i;
  const match = str.match(timePattern);

  if (match && (match[1] || match[2] || match[3])) {
    const hours = parseFloat(match[1] || "0");
    const minutes = parseFloat(match[2] || "0");
    const seconds = parseFloat(match[3] || "0");
    return Math.round(hours * 3600 + minutes * 60 + seconds);
  }

  // Format "HH:MM" ou "H:MM" ou "HH:MM:SS"
  if (str.includes(":")) {
    const parts = str.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 3600 + parts[1] * 60;
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  // Format décimal "2.5" (heures)
  const decimal = parseFloat(str);
  if (!isNaN(decimal)) {
    return decimal < 100 ? hoursToSeconds(decimal) : Math.round(decimal);
  }

  return 0;
}

export function hoursToSeconds(hours: number): number {
  return Math.round(hours * 3600);
}

export function secondsToHours(seconds: number): number {
  return seconds / 3600;
}

export function formatTimeDisplay(decimal: number): string {
  if (!decimal || Number.isNaN(decimal)) return "0h 0m";

  let hours = Math.floor(decimal);
  let minutes = Math.round((decimal - hours) * 60);

  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  return `${hours}h ${minutes}m`;
}
export function getThisWeek(weekOffset: number = 0) {
  const currentMonday = getMonday(weekOffset);
  const sunday = new Date(currentMonday);
  sunday.setDate(currentMonday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    startDate: currentMonday,
    endDate: sunday,
  };
}
export function getMonday(weekOffset: number = 0): Date {
  let i = 0;
  const today = new Date();
  today.setDate(today.getDate() + weekOffset * 7);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const result = new Date(today.setDate(diff));
  result.setHours(0, 0, 0, 0);
  return result;
}
export function isSameDay(a: Date, b: Date) {
  const result =
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  return result;
}

// Postgres `@db.Date` columns (weekStart on WeeklyObjective, FrozenWeek,
// WeeklyKilometrage) round-trip through Prisma as UTC midnight, not local
// midnight. Use this instead of isSameDay when comparing one of those
// DB-sourced dates against a locally-constructed Date (e.g. getMonday()),
// otherwise the comparison drifts a day off in any non-UTC timezone.
export function isSameUTCDate(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

// Convert a local date to UTC midnight for Prisma @db.Date queries.
// Extracts the local year/month/date and creates a new Date at UTC midnight.
export function toUTCDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}
